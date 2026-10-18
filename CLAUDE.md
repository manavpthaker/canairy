# Canairy

Household early-warning signals from public data, at https://canairy.news. An hourly job collects 36+ readings from official and market sources, grades each green/amber/red against fixed lines, and serves them as an open, read-only JSON feed plus a React site. Milo (brownbot) reads the feed to text alerts and fill the morning standup.

The June 2025 trip-wire system (H1-H6 collectors, TIGHTEN-UP email, Flask dashboards, Render/Docker hosting) was removed on 2026-10-18; it is in git history before that date. docs/AUDIT-2026-10-17.md has the audit. The old phases (`/phase`, `/hopi`, `phaseTasks.ts`) were replaced on 2026-10-18 by household stages.

## Live code

- `server/api/catalog.py`: every indicator (id, thresholds, source, tier, staleness). If `red > amber`, higher is worse.
- `server/collectors/verified.py`: the collectors. Return `None` on failure; never substitute a number.
- `server/api/collect.py`: one run (collect, classify, save, backfill, baselines, local, rules, briefing). `python -m api.collect` from `server/`.
- `server/api/simple_main.py`: FastAPI, read-only, routes under `/api` and `/api/v1` (indicators, history, briefing, local/{fips}, rules, outlook, stages, plan, status).
- `server/api/advice.json`: what each amber/red reading means and what to do. The site (`src/experience/advice.ts`) and the feed (`guidance`) both read it. Every core indicator needs an entry (a test checks).
- `server/api/outlook.json`: dates, slow clocks and dated tests from the October 2026 research. Estimates, not data.
- `server/api/briefing.py`: daily Claude briefing, validated so every number comes from the data.
- `server/api/stages.py`: household stages by area (0 Baseline, 1 Watch, 2 Prepare, 3 Brace) from each reading's recent history: watch line = Watch; act line held 2 weeks = Prepare (travel advisories count at once); brace line = Brace; Prepare cools off after 4 clear weeks, Watch after 30 clear days; two areas at Prepare move the whole household. Served at `/stages`. Milo texts on stage changes.
- `server/api/plan.json`: the ladder, the ten no-regret steps, steps by area and stage, upkeep. Served at `/plan`; the site's Plan page (`src/experience/Plan.tsx`) renders both. Keep it generic: this repo is public, so nothing about a specific household goes here.
- `src/App.tsx`, `src/experience/*`: the site.

## Tiers

- `core`: drives alerts and the briefing.
- `experimental`: real data but a loose proxy; served with `level: "unknown"` and the real level in `signalLevel`. Never alerts.

## Commands

```bash
.venv/bin/python -m pytest          # backend tests (no network)
npm test                            # site tests (vitest)
npx tsc --noEmit -p . && npm run lint && npm run build
cd server && python -m api.collect  # one collection run (needs FRED_API_KEY, EIA_API_KEY)
```

## Deploy

Vercel Services (`vercel.json`): `web` (Vite) and `api` (`server/api/simple_main.py`), hourly cron at `/api/cron/collect` (needs `CRON_SECRET`). Production DB is Supabase Postgres (`DATABASE_URL`); without it the store falls back to SQLite `data/canairy.db`, which is what the local launchd copy on the Mac (`launchd/`, port 5555) uses.
