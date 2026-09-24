import { HistoryPoint } from '../services/api';
import { useRef } from 'react';
import { formatReading } from './format';
import { useWidth } from './useWidth';

interface Props {
  points: HistoryPoint[];
  amber: number;
  red: number;
  unit: string;
  level: string;
  /** Compact sparkline (no labels) vs full chart */
  compact?: boolean;
  label: string;
}

const COLOR: Record<string, string> = {
  red: 'var(--act)', amber: 'var(--watch)', green: 'var(--steady)', unknown: 'var(--ink-3)',
};

/** Line of real stored readings with the amber and red thresholds drawn in. */
export function Chart(props: Props) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box, props.compact ? 320 : 640);
  return <div ref={box}><ChartSvg {...props} width={width} /></div>;
}

function ChartSvg({ points, amber, red, unit, level, compact, label, width }: Props & { width: number }) {
  const W = width;
  const H = compact ? 44 : Math.round(Math.min(260, Math.max(180, W * 0.42)));
  const pad = compact ? { l: 2, r: 6, t: 6, b: 6 } : { l: 4, r: 96, t: 14, b: 26 };

  if (points.length < 2) {
    return compact ? null : (
      <p className="cn-note">Not enough history yet. Readings are saved every hour and the trend will appear here.</p>
    );
  }

  const values = points.map((p) => p.value);
  const lo = Math.min(...values, ...(compact ? [] : [amber, red]));
  const hi = Math.max(...values, ...(compact ? [] : [amber, red]));
  const span = hi - lo || Math.abs(hi) || 1;
  const min = lo - span * 0.08;
  const max = hi + span * 0.08;
  const t0 = new Date(points[0].timestamp).getTime();
  const t1 = new Date(points[points.length - 1].timestamp).getTime();
  const x = (t: string) => pad.l + ((new Date(t).getTime() - t0) / Math.max(t1 - t0, 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.timestamp).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const inRange = (v: number) => v >= min && v <= max;
  const date = (t: string) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {[{ v: amber, c: 'var(--watch)', t: 'amber' }, { v: red, c: 'var(--act)', t: 'red' }].map(
        (th) =>
          inRange(th.v) && (
            <g key={th.t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(th.v)} y2={y(th.v)} stroke={th.c} strokeWidth="1" strokeDasharray="4 4" opacity=".7" vectorEffect="non-scaling-stroke" />
              {!compact && (
                <text className="axis" x={W - pad.r + 6} y={y(th.v) + 4} fill={th.c}>
                  {th.t === 'red' ? 'Act' : 'Watch'} {formatReading(th.v, unit)}
                </text>
              )}
            </g>
          ),
      )}
      <path d={path} fill="none" stroke={COLOR[level] ?? 'var(--ink-2)'} strokeWidth={compact ? 1.75 : 2.25} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(last.timestamp)} cy={y(last.value)} r={compact ? 2.5 : 4} fill={COLOR[level] ?? 'var(--ink-2)'} />
      {!compact && (
        <>
          <text className="axis" x={pad.l} y={H - 6}>{date(points[0].timestamp)}</text>
          <text className="axis" x={W - pad.r} y={H - 6} textAnchor="end">{date(last.timestamp)}</text>
        </>
      )}
    </svg>
  );
}
