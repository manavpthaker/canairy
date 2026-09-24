import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { useIndicatorHistory } from '../hooks/useIndicatorHistory';
import { getAdvice } from './advice';
import { Chart } from './Chart';
import { Perspective } from './Perspective';
import { helpFor } from './help';
import { useHousehold } from './household';
import { AREA_NAME, LEVEL_WORD, byArea, formatReading, levelOf, timeAgo } from './format';

const RANGES = [['90d', '3 months'], ['365d', '1 year']] as const;

export function SignalPage() {
  const { id } = useParams();
  const ind = useStore((s) => s.indicators.find((i) => i.id === id));
  const loaded = useStore((s) => s.indicators.length > 0);
  const household = useHousehold();
  const [range, setRange] = useState<string>('365d');
  const { points, loading } = useIndicatorHistory(id ?? '', range);

  if (!ind) {
    return (
      <div className="cn-column">
        <Link className="cn-back" to="/">Back to today</Link>
        <h1 className="cn-headline">{loaded ? 'We don’t track that signal.' : 'Loading…'}</h1>
        {loaded && <p><Link to="/signals">See every signal Canairy tracks</Link>.</p>}
      </div>
    );
  }

  const level = levelOf(ind);
  const shownLevel = (ind.status.signalLevel ?? level) as 'red' | 'amber' | 'green' | 'unknown';
  const ctx = getAdvice(ind.id);
  const help = helpFor(ind.id, household);
  const amber = ind.thresholds.threshold_amber ?? 0;
  const red = ind.thresholds.threshold_red ?? 0;
  const higherWorse = red > amber;
  const t = trendWords(ind.status.trend, higherWorse);

  return (
    <div>
      <Link className="cn-back" to="/">Back to today</Link>
      <p className="cn-kicker" style={{ marginTop: '1rem' }}>{AREA_NAME[ind.area ?? 'safety']}</p>
      <h1 className="cn-headline" style={{ maxWidth: '22ch' }}>{ind.name}</h1>
      <div className="cn-reading">
        <span className={`big lvl-${level === 'unknown' ? 'unknown' : level}`}>{formatReading(ind.status.value, ind.unit)}</span>
        <span className={`lvl lvl-${level}`}>{LEVEL_WORD[level]}</span>
        {t && <span style={{ color: 'var(--ink-2)' }}>{t}</span>}
      </div>
      {ind.status.note && <p className="cn-note">{ind.status.note}</p>}
      <div style={{ maxWidth: '40rem' }}><Perspective ind={ind} /></div>

      <div className="cn-grid-2" style={{ marginTop: '1.5rem' }}>
        <section aria-labelledby="history">
          <h2 id="history" className="sr-only">History</h2>
          <div className="cn-range" role="group" aria-label="Time range">
            {RANGES.map(([r, label]) => (
              <button key={r} aria-pressed={range === r} onClick={() => setRange(r)}>{label}</button>
            ))}
          </div>
          <div className="cn-chart">
            {loading ? (
              <p className="cn-note">Loading history…</p>
            ) : (
              <Chart points={points} amber={amber} red={red} unit={ind.unit} level={shownLevel} label={`${ind.name}, ${range === '90d' ? 'last 3 months' : 'last year'}`} />
            )}
          </div>

          <h2 className="cn-h2" style={{ marginTop: '2rem' }}>What it measures</h2>
          <p>{ind.description}</p>
          <p className="cn-note">
            {higherWorse ? 'Higher is worse.' : 'Lower is worse.'} We mark it worth watching at{' '}
            {formatReading(amber, ind.unit)} and act-now at {formatReading(red, ind.unit)}.
            {ind.tier === 'experimental' && ' This one is shown for context only; it never raises an alert on its own.'}
          </p>
        </section>

        <section aria-labelledby="for-you">
          {ctx && (level === 'amber' || level === 'red') ? (
            <>
              <h2 id="for-you" className="cn-h2" style={{ marginTop: 0 }}>What it means for you</h2>
              <p>{ctx.whatItMeans[level]} {ctx.familyImpact[level]}</p>
              <h3 style={{ fontSize: 'var(--step-0)', margin: '1.25rem 0 0.25rem' }}>What to do</h3>
              <p>{ctx.whatToDo[level]}</p>
            </>
          ) : (
            <>
              <h2 id="for-you" className="cn-h2" style={{ marginTop: 0 }}>What it means for you</h2>
              <p>{level === 'green' ? 'This is in its normal range. Nothing to do.' : 'Shown for context. No action needed from this alone.'}</p>
            </>
          )}

          {help.length > 0 && (
            <>
              <h3 style={{ fontSize: 'var(--step-0)', margin: '1.5rem 0 0.5rem' }}>Where to get help</h3>
              <ul className="cn-rows">
                {help.map((h) => (
                  <li key={h.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--line)' }}>
                    <a href={h.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700 }}>
                      {h.name}<span className="sr-only"> (opens a new tab)</span>
                    </a>
                    <p style={{ margin: '0.15rem 0 0', color: 'var(--ink-2)' }}>{h.who}</p>
                    {h.money && <p style={{ margin: '0.15rem 0 0', color: 'var(--steady)', fontSize: 'var(--step--1)' }}>{h.money}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3 style={{ fontSize: 'var(--step-0)', margin: '1.5rem 0 0.5rem' }}>Source</h3>
          <dl className="cn-facts">
            <dt>From</dt>
            <dd>{ind.sourceUrl ? <a href={ind.sourceUrl} target="_blank" rel="noopener noreferrer">{ind.dataSource}</a> : ind.dataSource}</dd>
            <dt>Published</dt>
            <dd>{ind.updateFrequency}</dd>
            <dt>Last checked</dt>
            <dd>{timeAgo(ind.status.lastUpdate)}</dd>
          </dl>
        </section>
      </div>
    </div>
  );
}

function trendWords(trend: string | undefined, higherWorse: boolean): string | null {
  if (trend === 'stable') return 'About the same as last week.';
  if (trend !== 'up' && trend !== 'down') return null;
  const worse = (trend === 'up') === higherWorse;
  return `${trend === 'up' ? 'Up' : 'Down'} from last week${worse ? '' : ', which is good'}.`;
}

export function AllSignals() {
  const indicators = useStore((s) => s.indicators);
  return (
    <div className="cn-column">
      <h1 className="cn-headline">Every signal we track</h1>
      <p className="cn-lede">{indicators.length} public data sources, checked every hour and grouped by what they touch in daily life.</p>
      {byArea(indicators).map(([area, list]) => (
        <section key={area}>
          <h2 className="cn-h2" style={{ fontSize: 'var(--step-1)', marginTop: '2rem' }}>{AREA_NAME[area]}</h2>
          <ul className="cn-rows">
            {list.map((ind) => {
              const level = levelOf(ind);
              return (
                <li key={ind.id}>
                  <Link className="cn-row compact" to={`/signal/${ind.id}`}>
                    <span className="name">{ind.name}</span>
                    <span className="value">{formatReading(ind.status.value, ind.unit)}</span>
                    <span className="why"><span className={`lvl lvl-${level}`}>{LEVEL_WORD[level]}</span>. {ind.dataSource}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
