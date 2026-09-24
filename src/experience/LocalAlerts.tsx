import { useEffect, useState } from 'react';

interface Alert {
  id: string;
  event: string;
  headline: string;
  severity: string;
  ends: string | null;
  instruction: string | null;
}

type State =
  | { kind: 'loading' }
  | { kind: 'unknown-zip' }
  | { kind: 'error' }
  | { kind: 'ok'; alerts: Alert[] };

/**
 * Active National Weather Service alerts for a ZIP code. The ZIP is resolved to
 * coordinates from a static file on this site; only the coordinates go to NWS.
 */
export function LocalAlerts({ zip }: { zip: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    (async () => {
      try {
        const table: Record<string, [number, number]> = await fetch(`/zip/${zip.slice(0, 3)}.json`).then((r) => (r.ok ? r.json() : {}));
        const point: [number, number] | undefined = table[zip];
        if (!point) {
          if (!cancelled) setState({ kind: 'unknown-zip' });
          return;
        }
        const res = await fetch(`https://api.weather.gov/alerts/active?point=${point[0]},${point[1]}`, {
          headers: { Accept: 'application/geo+json' },
        });
        if (!res.ok) throw new Error(String(res.status));
        const body = await res.json();
        const alerts: Alert[] = (body.features ?? []).map((f: { id: string; properties: Record<string, string | null> }) => ({
          id: f.id,
          event: f.properties.event ?? 'Weather alert',
          headline: f.properties.headline ?? '',
          severity: f.properties.severity ?? '',
          ends: f.properties.ends ?? f.properties.expires ?? null,
          instruction: f.properties.instruction ?? null,
        }));
        if (!cancelled) setState({ kind: 'ok', alerts });
      } catch {
        if (!cancelled) setState({ kind: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [zip]);

  if (state.kind === 'loading') return <p className="cn-note">Checking weather alerts near {zip}…</p>;
  if (state.kind === 'unknown-zip') return <p className="cn-note">We couldn’t find ZIP {zip}. Check it under Your household.</p>;
  if (state.kind === 'error') return <p className="cn-note">The National Weather Service didn’t respond. Try again in a few minutes.</p>;
  if (state.alerts.length === 0) {
    return <p>No weather alerts near {zip} right now.</p>;
  }
  return (
    <ul className="cn-actions">
      {state.alerts.map((a) => (
        <li key={a.id} className={`cn-action ${a.severity === 'Extreme' || a.severity === 'Severe' ? 'is-urgent' : ''}`} style={{ gridTemplateColumns: '1fr' }}>
          <h3>{a.event}</h3>
          <p>{a.headline}</p>
          {a.instruction && <p style={{ whiteSpace: 'pre-line' }}>{a.instruction.split('\n\n')[0]}</p>}
          {a.ends && (
            <div className="meta" style={{ gridColumn: 1 }}>
              Until {new Date(a.ends).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}. Source: National Weather Service.
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
