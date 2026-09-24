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
