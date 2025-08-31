# 🐦 Canairy - Early Warning System for Global Disruptions

<div align="center">
  
  # 🐦 Canairy
  
  **Your Personal Canary in the Coal Mine**
  
  *A Portfolio Demonstration of an Early Warning System*
  
  [![GitHub stars](https://img.shields.io/github/stars/manavpthaker/canairy.svg?style=social&label=Star)](https://github.com/manavpthaker/canairy)
  [![GitHub forks](https://img.shields.io/github/forks/manavpthaker/canairy.svg?style=social&label=Fork)](https://github.com/manavpthaker/canairy/fork)
  [![GitHub issues](https://img.shields.io/github/issues/manavpthaker/canairy.svg)](https://github.com/manavpthaker/canairy/issues)
  
  [![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  [![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  [![Status](https://img.shields.io/badge/Status-Active-success.svg)]()
</div>

## 🚨 What is Canairy?

Canairy is a **working early warning system** that monitors 40+ critical global indicators using real data sources and APIs. Originally built as a portfolio demonstration, it has evolved into a functional system that combines live data collection with sophisticated threat analysis. Like a canary in a coal mine, it provides early warnings for potential disruptions before they impact daily life.

### 🎯 Key Features

- **🔍 Real-Time Monitoring**: Live tracking of 40+ indicators using real APIs (FRED, Treasury, News API, ACLED, etc.)
- **📰 Intelligent News Analysis**: News API integration with real headlines and AI-powered threat correlation
- **📊 Advanced Visualization**: Interactive charts showing historical patterns and future projections
- **🚦 4-Phase Alert System**: Clear escalation from normal operations to crisis response
- **📱 Actionable Intelligence**: Specific steps to take based on current threat levels
- **🏦 Financial Protection**: Early warnings for banking stress and market crashes
- **🛒 Supply Chain Alerts**: Advance notice of shortages and price spikes
- **⚡ Energy Disruption Tracking**: Monitor risks to power grid and fuel supplies
- **🌍 Geopolitical Analysis**: Track global conflicts that could affect your region

## 📸 Screenshots

<div align="center">
  <img src="portfolio-assets/screenshots/01-dashboard-overview.png" alt="Dashboard Overview" width="800"/>
  <p><em>Main Dashboard - All critical information at a glance</em></p>
</div>

<div align="center">
  <img src="portfolio-assets/screenshots/03-critical-indicators.png" alt="Critical Indicators" width="800"/>
  <p><em>Critical Indicators Panel - Real-time threat assessment</em></p>
</div>

<div align="center">
  <img src="portfolio-assets/screenshots/04-priority-actions.png" alt="Priority Actions" width="800"/>
  <p><em>Priority Actions - Know exactly what to do and when</em></p>
</div>

<div align="center">
  <img src="portfolio-assets/screenshots/08-mobile-dashboard.png" alt="Mobile Dashboard" width="400"/>
  <p><em>Mobile-Responsive Design - Full functionality on all devices</em></p>
</div>

## 🌐 Live Demo

> **[🔗 Try Canairy Live](https://canairy.onrender.com)** - Experience the full dashboard with real-time data

**What you'll see:**
- 🚨 **Real-time threat assessment** across 22 critical indicators
- 📊 **Interactive charts** showing historical patterns and trends  
- 📰 **Live news intelligence** with AI-powered threat correlation
- 📱 **Mobile-responsive design** optimized for all devices
- ⚡ **Instant alerts** when conditions change

*No signup required - the system uses real data from 40+ collectors including Treasury, FRED, News API, and government sources. Some indicators fall back to mock data when APIs are unavailable.*

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (required - for data collector backend)
- API keys (News API, Alpha Vantage, FRED API recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/manavpthaker/canairy.git
   cd canairy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start the backend**
   ```bash
   cd dashboard
   python app.py
   ```

5. **Start the frontend**
   ```bash
   npm run dev
   ```

6. **Access the dashboard**
   ```
   http://localhost:3005
   ```

## 📊 Monitored Indicators

### Financial Indicators
- **Treasury Tail Risk** - Banking system stress detector
- **VIX Volatility** - Market crash probability
- **mBridge Settlement** - Dollar dominance threats
- **Unemployment Rate** - Economic health gauge

### Supply Chain Indicators
- **Taiwan Exclusion Zone** - Semiconductor shortage risk
- **Strait of Hormuz** - Oil supply disruption
- **Baltic Dry Index** - Global shipping costs
- **Food Price Index** - Agricultural supply stress

### Energy & Infrastructure
- **Natural Gas Prices** - Heating/cooling costs
- **Power Grid Frequency** - Electrical stability
- **Cyber Attack Index** - Digital infrastructure threats

### Social & Geopolitical
- **ICE Detention Capacity** - Immigration enforcement
- **Global Conflict Index** - Military tensions
- **Civil Unrest Tracker** - Social stability

[View Complete Indicator List →](docs/user-guide/indicator-reference.md)

## 🔧 System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│   Python Flask  │────▶│ Data Collectors │
│   Dashboard     │     │   Backend API   │     │   (40+ Sources) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         │                       ▼                        │
         │              ┌─────────────────┐              │
         └─────────────▶│   JSON Files    │◀─────────────┘
                        │   + History     │
                        └─────────────────┘
```

## 📖 Documentation

- [📚 User Guide](docs/user-guide/manual.md) - Complete usage instructions
- [🛠️ Technical Documentation](docs/technical/architecture.md) - System architecture and development
- [🔌 API Reference](docs/api/README.md) - Backend API documentation
- [🚀 Deployment Guide](docs/deployment/README.md) - Production deployment instructions
- [🔒 Security Guide](docs/deployment/security.md) - Security best practices
- [👨‍👩‍👧‍👦 Family Preparedness](docs/family/emergency-planning.md) - Emergency response planning

## 🌟 Why Canairy?

Traditional news and financial media often report on crises after they've already begun impacting daily life. Canairy changes this by:

1. **Monitoring Leading Indicators**: We track data that changes *before* mainstream awareness
2. **Connecting the Dots**: Our system identifies patterns across seemingly unrelated indicators
3. **Actionable Intelligence**: We don't just alert you - we tell you exactly what to do
4. **Family-Focused**: Designed for protecting households, not institutional investors

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Install development dependencies
npm install

# Run tests
npm test

# Run linters
npm run lint
npm run typecheck

# Start development server with hot reload
npm run dev
```

## 🎯 Project Status & Transparency

**This is a functional early warning system** featuring:
- ✅ Full-stack React/TypeScript frontend
- ✅ Python Flask backend with 40+ data collectors
- ✅ Real-time data visualization with Chart.js
- ✅ Responsive design with Tailwind CSS
- ✅ Live API integration (FRED, Treasury, News API, etc.)
- ✅ Professional UI/UX with dark theme

**Current Implementation:**
- 📊 **Live Data**: 40+ collectors fetch real data from government and financial APIs
- 📰 **Real News**: News API integration with actual headlines and threat correlation
- 🔄 **Robust Fallback**: Mock data used when APIs are unavailable or rate-limited
- 📱 **Fully Responsive**: Complete mobile/tablet support with hamburger menu
- 🎨 **Production UI**: Polished interface with animations and threat-responsive branding

**Active Data Sources:**
- Federal Reserve Economic Data (FRED)
- US Treasury Direct API
- News API for real-time headlines
- ACLED for conflict data
- Multiple government and financial endpoints

## 📊 Data Sources (Live Integration)

The system actively collects data from:

- **Financial Data**: Federal Reserve FRED API (✅ Live), Alpha Vantage (✅ Live), Treasury Direct (✅ Live)
- **News Intelligence**: News API (✅ Live with caching), OpenAI for analysis  
- **Government Data**: Treasury Direct (✅ Live), ICE reports, DHS data
- **Market Data**: Market volatility indices, oil futures
- **Geopolitical**: ACLED conflict data (✅ Live), Taiwan maritime zones, NATO readiness

**Fallback Strategy**: When APIs are unavailable, rate-limited, or return errors, the system gracefully falls back to recent cached data or realistic mock data to ensure continuous operation.

[View Technical Implementation →](docs/real-data-sources.md)

## 🔒 Security & Privacy

- All data is processed locally - no personal information leaves your system
- API keys are encrypted and stored securely
- Open source for complete transparency
- No tracking or analytics

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Nassim Taleb's work on Black Swan events
- Phase system adapted from emergency management best practices
- Built with love for families who want to stay prepared

## 📞 Contact & Collaboration

- 🐛 Issues: [GitHub Issues](https://github.com/manavpthaker/canairy/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/manavpthaker/canairy/discussions)
- 🤝 LinkedIn: Connect for collaboration opportunities

---

<div align="center">
  <strong>Stay Prepared. Stay Informed. Stay Safe.</strong>
  
  Made with ❤️ for families everywhere
</div>