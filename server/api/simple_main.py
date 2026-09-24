"""
Canairy API — read-only view of the readings the collector job stored.

Nothing here calls an outside data source. Collection happens on a schedule
in api/collect.py; this app only reads the database, so traffic can't cause
upstream requests or cost.
"""

from __future__ import annotations

import logging
import os
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, List, Optional

import hmac
import re

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from api import baselines, local, rules, store
from api.catalog import BY_ID, CATALOG, IndicatorDef

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Canairy",
    version="3.1.0",
    description="Household early-warning signals from public data, collected hourly. Free to use; read-only.",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)

# An open, read-only feed: any site may read it (no cookies or credentials are involved).
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"], allow_headers=["*"])


@app.middleware("http")
async def cache_headers(request, call_next):
    """Data changes hourly: let the CDN serve reads for 5 minutes (stale up to an hour while refreshing)."""
    response = await call_next(request)
    path = request.url.path
    if request.method == "GET" and path.startswith("/api/") and "/cron/" not in path and response.status_code == 200:
        response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300, stale-while-revalidate=3600"
    return response

# If the scheduler hasn't finished a run in this long, the whole feed is stale.
FEED_STALE_AFTER = timedelta(hours=3)
TREND_LOOKBACK = timedelta(days=7)
TREND_TOLERANCE = 0.02  # changes under 2% count as stable

PHASE_NAMES = {
    0: "Foundations", 1: "72-Hour Bin", 2: "Digital & Comms",
    3: "Air, Health, Mobile", 4: "Dry-Basement / Perimeter",
    5: "Oil-Tank → Generator Prep", 6: "Shelter Nook Build",
    7: "Harden + Genset Live", 8: "Water & Circuits", 9: "Optional Safe-Room",
}
PHASE_COLORS = {
    0: "#10B981", 1: "#10B981", 2: "#10B981", 3: "#F59E0B", 4: "#F59E0B",
    5: "#F97316", 6: "#F97316", 7: "#EF4444", 8: "#EF4444", 9: "#991B1B",
}
LEVEL_SCORES = {"green": 0.0, "amber": 0.5, "red": 1.0}


# ─── Short in-process cache so bursts of traffic hit the DB once ───

_cache: Dict[str, Any] = {}


def _cached(key: str, ttl: float, fn: Callable[[], Any]) -> Any:
    hit = _cache.get(key)
    if hit and time.monotonic() - hit[0] < ttl:
        return hit[1]
    value = fn()
    _cache[key] = (time.monotonic(), value)
    return value


def _iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


def _trend(reading: store.Reading, before: Optional[float]) -> str:
    if before is None or reading.value is None:
        return "unknown"
    base = abs(before) if before else 1.0
    change = (reading.value - before) / base
    if abs(change) < TREND_TOLERANCE:
        return "stable"
    return "up" if change > 0 else "down"


