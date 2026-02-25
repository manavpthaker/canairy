"""
Canairy API — serves indicator data with live collection where available.

Live collectors (no API key needed):
  - CISA KEV (cyber threats)
  - WHO Disease Outbreaks (RSS)
  - Grocery CPI (BLS — limited free tier)

Live collectors (need FRED_API_KEY env var):
  - Treasury yield volatility
  - Jobless claims
  - GDP growth

All other indicators served from curated mock data matching the frontend schema.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List
from datetime import datetime
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Canairy",
    version="2.2.0",
    description="Household Resilience Monitoring — Live + Mock Data API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:5173",
        "https://canairy.onrender.com",
        "https://canairy.xyz",
        "https://www.canairy.xyz",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Try to initialize live data service ───
data_service = None
try:
    from data_service import get_data_service
    data_service = get_data_service()
    logger.info(f"Live data service initialized with collectors: {list(data_service._collectors.keys())}")
except Exception as e:
    logger.warning(f"Live data service unavailable, using mock only: {e}")


# ─── Mock data for all 34 indicators (matches frontend mockData.ts IDs) ───

def _now() -> str:
    return datetime.utcnow().isoformat()


def _ind(id: str, name: str, domain: str, desc: str, unit: str,
         value: Any, level: str, trend: str, source: str,
         threshold_amber: float, threshold_red: float,
         critical: bool = False, green_flag: bool = False,
         enabled: bool = True) -> Dict[str, Any]:
    """Build an indicator dict matching the frontend IndicatorData shape."""
    return {
        "id": id,
        "name": name,
        "domain": domain,
        "description": desc,
        "unit": unit,
        "thresholds": {
            "green": {"max": threshold_amber},
            "amber": {"min": threshold_amber, "max": threshold_red},
            "red": {"min": threshold_red},
            "threshold_amber": threshold_amber,
            "threshold_red": threshold_red,
        },
        "critical": critical,
        "greenFlag": green_flag,
        "enabled": enabled,
        "dataSource": source,
        "updateFrequency": "60m",
        "status": {
            "level": level,
            "value": value,
            "trend": trend,
            "lastUpdate": _now(),
            "dataSource": "MOCK",
        },
    }


def get_all_mock_indicators() -> List[Dict[str, Any]]:
    """Return all 34 indicators with mock data."""
    return [
        # ── Economy (4) ──
        _ind("econ_01_treasury_tail", "10Y Auction Tail", "economy",
             "10-year Treasury auction tail in basis points", "bps",
             2.1, "green", "stable", "US Treasury API", 3, 7),
        _ind("econ_02_grocery_cpi", "Grocery CPI", "economy",
             "Grocery CPI 3-month annualized", "%",
             5.4, "amber", "up", "BLS API", 4, 8),
        _ind("market_01_intraday_swing", "10Y Intraday Swing", "economy",
             "10-year Treasury intraday swing in basis points", "bps",
             24.3, "amber", "up", "Yahoo Finance", 20, 30, critical=True),
        _ind("green_g1_gdp_rates", "GDP Green Flag", "economy",
             "US real GDP growth rate", "condition",
             0, "amber", "stable", "BEA / FRED", 1, 0, green_flag=True),

        # ── Jobs & Labor (1) ──
        _ind("job_01_strike_days", "US Strike Days", "jobs_labor",
             "US strike worker-days per month", "worker-days",
             78000, "green", "stable", "Cornell ILR", 100000, 500000),

        # ── Rights & Governance (2) ──
        _ind("power_01_ai_surveillance", "AI Surveillance Bills", "rights_governance",
             "AI-surveillance bills advancing per month", "bills",
             6, "amber", "up", "LegiScan API", 3, 10),
        _ind("civil_01_acled_protests", "US Protests (7d avg)", "rights_governance",
             "ACLED US protests 7-day average", "protests/day",
             18, "green", "stable", "ACLED API", 25, 75),

        # ── Security & Infrastructure (3) ──
        _ind("cyber_01_cisa_kev", "CISA KEV + ICS", "security_infrastructure",
             "CISA Known Exploited Vulnerabilities (90-day count)", "vulns",
             4, "amber", "up", "CISA JSON Feed", 2, 5),
        _ind("grid_01_pjm_outages", "PJM Grid Outages", "security_infrastructure",
             "PJM outages affecting ≥50k customers per quarter", "outages",
             1, "green", "stable", "DOE OE-417", 1, 2),
        _ind("bio_01_h2h_countries", "Novel H2H Pathogen", "security_infrastructure",
             "Countries with novel human-to-human transmission (14-day)", "countries",
             0, "green", "stable", "WHO DON RSS", 1, 3),

        # ── Oil Axis (4) ──
        _ind("oil_01_russian_brics", "Russian Crude to BRICS", "oil_axis",
             "Share of Russian crude going to BRICS nations", "%",
             68, "amber", "up", "CREA", 60, 75),
        _ind("oil_02_mbridge_settlements", "mBridge Settlement", "oil_axis",
             "mBridge energy settlement volume", "M USD/day",
             32, "green", "up", "BIS Reports", 50, 300, enabled=False),
        _ind("oil_03_ofac_designations", "OFAC Designations", "oil_axis",
             "OFAC sanctions designations (30-day count)", "designations",
             0, "green", "stable", "Treasury OFAC", 1, 5),
        _ind("oil_04_refinery_ratio", "Refinery Run Ratio", "oil_axis",
             "Refinery run-rate ratio (India+China)/OECD", "ratio",
             1.15, "green", "stable", "JODI API", 1.2, 1.4),

        # ── AI Window (4) ──
        _ind("labor_ai_01_layoffs", "AI-Linked Layoffs", "ai_window",
             "Monthly workers laid off citing AI/automation", "workers",
             3200, "green", "stable", "Layoffs.fyi", 5000, 25000, enabled=False),
        _ind("cyber_02_ai_ransomware", "AI Ransomware", "ai_window",
             "AI-assisted ransomware incidents (90-day)", "incidents",
             4, "amber", "up", "CISA ICS", 3, 6),
        _ind("info_02_deepfake_shocks", "Deepfake Market Shocks", "ai_window",
             "Deepfake-triggered market events per quarter", "events",
             0, "green", "stable", "Composite", 1, 2, critical=True),
        _ind("compute_01_training_cost", "Training Cost Trend", "ai_window",
             "$/training-FLOP 6-month change (%)", "%",
             -42, "green", "down", "Epoch AI", -30, 0, green_flag=True),

        # ── Global Conflict (6) ──
        _ind("global_conflict_intensity", "Global Battle Intensity", "global_conflict",
             "ACLED global battle-related events 90-day average", "events/day",
             720, "amber", "up", "ACLED API", 500, 2000, enabled=False),
        _ind("taiwan_pla_activity", "Taiwan PLA Incursions", "global_conflict",
             "PLA aircraft incursions into Taiwan ADIZ (14-day avg)", "aircraft/day",
             28, "amber", "up", "Taiwan MND", 20, 100),
        _ind("nato_high_readiness", "NATO High Readiness", "global_conflict",
             "NATO high-readiness force activations", "activations",
             0, "green", "stable", "NATO / News", 1, 2, critical=True),
        _ind("nuclear_test_activity", "Nuclear/Missile Tests", "global_conflict",
             "Nuclear detonation or ICBM tests (90-day count)", "tests",
             1, "green", "stable", "CTBTO / KCNA", 2, 10),
        _ind("russia_nato_escalation", "Russia-NATO Index", "global_conflict",
             "Russia-NATO escalation composite index", "index",
             45, "amber", "up", "Composite", 30, 80, enabled=False),
        _ind("defense_spending_growth", "Defense Spending Growth", "global_conflict",
             "Global defense spending year-over-year growth", "%",
             6.2, "amber", "up", "SIPRI", 5, 15, enabled=False),

        # ── Domestic Control (6) ──
        _ind("dc_control_countdown", "DC Autonomy Countdown", "domestic_control",
             "Days until DC autonomy revocation", "days",
             900, "green", "stable", "Congress.gov", 730, 365, enabled=False),
        _ind("national_guard_metros", "Guard Metro Deployments", "domestic_control",
             "Major metros with National Guard deployment", "metros",
             0, "green", "stable", "News Aggregator", 1, 2, critical=True),
        _ind("ice_detention_surge", "ICE Detention Population", "domestic_control",
             "ICE detention population", "detainees",
             62000, "amber", "up", "ICE Statistics", 50000, 150000),
        _ind("dhs_removal_expansion", "DHS Expedited Removal", "domestic_control",
             "DHS expedited removal expansion status", "status",
             0, "green", "stable", "Federal Register", 0, 1, critical=True),
        _ind("hill_control_legislation", "Control Bills Advancing", "domestic_control",
             "Control-oriented bills advancing in Congress", "bills",
             4, "amber", "up", "LegiScan API", 3, 10),
        _ind("liberty_litigation_count", "Liberty Cases Active", "domestic_control",
             "Major civil liberty cases currently active", "cases",
             8, "amber", "up", "ACLU / EFF", 5, 20),

        # ── Cult Signals (4 — all disabled) ──
        _ind("cult_trend_01_twitter", "#AIGod / #Basilisk Tweets", "cult",
             "X/Twitter 24h volume of AI-cult hashtags", "tweets",
             4200, "green", "stable", "X API", 10000, 50000, enabled=False),
        _ind("cult_meme_01_tokens", "Cult ERC-20 Tokens", "cult",
             "New ERC-20 tokens with cult+AI in name", "tokens",
             2, "green", "stable", "Etherscan", 5, 20, enabled=False),
        _ind("cult_event_01_protests", "AI Cult Protests", "cult",
             "ACLED protests mentioning AI + god/cult/church", "protests",
             0, "green", "stable", "ACLED API", 1, 4, enabled=False),
        _ind("cult_media_01_trends", "AI Religion Trends", "cult",
             "Google Trends score for 'AI religion' (US weekly)", "score",
             8, "green", "stable", "Google Trends", 15, 40, enabled=False),
    ]


def get_indicators_with_live_data() -> Dict[str, Any]:
    """
    Merge live-collected data into the full indicator set.
    Live data overrides mock for matching IDs.
    """
    mock_indicators = get_all_mock_indicators()
    live_count = 0

    if data_service:
        try:
            live_data = data_service.collect_all()
            live_by_id = {ind['id']: ind for ind in live_data}

            for i, mock in enumerate(mock_indicators):
                if mock['id'] in live_by_id:
                    mock_indicators[i] = live_by_id[mock['id']]
                    live_count += 1
        except Exception as e:
            logger.error(f"Live collection error, serving mock: {e}")

    logger.info(f"Serving {len(mock_indicators)} indicators ({live_count} live, {len(mock_indicators) - live_count} mock)")

    return {
        "indicators": mock_indicators,
        "timestamp": _now(),
        "live_count": live_count,
        "total_count": len(mock_indicators),
    }


# ─── Compute HOPI score from current indicators ───

def compute_hopi(indicators: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compute HOPI score from current indicator states."""
    from collections import defaultdict

    DOMAIN_WEIGHTS = {
        'economy': 1.0, 'jobs_labor': 1.0, 'rights_governance': 1.0,
        'security_infrastructure': 1.25, 'oil_axis': 1.0, 'ai_window': 1.0,
        'global_conflict': 1.5, 'domestic_control': 1.25, 'cult': 0.75,
    }
    LEVEL_SCORES = {'green': 0.0, 'amber': 0.5, 'red': 1.0, 'unknown': 0.3}

    domain_indicators: Dict[str, List] = defaultdict(list)
    domain_critical: Dict[str, List] = defaultdict(list)

    for ind in indicators:
        domain = ind.get('domain', 'economy')
        level = ind.get('status', {}).get('level', 'unknown')
        domain_indicators[domain].append(ind)
        if ind.get('critical') and level == 'red':
            domain_critical[domain].append(ind['id'])

    domains = {}
    weighted_sum = 0.0
    total_weight = 0.0

    for domain, weight in DOMAIN_WEIGHTS.items():
        inds = domain_indicators.get(domain, [])
        if not inds:
            domains[domain] = {"score": 0, "weight": weight, "indicators": [], "criticalAlerts": []}
            continue

        scores = [LEVEL_SCORES.get(i['status']['level'], 0.3) for i in inds]
        avg = sum(scores) / len(scores)
        domains[domain] = {
            "score": round(avg, 2),
            "weight": weight,
            "indicators": [i['id'] for i in inds],
            "criticalAlerts": domain_critical.get(domain, []),
        }
        weighted_sum += avg * weight
        total_weight += weight

    hopi = round(weighted_sum / total_weight, 2) if total_weight > 0 else 0

    # Determine phase from HOPI score
    red_count = sum(1 for i in indicators if i['status']['level'] == 'red')
    amber_count = sum(1 for i in indicators if i['status']['level'] == 'amber')

    if red_count >= 3:
        phase = 6
    elif red_count >= 2:
        phase = 4
    elif red_count >= 1 or amber_count >= 2:
        phase = 3
    elif amber_count >= 1:
        phase = 2
    else:
        phase = 1

    return {
        "score": hopi,
        "confidence": 88,
        "phase": phase,
        "targetPhase": phase,
        "domains": domains,
        "timestamp": _now(),
    }


