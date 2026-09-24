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

    hopi = client.get("/api/v1/hopi").json()
    assert (hopi["red"], hopi["amber"], hopi["counted"]) == (1, 1, 2)
    assert hopi["phase"] == 3


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
