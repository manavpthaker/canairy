import { useEffect, useState } from 'react';
import { apiService, HistoryPoint } from '../services/api';

const RANGE_TO_API: Record<string, string> = { '24h': '1d', '7d': '7d', '30d': '30d', '90d': '90d' };
const CACHE_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; points: HistoryPoint[] }>();

/** Real stored readings for one indicator. Empty until the collector has run a few times. */
export function useIndicatorHistory(id: string, range: string = '30d') {
  const key = `${id}:${RANGE_TO_API[range] ?? range}`;
  const cached = cache.get(key);
  const [points, setPoints] = useState<HistoryPoint[]>(cached?.points ?? []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) {
      setPoints(hit.points);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiService
      .getIndicatorHistory(id, RANGE_TO_API[range] ?? range)
      .then((result) => {
        cache.set(key, { at: Date.now(), points: result });
        if (!cancelled) setPoints(result);
      })
      .catch(() => {
        if (!cancelled) setPoints([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { points, loading };
}
