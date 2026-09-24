"""
Daily household briefing written by Claude from the stored readings.

Runs server-side inside the collection job, never per page view:
  - only when an alert level changed, an elevated value moved (2 significant
    figures), or the last briefing is > REFRESH_HOURS old
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

You will get DATA: the current readings, each with its level (green/amber/red), recent change, source and what it measures. Many also have "history" from the same source: the usual range (middle half of readings), median, record high and low with years, and the share of past readings below today's. Use it to put a number in perspective ("the highest since 2022", "well above its usual 15–25"), not to predict. Only indicators with tier "core" and a fresh reading drive alerts; "experimental" ones are context only.

Write to this rubric. It is how your output is graded:

1. Grounded. Every fact comes from DATA. Any number you write must appear in DATA (you may round it; units like "K" mean thousands). Do not add forecasts with numbers, historical comparisons, prices, or statistics that are not in DATA. Never estimate savings or costs in dollars unless that exact figure is in DATA. If DATA doesn't support a claim, leave it out.
2. Proportionate. Match the tone to the levels. Amber means a small, prudent step; red means act this week. When most readings are green, say so plainly. Never catastrophize or use fear words ("crisis", "collapse", "panic") unless DATA shows several reds in the same area.
3. Useful. Base every action on at least one core indicator that is fresh and amber or red; context-only (experimental) indicators may appear in watch notes but never drive an action. Each action is something a typical family can do this week, cheapest and easiest first, and says why in terms of their money, health or safety. Protecting cash flow comes before stockpiling. No advice to buy or sell specific investments, and no medical advice beyond "talk to your pharmacist or doctor".
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
        b = ind.get("baseline")
        if b:
            rows[-1]["history"] = {
                "since_year": int(b["since"][:4]),
                "usual_range": [b["p25"], b["p75"]],
                "median": b["p50"],
                "record_high": b["max"], "record_high_year": int(b["maxDate"][:4]),
                "record_low": b["min"], "record_low_year": int(b["minDate"][:4]),
                "percent_of_past_readings_below_today": b.get("percentile"),
            }
    counted = [r for r in rows if r["tier"] == "core" and r["fresh"]]
    return {
        "counts": {
            "red": sum(r["level"] == "red" for r in counted),
            "amber": sum(r["level"] == "amber" for r in counted),
            "green": sum(r["level"] == "green" for r in counted),
        },
        "indicators": rows,
    }


def _bucket(value: Any) -> str:
    """Value at two significant figures: a move big enough that quoted numbers would read as wrong."""
    if not isinstance(value, (int, float)) or value == 0:
        return str(value)
    return f"{float(f'{value:.2g}'):g}"


def fingerprint(data: Dict[str, Any]) -> str:
    """Changes when an alerting level changes, or when an elevated signal's value moves
    enough that the briefing's quoted numbers would be out of date."""
    parts = []
    for r in data["indicators"]:
        if r["tier"] != "core" or not r["fresh"]:
            continue
        part = f"{r['id']}:{r['level']}"
        if r["level"] in ("amber", "red"):
            part += f"@{_bucket(r['value'])}"
        parts.append(part)
    return "|".join(parts)


# ─── Validation ───

def _numbers_in(text: str) -> List[float]:
    return [float(m.replace(",", "")) for m in re.findall(r"\d[\d,]*(?:\.\d+)?", text)]


def _allowed_numbers(data: Dict[str, Any]) -> List[float]:
    allowed: List[float] = []
    for n in data["counts"].values():
        allowed.append(float(n))
    for r in data["indicators"]:
        for v in (r["value"], r["thresholds"]["amber"], r["thresholds"]["red"]):
            if isinstance(v, (int, float)):
                allowed.append(float(v))
        allowed.extend(_numbers_in(r["measures"]))
        for v in (r.get("history") or {}).values():
            for x in (v if isinstance(v, list) else [v]):
                if isinstance(x, (int, float)):
                    allowed.append(float(x))
    return allowed


def _grounded(n: float, text_number: str, allowed: List[float]) -> bool:
    """True when n is a DATA number, rounded to the precision it was written with,
    or scaled by a thousand (DATA "197 K" written as "197,000")."""
    decimals = len(text_number.split(".")[1]) if "." in text_number else 0
    tolerance = 0.5 * 10 ** (-decimals)
    for a in allowed:
        for candidate in (a, a * 1000, a / 1000):
            if abs(abs(n) - abs(candidate)) <= max(tolerance, 0.01 * abs(candidate)):
                return True
    return False


# Small counting words ("3 actions", "one of 2") that aren't claims about the data.
# Never exempt when written as money or a percentage.
_SMALL = {0, 1, 2, 3, 4, 5}


def _ungrounded(text: str, allowed: List[float]) -> List[str]:
    bad = []
    for m in re.finditer(r"(?<![\w.])([-+]?)(\$?)(\d[\d,]*(?:\.\d+)?)(%?)", text):
        sign, dollar, digits, pct = m.groups()
        n = float(digits.replace(",", ""))
        if not dollar and not pct and n in _SMALL:
            continue
        if not _grounded(n, digits.replace(",", ""), allowed):
            bad.append(m.group(0))
    return bad


def validate(briefing: Dict[str, Any], data: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    """Clean a briefing against DATA.

    Actions or watch notes with a problem are dropped (and reported). The whole
    briefing is rejected (None) only if the headline or summary is ungrounded,
    or no valid action is left while something is elevated.
    """
    problems: List[str] = []
    rows = {r["id"]: r for r in data["indicators"]}
    alerting = {i for i, r in rows.items() if r["tier"] == "core" and r["fresh"] and r["level"] in ("amber", "red")}
    allowed = _allowed_numbers(data)

    for field in ("headline", "summary"):
        bad = _ungrounded(briefing[field], allowed)
        if bad:
            problems.append(f"{field}: ungrounded {bad}")
    if len(briefing["headline"]) > 90:
        problems.append("headline over 90 characters")
    alarm = re.search(r"\b(crisis|collapse|panic|catastroph)", briefing["headline"] + " " + briefing["summary"], re.I)
    if alarm and data["counts"]["red"] < 3:
        problems.append(f"alarmist wording '{alarm.group(0)}' with fewer than 3 reds")
    if problems:
        return None, problems

    actions = []
    for a in briefing["actions"]:
        bad = _ungrounded(a["title"] + " " + a["why"], allowed)
        unknown = [i for i in a["indicator_ids"] if i not in rows]
        if bad:
            problems.append(f"dropped action (ungrounded {bad}): {a['title'][:50]}")
        elif unknown:
            problems.append(f"dropped action (unknown indicators {unknown}): {a['title'][:50]}")
        elif not set(a["indicator_ids"]) & alerting:
            problems.append(f"dropped action (no elevated core indicator): {a['title'][:50]}")
        else:
            actions.append(a)
    watch = []
    for w in briefing["watch"]:
        bad = _ungrounded(w["note"], allowed)
        if w["indicator_id"] not in rows or bad:
            problems.append(f"dropped watch note for {w['indicator_id']} ({bad or 'unknown indicator'})")
        else:
            watch.append(w)

    if alerting and not actions:
        problems.append("no valid actions left")
        return None, problems
    return {**briefing, "actions": actions[:3], "watch": watch[:3]}, problems


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

    cleaned, problems = validate(briefing, data)
    if cleaned is None:
        store.save_briefing(fp, briefing, "rejected", {**meta, "problems": problems})
        return f"rejected: {problems[:3]}"
    store.save_briefing(fp, cleaned, "published", {**meta, "problems": problems, "original": briefing})
    return "published" + (f" ({len(problems)} items dropped)" if problems else "")

