"""
Daily household briefing written by Claude from the stored readings.

Runs server-side inside the collection job, never per page view:
  - only when an alert level changed or the last briefing is > REFRESH_HOURS old
  - at most MAX_PER_DAY calls in any rolling 24 hours
  - only when BRIEFING_ENABLED=true and ANTHROPIC_API_KEY is set

Every briefing is checked before it is saved: numbers must come from the
input data and cited indicators must exist. A briefing that fails is stored
as rejected and the previous one keeps being served.
"""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from api import store

logger = logging.getLogger("canairy.briefing")

MODEL = "claude-opus-5"
MAX_PER_DAY = 4
REFRESH_HOURS = 20
MAX_TOKENS = 8000

SYSTEM_PROMPT = """You write Canairy's daily briefing: a short, calm note that tells a stretched US household what the latest public economic and safety data means for them this week, and what to do about it.

Readers are families watching their budget: renters and homeowners, some on benefits, many reading on a phone. They want to know "should I do anything?" in under a minute.

You will get DATA: the current readings, each with its level (green/amber/red), recent change, source and what it measures. Only indicators with tier "core" and a fresh reading drive alerts; "experimental" ones are context only.

Write to this rubric. It is how your output is graded:

1. Grounded. Every fact comes from DATA. Any number you write must appear in DATA (you may round it). Do not add forecasts with numbers, historical comparisons, prices, or statistics that are not in DATA. If DATA doesn't support a claim, leave it out.
2. Proportionate. Match the tone to the levels. Amber means a small, prudent step; red means act this week. When most readings are green, say so plainly. Never catastrophize or use fear words ("crisis", "collapse", "panic") unless DATA shows several reds in the same area.
3. Useful. Each action is something a typical family can do this week, cheapest and easiest first, and says why in terms of their money, health or safety. Protecting cash flow comes before stockpiling. No advice to buy or sell specific investments, and no medical advice beyond "talk to your pharmacist or doctor".
4. Connected. When several elevated readings point the same way (e.g. oil, gas and shipping costs), say what they add up to in one sentence rather than listing them separately.
5. Plain. Short sentences, everyday words, about an 8th-grade reading level. If a term like "bid-to-cover" is unavoidable, explain it in a few words. No markdown.
6. Honest. Don't overstate certainty. Don't mention indicators that aren't in DATA.

Output limits: headline under 90 characters; summary 2–3 sentences; 1–3 actions (fewer is better when little is elevated); 0–3 things to watch; cite the indicator ids each action is based on."""

OUTPUT_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "headline": {"type": "string"},
        "summary": {"type": "string"},
        "actions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "why": {"type": "string"},
                    "urgency": {"type": "string", "enum": ["today", "this week", "this month"]},
                    "effort": {"type": "string", "enum": ["5 minutes", "under an hour", "a weekend"]},
                    "cost": {"type": "string", "enum": ["free", "under $50", "$50-$200", "over $200"]},
                    "indicator_ids": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["title", "why", "urgency", "effort", "cost", "indicator_ids"],
                "additionalProperties": False,
            },
        },
        "watch": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "indicator_id": {"type": "string"},
                    "note": {"type": "string"},
                },
                "required": ["indicator_id", "note"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["headline", "summary", "actions", "watch"],
    "additionalProperties": False,
}


# ─── Input ───

