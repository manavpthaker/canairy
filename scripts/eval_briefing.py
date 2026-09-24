"""
Evaluate the briefing prompt on a few scenarios.

    cd server && ../.venv/bin/python ../scripts/eval_briefing.py [scenario ...]

Scenarios start from the current stored readings (local DB or DATABASE_URL)
and push chosen indicators past their thresholds. Each run makes one Claude
API call per scenario (~$0.10 each) and prints automatic checks plus the output.
"""

from __future__ import annotations

import copy
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "server"))

from api import briefing  # noqa: E402
from api.simple_main import build_indicators  # noqa: E402

# indicator id → multiple of its red threshold (red) or amber threshold (amber)
SCENARIOS = {
    "today": {},
    "calm": "all-green",
    "bank_scare": {
        "bank_02_discount_window": "red", "bank_03_deposit_flow": "red",
        "market_01_intraday_swing": "red", "bank_01_failures": "amber",
    },
    "disaster_shortage": {
        "grid_01_pjm_outages": "red", "fema_disaster_declarations": "red",
        "supply_pharmacy_shortage": "amber", "energy_gas_price": "amber",
    },
}


def _push(ind: dict, level: str) -> None:
    t = ind["thresholds"]
    target = t["threshold_red"] if level == "red" else t["threshold_amber"]
    higher_worse = t["threshold_red"] > t["threshold_amber"]
    step = abs(target) * 0.1 or 1
    ind["status"]["value"] = round(target + step if higher_worse else target - step, 2)
    ind["status"]["level"] = level
    ind["status"]["dataSource"] = "LIVE"


def scenario_indicators(name: str) -> list:
    base = copy.deepcopy(build_indicators()["indicators"])
    spec = SCENARIOS[name]
    if spec == "all-green":
        for ind in base:
            if ind["tier"] == "core" and ind["status"]["level"] in ("amber", "red"):
                t = ind["thresholds"]
                higher_worse = t["threshold_red"] > t["threshold_amber"]
                a = t["threshold_amber"]
                ind["status"]["value"] = round(a * 0.8 if higher_worse else a * 1.2, 2) if a else 0
                ind["status"]["level"] = "green"
        return base
    for ind in base:
        if ind["id"] in spec:
            _push(ind, spec[ind["id"]])
    return base


def grade_level(text: str) -> float:
    """Flesch-Kincaid grade, rough syllable count."""
    words = re.findall(r"[A-Za-z']+", text)
    sentences = max(1, len(re.findall(r"[.!?]+", text)))
    syllables = sum(max(1, len(re.findall(r"[aeiouy]+", w.lower())) - w.lower().endswith("e")) for w in words)
    if not words:
        return 0.0
    return 0.39 * len(words) / sentences + 11.8 * syllables / len(words) - 15.59


def main(names: list) -> None:
    total_in = total_out = 0
    for name in names or list(SCENARIOS):
        data = briefing.build_data(scenario_indicators(name))
        result, meta = briefing.call_claude(data)
        total_in += meta.get("input_tokens", 0)
        total_out += meta.get("output_tokens", 0)
        print(f"\n=== {name}  counts={data['counts']}  model={meta.get('model')}  stop={meta.get('stop_reason')}")
        if result is None:
            print("NO RESULT")
            continue
        problems = briefing.validate(result, data)
        prose = " ".join([result["summary"]] + [a["why"] for a in result["actions"]])
        print(f"checks: {'PASS' if not problems else problems}   grade≈{grade_level(prose):.1f}   "
              f"actions={len(result['actions'])} watch={len(result['watch'])}")
        print(json.dumps(result, indent=2))
    cost = total_in / 1e6 * 5 + total_out / 1e6 * 25
    print(f"\ntokens in={total_in} out={total_out}  ≈ ${cost:.2f}")


if __name__ == "__main__":
    main(sys.argv[1:])
