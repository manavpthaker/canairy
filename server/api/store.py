"""
Persistent storage for indicator readings.

The collector job (api/collect.py) writes one row per indicator per run.
The API only reads from here, so page views never trigger outbound requests.

DATABASE_URL (or POSTGRES_URL) selects the backend:
  - unset                → SQLite file at data/canairy.db (local dev)
  - postgres://...       → Postgres (production, e.g. Supabase via Vercel)
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Column, DateTime, Float, Integer, MetaData, String, Table, Text,
    create_engine, func, select, and_, text,
)
from sqlalchemy.engine import Engine
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

metadata = MetaData()

runs = Table(
    "runs", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("started_at", DateTime(timezone=True), nullable=False),
    Column("finished_at", DateTime(timezone=True)),
    Column("live_count", Integer, default=0),
    Column("failed_count", Integer, default=0),
)

readings = Table(
    "readings", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("run_id", Integer, nullable=False, index=True),
    Column("indicator_id", String(64), nullable=False, index=True),
    Column("collected_at", DateTime(timezone=True), nullable=False, index=True),
    # 'live' = real value from the source; anything else has value NULL
    Column("quality", String(16), nullable=False),
    Column("value", Float),
    Column("level", String(16), nullable=False),
    Column("detail", Text),  # JSON: source label, error message, raw metadata
)

briefings = Table(
    "briefings", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("created_at", DateTime(timezone=True), nullable=False, index=True),
    Column("fingerprint", Text, nullable=False),
    # published | rejected | error. Only published briefings are served.
    Column("status", String(16), nullable=False),
    Column("body", Text),  # JSON briefing
    Column("meta", Text),  # JSON: model, token usage, validation problems
)

baselines = Table(
    "baselines", metadata,
    Column("indicator_id", String(64), primary_key=True),
    Column("computed_at", DateTime(timezone=True), nullable=False),
    Column("stats", Text, nullable=False),  # JSON, see api.baselines.summarize
)


# libpq rejects query parameters it doesn't know (Supabase adds e.g. `supa=`).
_LIBPQ_PARAMS = {"sslmode", "sslrootcert", "connect_timeout", "application_name", "options", "target_session_attrs"}


def _database_url() -> str:
    # DATABASE_URL wins; POSTGRES_URL is what Vercel's Supabase/Postgres integrations set.
    url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
    if not url and os.environ.get("VERCEL"):
        raise RuntimeError("DATABASE_URL / POSTGRES_URL is not set; the deployed API needs a Postgres database.")
    if not url:
        path = Path(__file__).resolve().parents[2] / "data" / "canairy.db"
        path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{path}"

    parts = urlsplit(url)
    if parts.scheme not in ("postgres", "postgresql", "postgresql+psycopg"):
        return url
    query = urlencode([(k, v) for k, v in parse_qsl(parts.query) if k in _LIBPQ_PARAMS])
    scheme = "postgresql+psycopg"  # SQLAlchemy needs the driver named; providers hand out postgres://
    return urlunsplit((scheme, parts.netloc, parts.path, query, parts.fragment))


PG_SCHEMA = "canairy"

_engine: Optional[Engine] = None


def engine() -> Engine:
    global _engine
    if _engine is None:
        url = _database_url()
        if url.startswith("sqlite"):
            _engine = create_engine(url, future=True)
        else:
            # Fluid Compute reuses instances, so a small pool saves a TLS handshake per query.
            # No server-side prepared statements, so transaction-mode poolers (Supabase) work.
            # Tables live in their own schema: Supabase exposes `public` through its REST API.
            _engine = create_engine(
                url, future=True, pool_size=2, max_overflow=3, pool_recycle=300, pool_pre_ping=True,
                connect_args={"prepare_threshold": None},
                execution_options={"schema_translate_map": {None: PG_SCHEMA}},
            )
            with _engine.begin() as conn:
                conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {PG_SCHEMA}"))
        metadata.create_all(_engine)
    return _engine


def _utc(dt: datetime) -> datetime:
    # SQLite drops tzinfo on read; everything we store is UTC.
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


@dataclass
class Reading:
    indicator_id: str
    collected_at: datetime
    quality: str
    value: Optional[float]
    level: str
    detail: Dict[str, Any]


def _row_to_reading(row) -> Reading:
    return Reading(
        indicator_id=row.indicator_id,
        collected_at=_utc(row.collected_at),
        quality=row.quality,
        value=row.value,
        level=row.level,
        detail=json.loads(row.detail) if row.detail else {},
    )


def start_run() -> int:
    with engine().begin() as conn:
        result = conn.execute(runs.insert().values(started_at=datetime.now(timezone.utc)))
        return int(result.inserted_primary_key[0])


def finish_run(run_id: int, live_count: int, failed_count: int) -> None:
    with engine().begin() as conn:
        conn.execute(
            runs.update().where(runs.c.id == run_id).values(
                finished_at=datetime.now(timezone.utc),
                live_count=live_count,
                failed_count=failed_count,
            )
        )


def save_readings(run_id: int, items: List[Reading]) -> None:
    if not items:
        return
    with engine().begin() as conn:
        conn.execute(readings.insert(), [
            {
                "run_id": run_id,
                "indicator_id": r.indicator_id,
                "collected_at": r.collected_at,
                "quality": r.quality,
                "value": r.value,
                "level": r.level,
                "detail": json.dumps(r.detail, default=str),
            }
            for r in items
        ])


def last_run() -> Optional[Dict[str, Any]]:
    with engine().connect() as conn:
        row = conn.execute(
            select(runs).where(runs.c.finished_at.is_not(None)).order_by(runs.c.id.desc()).limit(1)
        ).first()
    if not row:
        return None
    return {
        "id": row.id,
        "started_at": _utc(row.started_at),
        "finished_at": _utc(row.finished_at),
        "live_count": row.live_count,
        "failed_count": row.failed_count,
    }


def _latest_per_indicator(conn, *conditions) -> Dict[str, Reading]:
    # By reading time, not row id: backfilled history is inserted after newer rows.
    stmt = select(readings.c.indicator_id, func.max(readings.c.collected_at).label("latest"))
    if conditions:
        stmt = stmt.where(*conditions)
    sub = stmt.group_by(readings.c.indicator_id).subquery()
    query = select(readings).join(sub, and_(
        readings.c.indicator_id == sub.c.indicator_id,
        readings.c.collected_at == sub.c.latest,
    ))
    if conditions:
        query = query.where(*conditions)
    rows = conn.execute(query.order_by(readings.c.id)).all()
    return {r.indicator_id: _row_to_reading(r) for r in rows}


def latest_attempts() -> Dict[str, Reading]:
    """Most recent reading per indicator, whatever its quality."""
    with engine().connect() as conn:
        return _latest_per_indicator(conn)


def latest_live() -> Dict[str, Reading]:
    """Most recent real (quality='live') reading per indicator."""
    with engine().connect() as conn:
        return _latest_per_indicator(conn, readings.c.quality == "live")


def history(indicator_id: str, days: int) -> List[Reading]:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    with engine().connect() as conn:
        rows = conn.execute(
            select(readings)
            .where(and_(
                readings.c.indicator_id == indicator_id,
                readings.c.quality == "live",
                readings.c.collected_at >= since,
            ))
            .order_by(readings.c.collected_at)
        ).all()
    return [_row_to_reading(r) for r in rows]


def has_readings_before(indicator_id: str, when: datetime) -> bool:
    with engine().connect() as conn:
        row = conn.execute(
            select(readings.c.id)
            .where(and_(readings.c.indicator_id == indicator_id, readings.c.collected_at < when))
            .limit(1)
        ).first()
    return row is not None


def save_briefing(fingerprint: str, body: Optional[Dict[str, Any]], status: str, meta: Dict[str, Any]) -> None:
    with engine().begin() as conn:
        conn.execute(briefings.insert().values(
            created_at=datetime.now(timezone.utc), fingerprint=fingerprint, status=status,
            body=json.dumps(body) if body is not None else None, meta=json.dumps(meta, default=str),
        ))


def latest_briefing() -> Optional[Dict[str, Any]]:
    """Most recent published briefing."""
    with engine().connect() as conn:
        row = conn.execute(
            select(briefings).where(briefings.c.status == "published").order_by(briefings.c.id.desc()).limit(1)
        ).first()
    if not row:
        return None
    return {
        "created_at": _utc(row.created_at), "fingerprint": row.fingerprint,
        "body": json.loads(row.body), "meta": json.loads(row.meta or "{}"),
    }


def briefing_calls_since(when: datetime) -> int:
    """API calls attempted since `when`, whatever their outcome (the spend cap counts all of them)."""
    with engine().connect() as conn:
        return conn.execute(
            select(func.count()).select_from(briefings).where(briefings.c.created_at >= when)
        ).scalar_one()


def values_at(when: datetime) -> Dict[str, float]:
    """Latest live value per indicator recorded at or before `when`, in one query (for trends)."""
    with engine().connect() as conn:
        sub = (
            select(readings.c.indicator_id, func.max(readings.c.collected_at).label("latest"))
            .where(and_(readings.c.quality == "live", readings.c.collected_at <= when))
            .group_by(readings.c.indicator_id)
            .subquery()
        )
        rows = conn.execute(
            select(readings.c.indicator_id, readings.c.value)
            .join(sub, and_(readings.c.indicator_id == sub.c.indicator_id, readings.c.collected_at == sub.c.latest))
            .where(readings.c.quality == "live")
        ).all()
    return {r.indicator_id: r.value for r in rows}


def save_baseline(indicator_id: str, stats: Dict[str, Any]) -> None:
    with engine().begin() as conn:
        conn.execute(baselines.delete().where(baselines.c.indicator_id == indicator_id))
        conn.execute(baselines.insert().values(
            indicator_id=indicator_id, computed_at=datetime.now(timezone.utc), stats=json.dumps(stats),
        ))


def all_baselines() -> Dict[str, Dict[str, Any]]:
    with engine().connect() as conn:
        rows = conn.execute(select(baselines)).all()
    return {r.indicator_id: {**json.loads(r.stats), "computed_at": _utc(r.computed_at)} for r in rows}
