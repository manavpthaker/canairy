"""
Household stages: where a family stands, area by area, worked out from the readings.

The ladder and its rules come from Canairy's October 2026 family preparedness
research. Decide in calm times what moves you up and what moves you down, then
follow the rule even when the news feels louder than the numbers.

  0 Baseline   normal life, prepared house
  1 Watch      a reading past its watch line (amber), or a dated tripwire within 30 days
  2 Prepare    a reading past its act line (red) for 2 weeks; event readings (travel
               advisories) count at once
  3 Brace      a reading past its brace line: the event is under way
  4, 5         shelter or relocate, emergency: set by officials or the household,
               never by readings

Cooling off: Prepare holds until the act line has been clear for 4 weeks, Watch until
the watch line has been clear for 30 days. Nothing else keeps a stage up, so a stage
you can't name a number for drops back on its own.

Only core, fresh readings count, plus a few context readings that may raise Watch
(never Prepare). Things no public feed measures (a Taiwan quarantine, defiance of a
court ruling) are listed per area as triggers for the household to set itself.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from api import store
from api.catalog import BY_ID, IndicatorDef, determine_level

STAGE_NAMES = {0: "Baseline", 1: "Watch", 2: "Prepare", 3: "Brace", 4: "Shelter or relocate", 5: "Emergency"}

HOLD = timedelta(days=14)          # act line held this long moves an area to Prepare
PREPARE_COOL = timedelta(days=28)  # Prepare holds until the act line is clear this long
WATCH_COOL = timedelta(days=30)    # Watch holds until the watch line is clear this long
TRIPWIRE_DAYS = 30                 # a dated tripwire this close raises Watch
LOOKBACK_DAYS = 75                 # history read to apply the rules above


@dataclass(frozen=True)
class Area:
    id: str
    name: str
    about: str
    readings: Tuple[str, ...]
    # Context readings that can raise Watch but never Prepare.
    watch_only: Tuple[str, ...] = ()
    # (stage, trigger) pairs no public feed measures; the household sets these.
    manual: Tuple[Tuple[int, str], ...] = ()


AREAS: List[Area] = [
    Area("energy", "Energy", "Oil, gas and power: what it costs to drive, heat and cool.",
         ("oil_brent_price", "energy_gas_price", "spr_01_level", "energy_02_nat_gas_storage", "energy_03_electricity_cpi"),
         watch_only=("energy_04_power_vs_inflation",),
         manual=((2, "The Strait of Hormuz is closed, or fuel rationing is announced anywhere in the US"),
                 (2, "The regional grid declares an Energy Emergency Alert in winter"),
                 (3, "Gas stations near you run out or limit sales"))),
    Area("money", "Banks and markets", "Whether money in banks, markets and loans is safe and affordable.",
         ("bank_01_failures", "bank_02_discount_window", "bank_03_deposit_flow", "econ_01_treasury_tail",
          "market_01_intraday_swing", "housing_03_rate_shock", "market_02_nasdaq_drawdown"),
         watch_only=("bond_01_term_premium",),
         manual=((2, "A bank holiday, or a large bank limits withdrawals"),
                 (3, "One of the 25 largest US banks fails, or deposits are frozen anywhere in the US"),
                 (3, "A US Treasury auction fails"))),
    Area("jobs", "Jobs and income", "Whether paychecks are safe and lost jobs are easy to replace, including AI's effect on entry-level work.",
         ("job_01_jobless_claims", "job_02_continuing_claims", "job_04_sahm_rule", "job_03_real_wages",
          "job_05_youth_unemployment", "job_06_hires_rate", "debt_01_card_delinquency", "housing_01_delinquency"),
         manual=((1, "Layoffs in your industry"),
                 (2, "Your employer announces AI-driven restructuring"),
                 (3, "Your role is named in a layoff"))),
    Area("costs", "Household costs", "Groceries, rent, insurance, childcare and medical bills.",
         ("econ_02_grocery_cpi", "housing_04_rent_cpi", "cost_auto_insurance", "cost_childcare", "cost_medical",
          "supply_02_freight_index"),
         watch_only=("cost_beef",),
         manual=((3, "Staples are missing from store shelves near you"),)),
    Area("health", "Health", "Illness waves and access to medicine.",
         ("bio_02_wastewater", "supply_pharmacy_shortage"),
         watch_only=("bio_03_measles",),
         manual=((1, "The WHO declares a new global health emergency"),
                 (2, "A measles outbreak in your state, or a new disease spreading person to person outside where it started"),
                 (3, "Community spread in the US, or an outbreak in your county or school"))),
    Area("weather", "Weather and disasters", "Storms, heat, floods and long power cuts.",
         ("fema_disaster_declarations", "grid_01_pjm_outages"),
         manual=((1, "Your area is in a 5-day storm cone, or under a heat advisory or flood watch"),
                 (2, "A tropical storm watch or excessive heat warning for your area"),
                 (3, "A hurricane warning, evacuation order, or river flooding for your area"))),
    Area("cyber", "Cyber", "Hacking waves that hit bank, utility and email accounts.",
         ("cyber_01_cisa_kev",),
         manual=((1, "A new federal warning about state hackers inside US utilities"),
                 (2, "A CISA emergency directive about power, water or payment systems"),
                 (3, "Outages of power, water or payments blamed on a foreign state"))),
    Area("world", "War and Taiwan", "Great-power conflict that would hit chips, medicines and shipping.",
         ("world_01_china_advisory", "world_02_taiwan_advisory", "travel_01_advisories"),
         manual=((1, "A large named Chinese military drill around Taiwan"),
                 (2, "China's coast guard boards or inspects Taiwan-bound ships, or the US-China trade truce lapses with tariffs snapping back"),
                 (3, "Inspections or closures around Taiwan last 7+ days, or US and Chinese forces exchange fire"))),
    Area("politics", "Rule of law", "Whether courts, elections and limits on power still hold. Applied the same way whoever holds office.",
         (),
         manual=((1, "Officials attack judges, or there is open talk of invoking the Insurrection Act"),
                 (2, "An upheld court order is defied; the Insurrection Act is invoked or the Guard federalized over a governor's objection; an attempt to postpone a federal election"),
                 (3, "The executive defies a final Supreme Court ruling, or a federal election is cancelled or overturned"))),
]
AREA_BY_ID = {a.id: a for a in AREAS}

# Brace lines: past these the event is under way. From the preparedness plan.
BRACE: Dict[str, float] = {
    "oil_brent_price": 150, "energy_gas_price": 6.0, "econ_02_grocery_cpi": 10,
    "job_01_jobless_claims": 500, "job_02_continuing_claims": 3500, "job_04_sahm_rule": 1.0,
    "bank_02_discount_window": 100, "bank_03_deposit_flow": -2.0, "market_01_intraday_swing": 50,
    "supply_02_freight_index": 10000, "supply_pharmacy_shortage": 150,
    "world_01_china_advisory": 5, "world_02_taiwan_advisory": 5,
}
# Readings that are events, not noisy numbers: past the act line counts at once.
NO_HOLD = {"world_01_china_advisory", "world_02_taiwan_advisory"}


def fmt(defn: IndicatorDef, v: float) -> str:
    """The reading in plain words: "$126.55 a barrel", "199,000 a week"."""
    def num(x: float, digits: int = 2) -> str:
        d = 0 if abs(x) >= 100 else digits
        return f"{x:,.{d}f}".rstrip("0").rstrip(".") if d else f"{x:,.0f}"
    u = defn.unit
    if u == "$/gal":
        return f"${v:.2f} a gallon"
    if u == "$/bbl":
        return f"${v:.0f} a barrel" if v == int(v) else f"${v:.2f} a barrel"
    if u == "$/FEU":
        return f"${num(v)} a shipping container"
    if u == "$B":
        return f"${num(v, 1)} billion"
    if u in ("% y/y", "% from peak", "% vs avg"):
        tail = {"% y/y": "from a year ago", "% from peak": "from the peak", "% vs avg": "vs normal"}[u]
        return f"{'+' if v > 0 else ''}{num(v, 1)}% {tail}"
    if u in ("%", "% of people"):
        return f"{num(v, 2)}%" + (" of people" if u == "% of people" else "")
    if u == "K/week":
        return f"{round(v * 1000):,} a week"
    if u == "K":
        return f"{num(v / 1000, 2)} million" if v >= 1000 else f"{round(v * 1000):,}"
    if u == "K/day":
        return f"{num(v / 1000, 2)} million a day" if v >= 1000 else f"{round(v * 1000):,} a day"
    if u == "M bbl":
        return f"{num(v)} million barrels"
    if u == "M people":
        return f"{num(v, 1)} million people"
    if u == "ratio":
        return f"{num(v)} bids per $1 offered"
    if u == "per 90d":
        return f"{num(v)} in 90 days"
    if u == "vulns/wk":
        return f"{num(v, 1)} a week"
    if u == "level":
        return f"Level {v:g}"
    if u == "pts":
        return f"{num(v, 2)} points"
    if u == "bps":
        return f"{num(v, 1)} basis points"
    if u == "index":
        return num(v, 1)
    return f"{num(v)} {u}"


def _past(defn: IndicatorDef, value: float, line: float) -> bool:
    return value >= line if defn.higher_is_worse else value <= line


def _day(dt: datetime) -> str:
    return f"{dt:%b} {dt.day}"


@dataclass
class Finding:
    stage: int
    text: str
    up: Optional[str] = None                 # what would move this reading's area up next
    cooling_until: Optional[datetime] = None  # set when the stage is held only by cooling off
    name: str = ""


def assess(defn: IndicatorDef, history: List[store.Reading], now: datetime, watch_only: bool = False) -> Finding:
    """One reading's contribution to its area, from its recent history (oldest first)."""
    value = history[-1].value
    level = determine_level(value, defn)
    shown = f"{defn.name}: {fmt(defn, value)}"
    act, watch = fmt(defn, defn.red), fmt(defn, defn.amber)
    side = "above" if defn.higher_is_worse else "below"
    # A reading exactly on a line is "at" it, not above or below.
    on = lambda line: "at" if value == line else side
    levels = [(r.collected_at, determine_level(r.value, defn)) for r in history if r.value is not None]

    if watch_only:
        if level in ("amber", "red"):
            return Finding(1, f"{shown}, high (context only)", name=defn.name)
        return Finding(0, "")

    brace = BRACE.get(defn.id)
    if brace is not None and _past(defn, value, brace):
        return Finding(3, f"{shown}, past its brace line ({fmt(defn, brace)})", name=defn.name)

    # Runs of red readings: (first, last) times.
    runs: List[Tuple[datetime, datetime]] = []
    start: Optional[datetime] = None
    prev: Optional[datetime] = None
    for at, lv in levels:
        if lv == "red" and start is None:
            start = at
        if lv != "red" and start is not None:
            runs.append((start, prev or start))
            start = None
        prev = at
    if start is not None:
        runs.append((start, prev or start))
    hold = timedelta(0) if defn.id in NO_HOLD else HOLD

    if level == "red":
        since = runs[-1][0]
        if now - since >= hold:
            days = (now - since).days
            return Finding(2, f"{shown}, {on(defn.red)} its act line ({act}) since {_day(since)}" + (f" ({days} days)" if days >= 2 else ""),
                           up=f"Brace if {defn.name} passes {fmt(defn, brace)}" if brace is not None else None, name=defn.name)
        return Finding(1, f"{shown}, {on(defn.red)} its act line ({act}) since {_day(since)}",
                       up=f"Prepare on {_day(since + hold)} if {defn.name} stays {side} {act}", name=defn.name)

    held = [r for r in runs if r[1] - r[0] >= hold or defn.id in NO_HOLD]
    if held and now - held[-1][1] < PREPARE_COOL:
        end = held[-1][1]
        return Finding(2, f"{shown}; it was {side} its act line ({act}) until {_day(end)}",
                       cooling_until=end + PREPARE_COOL, name=defn.name)

    if level == "amber":
        return Finding(1, f"{shown}, {on(defn.amber)} its watch line ({watch})",
                       up=f"Prepare if {defn.name} stays {side} {act}" + ("" if defn.id in NO_HOLD else " for 2 weeks"), name=defn.name)

    last_watch = next((at for at, lv in reversed(levels) if lv in ("amber", "red")), None)
    if last_watch and now - last_watch < WATCH_COOL:
        return Finding(1, f"{shown}; it was {side} its watch line ({watch}) until {_day(last_watch)}",
                       cooling_until=last_watch + WATCH_COOL, name=defn.name)
    return Finding(0, "")


