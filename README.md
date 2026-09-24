# Canairy

**Your family's early warning system.**

We watch 35+ economic and safety signals so you don't have to — and tell you exactly what to do about them.

[![Live Demo](https://img.shields.io/badge/Live-canairy.news-amber.svg)](https://canairy.news)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## What is Canairy?

Remember when baby formula disappeared overnight? Or when gas stations ran dry? Canairy watches the signals that predict disruptions like that — and gives your family a head start.

Unlike doomscrolling the news, Canairy:
- **Monitors leading indicators** — Treasury data, supply chains, infrastructure health
- **Translates to plain English** — "Grocery prices up $30-50/week" not "CPI elevated 4.2%"
- **Tells you what to do** — Specific actions, not vague warnings
- **Respects your time** — Check once a week, 2 minutes max

## How It Works

**Green / Amber / Red** — Instantly see what needs attention.

| Status | Meaning | Action |
|--------|---------|--------|
| 🟢 Green | Within normal range | No action needed |
| 🟡 Amber | Elevated, worth watching | Consider preparing |
| 🔴 Red | Action recommended | Check your plan |

## What We Track

**Your Wallet** — Grocery prices, job market, cost of living, your 401k

**Supply & Shortages** — Things that could affect what's on shelves or at the pump

**Keeping Things Running** — Power grid, internet, travel, the stuff daily life depends on

## Quick Start

```bash
git clone https://github.com/manavpthaker/canairy.git
cd canairy
npm install
python3.11 -m venv .venv && .venv/bin/pip install -r api/requirements.txt
cp .env.example .env          # add FRED_API_KEY (free); EIA_API_KEY optional

# Collect once, and load a year of history for the FRED-backed indicators
set -a && source .env && set +a
.venv/bin/python -m api.collect
.venv/bin/python -m api.collect --backfill 365

# Serve the API (reads the database only) and the site
.venv/bin/python -m uvicorn api.simple_main:app --port 5555
npm run dev                   # http://localhost:3003
```

Tests: `.venv/bin/python -m pytest` (backend) and `npx vitest run` (frontend).

## Architecture

```
 hourly schedule                      every page view
┌──────────────────┐   ┌──────────┐   ┌──────────────┐   ┌───────────────┐
│ api/collect.py   │──▶│ Postgres │◀──│ FastAPI      │◀──│ React site    │
│ runs collectors, │   │ (SQLite  │   │ read-only,   │   │               │
│ checks each value│   │  locally)│   │ no outbound  │   │               │
└──────────────────┘   └──────────┘   └──────────────┘   └───────────────┘
```

- **What's tracked** is defined in one place: `api/catalog.py`. Each entry names its
  source, units, thresholds, and how old a reading can be before it stops counting.
- **Only real readings are shown.** A collector result labelled fallback, estimated or
  mock is stored as a failure and never displayed. Stale readings are shown greyed and
  never raise an alert. Indicators marked *experimental* are shown for context only.
- **Page views never call outside services**, so traffic can't create upstream load or cost.
- **Sources:** FRED (BLS, BEA, EIA, Fed, Freddie Mac, DOL), CISA, FEMA, FDA, NWS, TSA,
  FDIC, US Treasury, State Department, WHO, Freightos, Yahoo Finance.

## Privacy

- No account required
- No tracking or analytics
- No data collection
- All processing happens locally
- Open source for transparency

## Built By Parents, For Parents

We created Canairy because we were tired of doomscrolling the news trying to figure out what it meant for our families. Now we check once a week and know exactly what to do.

Smart families plan ahead.

---

**[Try it live →](https://canairy.news)**

MIT License • [Issues](https://github.com/manavpthaker/canairy/issues) • [Discussions](https://github.com/manavpthaker/canairy/discussions)
