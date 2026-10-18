"""Collector classification, scoring, storage and API behaviour. No network."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from api import catalog, collect, store
from api.catalog import BY_ID, CATALOG, IndicatorDef, determine_level


def _defn(**overrides) -> IndicatorDef:
    base = dict(
        id="test_ind", name="Test", domain="economy", description="", unit="x",
        amber=10, red=20, collector_file="verified.py", collector_class="X",
        source_name="Test", source_url="", update_frequency="Daily", max_age_hours=48,
    )
    return IndicatorDef(**{**base, **overrides})


# ─── Scoring ───

@pytest.mark.parametrize("value,level", [(5, "green"), (10, "amber"), (19.9, "amber"), (20, "red")])
def test_level_higher_is_worse(value, level):
    assert determine_level(value, _defn()) == level


@pytest.mark.parametrize("value,level", [(3, "green"), (2, "amber"), (0.5, "amber"), (0, "red"), (-1, "red")])
def test_level_lower_is_worse(value, level):
    assert determine_level(value, _defn(amber=2, red=0)) == level


# ─── Catalog ───

def test_catalog_ids_unique_and_thresholds_distinct():
    assert len(BY_ID) == len(CATALOG)
    for d in CATALOG:
        assert d.amber != d.red, d.id
        assert d.tier in ("core", "experimental"), d.id
        assert d.max_age_hours > 0, d.id
        assert d.area in catalog.AREAS, d.id


def test_every_catalog_collector_loads():
    for d in CATALOG:
        cls = collect._load_class(d.collector_file, d.collector_class)
        assert callable(getattr(cls, "collect", None)), d.id


# ─── Classification: only real readings count as live ───

@pytest.mark.parametrize("label", [
    "Estimated", "Error fallback", "Fallback", "EIA Fallback", "mock_data", "MOCK", "Mock data - FRED unavailable",
])
def test_fallback_labels_are_not_live(label):
    quality, value, _ = collect.classify({"value": 5, "metadata": {"data_source": label}})
    assert quality == "fallback" and value is None


def test_real_reading_is_live():
    assert collect.classify({"value": "4.5", "metadata": {"data_source": "FRED ICSA"}})[:2] == ("live", 4.5)


@pytest.mark.parametrize("raw", [None, {"value": "n/a", "metadata": {}}, {"value": float("nan"), "metadata": {}}])
def test_missing_or_bad_values_fail(raw):
    assert collect.classify(raw)[0] == "failed"


def test_error_metadata_is_not_live():
    assert collect.classify({"value": 0, "metadata": {"data_source": "API", "error": "timeout"}})[0] == "fallback"


class _Stub:
    value = 0.0
    label = "Source"

    def __init__(self, config):
        pass

    def collect(self):
        return {"value": self.value, "metadata": {"data_source": self.label}}


def test_run_one_applies_transform_and_range():
    _Stub.value, _Stub.label = 250000, "FRED"
    ok = collect._run_one(_defn(transform=lambda v: v / 1000, amber=250, red=350, valid_range=(0, 1000)), _Stub, None)
    assert (ok.quality, ok.value, ok.level) == ("live", 250, "amber")

    _Stub.value = 5_000_000
    bad = collect._run_one(_defn(transform=lambda v: v / 1000, valid_range=(0, 1000)), _Stub, None)
    assert bad.quality == "failed" and bad.value is None and bad.level == "unknown"


def test_run_one_survives_collector_exception():
    class Boom(_Stub):
        def collect(self):
            raise RuntimeError("upstream down")

    r = collect._run_one(_defn(), Boom, None)
    assert r.quality == "failed" and "upstream down" in r.detail["error"]


def test_scrub_removes_api_keys():
    detail = collect._scrub({"error": "429 for url: https://x/?api_key=SECRET123&series=A&token=abc"})
    assert "SECRET123" not in detail["error"] and "abc" not in detail["error"]


# ─── Storage + API ───

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}")
    monkeypatch.delenv("CRON_SECRET", raising=False)
    store._engine = None
    from api import simple_main
    simple_main._cache.clear()
    yield TestClient(simple_main.app)
    store._engine = None


def _save(*readings):
    run = store.start_run()
    store.save_readings(run, list(readings))
    store.finish_run(run, sum(r.quality == "live" for r in readings), 0)


def _r(ind, value, level, hours_ago=0, quality="live"):
    when = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
    return store.Reading(ind, when, quality, value if quality == "live" else None,
                         level if quality == "live" else "unknown", {})


def test_api_reports_only_real_fresh_core_data(client):
    _save(
        _r("oil_brent_price", 115, "red"),                    # fresh core red
        _r("energy_gas_price", 4.5, "amber"),                 # fresh core amber
        _r("job_01_jobless_claims", 400, "red", hours_ago=30 * 24),  # stale → no alert
        _r("luxury_01_collapse", -40, "red"),                 # experimental → grey
        _r("spr_01_level", None, "unknown", quality="failed"),  # never live → hidden
    )
    body = client.get("/api/v1/indicators/").json()
    by_id = {i["id"]: i for i in body["indicators"]}

    assert "spr_01_level" not in by_id
    brent = by_id["oil_brent_price"]["status"]
    assert (brent["level"], brent["dataSource"]) == ("red", "LIVE")
    assert by_id["job_01_jobless_claims"]["status"]["level"] == "unknown"
    assert by_id["job_01_jobless_claims"]["status"]["dataSource"] == "STALE"
    lux = by_id["luxury_01_collapse"]["status"]
    assert lux["level"] == "unknown" and lux["signalLevel"] == "red"

    status = client.get("/api/v1/status").json()
    assert status["activeAlerts"] == 1


def test_latest_reading_is_by_time_not_insert_order(client):
    _save(_r("energy_gas_price", 4.5, "amber"))
    _save(_r("energy_gas_price", 3.1, "green", hours_ago=24 * 90))  # backfill inserted later
    status = client.get("/api/v1/indicators/energy_gas_price").json()["status"]
    assert status["value"] == 4.5


def test_trend_uses_week_old_value(client):
    _save(_r("energy_gas_price", 4.0, "amber", hours_ago=8 * 24), _r("energy_gas_price", 4.5, "amber"))
    assert client.get("/api/v1/indicators/energy_gas_price").json()["status"]["trend"] == "up"


def test_history_endpoint(client):
    _save(_r("energy_gas_price", 4.0, "amber", hours_ago=48), _r("energy_gas_price", 4.5, "amber"))
    points = client.get("/api/v1/indicators/energy_gas_price/history?range=7d").json()["points"]
    assert [p["value"] for p in points] == [4.0, 4.5]
    assert client.get("/api/v1/indicators/nope/history").status_code == 404
    assert client.get("/api/v1/indicators/energy_gas_price/history?range=abc").status_code == 422


def test_empty_database_is_honest(client):
    assert client.get("/api/v1/indicators/").json()["indicators"] == []
    status = client.get("/api/v1/status").json()
    assert status["operational"] is False and status["dataQuality"] == 0


def test_no_public_write_endpoints(client):
    assert client.post("/api/indicators/refresh-all").status_code in (404, 405)
    assert client.get("/api/cron/collect").status_code == 404  # disabled without CRON_SECRET


def test_cron_endpoint_requires_secret(client, monkeypatch):
    monkeypatch.setenv("CRON_SECRET", "s3cret")
    assert client.get("/api/cron/collect").status_code == 401
    assert client.get("/api/cron/collect", headers={"Authorization": "Bearer wrong"}).status_code == 401


@pytest.mark.parametrize("given,expected", [
    ("postgres://u:p@h.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x",
     "postgresql+psycopg://u:p@h.pooler.supabase.com:6543/postgres?sslmode=require"),
    ("postgresql://u:p@h:5432/db", "postgresql+psycopg://u:p@h:5432/db"),
    ("sqlite:///tmp/x.db", "sqlite:///tmp/x.db"),
])
def test_database_url_normalised(monkeypatch, given, expected):
    monkeypatch.delenv("POSTGRES_URL", raising=False)
    monkeypatch.setenv("DATABASE_URL", given)
    assert store._database_url() == expected


def test_postgres_url_used_when_database_url_missing(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("POSTGRES_URL", "postgres://u:p@h:5432/db")
    assert store._database_url() == "postgresql+psycopg://u:p@h:5432/db"


# ─── Briefing validation (no API calls) ───

def _brief_data():
    from api import briefing
    return briefing, {
        "counts": {"red": 1, "amber": 1, "green": 1},
        "indicators": [
            {"id": "oil", "name": "Oil", "measures": "Crude.", "value": 114.89, "unit": "$/bbl", "level": "red",
             "thresholds": {"amber": 90, "red": 110}, "trend_7d": "up", "tier": "core", "fresh": True, "source": "x"},
            {"id": "claims", "name": "Claims", "measures": "Claims.", "value": 197.0, "unit": "K/week", "level": "amber",
             "thresholds": {"amber": 250, "red": 350}, "trend_7d": "stable", "tier": "core", "fresh": True, "source": "x"},
            {"id": "measles", "name": "Measles", "measures": "Cases.", "value": 669, "unit": "cases", "level": "red",
             "thresholds": {"amber": 100, "red": 400}, "trend_7d": None, "tier": "experimental", "fresh": True, "source": "x"},
        ],
    }


def _action(title, why, ids):
    return {"title": title, "why": why, "urgency": "this week", "effort": "5 minutes", "cost": "free", "indicator_ids": ids}


def test_briefing_accepts_rounding_and_thousands():
    b, data = _brief_data()
    brief = {"headline": "Oil near $115", "summary": "Claims at 197,000 a week.",
             "actions": [_action("Trim trips", "Oil is $114.9 a barrel.", ["oil"])], "watch": []}
    cleaned, problems = b.validate(brief, data)
    assert cleaned is not None and problems == []


def test_briefing_drops_invented_dollars_and_context_only_actions():
    b, data = _brief_data()
    brief = {"headline": "Oil is high", "summary": "Fuel is the pressure.",
             "actions": [_action("Save $20", "Saves $20 a week.", ["oil"]),
                         _action("Check shots", "669 cases.", ["measles"]),
                         _action("Trim trips", "Oil is high.", ["oil"])],
             "watch": [{"indicator_id": "claims", "note": "Up 12% soon."}]}
    cleaned, problems = b.validate(brief, data)
    assert [a["title"] for a in cleaned["actions"]] == ["Trim trips"]
    assert cleaned["watch"] == [] and len(problems) == 3


def test_briefing_rejected_when_summary_invents_numbers():
    b, data = _brief_data()
    brief = {"headline": "Oil is high", "summary": "Prices will rise 30% by March.",
             "actions": [_action("Trim trips", "Oil is high.", ["oil"])], "watch": []}
    cleaned, _ = b.validate(brief, data)
    assert cleaned is None


def test_reads_are_cdn_cacheable_but_cron_is_not(client, monkeypatch):
    _save(_r("energy_gas_price", 4.5, "amber"))
    assert "s-maxage=300" in client.get("/api/v1/indicators").headers["cache-control"]
    monkeypatch.setenv("CRON_SECRET", "s")
    assert "cache-control" not in client.get("/api/cron/collect").headers


def test_briefing_refreshes_when_quoted_values_move():
    b, data = _brief_data()
    fp = b.fingerprint(data)
    data["indicators"][1]["value"] = 199.0  # 197 → 199: still "200" at 2 sig figs
    assert b.fingerprint(data) == fp
    data["indicators"][0]["value"] = 131.0  # oil 115 → 131: quoted number would be wrong
    assert b.fingerprint(data) != fp


# ─── Baselines ───

def test_summarize_and_percentile():
    from api import baselines
    start = datetime(2020, 1, 1)
    points = [(start + timedelta(days=i), float(i)) for i in range(101)]  # 0..100
    stats = baselines.summarize(points)
    assert (stats["p25"], stats["p50"], stats["p75"]) == (25, 50, 75)
    assert (stats["min"], stats["max"], stats["maxDate"]) == (0, 100, "2020-04-10")
    assert baselines.percentile(90, stats["quantiles"]) == 90
    assert baselines.percentile(-5, stats["quantiles"]) == 0
    assert baselines.percentile(500, stats["quantiles"]) == 100
    assert baselines.summarize(points[:5]) is None  # too little history to say what's normal


def test_api_includes_baseline(client):
    from api import baselines
    _save(_r("energy_gas_price", 4.5, "amber"))
    pts = [(datetime(2016, 1, 1) + timedelta(weeks=i), 2.0 + i / 100) for i in range(200)]
    store.save_baseline("energy_gas_price", baselines.summarize(pts))
    b = client.get("/api/v1/indicators/energy_gas_price").json()["baseline"]
    assert b["since"] == "2016-01-01" and b["percentile"] == 100 and "quantiles" not in b


# ─── Local and rules ───

def test_local_for_county_joins_scopes(client):
    from api import local
    store.replace_local("fema", [("county:34017", "fema", {"value": 1, "level": "red", "individual_assistance": True, "as_of": "2026-09-01"})])
    store.replace_local("unemployment", [
        ("state:NJ", "unemployment", {"value": 4.9, "level": "amber", "as_of": "2026-08", "rise_from_12mo_low": 0.4}),
        ("national", "unemployment", {"value": 4.3, "level": "none", "as_of": "2026-08"}),
    ])
    out = local.for_county("34017")
    assert out["place"].endswith("NJ")
    by = {s["metric"]: s for s in out["signals"]}
    assert by["fema"]["where"] == out["county"] and by["fema"]["level"] == "red"
    assert by["unemployment"]["where"] == "New Jersey" and by["unemployment"]["national"]["value"] == 4.3
    assert local.for_county("99999") is None


def test_local_route_validates_fips(client):
    assert client.get("/api/v1/local/abc").status_code in (404, 422)
    assert client.get("/api/v1/local/99999").status_code == 404


@pytest.mark.parametrize("text,expected", [
    ("Supplemental Nutrition Assistance Program: Work Requirements", ["SNAP"]),
    ("Amendments to Section 898 reporting", []),
    ("Section 8 Housing Choice Voucher Program", ["Housing assistance"]),
    ("Medicaid and CHIP eligibility", ["Medicaid and CHIP"]),
    ("Chipset export controls", []),
])
def test_rule_program_matching_is_whole_word(text, expected):
    from api import rules
    assert rules._programs(text) == expected


def test_rule_summary_numbers_must_come_from_rule():
    from api import rules
    source = "This rule raises the asset limit to $3,000 effective October 1, 2026."
    assert rules._grounded("The asset limit rises to $3,000 on October 1, 2026.", source)
    assert not rules._grounded("The asset limit rises to $4,500.", source)


# ─── Guidance, as-of dates and the outlook (2026-10-17) ───

def test_every_core_indicator_has_written_advice():
    from api.simple_main import ADVICE
    for d in CATALOG:
        if d.tier == "core":
            entry = ADVICE.get(d.id)
            assert entry, d.id
            for part in ("whatItMeans", "familyImpact", "whatToDo"):
                assert entry[part]["amber"] and entry[part]["red"], (d.id, part)


def test_feed_carries_guidance_for_elevated_readings_only(client):
    when = datetime.now(timezone.utc)
    _save(
        _r("oil_brent_price", 126, "red"),
        _r("job_01_jobless_claims", 199, "green"),
        _r("bio_03_measles", 733, "red"),  # experimental: guidance from its real level
        _r("job_04_sahm_rule", 0.6, "red", hours_ago=60 * 24),  # stale: no guidance
        store.Reading("energy_gas_price", when, "live", 4.4, "amber", {"observation_date": "2026-10-12"}),
    )
    by_id = {i["id"]: i for i in client.get("/api/v1/indicators").json()["indicators"]}
    oil = by_id["oil_brent_price"]["guidance"]
    assert oil["level"] == "red" and oil["whatToDo"]
    assert by_id["job_01_jobless_claims"]["guidance"] is None
    assert by_id["bio_03_measles"]["guidance"]["level"] == "red"
    assert by_id["job_04_sahm_rule"]["guidance"] is None
    gas = by_id["energy_gas_price"]
    assert gas["guidance"]["level"] == "amber"
    assert gas["status"]["asOf"] == "2026-10-12"
    assert "asOf" not in by_id["oil_brent_price"]["status"]


def test_old_briefing_is_not_served(client):
    from sqlalchemy import update
    store.save_briefing("fp", {"headline": "h", "summary": "s", "actions": [], "watch": []}, "published", {"model": "m"})
    assert client.get("/api/v1/briefing").json()["briefing"]["headline"] == "h"
    with store.engine().begin() as conn:
        conn.execute(update(store.briefings).values(created_at=datetime.now(timezone.utc) - timedelta(hours=72)))
    from api import simple_main
    simple_main._cache.clear()
    body = client.get("/api/v1/briefing").json()
    assert body["briefing"] is None and body["lastCreatedAt"]


def test_outlook_lists_upcoming_dates_in_order(client):
    from datetime import date
    from api.simple_main import build_outlook
    out = build_outlook(date(2026, 10, 17))
    assert [d["daysAway"] for d in out["upcoming"]] == sorted(d["daysAway"] for d in out["upcoming"])
    assert out["upcoming"][0]["date"] == "2026-11-01" and out["upcoming"][0]["daysAway"] == 15
    assert all(d["daysAway"] >= 0 for d in out["upcoming"])
    assert {t["id"] for t in out["tests"]} >= {"H1", "H4a", "H7"}
    assert client.get("/api/v1/outlook").status_code == 200
    for item in out["dates"]:
        for ind in item.get("indicators", []):
            assert ind in BY_ID, ind


def test_classify_keeps_the_observation_date():
    quality, _, detail = collect.classify({"value": 3.1, "metadata": {"data_source": "FRED X", "observation_date": "2026-09-01", "other": "x"}})
    assert quality == "live" and detail == {"source_label": "FRED X", "observation_date": "2026-09-01"}


def test_bond_swing_skips_sessions_without_a_range():
    from collectors.verified import _latest_session_range
    chart = {"timestamp": [1760659200, 1760745600, 1760832000],
             "indicators": {"quote": [{"high": [4.10, 4.15, 4.12], "low": [4.02, 4.05, 4.12]}]}}
    day, hi, lo = _latest_session_range(chart)
    assert (hi, lo) == (4.15, 4.05) and day == "2025-10-18"
    assert _latest_session_range({"timestamp": [1], "indicators": {"quote": [{"high": [None], "low": [None]}]}}) is None


# ─── Household stages (2026-10-18) ───

NO_DATES = {"dates": []}


def _series(ind, points):
    """Readings at (days_ago, value) points."""
    when = datetime.now(timezone.utc)
    return [store.Reading(ind, when - timedelta(days=d), "live", v, "unknown", {}) for d, v in points]


def _area(out, area_id):
    return next(a for a in out["areas"] if a["id"] == area_id)


def test_stage_needs_the_act_line_held_two_weeks(client):
    from api import stages
    _save(*_series("oil_brent_price", [(20, 115), (10, 120), (0, 126)]))
    out = stages.compute(NO_DATES)
    energy = _area(out, "energy")
    assert energy["stage"] == 2 and "act line ($110 a barrel)" in energy["why"][0]
    assert energy["down"].startswith("Back to Watch 4 weeks after Crude Oil Price")
    assert out["overall"]["stage"] == 1, "one area at Prepare keeps the household at Watch"


def test_new_red_is_watch_until_it_holds(client):
    from api import stages
    _save(*_series("energy_gas_price", [(30, 3.9), (5, 4.8), (0, 4.9)]))
    energy = _area(stages.compute(NO_DATES), "energy")
    assert energy["stage"] == 1
    assert energy["next"][0].startswith("Prepare on ") and "Gas Prices stays above $4.75 a gallon" in energy["next"][0]


def test_two_areas_at_prepare_move_the_household(client):
    from api import stages
    _save(*_series("oil_brent_price", [(20, 115), (0, 126)]), *_series("bank_02_discount_window", [(20, 60), (0, 70)]))
    out = stages.compute(NO_DATES)
    assert out["overall"]["stage"] == 2 and "Energy" in out["overall"]["why"] and "Banks and markets" in out["overall"]["why"]


def test_prepare_cools_off_for_four_weeks(client):
    from api import stages
    _save(*_series("oil_brent_price", [(40, 115), (20, 116), (10, 80), (0, 80)]))
    energy = _area(stages.compute(NO_DATES), "energy")
    assert energy["stage"] == 2 and "until" in energy["why"][0]
    assert energy["down"].startswith("Back to Watch on ")


def test_watch_cools_off_for_thirty_days(client):
    from api import stages
    _save(*_series("energy_gas_price", [(40, 4.2), (20, 4.1), (10, 3.5), (0, 3.4)]))
    energy = _area(stages.compute(NO_DATES), "energy")
    assert energy["stage"] == 1 and energy["down"].startswith("Back to Baseline on ")


def test_watch_ends_after_thirty_clear_days(client):
    from api import stages
    _save(*_series("energy_gas_price", [(60, 4.2), (40, 3.5), (0, 3.4)]))
    assert _area(stages.compute(NO_DATES), "energy")["stage"] == 0


def test_brace_line_is_immediate(client):
    from api import stages
    _save(*_series("oil_brent_price", [(1, 120), (0, 152)]))
    out = stages.compute(NO_DATES)
    assert _area(out, "energy")["stage"] == 3 and out["overall"]["stage"] == 3


def test_travel_advisories_count_at_once(client):
    from api import stages
    _save(*_series("world_02_taiwan_advisory", [(30, 1), (0, 3)]))
    assert _area(stages.compute(NO_DATES), "world")["stage"] == 2


def test_context_readings_raise_watch_only(client):
    from api import stages
    _save(*_series("bio_03_measles", [(60, 700), (0, 900)]))
    health = _area(stages.compute(NO_DATES), "health")
    assert health["stage"] == 1 and "context only" in health["why"][0]


def test_stale_readings_do_not_count(client):
    from api import stages
    _save(*_series("job_04_sahm_rule", [(90, 0.7), (60, 0.8)]))
    assert _area(stages.compute(NO_DATES), "jobs")["stage"] == 0


def test_dated_tripwire_raises_watch(client):
    from datetime import date
    from api import stages
    soon = (datetime.now(timezone.utc).date() + timedelta(days=10)).isoformat()
    far = (datetime.now(timezone.utc).date() + timedelta(days=60)).isoformat()
    outlook = {"dates": [{"date": soon, "title": "Election", "stageAreas": ["politics"]},
                         {"date": far, "title": "Later", "stageAreas": ["world"]}]}
    out = stages.compute(outlook)
    assert _area(out, "politics")["stage"] == 1 and "in 10 days" in _area(out, "politics")["why"][0]
    assert _area(out, "world")["stage"] == 0
    assert stages.tripwires({"dates": [{"date": "2026-11-01", "until": "2026-12-31", "title": "Drills", "stageAreas": ["world"]}]}, date(2026, 11, 20)) == {"world": ["Drills under way until Dec 31"]}


def test_stages_and_plan_routes(client):
    from api import stages
    from api.simple_main import PLAN
    _save(*_series("oil_brent_price", [(20, 115), (0, 126)]))
    body = client.get("/api/v1/stages").json()
    assert body["overall"]["stage"] == 1 and {a["id"] for a in body["areas"]} == {a.id for a in stages.AREAS}
    assert client.get("/api/v1/plan").json()["ladder"][2]["name"] == "Prepare"
    assert set(PLAN["areas"]) == {a.id for a in stages.AREAS}
    for area in stages.AREAS:
        for rid in area.readings + area.watch_only:
            assert rid in BY_ID, rid
        assert all(rid in stages.AREA_BY_ID for rid in [area.id])
    for rid in stages.BRACE:
        assert rid in BY_ID, rid
    assert client.get("/api/v1/hopi").status_code == 404


def test_stage_wording():
    from api.stages import fmt
    assert fmt(BY_ID["oil_brent_price"], 110) == "$110 a barrel"
    assert fmt(BY_ID["job_01_jobless_claims"], 199) == "199,000 a week"
    assert fmt(BY_ID["world_02_taiwan_advisory"], 3) == "Level 3"
    assert fmt(BY_ID["housing_04_rent_cpi"], 2.78) == "+2.8% from a year ago"


def test_advisory_parsing():
    import xml.etree.ElementTree as ET
    from collectors.verified import ChinaAdvisoryCollector, TaiwanAdvisoryCollector, advisory_reading
    rss = ET.fromstring("""<rss><channel>
      <item><title>Macau - Level 3: Reconsider Travel</title><description>x</description></item>
      <item><title>China - Level 2: Exercise Increased Caution</title><pubDate>Fri, 04 Sep 2026 00:00:00 -0500</pubDate><description>Arbitrary enforcement of local laws.</description></item>
      <item><title>Taiwan - Level 4: Do Not Travel</title><description>On May 1 the Department ordered the departure of non-emergency U.S. government employees.</description></item>
    </channel></rss>""")
    china = advisory_reading(ChinaAdvisoryCollector({}), rss)
    assert china["value"] == 2.0 and china["metadata"]["observation_date"] == "2026-09-04"
    assert advisory_reading(TaiwanAdvisoryCollector({}), rss)["value"] == 5.0