# ═══════════════════════════════════════════════
# Routes — match frontend API paths exactly
# ═══════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "name": "Canairy",
        "version": "2.2.0",
        "status": "operational",
        "docs": "/docs",
        "live_collectors": list(data_service._collectors.keys()) if data_service else [],
    }


@app.get("/api/indicators")
async def get_indicators():
    """All indicators — live where available, mock elsewhere."""
    return get_indicators_with_live_data()


# Also serve on /api/v1/ paths for backwards compatibility
@app.get("/api/v1/indicators/")
async def get_indicators_v1():
    return get_indicators_with_live_data()


@app.get("/api/indicators/{indicator_id}")
async def get_indicator(indicator_id: str):
    """Single indicator by ID."""
    data = get_indicators_with_live_data()
    for ind in data["indicators"]:
        if ind["id"] == indicator_id:
            return ind
    return {"error": "Not found", "id": indicator_id}


@app.get("/api/hopi")
async def get_hopi():
    """HOPI score computed from current indicators."""
    data = get_indicators_with_live_data()
    return compute_hopi(data["indicators"])


@app.get("/api/v1/hopi")
async def get_hopi_v1():
    return await get_hopi()


@app.get("/api/status")
async def get_status():
    """System status."""
    data = get_indicators_with_live_data()
    red_count = sum(1 for i in data["indicators"] if i["status"]["level"] == "red")
    return {
        "operational": True,
        "lastUpdate": _now(),
        "activeAlerts": red_count,
        "dataQuality": round(data["live_count"] / max(data["total_count"], 1) * 100) if data["live_count"] > 0 else 88,
        "message": f"Monitoring {data['total_count']} indicators ({data['live_count']} live).",
    }


