"""
Federal rule changes that affect family benefits.

Once a day, pull final and proposed rules from the agencies that run SNAP, WIC,
school meals, Medicaid/CHIP, marketplace coverage, unemployment insurance,
SSI/disability, housing assistance, LIHEAP/TANF/childcare, Lifeline, tax
credits and student loans (Federal Register API, no key). Keep only rules that
name one of those programs, and write a short plain-language summary for each
new one (Claude, capped per day; checked against the rule's own text).
"""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import requests

from api import store

logger = logging.getLogger("canairy.rules")

HEADERS = {"User-Agent": "Canairy/3.0 (household resilience monitor; https://canairy.news)"}
API = "https://www.federalregister.gov/api/v1/documents.json"
LOOKBACK_DAYS = 180
REFRESH = timedelta(hours=20)
MAX_SUMMARIES_PER_DAY = 10
FIRST_RUN_SUMMARIES = 40

AGENCIES = [
    "food-and-nutrition-service", "centers-for-medicare-medicaid-services", "employment-and-training-administration",
    "social-security-administration", "housing-and-urban-development-department", "children-and-families-administration",
    "federal-communications-commission", "internal-revenue-service", "education-department",
]

# Program -> phrases that must appear in the title or abstract.
PROGRAMS: Dict[str, List[str]] = {
    "SNAP": ["supplemental nutrition assistance", "snap"],
    "WIC": ["women, infants, and children", "wic program", "(wic)"],
    "School meals": ["school lunch", "school breakfast", "child nutrition program", "summer ebt"],
    "Medicaid and CHIP": ["medicaid", "children's health insurance program", "chip"],
    "Marketplace coverage": ["health insurance exchange", "health insurance marketplace", "patient protection and affordable care act"],
    "Unemployment insurance": ["unemployment compensation", "unemployment insurance"],
    "SSI and disability": ["supplemental security income", "disability insurance", "disability benefits"],
    "Housing assistance": ["housing choice voucher", "public housing", "section 8", "rental assistance", "homeless"],
    "Energy and family aid": ["low income home energy", "liheap", "temporary assistance for needy families", "tanf",
                              "child care and development", "head start"],
    "Phone and internet": ["lifeline", "affordable connectivity"],
    "Tax credits": ["earned income", "child tax credit", "eitc"],
    "Student loans": ["student loan", "income-driven repayment", "pell grant", "public service loan forgiveness"],
}

FIELDS = ["document_number", "title", "type", "abstract", "html_url", "publication_date", "effective_on",
          "comments_close_on", "agencies", "significant", "action"]


def _programs(text: str) -> List[str]:
    lowered = text.lower()
    # Whole words only: "section 8" must not match "section 898", "chip" not "chipset".
    return [
        program for program, phrases in PROGRAMS.items()
        if any(re.search(rf"(?<!\w){re.escape(p)}(?!\w)", lowered) for p in phrases)
    ]


def fetch(since: datetime) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    for agency in AGENCIES:
        page = 1
        while page <= 5:
            params: List[tuple] = [
                ("conditions[agencies][]", agency), ("conditions[type][]", "RULE"), ("conditions[type][]", "PRORULE"),
                ("conditions[publication_date][gte]", since.strftime("%Y-%m-%d")),
                ("per_page", 100), ("page", page), ("order", "newest"),
            ] + [("fields[]", f) for f in FIELDS]
            resp = requests.get(API, params=params, headers=HEADERS, timeout=60)
            resp.raise_for_status()
            body = resp.json()
            for d in body.get("results", []):
                programs = _programs(f"{d.get('title', '')} {d.get('abstract') or ''}")
                if programs:
                    items.append({
                        "id": d["document_number"],
                        "title": d["title"],
                        "type": "final" if d["type"] == "Rule" else "proposed",
                        "abstract": d.get("abstract") or "",
                        "url": d["html_url"],
                        "published": d["publication_date"],
                        "effective": d.get("effective_on"),
                        "comments_close": d.get("comments_close_on"),
                        "agency": ", ".join(a.get("name", "") for a in d.get("agencies", []) if a.get("name")),
                        "significant": bool(d.get("significant")),
                        "programs": programs,
                    })
            if page >= body.get("total_pages", 1):
                break
            page += 1
    # The same rule can be listed under two agencies.
    return list({i["id"]: i for i in items}.values())


