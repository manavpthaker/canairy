"""
Scheduled collection job.

Runs every collector once, checks that each value is real data (not a
fallback, estimate or mock), scores it, and writes it to the database.

    python -m api.collect            # run once (what the scheduler calls)
    python -m api.collect --dry-run  # print results without saving

Run this on a schedule (Vercel Cron via /api/cron/collect, or launchd), never per page view.
"""

from __future__ import annotations

import argparse
import importlib
import logging
import os
import re
import socket
import sys
import time
from concurrent.futures import ThreadPoolExecutor, wait
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from api import store
from api.catalog import CATALOG, IndicatorDef, determine_level

logger = logging.getLogger("canairy.collect")

# Any single upstream call that hangs longer than this is abandoned.
socket.setdefaulttimeout(30)
PER_COLLECTOR_TIMEOUT = 90
MAX_WORKERS = 8

# Words in a collector's source label that mean "this is not a real reading".
NOT_LIVE_MARKERS = (
    "mock", "fallback", "estimat", "simulat", "placeholder", "hardcod",
    "sample", "default", "error", "unavailable", "cached",
)


def _load_class(filename: str, class_name: str):
    """Collector class by file name within the collectors package, e.g. ("verified.py", "X")."""
    return getattr(importlib.import_module(f"collectors.{filename[:-3]}"), class_name)


def _config() -> Dict[str, Any]:
    # Collectors take a config argument for historical reasons; none of the current ones use it.
    return {}


def classify(raw: Optional[Dict[str, Any]]) -> Tuple[str, Optional[float], Dict[str, Any]]:
    """Return (quality, value, detail). quality is 'live' only for real readings."""
    if raw is None:
        return "failed", None, {"error": "collector returned nothing"}
    md = raw.get("metadata") or {}
    label = str(md.get("data_source") or md.get("source") or "")
    detail = {"source_label": label}
    if md.get("error"):
        detail["error"] = str(md["error"])[:300]

    lowered = label.lower()
    if any(marker in lowered for marker in NOT_LIVE_MARKERS) or md.get("is_fallback") or md.get("error"):
        return "fallback", None, detail

    value = raw.get("value")
    try:
        value = float(value)
    except (TypeError, ValueError):
        detail["error"] = f"non-numeric value: {value!r}"[:300]
        return "failed", None, detail
    if value != value:  # NaN
        return "failed", None, {**detail, "error": "value is NaN"}
    return "live", value, detail


_SECRET_PARAM = re.compile(r"((?:api_)?key|token|secret)=[^&\s]+", re.I)


def _scrub(detail: Dict[str, Any]) -> Dict[str, Any]:
    """Error messages often echo the request URL; keep API keys out of the database."""
    if "error" in detail:
        detail["error"] = _SECRET_PARAM.sub(r"\1=***", detail["error"])
    return detail


def _run_one(defn: IndicatorDef, cls, config) -> store.Reading:
    now = datetime.now(timezone.utc)
    try:
        if cls is None:
            raise RuntimeError(f"could not load {defn.collector_class} from {defn.collector_file}")
        raw = cls(config).collect()
        quality, value, detail = classify(raw)
    except Exception as e:  # collector bugs must not stop the run
        quality, value, detail = "failed", None, {"error": f"{type(e).__name__}: {e}"[:300]}

    if quality == "live" and defn.transform is not None:
        value = defn.transform(value)
    if quality == "live" and defn.valid_range is not None:
        lo, hi = defn.valid_range
        if not (lo <= value <= hi):
            detail["error"] = f"value {value} outside plausible range {defn.valid_range}"
            quality, value = "failed", None

    level = determine_level(value, defn) if quality == "live" else "unknown"
    if quality == "live":
        value = round(value, 4)
    return store.Reading(defn.id, now, quality, value, level, _scrub(detail))


def collect_all(only: Optional[List[str]] = None) -> List[store.Reading]:
    config = _config()
    defs = [d for d in CATALOG if only is None or d.id in only]
    results: Dict[str, store.Reading] = {}

    # Rate-limited sources: skip while the last real reading is recent enough.
    throttled = [d for d in defs if d.min_interval_hours]
    if throttled:
        latest = store.latest_live()
        now = datetime.now(timezone.utc)
        defs = [
            d for d in defs
            if not d.min_interval_hours or d.id not in latest
            or now - latest[d.id].collected_at >= timedelta(hours=d.min_interval_hours)
        ]

    # Import collector modules up front; importing from several threads at once races.
    classes = {}
    for d in defs:
        try:
            classes[d.id] = _load_class(d.collector_file, d.collector_class)
        except Exception as e:
            logger.warning(f"cannot load {d.collector_class}: {e}")
            classes[d.id] = None

    pool = ThreadPoolExecutor(max_workers=MAX_WORKERS)
    futures = {pool.submit(_run_one, d, classes[d.id], config): d for d in defs}
    done, pending = wait(futures, timeout=PER_COLLECTOR_TIMEOUT * 2)
    for fut in done:
        reading = fut.result()
        results[reading.indicator_id] = reading
    for fut in pending:
        d = futures[fut]
        results[d.id] = store.Reading(d.id, datetime.now(timezone.utc), "failed", None,
                                      "unknown", {"error": "timed out"})
    pool.shutdown(wait=False, cancel_futures=True)
    return [results[d.id] for d in defs if d.id in results]


