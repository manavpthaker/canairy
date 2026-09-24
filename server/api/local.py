"""
Local signals: what's happening in a household's county, state and region.

Collected once a day for every county and state (never per visitor), stored as
the latest value per (scope, metric), and served by county FIPS. The visitor's
ZIP never reaches the server: the browser maps ZIP -> county from a static file.

Scopes: county:<5-digit FIPS>, state:<USPS code>, region:<census region>,
gas:<EIA area code>, national.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests

from api import store

logger = logging.getLogger("canairy.local")

HEADERS = {"User-Agent": "Canairy/3.0 (household resilience monitor; https://canairy.news)"}
REFRESH = timedelta(hours=20)
COUNTIES: Dict[str, List[str]] = json.loads((Path(__file__).parent / "data" / "counties.json").read_text())

STATE_FIPS = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE", "11": "DC",
    "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
    "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT",
    "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
    "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI", "56": "WY", "72": "PR",
}
STATE_NAME = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado",
    "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts",
    "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana",
    "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico",
    "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota",
    "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
    "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming", "PR": "Puerto Rico",
}

# Census regions (BLS regional CPI) and EIA gasoline price areas.
REGION = {
    **{s: "northeast" for s in ("CT", "ME", "MA", "NH", "RI", "VT", "NJ", "NY", "PA")},
    **{s: "midwest" for s in ("IL", "IN", "MI", "OH", "WI", "IA", "KS", "MN", "MO", "NE", "ND", "SD")},
    **{s: "south" for s in ("DE", "DC", "FL", "GA", "MD", "NC", "SC", "VA", "WV", "AL", "KY", "MS", "TN",
                            "AR", "LA", "OK", "TX")},
    **{s: "west" for s in ("AZ", "CO", "ID", "MT", "NV", "NM", "UT", "WY", "AK", "CA", "HI", "OR", "WA")},
}
REGION_CPI = {"northeast": "CUUR0100SAF11", "midwest": "CUUR0200SAF11", "south": "CUUR0300SAF11", "west": "CUUR0400SAF11"}
REGION_NAME = {"northeast": "the Northeast", "midwest": "the Midwest", "south": "the South", "west": "the West"}

GAS_STATE = {"CA": "SCA", "CO": "SCO", "FL": "SFL", "MA": "SMA", "MN": "SMN", "NY": "SNY", "OH": "SOH", "TX": "STX", "WA": "SWA"}
GAS_PADD = {
    **{s: "R1X" for s in ("CT", "ME", "MA", "NH", "RI", "VT")},
    **{s: "R1Y" for s in ("DE", "DC", "MD", "NJ", "NY", "PA")},
    **{s: "R1Z" for s in ("FL", "GA", "NC", "SC", "VA", "WV")},
    **{s: "R20" for s in ("IL", "IN", "IA", "KS", "KY", "MI", "MN", "MO", "NE", "ND", "SD", "OH", "OK", "TN", "WI")},
    **{s: "R30" for s in ("AL", "AR", "LA", "MS", "NM", "TX")},
    **{s: "R40" for s in ("CO", "ID", "MT", "UT", "WY")},
    **{s: "R5XCA" for s in ("AK", "AZ", "HI", "NV", "OR", "WA")},
    "CA": "SCA",
}
GAS_AREA_NAME = {
    "R1X": "New England", "R1Y": "the Central Atlantic states", "R1Z": "the Lower Atlantic states",
    "R20": "the Midwest", "R30": "the Gulf Coast", "R40": "the Rocky Mountain states", "R5XCA": "the West Coast (outside California)",
}


def gas_area(state: str) -> str:
    return GAS_STATE.get(state) or GAS_PADD.get(state, "NUS")


# ─── Collection ───

def _fred(series: str, limit: int = 30) -> List[Dict[str, str]]:
    for attempt in range(4):
        resp = requests.get("https://api.stlouisfed.org/fred/series/observations", headers=HEADERS, timeout=30, params={
            "series_id": series, "api_key": os.environ["FRED_API_KEY"], "file_type": "json",
            "sort_order": "desc", "limit": limit,
        })
        # FRED allows 120 requests a minute per key, shared with the hourly collection.
        if resp.status_code != 429 or attempt == 3:
            break
        time.sleep(5 * (attempt + 1))
    resp.raise_for_status()
    return [o for o in resp.json().get("observations", []) if o.get("value") not in ("", ".")]


def _yoy(obs: List[Dict[str, str]]) -> Optional[Tuple[float, str]]:
    """Change from the same month a year earlier (matched by date), and the month."""
    latest = obs[0]
    y, m, d = latest["date"].split("-")
    prior = next((o for o in obs if o["date"] == f"{int(y) - 1}-{m}-{d}"), None)
    if not prior:
        return None
    return round((float(latest["value"]) / float(prior["value"]) - 1) * 100, 2), latest["date"][:7]


def _unemployment() -> List[Tuple[str, str, Dict[str, Any]]]:
    def one(state: str):
        obs = _fred(f"{state}UR", 14)
        if len(obs) < 13:
            return None
        rate = float(obs[0]["value"])
        low = min(float(o["value"]) for o in obs[:12])
        rise = round(rate - low, 2)
        level = "red" if rise >= 0.5 else "amber" if rise >= 0.3 else "green"
        return f"state:{state}", "unemployment", {
            "value": rate, "level": level, "as_of": obs[0]["date"][:7], "rise_from_12mo_low": rise, "low_12mo": low,
        }

    states = [s for s in STATE_NAME if s != "PR"]
    errors: List[str] = []

    def attempt(state: str):
        try:
            return one(state)
        except Exception as e:
            errors.append(f"{state}: {_error(e)}")
            return None

    with ThreadPoolExecutor(max_workers=4) as pool:
        rows = [r for r in pool.map(attempt, states) if r]
    if not rows:
        raise RuntimeError(errors[0] if errors else "no state series")
    national = _fred("UNRATE", 2)
    if national:
        rows.append(("national", "unemployment", {"value": float(national[0]["value"]), "level": "none", "as_of": national[0]["date"][:7]}))
    return rows


def _grocery() -> List[Tuple[str, str, Dict[str, Any]]]:
    rows = []
    for region, series in REGION_CPI.items():
        got = _yoy(_fred(series, 30))
        if got:
            change, month = got
            level = "red" if change >= 6 else "amber" if change >= 3.5 else "green"
            rows.append((f"region:{region}", "grocery", {"value": change, "level": level, "as_of": month}))
    got = _yoy(_fred("CUUR0000SAF11", 30))
    if got:
        rows.append(("national", "grocery", {"value": got[0], "level": "none", "as_of": got[1]}))
    return rows


def _eia(path: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    resp = requests.get(f"https://api.eia.gov/v2/{path}/data/", headers=HEADERS, timeout=60,
                        params={"api_key": os.environ.get("EIA_API_KEY", "DEMO_KEY"), **params})
    resp.raise_for_status()
    return resp.json().get("response", {}).get("data", [])


def _gas() -> List[Tuple[str, str, Dict[str, Any]]]:
    data = _eia("petroleum/pri/gnd", {
        "frequency": "weekly", "data[0]": "value", "facets[product][]": "EPMR",
        "sort[0][column]": "period", "sort[0][direction]": "desc", "length": 200,
    })
    latest: Dict[str, Dict[str, Any]] = {}
    for r in data:
        latest.setdefault(r["duoarea"], r)
    rows = []
    for area, r in latest.items():
        value = float(r["value"])
        level = "red" if value >= 4.75 else "amber" if value >= 4.0 else "green"
        scope = "national" if area == "NUS" else f"gas:{area}"
        rows.append((scope, "gas", {"value": value, "level": "none" if area == "NUS" else level,
                                    "as_of": r["period"], "area_name": r.get("area-name")}))
    return rows


def _electricity() -> List[Tuple[str, str, Dict[str, Any]]]:
    data = _eia("electricity/retail-sales", {
        "frequency": "monthly", "data[0]": "price", "facets[sectorid][]": "RES",
        "sort[0][column]": "period", "sort[0][direction]": "desc", "length": 1500,
    })
    by_state: Dict[str, Dict[str, float]] = {}
    for r in data:
        if r.get("price") not in (None, ""):
            by_state.setdefault(r["stateid"], {})[r["period"]] = float(r["price"])
    rows = []
    for state, series in by_state.items():
        month = max(series)
        y, m = month.split("-")
        prior = series.get(f"{int(y) - 1}-{m}")
        if not prior:
            continue
        change = round((series[month] / prior - 1) * 100, 1)
        level = "red" if change >= 10 else "amber" if change >= 6 else "green"
        scope = "national" if state == "US" else f"state:{state}"
        if scope != "national" and state not in STATE_NAME:
            continue  # census divisions
        rows.append((scope, "electricity", {"value": series[month], "change_pct": change,
                                            "level": "none" if state == "US" else level, "as_of": month}))
    return rows


def _fema() -> List[Tuple[str, str, Dict[str, Any]]]:
    since = (datetime.utcnow() - timedelta(days=90)).strftime("%Y-%m-%d")
    resp = requests.get("https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries", headers=HEADERS, timeout=60, params={
        "$filter": f"declarationDate ge '{since}' and (declarationType eq 'DR' or declarationType eq 'EM')",
        "$select": "disasterNumber,declarationType,declarationDate,state,fipsStateCode,fipsCountyCode,"
                   "designatedArea,incidentType,declarationTitle,ihProgramDeclared",
        "$top": 10000,
    })
    resp.raise_for_status()
    counties: Dict[str, Dict[int, Dict[str, Any]]] = {}
    for r in resp.json().get("DisasterDeclarationsSummaries", []):
        if r.get("fipsCountyCode") in (None, "000"):
            continue  # statewide or tribal designations
        fips = f"{r['fipsStateCode']}{r['fipsCountyCode']}"
        counties.setdefault(fips, {})[r["disasterNumber"]] = {
            "number": r["disasterNumber"], "type": r["declarationType"], "date": r["declarationDate"][:10],
            "title": (r.get("declarationTitle") or r.get("incidentType") or "").title(),
            "individual_assistance": bool(r.get("ihProgramDeclared")),
        }
    rows = []
    for fips, disasters in counties.items():
        items = sorted(disasters.values(), key=lambda d: d["date"], reverse=True)
        aid = any(d["individual_assistance"] for d in items)
        rows.append((f"county:{fips}", "fema", {
            "value": len(items), "level": "red" if aid else "amber",
            "as_of": items[0]["date"], "disasters": items[:5], "individual_assistance": aid,
        }))
    return rows


def _county_lookup() -> Dict[Tuple[str, str], str]:
    """(state code, county name without suffix, lowercased) -> FIPS."""
    out = {}
    for fips, (name, state) in COUNTIES.items():
        base = name.lower()
        for suffix in (" county", " parish", " borough", " census area", " city and borough", " municipality", " city"):
            if base.endswith(suffix):
                base = base[: -len(suffix)]
                break
        out[(state, base)] = fips
    return out


def _wastewater() -> List[Tuple[str, str, Dict[str, Any]]]:
    since = (datetime.utcnow() - timedelta(days=21)).strftime("%Y-%m-%d")
    resp = requests.get("https://data.cdc.gov/resource/atcp-73re.json", headers=HEADERS, timeout=90, params={
        "$select": "state_territory,counties_served,week_end,pathogen_target,site_wval_category",
        "$where": f"week_end >= '{since}'", "$limit": 50000,
    })
    resp.raise_for_status()
    rows = resp.json()
    if not rows:
        return []
    latest = max(r["week_end"][:10] for r in rows)
    state_code = {v: k for k, v in STATE_NAME.items()}
    lookup = _county_lookup()
    rank = {"Very Low": 0, "Low": 1, "Moderate": 2, "High": 3, "Very High": 4}
    worst: Dict[str, Tuple[int, str, str]] = {}
    for r in rows:
        if r["week_end"][:10] != latest or r.get("site_wval_category") not in rank:
            continue
        state = state_code.get(r.get("state_territory", ""))
        for county in (r.get("counties_served") or "").split(","):
            fips = lookup.get((state, county.strip().lower()))
            if not fips:
                continue
            score = rank[r["site_wval_category"]]
            if fips not in worst or score > worst[fips][0]:
                worst[fips] = (score, r["site_wval_category"], r["pathogen_target"])
    names = {"SARS-CoV-2": "COVID", "Influenza A virus": "flu", "RSV": "RSV"}
    return [
        (f"county:{fips}", "wastewater", {
            "value": score, "category": cat, "pathogen": names.get(pathogen, pathogen),
            "level": "red" if score == 4 else "amber" if score == 3 else "green", "as_of": latest,
        })
        for fips, (score, cat, pathogen) in worst.items()
    ]


def _drought() -> List[Tuple[str, str, Dict[str, Any]]]:
    end = datetime.utcnow()
    start = end - timedelta(days=8)

    def one(state: str):
        resp = requests.get(
            "https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent",
            headers={**HEADERS, "Accept": "application/json"}, timeout=60,
            params={"aoi": state, "startdate": f"{start.month}/{start.day}/{start.year}",
                    "enddate": f"{end.month}/{end.day}/{end.year}", "statisticsType": 1},
        )
        resp.raise_for_status()
        return resp.json()

    states = [s for s in STATE_NAME if s not in ("DC", "PR")]
    with ThreadPoolExecutor(max_workers=6) as pool:
        batches = list(pool.map(lambda s: _safe(one, s) or [], states))
    latest: Dict[str, Dict[str, Any]] = {}
    for batch in batches:
        for r in batch:
            if r["fips"] not in latest or r["mapDate"] > latest[r["fips"]]["mapDate"]:
                latest[r["fips"]] = r
    rows = []
    for fips, r in latest.items():
        # Share of the county in severe drought (D2) or worse.
        severe = round(float(r["d2"]) + float(r["d3"]) + float(r["d4"]), 1)
        extreme = round(float(r["d3"]) + float(r["d4"]), 1)
        level = "red" if extreme >= 50 else "amber" if severe >= 50 else "green"
        rows.append((f"county:{fips}", "drought", {
            "value": severe, "extreme_pct": extreme, "any_drought_pct": round(100 - float(r["none"]), 1),
            "level": level, "as_of": r["mapDate"][:10],
        }))
    return rows


def _error(e: Exception) -> str:
    # Request errors echo the URL, which carries the API key.
    return re.sub(r"(api_key)=[^&\s]+", r"\1=***", str(e))[:300]


def _safe(fn, *args):
    try:
        return fn(*args)
    except Exception as e:
        logger.warning(f"local {fn.__name__}{args} failed: {_error(e)}")
        return None


SOURCES = {
    "unemployment": _unemployment, "grocery": _grocery, "gas": _gas, "electricity": _electricity,
    "fema": _fema, "wastewater": _wastewater, "drought": _drought,
}


def refresh(force: bool = False) -> Dict[str, Any]:
    """Collect every local metric that's more than REFRESH old. Returns rows saved, and why any failed."""
    ages = store.local_ages()
    now = datetime.now(timezone.utc)
    saved: Dict[str, int] = {}
    failed: Dict[str, str] = {}
    for metric, fn in SOURCES.items():
        if not force and metric in ages and now - ages[metric] < REFRESH:
            continue
        try:
            rows = fn()
        except Exception as e:
            failed[metric] = _error(e)
            logger.warning(f"local {metric} failed: {failed[metric]}")
            continue
        if rows:
            store.replace_local(metric, rows)
            saved[metric] = len(rows)
        else:
            failed[metric] = "no rows"
    return {"saved": saved, "failed": failed}