SUMMARY_PROMPT = """You explain federal rule changes to families who rely on public benefits. Write for someone reading on a phone, at about an 8th-grade level.

From the RULE below, write:
- summary: 1–2 short sentences on what changes and who is affected. Use only facts in the RULE. No numbers or dates that aren't in the RULE. If it's a technical change that won't affect what families receive or how they apply, say so plainly.
- affects_families: true only if it changes eligibility, benefit amounts, how to apply or keep benefits, or what people can buy or get.

Use neutral, everyday terms. If the rule uses a loaded or unusual term, describe what it covers instead of repeating it. Use plain punctuation: commas and periods, no dashes or line breaks."""

SUMMARY_SCHEMA = {
    "type": "object",
    "properties": {"summary": {"type": "string"}, "affects_families": {"type": "boolean"}},
    "required": ["summary", "affects_families"],
    "additionalProperties": False,
}


def _grounded(summary: str, source: str) -> bool:
    """Every number in the summary appears in the rule's own title/abstract."""
    source_numbers = set(re.findall(r"\d[\d,.]*", source))
    return all(n.rstrip(".,") in {s.rstrip(".,") for s in source_numbers} for n in re.findall(r"\d[\d,.]*", summary))


def summarize(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    import anthropic

    from api.briefing import MODEL

    workspace = os.environ.get("ANTHROPIC_WORKSPACE_ID")
    client = anthropic.Anthropic(max_retries=2, timeout=120,
                                 default_headers={"anthropic-workspace-id": workspace} if workspace else None)
    source = f"{item['title']}\n\n{item['abstract']}"
    for _ in range(2):  # one retry if the text comes back malformed
        response = client.beta.messages.create(
            model=MODEL, max_tokens=2000,
            betas=["server-side-fallback-2026-07-01"], fallbacks="default",
            system=SUMMARY_PROMPT,
            output_config={"effort": "low", "format": {"type": "json_schema", "schema": SUMMARY_SCHEMA}},
            messages=[{"role": "user", "content": f"RULE ({'final' if item['type'] == 'final' else 'proposed'}):\n{source}"}],
        )
        if response.stop_reason != "end_turn":
            return None
        text = next((b.text for b in response.content if b.type == "text"), None)
        out = json.loads(text) if text else None
        if not out or not _grounded(out["summary"], source):
            return None
        if not re.search(r"[\x00-\x1f]", out["summary"]):
            return out
    return None


def refresh(force: bool = False) -> Dict[str, int]:
    now = datetime.now(timezone.utc)
    last = store.rules_last_fetched()
    if not force and last and now - last < REFRESH:
        return {}
    items = fetch(now - timedelta(days=LOOKBACK_DAYS))
    known = store.rule_ids()
    new = [i for i in items if i["id"] not in known]
    store.upsert_rules(items)

    summarized = 0
    can_summarize = os.environ.get("BRIEFING_ENABLED", "").lower() == "true" and os.environ.get("ANTHROPIC_API_KEY")
    if can_summarize:
        # The first run has a backlog; after that, new rules arrive a few a week.
        first_run = store.rule_summaries_since(datetime(2000, 1, 1, tzinfo=timezone.utc)) == 0
        cap = FIRST_RUN_SUMMARIES if first_run else MAX_SUMMARIES_PER_DAY
        budget = cap - store.rule_summaries_since(now - timedelta(hours=24))
        for item in sorted(store.rules_needing_summary(), key=lambda i: i["published"], reverse=True)[:max(budget, 0)]:
            try:
                result = summarize(item)
            except Exception as e:
                logger.warning(f"rule summary {item['id']} failed: {e}")
                result = None
            store.save_rule_summary(item["id"], result)
            summarized += 1
    return {"matched": len(items), "new": len(new), "summarized": summarized}


def recent(days: int = 120) -> List[Dict[str, Any]]:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out = []
    for r in store.rules_since(cutoff):
        r["open_for_comment"] = bool(r.get("comments_close") and r["comments_close"] >= today)
        out.append(r)
    return sorted(out, key=lambda r: r["published"], reverse=True)