def _indicator(defn: IndicatorDef, live: store.Reading, attempt: Optional[store.Reading],
               now: datetime, week_ago: Optional[float], baseline: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    age = now - live.collected_at
    stale = age > timedelta(hours=defn.max_age_hours)
    status: Dict[str, Any] = {
        # A stale reading is shown for context but never drives an alert.
        "level": "unknown" if stale else live.level,
        "value": live.value,
        "trend": _trend(live, week_ago),
        "lastUpdate": _iso(live.collected_at),
        "dataSource": "STALE" if stale else "LIVE",
    }
    if stale:
        status["note"] = f"Last real reading {age.days}d {age.seconds // 3600}h ago"
    elif defn.tier == "experimental":
        # Real data, but too loose a proxy to raise an alert: show it grey.
        status["signalLevel"] = live.level
        status["level"] = "unknown"
        status["note"] = "For context only. This doesn't change your alert level."
    if attempt is not None:
        status["lastAttempt"] = _iso(attempt.collected_at)

    return {
        "id": defn.id,
        "name": defn.name,
        "domain": defn.domain,
        "description": defn.description,
        "unit": defn.unit,
        "thresholds": defn.thresholds(),
        "critical": defn.critical,
        "greenFlag": defn.green_flag,
        "enabled": True,
        "unavailable": False,
        "tier": defn.tier,
        "area": defn.area,
        "dataSource": defn.source_name,
        "sourceUrl": defn.source_url,
        "updateFrequency": defn.update_frequency,
        "baseline": baselines.describe(baseline, live.value) if baseline else None,
        "status": status,
    }


def build_indicators() -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    live = store.latest_live()
    attempts = store.latest_attempts()
    # An indicator that has never produced a real reading (e.g. its API key isn't
    # configured) is left out rather than shown as a permanent blank.
    week_ago = store.values_at(now - TREND_LOOKBACK)
    context = store.all_baselines()
    indicators = [
        _indicator(d, live[d.id], attempts.get(d.id), now, week_ago.get(d.id), context.get(d.id))
        for d in CATALOG if d.id in live
    ]
    run = store.last_run()
    return {
        "indicators": indicators,
        "timestamp": _iso(run["finished_at"]) if run else None,
        "live_count": sum(1 for i in indicators if i["status"]["dataSource"] == "LIVE"),
        "total_count": len(indicators),
    }


def get_indicators_data() -> Dict[str, Any]:
    return _cached("indicators", 60, build_indicators)


def _alerting(indicators: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Indicators allowed to drive the phase: core tier with a fresh, real reading."""
    return [i for i in indicators if i["tier"] == "core" and i["status"]["dataSource"] == "LIVE"]


def compute_hopi(indicators: List[Dict[str, Any]]) -> Dict[str, Any]:
    counted = _alerting(indicators)
    by_domain: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for ind in counted:
        by_domain[ind["domain"]].append(ind)

    domains = {}
    for domain, inds in by_domain.items():
        scores = [LEVEL_SCORES[i["status"]["level"]] for i in inds]
        domains[domain] = {
            "score": round(sum(scores) / len(scores), 2),
            "weight": 1.0,
            "indicators": [i["id"] for i in inds],
            "criticalAlerts": [i["id"] for i in inds if i["critical"] and i["status"]["level"] == "red"],
        }
    score = round(sum(d["score"] for d in domains.values()) / len(domains), 2) if domains else 0

    red = sum(1 for i in counted if i["status"]["level"] == "red")
    amber = sum(1 for i in counted if i["status"]["level"] == "amber")
    if red >= 3:
        phase = 6
    elif red >= 2:
        phase = 4
    elif red >= 1 or amber >= 2:
        phase = 3
    elif amber >= 1:
        phase = 2
    else:
        phase = 1

    core_total = sum(1 for d in CATALOG if d.tier == "core")
    return {
        "score": score,
        # Share of core indicators with fresh real data.
        "confidence": round(100 * len(counted) / core_total) if core_total else 0,
        "phase": phase,
        "targetPhase": phase,
        "domains": domains,
        "counted": len(counted),
        "red": red,
        "amber": amber,
        "timestamp": _iso(datetime.now(timezone.utc)),
    }


# ═══════════════════════════════════════════════
# Routes (served under both /api and /api/v1)
# ═══════════════════════════════════════════════

@app.get("/")
def root():
    return {"name": "Canairy", "version": app.version, "docs": "/docs"}


@app.get("/health")
def health():
    run = store.last_run()
    fresh = bool(run and datetime.now(timezone.utc) - run["finished_at"] < FEED_STALE_AFTER)
    return {"ok": True, "lastRun": _iso(run["finished_at"]) if run else None, "feedFresh": fresh}


@app.get("/api/cron/collect", include_in_schema=False)
def cron_collect(authorization: Optional[str] = Header(None)):
    """Run one collection. For schedulers that call a URL (e.g. Vercel Cron),
    which send `Authorization: Bearer $CRON_SECRET`. Disabled unless CRON_SECRET is set."""
    secret = os.environ.get("CRON_SECRET")
    if not secret:
        raise HTTPException(status_code=404)
    if not authorization or not hmac.compare_digest(authorization, f"Bearer {secret}"):
        raise HTTPException(status_code=401)
    from api.collect import run_once
    result = run_once()
    _cache.clear()
    return {"run_id": result["run_id"], "live": result["live"], "total": result["total"], "briefing": result["briefing"]}


def _routes(prefix: str) -> None:
    @app.get(f"{prefix}/indicators")
    @app.get(f"{prefix}/indicators/", include_in_schema=False)
    def indicators():
        return get_indicators_data()

    @app.get(f"{prefix}/indicators/{{indicator_id}}")
    def indicator(indicator_id: str):
        for ind in get_indicators_data()["indicators"]:
            if ind["id"] == indicator_id:
                return ind
        raise HTTPException(status_code=404, detail=f"Unknown indicator {indicator_id}")

    @app.get(f"{prefix}/indicators/{{indicator_id}}/history")
    def indicator_history(indicator_id: str, range_: str = Query("30d", alias="range", pattern=r"^\d{1,3}d$")):
        if indicator_id not in BY_ID:
            raise HTTPException(status_code=404, detail=f"Unknown indicator {indicator_id}")
        days = min(int(range_[:-1]), 365)
        points = _cached(f"history:{indicator_id}:{days}", 300, lambda: [
            {"timestamp": _iso(r.collected_at), "value": r.value, "level": r.level}
            for r in store.history(indicator_id, days)
        ])
        return {"id": indicator_id, "range": f"{days}d", "points": points}

    @app.get(f"{prefix}/briefing")
    def briefing():
        latest = _cached("briefing", 60, store.latest_briefing)
        if not latest:
            return {"briefing": None}
        return {
            "briefing": latest["body"],
            "createdAt": _iso(latest["created_at"]),
            "model": latest["meta"].get("model"),
        }

    @app.get(f"{prefix}/local/{{county_fips}}")
    def local_signals(county_fips: str):
        """Signals for one county, its state and region. Takes a county, never a ZIP or address."""
        if not re.fullmatch(r"\d{5}", county_fips):
            raise HTTPException(status_code=422, detail="County must be a 5-digit FIPS code")
        data = _cached(f"local:{county_fips}", 300, lambda: local.for_county(county_fips))
        if data is None:
            raise HTTPException(status_code=404, detail=f"Unknown county {county_fips}")
        return data

    @app.get(f"{prefix}/rules")
    def rule_changes(days: int = Query(120, ge=1, le=180)):
        """Recent federal rules that name a family benefit program."""
        return {"rules": _cached(f"rules:{days}", 300, lambda: rules.recent(days))}

    @app.get(f"{prefix}/hopi")
    def hopi():
        return compute_hopi(get_indicators_data()["indicators"])

    @app.get(f"{prefix}/status")
    def status():
        data = get_indicators_data()
        run = store.last_run()
        now = datetime.now(timezone.utc)
        fresh = bool(run and now - run["finished_at"] < FEED_STALE_AFTER)
        core_total = sum(1 for d in CATALOG if d.tier == "core")
        counted = _alerting(data["indicators"])
        return {
            "operational": fresh,
            "lastUpdate": _iso(run["finished_at"]) if run else None,
            "activeAlerts": sum(1 for i in counted if i["status"]["level"] == "red"),
            "dataQuality": round(100 * len(counted) / core_total) if core_total else 0,
            "message": (
                f"{len(counted)} of {core_total} core indicators have fresh data."
                if fresh else "Data collection is behind schedule; readings may be out of date."
            ),
        }

    @app.get(f"{prefix}/phase")
    def phase():
        hopi_data = compute_hopi(get_indicators_data()["indicators"])
        n = hopi_data["phase"]
        return {
            "number": n,
            "name": PHASE_NAMES[n],
            "description": (
                f"Based on {hopi_data['counted']} indicators with fresh data: "
                f"{hopi_data['red']} red, {hopi_data['amber']} amber."
            ),
            "triggers": [],
            "actions": [],
            "color": PHASE_COLORS[n],
        }


_routes("/api")
_routes("/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.simple_main:app", host="127.0.0.1", port=int(os.environ.get("PORT", 5555)), reload=True)