def run_once(only: Optional[List[str]] = None) -> Dict[str, Any]:
    """Collect everything and save it. Used by the CLI and the cron endpoint."""
    items = collect_all(only)
    live = sum(1 for r in items if r.quality == "live")
    run_id = store.start_run()
    store.save_readings(run_id, items)
    store.finish_run(run_id, live, len(items) - live)

    # New indicators get a year of history on their first run (no-op once they have it).
    past = backfill(365, quiet=True)
    if past:
        history_run = store.start_run()
        store.save_readings(history_run, past)
        store.finish_run(history_run, 0, 0)

    # Weekly: refresh "what's normal" from each source's long history.
    from api import baselines, local
    baselines.refresh()

    # Daily: county, state and regional signals for every place at once,
    # and federal rule changes that affect family benefits.
    local_status = local.refresh()
    from api import rules
    rules.refresh()

    # Briefing reads the same view the API serves; imported here to avoid an import cycle.
    from api import briefing
    from api.simple_main import build_indicators
    briefing_status = briefing.maybe_generate(build_indicators()["indicators"])
    return {"run_id": run_id, "live": live, "total": len(items), "items": items, "briefing": briefing_status,
            "local": local_status}


def backfill(days: int, quiet: bool = False) -> List[store.Reading]:
    """Past readings for collectors whose source keeps history (FRED, FEMA, CISA, …).

    Skips any indicator that already has readings older than two days, so running
    it twice doesn't duplicate history.
    """
    config = _config()
    cutoff = datetime.now(timezone.utc) - timedelta(days=2)
    items: List[store.Reading] = []
    for d in CATALOG:
        cls = _load_class(d.collector_file, d.collector_class)
        if not (hasattr(cls, "backfill") or hasattr(cls, "history")) or store.has_readings_before(d.id, cutoff):
            continue
        try:
            if hasattr(cls, "backfill"):
                points = cls(config).backfill(days)
            else:
                since = datetime.utcnow() - timedelta(days=days)
                points = [(w, v) for w, v in cls(config).history(max(1, -(-days // 365))) if w >= since]
        except Exception as e:
            logger.warning(f"backfill {d.id} failed: {e}")
            continue
        for when, value in points:
            if d.transform is not None:
                value = d.transform(value)
            if d.valid_range and not (d.valid_range[0] <= value <= d.valid_range[1]):
                continue
            items.append(store.Reading(
                d.id, when.replace(tzinfo=timezone.utc), "live", round(value, 4),
                determine_level(value, d), {"source_label": "backfill"},
            ))
        if not quiet:
            print(f"{d.id:32} {len(points)} points")
    return items


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="print results, don't save")
    parser.add_argument("--only", nargs="*", help="indicator ids to collect")
    parser.add_argument("--backfill", type=int, metavar="DAYS",
                        help="load past values from sources that keep history, then exit")
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(name)s: %(message)s")
    logger.setLevel(logging.INFO)

    if args.backfill:
        items = backfill(args.backfill)
        if items and not args.dry_run:
            run_id = store.start_run()
            store.save_readings(run_id, items)
            store.finish_run(run_id, 0, 0)
            print(f"saved {len(items)} past readings")
        sys.stdout.flush()
        os._exit(0)

    t0 = time.time()
    if args.dry_run:
        items = collect_all(args.only)
        live = sum(1 for r in items if r.quality == "live")
    else:
        result = run_once(args.only)
        items, live = result["items"], result["live"]

    for r in items:
        value = "" if r.value is None else r.value
        note = r.detail.get("error") or r.detail.get("source_label", "")
        print(f"{r.quality:8} {r.level:7} {r.indicator_id:32} {value!s:>12}  {note}")
    print(f"\n{live}/{len(items)} live in {time.time() - t0:.1f}s" + ("" if args.dry_run else f", saved run {result['run_id']}"))
    if not args.dry_run:
        print(f"briefing: {result['briefing']}")

    # Stuck collector threads would otherwise keep the process alive.
    sys.stdout.flush()
    os._exit(0 if live > 0 else 1)


if __name__ == "__main__":
    main()