def step_down(stage: int, findings: List[Finding]) -> Optional[str]:
    """When an area can drop a stage, in words."""
    at = [f for f in findings if f.stage == stage]
    if not at or stage == 0:
        return None
    lower = STAGE_NAMES[stage - 1]
    current = [f for f in at if f.cooling_until is None and f.name]
    if current:
        names = ", ".join(f.name for f in current)
        if stage >= 3:
            return f"Back to {lower} once {names} is back inside its brace line."
        if stage == 2:
            return f"Back to {lower} 4 weeks after {names} is back inside its act line."
        return f"Back to {lower} 30 days after every reading is back inside its watch line."
    dated = [f.cooling_until for f in at if f.cooling_until]
    if dated:
        return f"Back to {lower} on {_day(max(dated))} if nothing new crosses a line."
    return f"Back to {lower} once the dates above have passed."


def tripwires(outlook: Dict[str, Any], today: date) -> Dict[str, List[str]]:
    """Dated tripwires within 30 days (or under way), by area."""
    out: Dict[str, List[str]] = {}
    for item in outlook.get("dates", []):
        areas = item.get("stageAreas") or []
        if not areas:
            continue
        start = date.fromisoformat(item["date"])
        until = date.fromisoformat(item["until"]) if item.get("until") else start
        if today > until or (start - today).days > TRIPWIRE_DAYS:
            continue
        days = (start - today).days
        when = f"under way until {until:%b} {until.day}" if days <= 0 and until > start else (
            "today" if days == 0 else f"on {start:%b} {start.day}, in {days} days")
        for a in areas:
            out.setdefault(a, []).append(f"{item['title']} {when}")
    return out


