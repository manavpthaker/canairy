import { LocalAlerts } from './LocalAlerts';
import { LEVEL_WORD } from './format';
import { LOCAL_SOURCE, localCompare, localValue } from './localFormat';
import { openHousehold } from './household';
import { useLocal } from './useLocal';

const ORDER = { red: 0, amber: 1, green: 2, none: 3 } as const;

/** County, state and regional signals for the household, plus active weather alerts. */
export function LocalSection({ zip, local }: { zip: string; local: ReturnType<typeof useLocal> }) {
  const { status, place, data } = local;

  if (status === 'unknown-zip') {
    return (
      <p className="cn-note">
        We couldn’t find ZIP {zip}. <button className="cn-link-button" onClick={openHousehold}>Check your ZIP</button>.
      </p>
    );
  }
  if (status === 'loading' || status === 'idle') return <p className="cn-note">Checking what’s happening near {zip}…</p>;

  const signals = [...(data?.signals ?? [])].sort((a, b) => ORDER[a.level] - ORDER[b.level]);

  return (
    <>
      {signals.length > 0 && (
        <ul className="cn-rows" style={{ marginBottom: '1.5rem' }}>
          {signals.map((s) => {
            const compare = localCompare(s);
            const source = LOCAL_SOURCE[s.metric];
            const level = s.level === 'none' ? 'unknown' : s.level;
            return (
              <li key={s.metric} className="cn-row" style={{ cursor: 'default' }}>
                <span className="name">{s.name} <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>in {s.where}</span></span>
                <span className={`value lvl-${level}`} style={{ fontSize: 'var(--step-0)' }}>
                  {level !== 'unknown' && LEVEL_WORD[level]}
                </span>
                <span className="why" style={{ gridColumn: '1 / -1' }}>
                  <strong style={{ color: 'var(--ink)' }}>{localValue(s)}.</strong> {compare}{' '}
                  {s.metric === 'fema' && s.disasters && (
                    <>{s.disasters.map((d) => d.title).join('; ')}.{' '}</>
                  )}
                  <a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a>, {asOf(s.as_of)}.
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {status === 'error' && <p className="cn-note">Local readings didn’t load. Try again in a few minutes.</p>}
      <h3 style={{ fontSize: 'var(--step-0)', margin: '0 0 0.5rem' }}>Weather alerts</h3>
      {place ? <LocalAlerts point={[place.lat, place.lon]} zip={zip} /> : null}
    </>
  );
}

function asOf(d: string): string {
  if (/^\d{4}-\d{2}$/.test(d)) {
    return new Date(`${d}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  return `as of ${new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}
