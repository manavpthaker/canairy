# Brown Man Bunker 🏠🚨

A personal resilience monitoring system that tracks global risk indicators and provides early warning alerts for household preparedness.

## Quick Start

### React Dashboard (Recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys (see API Setup section)
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the dashboard:** http://localhost:3005

### Legacy Python Dashboard

```bash
cd dashboard && python app.py
```

Access at: http://localhost:5555

## API Setup

To enable real-time news intelligence, you'll need API keys for:

### News API
1. Sign up at [newsapi.org](https://newsapi.org)
2. Get your API key
3. Add to `.env`: `NEWS_API_KEY=your_api_key_here`

### Alpha Vantage (Market Data)
1. Sign up at [alphavantage.co](https://www.alphavantage.co/support/#api-key)
2. Get your free API key
3. Add to `.env`: `ALPHA_VANTAGE_API_KEY=your_api_key_here`

### OpenAI (Optional - for news analysis)
1. Get API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. Add to `.env`: `OPENAI_API_KEY=your_api_key_here`

## Features

- **Real-time Risk Indicators**: Monitor 16 critical resilience indicators
- **News Intelligence**: Get news filtered by risk indicators with credibility scoring
- **Plain English Context**: Understand what indicators mean for your family's security
- **Action Guidance**: Know what to do at each alert level
- **Historical Context**: See when thresholds were last breached and what happened

## Risk Indicators

- **Treasury Tail Risk**: Banking system stress
- **Taiwan Exclusion Zone**: Semiconductor supply chain risk
- **Strait of Hormuz**: Oil/gas price disruption risk
- **mBridge Settlement**: Dollar dominance threats
- **VIX Volatility**: Market crash indicators
- **ICE Detention**: Immigration enforcement patterns
- **Global Conflict**: Military tensions worldwide
- And more...