def compute(outlook: Dict[str, Any], now: Optional[datetime] = None) -> Dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    ids = sorted({i for a in AREAS for i in a.readings + a.watch_only if i in BY_ID})
    hist = store.history_many(ids, LOOKBACK_DAYS)
    wires = tripwires(outlook, now.date())

    areas_out: List[Dict[str, Any]] = []
    watch_count: Dict[str, int] = {}
    for area in AREAS:
        findings: List[Tuple[str, Finding]] = []
        for rid in area.readings + area.watch_only:
            defn = BY_ID.get(rid)
            h = hist.get(rid) or []
            if not defn or not h or now - h[-1].collected_at > timedelta(hours=defn.max_age_hours):
                continue  # no fresh reading: it doesn't count
            f = assess(defn, h, now, watch_only=rid in area.watch_only)
            if f.stage:
                findings.append((rid, f))
        for w in wires.get(area.id, []):
            findings.append(("date", Finding(1, w)))
        stage = max((f.stage for _, f in findings), default=0)
        watch_count[area.id] = sum(1 for rid, f in findings if rid != "date" and f.stage >= 1)
        top = sorted(findings, key=lambda x: -x[1].stage)
        manual_up = [t for s, t in area.manual if s == stage + 1]
        areas_out.append({
            "id": area.id,
            "name": area.name,
            "about": area.about,
            "stage": stage,
            "stageName": STAGE_NAMES[stage],
            "why": [f.text for _, f in top if f.stage == stage] if stage else [],
            "alsoWatching": [f.text for _, f in top if 0 < f.stage < stage],
            "next": [f.up for _, f in top if f.up][:3] + manual_up,
            "down": step_down(stage, [f for _, f in findings]),
            "manualTriggers": [{"stage": s, "trigger": t} for s, t in area.manual],
            "readings": list(area.readings),
        })

    at_prepare = [a for a in areas_out if a["stage"] >= 2]
    worst = max(a["stage"] for a in areas_out)
    watching = [a for a in areas_out if a["stage"] >= 1]
    if worst >= 3:
        overall, why = 3, f"{', '.join(a['name'] for a in areas_out if a['stage'] >= 3)} at Brace."
    elif len(at_prepare) >= 2:
        overall, why = 2, f"Two or more areas at Prepare at once ({', '.join(a['name'] for a in at_prepare)}): shocks arriving together."
    elif watching:
        overall = 1
        why = (f"{at_prepare[0]['name']} is at Prepare; the rest of the household stays at Watch until a second area joins it."
               if at_prepare else f"Watching {', '.join(a['name'].lower() for a in watching)}.")
    else:
        overall, why = 0, "Every reading is inside its watch line."
    return {
        "asOf": now.isoformat(),
        "overall": {"stage": overall, "name": STAGE_NAMES[overall], "why": why},
        "areas": areas_out,
        "rules": {
            "watch": "A reading past its watch line, or a dated tripwire within 30 days.",
            "prepare": "A reading past its act line for 2 weeks (travel advisories count at once). The whole household moves to Prepare when two areas are there at once.",
            "brace": "A reading past its brace line: the event is under way. Stage 3 needs both adults to agree on the trigger, not the mood.",
            "coolOff": "Prepare holds until the act line has been clear 4 weeks; Watch until the watch line has been clear 30 days.",
            "shelter": "Stages 4 and 5 are set by officials or by you, never by readings.",
        },
        "watchReadings": sum(watch_count.values()),
    }
