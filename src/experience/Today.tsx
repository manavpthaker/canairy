import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { IndicatorData } from '../types';
import { useIndicatorHistory } from '../hooks/useIndicatorHistory';
import { CanaryLine } from './CanaryLine';
import { Chart } from './Chart';
import { ChangesPreview } from './Changes';
import { LocalSection } from './LocalSection';
import { Action, buildActions, composeHeadline, localActions } from './guidance';
import { openHousehold, useDone, useHousehold } from './household';
import { useBriefing } from './useBriefing';
import { useLocal } from './useLocal';
import {
  AREA_NAME, LEVEL_WORD, SEVERITY, byArea, formatReading, isAlerting, levelOf, perspectiveLine, timeAgo, todayLabel,
} from './format';

export function Today() {
  const indicators = useStore((s) => s.indicators);
  const loading = useStore((s) => s.loading);
  const offline = useStore((s) => s.usingFallbackData);
  const lastFetch = useStore((s) => s.lastSuccessfulFetch);
  const { briefing, createdAt } = useBriefing();
  const household = useHousehold();
  const local = useLocal(household.zip || undefined);

  if (indicators.length === 0) {
    return loading || !offline ? <TodaySkeleton /> : <Unreachable />;
  }

  const composed = composeHeadline(indicators);
  const headline = briefing?.headline ?? composed.headline;
  const summary = briefing?.summary ?? composed.summary;
  // Something happening in your own county comes before national signals.
  const actions = [...localActions(local.data), ...buildActions(indicators, household, briefing)];
  const watching = indicators.filter(isAlerting).sort((a, b) => SEVERITY[levelOf(a)] - SEVERITY[levelOf(b)]);
  const steady = indicators.filter((i) => !isAlerting(i));
  const lastUpdate = indicators.reduce<string | null>(
    (latest, i) => (i.status.lastUpdate && (!latest || i.status.lastUpdate > latest) ? i.status.lastUpdate : latest),
    null,
  );
  const counts = {
    red: watching.filter((i) => levelOf(i) === 'red').length,
    amber: watching.filter((i) => levelOf(i) === 'amber').length,
    steady: steady.filter((i) => levelOf(i) === 'green').length,
  };

  return (
    <div className="cn-column" style={{ maxWidth: '44rem' }}>
      <p className="cn-kicker">
        {todayLabel()}. Checked {timeAgo(lastUpdate)}.
      </p>
      {offline && (
        <div className="cn-banner warn" role="status">
          Can’t reach Canairy right now. You’re seeing the readings this device last loaded
          {lastFetch ? `, ${timeAgo(lastFetch.toISOString())}` : ''}.
        </div>
      )}

      <h1 className="cn-headline">{headline}</h1>
      <p className="cn-lede">{summary}</p>
      {briefing && (
        <p className="cn-note" style={{ marginTop: '-1rem', marginBottom: '1.5rem' }}>
          Written {timeAgo(createdAt)} by Claude, an AI model, from the readings below. Every number was checked
          against the data before publishing. <Link to="/about">How this works</Link>.
        </p>
      )}

      <CanaryLine indicators={indicators} />
      <p className="cn-line-caption">
        Each mark is one signal. Taller, coloured marks need attention: {counts.red > 0 && <><span className="lvl lvl-red">{counts.red} to act on</span>, </>}
        <span className="lvl lvl-amber">{counts.amber} worth watching</span>, {counts.steady} steady. Tap one for details.
      </p>

      <h2 className="cn-h2">This week</h2>
      <p className="cn-sub">
        {actions.length ? 'The few things worth doing, cheapest and easiest first.' : 'Nothing needs doing this week.'}
        {!household.zip && !household.housing && (
          <> <button className="cn-link-button" onClick={openHousehold}>Tell us about your household</button> to tailor these.</>
        )}
      </p>
      <ActionList actions={actions} />

      {household.zip ? (
        <>
          <h2 className="cn-h2">Where you live{local.data ? `: ${local.data.place}` : ''}</h2>
          <p className="cn-sub">Readings for your county, state and region. Only your county code is sent to Canairy.</p>
          <LocalSection zip={household.zip} local={local} />
        </>
      ) : (
        <>
          <h2 className="cn-h2">Where you live</h2>
          <p className="cn-sub">
            <button className="cn-link-button" onClick={openHousehold}>Add your ZIP code</button> to see disasters,
            unemployment, gas, power and grocery prices, drought and illness where you are. It stays on this device.
          </p>
        </>
      )}

      <ChangesPreview />

      {watching.length > 0 && (
        <>
          <h2 className="cn-h2">Worth watching</h2>
          <p className="cn-sub">Signals past their normal range, with their recent history.</p>
          <ul className="cn-rows">
            {watching.map((ind) => (
              <WatchRow key={ind.id} ind={ind} note={briefing?.watch.find((w) => w.indicator_id === ind.id)?.note} />
            ))}
          </ul>
        </>
      )}

      <details className="cn-disclosure">
        <summary>{steady.length} other signals are steady or shown for context</summary>
        {byArea(steady).map(([area, list]) => (
          <div key={area}>
            <p className="cn-area-title">{AREA_NAME[area]}</p>
            <ul className="cn-rows" style={{ borderTop: 0 }}>
              {list.map((ind) => (
                <li key={ind.id}>
                  <Link className="cn-row compact" to={`/signal/${ind.id}`}>
                    <span className="name" style={{ fontWeight: 400 }}>{ind.name}</span>
                    <span className="value">{formatReading(ind.status.value, ind.unit)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </details>

      <h2 className="cn-h2">Where this comes from</h2>
      <p>
        Every hour Canairy checks {indicators.length} public sources, including the Bureau of Labor Statistics, the
        Federal Reserve, FEMA, the CDC and the National Weather Service. Nothing here is estimated: if a source doesn’t
        answer, its reading is marked as old rather than filled in.{' '}
        <Link to="/about">How it works</Link>.
      </p>
    </div>
  );
}

function ActionList({ actions }: { actions: Action[] }) {
  const { done, toggle } = useDone('week');
  if (!actions.length) return null;
  return (
    <ul className="cn-actions">
      {actions.map((a) => {
        const isDone = done.has(a.id);
        return (
          <li key={a.id} className={`cn-action ${a.urgent ? 'is-urgent' : ''} ${isDone ? 'is-done' : ''}`}>
            <input type="checkbox" checked={isDone} onChange={() => toggle(a.id)} aria-labelledby={`${a.id}-t`} />
            <div>
              <h3 id={`${a.id}-t`}>{a.title}</h3>
              <p>{a.why}</p>
            </div>
            {a.meta && <div className="meta">{a.meta}</div>}
            {a.indicators.length > 0 && (
              <div className="meta">
                Based on{' '}
                {a.indicators.map((ind, n) => (
                  <span key={ind.id}>
                    {n > 0 && ', '}
                    <Link to={`/signal/${ind.id}`}>{ind.name.toLowerCase()}</Link> ({formatReading(ind.status.value, ind.unit)})
                  </span>
                ))}
                .
              </div>
            )}
            {a.help.length > 0 && (
              <ul className="help" aria-label="Where to get help">
                {a.help.map((h) => (
                  <li key={h.id}>
                    <a href={h.url} target="_blank" rel="noopener noreferrer">
                      {h.name}<span className="sr-only"> (opens a new tab)</span>
                    </a>
                    {h.money && <span className="money"> {h.money}</span>}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function WatchRow({ ind, note }: { ind: IndicatorData; note?: string }) {
  const level = levelOf(ind);
  // Slow-moving series need a longer window to show any shape.
  const range = /Monthly|Quarterly/.test(ind.updateFrequency) ? '365d' : '90d';
  const { points } = useIndicatorHistory(ind.id, range);
  const flat = points.length > 1 && points.every((p) => p.value === points[0].value);
  return (
    <li>
      <Link className="cn-row" to={`/signal/${ind.id}`}>
        <span className="name">{ind.name}</span>
        <span className="value">
          {formatReading(ind.status.value, ind.unit)}
        </span>
        <span className="why">
          <span className={`lvl lvl-${level}`}>{LEVEL_WORD[level]}.</span> {perspectiveLine(ind) ?? ''}{' '}
          {note ?? `${ind.description.split('. ')[0]}.`}
        </span>
        {!flat && (
          <span className="spark">
            <Chart
              compact points={points} unit={ind.unit} level={level}
              amber={ind.thresholds.threshold_amber ?? 0} red={ind.thresholds.threshold_red ?? 0}
              label={`${ind.name} over the last ${range === '365d' ? 'year' : '90 days'}`}
            />
          </span>
        )}
      </Link>
    </li>
  );
}

function TodaySkeleton() {
  return (
    <div className="cn-column" aria-busy="true">
      <p className="cn-kicker">{todayLabel()}.</p>
      <h1 className="cn-headline" style={{ color: 'var(--ink-3)' }}>Checking today’s signals…</h1>
    </div>
  );
}

function Unreachable() {
  const refreshAll = useStore((s) => s.refreshAll);
  return (
    <div className="cn-column">
      <h1 className="cn-headline">Canairy can’t load today’s readings.</h1>
      <p className="cn-lede">
        Our data service isn’t responding, and this device has no earlier readings saved. Nothing is shown rather than a
        guess.
      </p>
      <button className="cn-button" onClick={() => refreshAll()}>Try again</button>
    </div>
  );
}
