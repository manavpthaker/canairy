import { useRef } from 'react';
import { IndicatorData } from '../types';
import { formatReading, perspectiveLine } from './format';
import { useWidth } from './useWidth';

const year = (d: string) => d.slice(0, 4);
const monthYear = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

/**
 * Where today sits against its own history: record low to record high, the usual
 * range (middle half of readings) shaded, the alert lines, and today's reading.
 */
export function Perspective({ ind }: { ind: IndicatorData }) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box, 560);
  const b = ind.baseline;
  const v = typeof ind.status.value === 'number' ? ind.status.value : null;
  if (!b || v === null) return null;

  const amber = ind.thresholds.threshold_amber;
  const red = ind.thresholds.threshold_red;
  const iqr = b.p75 - b.p25 || Math.abs(b.p50) * 0.1 || 1;
  // Keep the usual range readable: records far outside it are named in text, not drawn to scale.
  const farHigh = b.max > b.p75 + 4 * iqr;
  const farLow = b.min < b.p25 - 4 * iqr;
  const candidates = [v, b.p25, b.p75, ...(amber !== undefined ? [amber] : []), ...(red !== undefined ? [red] : [])];
  const lo = farLow ? Math.min(...candidates, b.p25 - 1.5 * iqr) : Math.min(b.min, ...candidates);
  const hi = farHigh ? Math.max(...candidates, b.p75 + 1.5 * iqr) : Math.max(b.max, ...candidates);
  const pad = (hi - lo) * 0.04 || 1;
  const x0 = lo - pad;
  const x1 = hi + pad;
  const W = width;
  const L = 8;
  const R = W - 8;
  const x = (n: number) => L + ((n - x0) / (x1 - x0)) * (R - L);
  const Y = 34;
  const unit = ind.unit;
  const levelColor =
    ind.status.level === 'red' ? 'var(--act)' : ind.status.level === 'amber' ? 'var(--watch)' : 'var(--ink)';

  const line = perspectiveLine(ind);

  return (
    <section className="cn-perspective" aria-labelledby={`p-${ind.id}`}>
      <h2 id={`p-${ind.id}`} className="cn-h2" style={{ marginTop: '2rem' }}>In perspective</h2>
      <p style={{ marginTop: 0 }}>
        Usually between <strong>{formatReading(b.p25, unit)}</strong> and <strong>{formatReading(b.p75, unit)}</strong>{' '}
        (half of all readings since {year(b.since)}). {line}
      </p>
      <div ref={box}>
        <svg width={W} height={78} viewBox={`0 0 ${W} 78`} role="img"
          aria-label={`Usual range ${formatReading(b.p25, unit)} to ${formatReading(b.p75, unit)}; today ${formatReading(v, unit)}.`}>
          <line x1={L} x2={R} y1={Y} y2={Y} stroke="var(--line)" strokeWidth="6" strokeLinecap="round" />
          <rect x={x(b.p25)} y={Y - 7} width={Math.max(2, x(b.p75) - x(b.p25))} height="14" rx="7" fill="var(--steady-bg)" stroke="var(--steady)" strokeOpacity=".5" />
          <line x1={x(b.p50)} x2={x(b.p50)} y1={Y - 7} y2={Y + 7} stroke="var(--steady)" strokeWidth="2" />
          {amber !== undefined && (
            <g>
              <line x1={x(amber)} x2={x(amber)} y1={Y - 14} y2={Y + 14} stroke="var(--watch)" strokeWidth="2" strokeDasharray="3 3" />
              <text className="axis" x={x(amber)} y={Y + 28} textAnchor="middle" fill="var(--watch)">Watch</text>
            </g>
          )}
          {red !== undefined && (
            <g>
              <line x1={x(red)} x2={x(red)} y1={Y - 14} y2={Y + 14} stroke="var(--act)" strokeWidth="2" strokeDasharray="3 3" />
              <text className="axis" x={x(red)} y={Y + 28} textAnchor="middle" fill="var(--act)">Act</text>
            </g>
          )}
          <circle cx={x(v)} cy={Y} r="8" fill={levelColor} stroke="var(--paper)" strokeWidth="3" />
          <text className="axis" x={Math.min(Math.max(x(v), 40), W - 40)} y={Y - 16} textAnchor="middle" fill="var(--ink)" fontWeight="700">
            Today {formatReading(v, unit)}
          </text>
          {!farLow && <text className="axis" x={L} y={Y + 28}>{formatReading(b.min, unit)}</text>}
          {!farHigh && <text className="axis" x={R} y={Y + 28} textAnchor="end">{formatReading(b.max, unit)}</text>}
        </svg>
      </div>
      <p className="cn-note" style={{ marginTop: '0.25rem' }}>
        Record high {formatReading(b.max, unit)} ({monthYear(b.maxDate)}); record low {formatReading(b.min, unit)} (
        {monthYear(b.minDate)}). The shaded band is the usual range and the line inside it is the median.
      </p>
    </section>
  );
}
