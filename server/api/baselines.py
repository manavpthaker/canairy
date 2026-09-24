"""
Historical context for each signal: what's usual, what's a record, and where
today's reading falls.

Computed from up to 10 years of the same official source (via each collector's
`history`), refreshed weekly by the collection job. Nothing is estimated: a
signal whose source has no history simply has no baseline.
"""

from __future__ import annotations

import logging
import time
from bisect import bisect_left, bisect_right
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from api import store
from api.catalog import CATALOG, IndicatorDef

logger = logging.getLogger("canairy.baselines")

YEARS = 10
MAX_AGE = timedelta(days=7)
MIN_POINTS = 20


def _quantile(sorted_vals: List[float], q: float) -> float:
    pos = q * (len(sorted_vals) - 1)
    lo = int(pos)
    hi = min(lo + 1, len(sorted_vals) - 1)
    return sorted_vals[lo] + (sorted_vals[hi] - sorted_vals[lo]) * (pos - lo)


def summarize(points: List[Tuple[datetime, float]]) -> Optional[Dict[str, Any]]:
    """Usual range (middle half), median, records with dates, and a 21-point quantile table."""
    points = sorted(points)
    if len(points) < MIN_POINTS:
        return None
    vals = sorted(v for _, v in points)
    lo_d, lo_v = min(points, key=lambda p: (p[1], p[0]))
    hi_d, hi_v = max(points, key=lambda p: (p[1], -p[0].timestamp()))
    return {
        "since": points[0][0].strftime("%Y-%m-%d"),
        "n": len(vals),
        "p25": round(_quantile(vals, 0.25), 4),
        "p50": round(_quantile(vals, 0.50), 4),
        "p75": round(_quantile(vals, 0.75), 4),
        "min": round(lo_v, 4), "minDate": lo_d.strftime("%Y-%m-%d"),
        "max": round(hi_v, 4), "maxDate": hi_d.strftime("%Y-%m-%d"),
        "quantiles": [round(_quantile(vals, i / 20), 4) for i in range(21)],
    }


def percentile(value: float, quantiles: List[float]) -> int:
    """Share of past readings below `value` (0–100), from the 21-point table."""
    if value <= quantiles[0]:
        return 0
    if value >= quantiles[-1]:
        return 100
    i = bisect_right(quantiles, value) - 1
    j = min(i + 1, 20)
    span = quantiles[j] - quantiles[i]
    frac = (value - quantiles[i]) / span if span else 0.5
    # Ties across several quantiles: take the middle of the tied run.
    first = bisect_left(quantiles, value)
    if quantiles[first] == value:
        last = bisect_right(quantiles, value) - 1
        return round(100 * ((first + last) / 2) / 20)
    return round(100 * (i + frac) / 20)


def history_points(defn: IndicatorDef, cls) -> List[Tuple[datetime, float]]:
    raw = cls({}).history(YEARS)
    out = []
    for when, v in raw:
        v = defn.transform(v) if defn.transform else v
        if defn.valid_range and not (defn.valid_range[0] <= v <= defn.valid_range[1]):
            continue
        out.append((when, v))
    return out


def refresh(budget_seconds: float = 90) -> List[str]:
    """Recompute baselines older than a week, within a time budget. Returns ids refreshed."""
    from api.collect import _load_class

    existing = store.all_baselines()
    now = datetime.now(timezone.utc)
    started = time.monotonic()
    done = []
    for defn in CATALOG:
        if time.monotonic() - started > budget_seconds:
            break
        cls = _load_class(defn.collector_file, defn.collector_class)
        if not hasattr(cls, "history"):
            continue
        current = existing.get(defn.id)
        if current and now - current["computed_at"] < MAX_AGE:
            continue
        try:
            stats = summarize(history_points(defn, cls))
        except Exception as e:  # a history source being down must not break collection
            logger.warning(f"baseline {defn.id} failed: {e}")
            continue
        if stats:
            store.save_baseline(defn.id, stats)
            done.append(defn.id)
    return done


def describe(stats: Dict[str, Any], value: Optional[float]) -> Dict[str, Any]:
    """The subset of a baseline the API returns, with today's percentile."""
    out = {k: stats[k] for k in ("since", "p25", "p50", "p75", "min", "minDate", "max", "maxDate")}
    if isinstance(value, (int, float)):
        out["percentile"] = percentile(float(value), stats["quantiles"])
    return out