def build_data(indicators: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compact, deterministic view of the API's indicator list for the prompt."""
    rows = []
    for ind in sorted(indicators, key=lambda i: i["id"]):
        status = ind["status"]
        level = status.get("signalLevel") or status["level"]
        rows.append({
            "id": ind["id"],
            "name": ind["name"],
            "measures": ind["description"],
            "value": status["value"],
            "unit": ind["unit"],
            "level": level,
            "thresholds": {"amber": ind["thresholds"]["threshold_amber"], "red": ind["thresholds"]["threshold_red"]},
            "trend_7d": status.get("trend"),
            "tier": ind["tier"],
            "fresh": status["dataSource"] == "LIVE",
            "source": ind["dataSource"],
        })
    counted = [r for r in rows if r["tier"] == "core" and r["fresh"]]
    return {
        "counts": {
            "red": sum(r["level"] == "red" for r in counted),
            "amber": sum(r["level"] == "amber" for r in counted),
            "green": sum(r["level"] == "green" for r in counted),
        },
        "indicators": rows,
    }


def fingerprint(data: Dict[str, Any]) -> str:
    """Changes only when an alerting level changes, so small value moves don't trigger a rewrite."""
    return "|".join(f"{r['id']}:{r['level']}" for r in data["indicators"] if r["tier"] == "core" and r["fresh"])


# ─── Validation ───

_NUMBER = re.compile(r"(?<![\w.])[-+]?\$?\d[\d,]*(?:\.\d+)?")


def _numbers_in(text: str) -> List[float]:
    out = []
    for m in _NUMBER.findall(text):
        try:
            out.append(float(m.replace("$", "").replace(",", "").lstrip("+")))
        except ValueError:
            pass
    return out


def _allowed_numbers(data: Dict[str, Any]) -> List[float]:
    allowed: List[float] = []
    for n in data["counts"].values():
        allowed.append(float(n))
    for r in data["indicators"]:
        for v in (r["value"], r["thresholds"]["amber"], r["thresholds"]["red"]):
            if isinstance(v, (int, float)):
                allowed.append(float(v))
        allowed.extend(_numbers_in(r["measures"]))
    return allowed


# Small counting words and schema values that aren't claims about the data.
_ALWAYS_OK = {0, 1, 2, 3, 4, 5, 7, 10, 30, 50, 90, 200}


def validate(briefing: Dict[str, Any], data: Dict[str, Any]) -> List[str]:
    """Return a list of problems; empty means the briefing can be published."""
    problems = []
    ids = {r["id"] for r in data["indicators"]}
    elevated = {r["id"] for r in data["indicators"] if r["level"] in ("amber", "red")}
    allowed = _allowed_numbers(data)

    def grounded(n: float) -> bool:
        if n in _ALWAYS_OK:
            return True
        # Allow rounding: within 1% or 0.05 absolute of a DATA number (sign-insensitive, % or raw).
        return any(abs(abs(n) - abs(a)) <= max(0.05, 0.01 * abs(a)) for a in allowed)

    texts = [briefing["headline"], briefing["summary"]]
    texts += [a["title"] + " " + a["why"] for a in briefing["actions"]]
    texts += [w["note"] for w in briefing["watch"]]
    for text in texts:
        for n in _numbers_in(text):
            if not grounded(n):
                problems.append(f"ungrounded number {n:g} in: {text[:80]}")

    if len(briefing["headline"]) > 90:
        problems.append("headline over 90 characters")
    if not 1 <= len(briefing["actions"]) <= 3:
        problems.append("need 1-3 actions")
    for a in briefing["actions"]:
        unknown = [i for i in a["indicator_ids"] if i not in ids]
        if unknown:
            problems.append(f"action cites unknown indicators {unknown}")
        if a["indicator_ids"] and not set(a["indicator_ids"]) & elevated:
            problems.append(f"action cites no elevated indicator: {a['title'][:60]}")
    for w in briefing["watch"]:
        if w["indicator_id"] not in ids:
            problems.append(f"watch item cites unknown indicator {w['indicator_id']}")
    if re.search(r"\b(crisis|collapse|panic|catastroph)", " ".join(texts), re.I) and data["counts"]["red"] < 3:
        problems.append("alarmist wording with fewer than 3 reds")
    return problems


# ─── Generation ───

def call_claude(data: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
    """One API call. Returns (briefing or None, metadata)."""
    import anthropic

    # Keys not scoped to a workspace must name one; a dedicated workspace also carries the spend limit.
    workspace = os.environ.get("ANTHROPIC_WORKSPACE_ID")
    client = anthropic.Anthropic(
        max_retries=2, timeout=180,
        default_headers={"anthropic-workspace-id": workspace} if workspace else None,
    )
    response = client.beta.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        system=SYSTEM_PROMPT,
        output_config={"format": {"type": "json_schema", "schema": OUTPUT_SCHEMA}},
        messages=[{
            "role": "user",
            "content": "DATA:\n" + json.dumps(data, sort_keys=True, default=str) + "\n\nWrite this week's briefing.",
        }],
    )
    meta = {
        "model": response.model,
        "stop_reason": response.stop_reason,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
    }
    if response.stop_reason != "end_turn":
        return None, meta
    text = next((b.text for b in response.content if b.type == "text"), None)
    return (json.loads(text) if text else None), meta


def maybe_generate(indicators: List[Dict[str, Any]], force: bool = False) -> Optional[str]:
    """Generate and store a briefing if one is due. Returns a short status string."""
    if os.environ.get("BRIEFING_ENABLED", "").lower() != "true" or not os.environ.get("ANTHROPIC_API_KEY"):
        return "disabled"

    data = build_data(indicators)
    fp = fingerprint(data)
    now = datetime.now(timezone.utc)
    last = store.latest_briefing()

    if store.briefing_calls_since(now - timedelta(hours=24)) >= MAX_PER_DAY:
        return "daily cap reached"
    if not force and last and last["fingerprint"] == fp and now - last["created_at"] < timedelta(hours=REFRESH_HOURS):
        return "up to date"

    try:
        briefing, meta = call_claude(data)
    except Exception as e:  # never break collection because of the briefing
        store.save_briefing(fp, None, "error", {"error": f"{type(e).__name__}: {e}"[:300]})
        logger.warning(f"briefing call failed: {e}")
        return "error"

    if briefing is None:
        store.save_briefing(fp, None, "error", meta)
        return f"no briefing ({meta.get('stop_reason')})"

    problems = validate(briefing, data)
    status = "published" if not problems else "rejected"
    store.save_briefing(fp, briefing, status, {**meta, "problems": problems})
    return status if not problems else f"rejected: {problems[:3]}"