@app.get("/api/v1/status")
async def get_status_v1():
    return await get_status()


@app.get("/api/phase")
async def get_phase():
    """Current recommended phase."""
    data = get_indicators_with_live_data()
    hopi = compute_hopi(data["indicators"])
    phase_num = hopi["phase"]

    PHASE_NAMES = {
        0: "Foundations", 1: "72-Hour Bin", 2: "Digital & Comms",
        3: "Air, Health, Mobile", 4: "Dry-Basement / Perimeter",
        5: "Oil-Tank → Generator Prep", 6: "Shelter Nook Build",
        7: "Harden + Genset Live", 8: "Water & Circuits",
        9: "Optional Safe-Room",
    }
    PHASE_COLORS = {
        0: "#10B981", 1: "#10B981", 2: "#10B981", 3: "#F59E0B",
        4: "#F59E0B", 5: "#F97316", 6: "#F97316", 7: "#EF4444",
        8: "#EF4444", 9: "#991B1B",
    }

    return {
        "number": phase_num,
        "name": PHASE_NAMES.get(phase_num, "Unknown"),
        "description": f"Phase {phase_num} activated based on current indicator readings.",
        "triggers": [f"Based on {hopi['score']:.0%} HOPI score"],
        "actions": [],
        "color": PHASE_COLORS.get(phase_num, "#6B7280"),
    }


@app.get("/api/v1/phase")
async def get_phase_v1():
    return await get_phase()


@app.post("/api/indicators/refresh-all")
async def refresh_all():
    """Invalidate cache and re-collect."""
    if data_service:
        data_service.invalidate_cache()
    return {"status": "ok", "message": "Cache invalidated, next request will re-collect."}


@app.post("/api/indicators/{indicator_id}/refresh")
async def refresh_indicator(indicator_id: str):
    """Refresh a single indicator."""
    if data_service:
        data_service.invalidate_cache()
    return await get_indicator(indicator_id)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5555))
    uvicorn.run("simple_main:app", host="0.0.0.0", port=port, reload=True)