# ─── Serving ───

def for_county(fips: str) -> Optional[Dict[str, Any]]:
    if fips not in COUNTIES:
        return None
    name, state = COUNTIES[fips]
    region = REGION.get(state)
    area = gas_area(state)
    scopes = [f"county:{fips}", f"state:{state}", "national", f"gas:{area}"] + ([f"region:{region}"] if region else [])
    data = store.local_for(scopes)
    national = {m: v for (s, m), v in data.items() if s == "national"}
    place = f"{name}, {state}"
    signals = []

    def add(metric: str, scope: str, name_: str, where: str, **extra):
        v = data.get((scope, metric))
        if v:
            signals.append({"metric": metric, "name": name_, "where": where, "national": national.get(metric), **v, **extra})

    add("fema", f"county:{fips}", "Disaster declarations", name)
    add("wastewater", f"county:{fips}", "Illness in wastewater", name)
    add("drought", f"county:{fips}", "Drought", name)
    add("unemployment", f"state:{state}", "Unemployment", STATE_NAME.get(state, state))
    add("gas", f"gas:{area}", "Gas prices", STATE_NAME.get(state) if area.startswith("S") else GAS_AREA_NAME.get(area, "the US"))
    add("electricity", f"state:{state}", "Electricity prices", STATE_NAME.get(state, state))
    if region:
        add("grocery", f"region:{region}", "Grocery prices", REGION_NAME[region])
    return {"fips": fips, "county": name, "state": state, "place": place, "signals": signals}
