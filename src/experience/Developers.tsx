import { Link } from 'react-router-dom';

const ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://canairy.news';

const EXAMPLE = `{
  "id": "energy_gas_price",
  "name": "Gas Prices",
  "area": "costs",
  "unit": "$/gal",
  "tier": "core",
  "thresholds": { "threshold_amber": 4.0, "threshold_red": 4.75 },
  "dataSource": "EIA (via FRED)",
  "sourceUrl": "https://fred.stlouisfed.org/series/GASREGW",
  "status": {
    "value": 4.478,
    "level": "amber",
    "trend": "up",
    "dataSource": "LIVE",
    "lastUpdate": "2026-09-24T16:07:43Z"
  }
}`;

export function Developers() {
  return (
    <div className="cn-column">
      <h1 className="cn-headline">An open early-warning feed</h1>
      <p className="cn-lede">
        Canairy’s readings are free to use. If you build tools for benefit navigators, financial coaches or caseworkers,
        you can pull the same signals into your own product.
      </p>

      <h2 className="cn-h2">Endpoints</h2>
      <p>All responses are JSON over HTTPS, readable from any website. No key is needed.</p>
      <dl className="cn-facts" style={{ fontSize: 'var(--step-0)', rowGap: '0.9rem' }}>
        <dt><code>GET /api/v1/indicators</code></dt>
        <dd>Every signal with its latest reading, level (green, amber, red), trend, thresholds and source.</dd>
        <dt><code>GET /api/v1/indicators/&#123;id&#125;/history?range=90d</code></dt>
        <dd>Stored readings for one signal, up to 365 days.</dd>
        <dt><code>GET /api/v1/briefing</code></dt>
        <dd>The latest published plain-language briefing, with actions and the signals each one is based on.</dd>
        <dt><code>GET /api/v1/status</code></dt>
        <dd>When data was last collected and how many signals are fresh.</dd>
      </dl>

      <h2 className="cn-h2">Example</h2>
      <pre className="cn-code">{`curl ${ORIGIN}/api/v1/indicators`}</pre>
      <p>One item from the response:</p>
      <pre className="cn-code">{EXAMPLE}</pre>

      <h2 className="cn-h2">What you can rely on</h2>
      <p>
        <code>status.dataSource</code> is <code>LIVE</code> only for a fresh, real reading. <code>STALE</code> means the
        last real reading is older than the source’s normal schedule; its level is <code>unknown</code> and it shouldn’t
        drive alerts. Signals with <code>tier: "experimental"</code> are context only.
      </p>
      <p>
        Readings update hourly, and responses may be cached for up to a minute. The underlying data comes from US
        government and market sources; each item links to its origin in <code>sourceUrl</code>.
      </p>
      <p>
        Interactive API reference: <a href={`${ORIGIN}/api/docs`}>{ORIGIN}/api/docs</a>. Source code and issues:{' '}
        <a href="https://github.com/manavpthaker/canairy">github.com/manavpthaker/canairy</a>.
      </p>
      <p><Link to="/about">How Canairy works</Link></p>
    </div>
  );
}
