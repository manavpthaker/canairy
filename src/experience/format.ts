import { IndicatorData } from '../types';

export type Level = 'red' | 'amber' | 'green' | 'unknown';

export const LEVEL_WORD: Record<Level, string> = {
  red: 'Act now',
  amber: 'Worth watching',
  green: 'Steady',
  unknown: 'For context',
};

export const AREA_ORDER = ['costs', 'jobs', 'banks', 'energy', 'health', 'safety'] as const;

export const AREA_NAME: Record<string, string> = {
  costs: 'Household costs',
  jobs: 'Jobs, income and debt',
  banks: 'Banks and markets',
  energy: 'Energy',
  health: 'Health',
  safety: 'Safety',
};

/** Level that drives alerts. Experimental and stale readings report 'unknown'. */
export function levelOf(ind: IndicatorData): Level {
  return (ind.status.level as Level) ?? 'unknown';
}

export function isAlerting(ind: IndicatorData): boolean {
  return ind.status.dataSource === 'LIVE' && (ind.status.level === 'red' || ind.status.level === 'amber');
}

/** "$4.48/gal", "2.75% y/y", "1,719K", "35 per 90d" */
export function formatReading(value: number | string | null | undefined, unit: string): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);

  if (unit.startsWith('$')) {
    const amount = Math.abs(n) < 100 ? n.toFixed(2) : Math.round(n).toLocaleString('en-US');
    return `$${amount}${unit.slice(1)}`;
  }
  const digits = Math.abs(n) >= 100 ? 0 : Math.abs(n) >= 10 ? 1 : 2;
  const num = n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  if (unit === '%') return `${num}%`;
  if (unit.startsWith('% ')) return `${num}% ${unit.slice(2)}`;
  if (unit === 'K' || unit.startsWith('K/')) return `${num}${unit}`;
  if (unit === 'ratio') return num;
  return `${num} ${unit}`;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'not yet';
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** Group indicators by area in display order. */
export function byArea(indicators: IndicatorData[]): [string, IndicatorData[]][] {
  const groups = new Map<string, IndicatorData[]>();
  for (const area of AREA_ORDER) groups.set(area, []);
  for (const ind of indicators) {
    const area = ind.area && groups.has(ind.area) ? ind.area : 'safety';
    groups.get(area)!.push(ind);
  }
  return [...groups.entries()].filter(([, list]) => list.length > 0);
}

export const SEVERITY: Record<Level, number> = { red: 0, amber: 1, green: 2, unknown: 3 };
