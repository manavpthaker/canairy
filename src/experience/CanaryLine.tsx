import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndicatorData } from '../types';
import { AREA_ORDER, LEVEL_WORD, formatReading, levelOf } from './format';
import { useWidth } from './useWidth';

const SHORT_AREA: Record<string, string> = {
  costs: 'Costs', jobs: 'Jobs', banks: 'Banks', energy: 'Energy', health: 'Health', safety: 'Safety',
};

const HEIGHT = { red: 52, amber: 32, green: 12, unknown: 8 } as const;
const BASE = 62;
const GAP = 16;

/**
 * The canary line: every indicator is one tick on a single line, grouped by area.
 * Steady readings stay low and quiet; what needs attention rises and takes colour.
 */
export function CanaryLine({ indicators }: { indicators: IndicatorData[] }) {
  const navigate = useNavigate();
  const wrap = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const W = useWidth(wrap, 640);

  const layout = useMemo(() => {
    const groups = AREA_ORDER.map((area) => ({
      area,
      items: indicators.filter((i) => (i.area ?? 'safety') === area),
    })).filter((g) => g.items.length);
    const count = groups.reduce((n, g) => n + g.items.length, 0);
    const step = (W - 24 - GAP * (groups.length - 1)) / Math.max(count - 1 + groups.length, 1);
    let x = 12;
    let i = 0;
    const ticks: { ind: IndicatorData; x: number; i: number }[] = [];
    const labels: { area: string; x: number }[] = [];
    for (const g of groups) {
      labels.push({ area: g.area, x });
      for (const ind of g.items) {
        ticks.push({ ind, x, i: i++ });
        x += step;
      }
      x += GAP;
    }
    return { ticks, labels };
  }, [indicators, W]);

  const show = (x: number, y: number, ind: IndicatorData) => {
    const level = levelOf(ind);
    setTip({
      x: Math.min(Math.max(x, 90), W - 90),
      y,
      text: `${ind.name}: ${formatReading(ind.status.value, ind.unit)} · ${LEVEL_WORD[level]}`,
    });
  };

  const color = (level: string) =>
    level === 'red' ? 'var(--act)' : level === 'amber' ? 'var(--watch)' : level === 'green' ? 'var(--ink-3)' : 'var(--line)';

  return (
    <div className="cn-line" ref={wrap} style={{ position: 'relative' }}>
      <svg width={W} height={W < 520 ? 100 : 86} viewBox={`0 0 ${W} ${W < 520 ? 100 : 86}`} role="group" aria-label="Every signal Canairy tracks, grouped by area. Taller marks need more attention.">
        <line x1="4" x2={W - 4} y1={BASE} y2={BASE} stroke="var(--canary)" strokeWidth="3" strokeLinecap="round" />
        {layout.ticks.map(({ ind, x, i }) => {
          const level = levelOf(ind);
          const h = HEIGHT[level];
          const label = `${ind.name}: ${formatReading(ind.status.value, ind.unit)}, ${LEVEL_WORD[level].toLowerCase()}`;
          const go = () => navigate(`/signal/${ind.id}`);
          return (
            <g
              key={ind.id}
              className="tick"
              role="link"
              tabIndex={0}
              aria-label={label}
              style={{ ['--i' as string]: i }}
              onClick={go}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), go())}
              onMouseEnter={() => show(x, BASE - h, ind)}
              onFocus={() => show(x, BASE - h, ind)}
              onMouseLeave={() => setTip(null)}
              onBlur={() => setTip(null)}
            >
              <rect x={x - 6} y={BASE - 58} width="12" height="60" fill="transparent" />
              <line
                x1={x} x2={x} y1={BASE - 2} y2={BASE - h}
                stroke={color(level)}
                strokeWidth={level === 'red' || level === 'amber' ? 5 : 3}
                strokeDasharray={level === 'unknown' ? '2 3' : undefined}
                opacity={level === 'green' ? 0.55 : 1}
              />
              {(level === 'red' || level === 'amber') && (
                <circle cx={x} cy={BASE - h} r="4.5" fill={color(level)} stroke="var(--paper)" strokeWidth="2" />
              )}
            </g>
          );
        })}
        {layout.labels.map(({ area, x }, n) => (
          // On narrow screens alternate label rows so short groups don't collide.
          <text key={area} className="area-label" x={x} y={BASE + (W < 520 && n % 2 ? 34 : 20)}>{SHORT_AREA[area]}</text>
        ))}
      </svg>
      {tip && (
        <div className="cn-line-tip" role="status" style={{ left: tip.x, top: tip.y }}>
          {tip.text}
        </div>
      )}
    </div>
  );
}

export function CanaryMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M6 20c0-6 4.6-11 10.5-11 3 0 5.2 1.4 6.3 3.4L28 11l-3.6 4.1c.4 4.9-3.6 9.9-10.4 9.9H9.5L6 28v-8z" fill="var(--canary)" />
      <path d="M11 17.5c2.6 1.9 6.5 2.1 9.4.6" fill="none" stroke="var(--canary-deep)" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
      <circle cx="19.2" cy="12.6" r="1.35" fill="var(--ink)" />
    </svg>
  );
}
