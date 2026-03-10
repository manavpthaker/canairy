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
# Clone and install
git clone https://github.com/manavpthaker/canairy.git
cd canairy
npm install

# Start the backend (Python 3.10+)
cd dashboard && python app.py

# Start the frontend
npm run dev

# Open http://localhost:3005
```

### Prerequisites
- Node.js 18+
- Python 3.10+
- API keys for full functionality (FRED, News API, Alpha Vantage)

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React + TS    │────▶│  Python Flask   │────▶│  35+ Collectors │
│   Dashboard     │     │   Backend API   │     │  (Live + Cache) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Data Sources:** Federal Reserve (FRED), Treasury Direct, News API, ACLED, and government endpoints. Falls back gracefully to cached data when APIs are unavailable.

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
