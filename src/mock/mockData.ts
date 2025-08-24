import { IndicatorData, HOPIScore, SystemStatus } from '../types';

export const mockIndicators: IndicatorData[] = [
  // Economic Indicators
  {
    id: 'treasury_tail',
    name: 'Treasury Tail Risk',
    domain: 'economy',
    description: 'Monitors bond market stress through auction tail basis points',
    unit: 'bps',
    thresholds: {
      green: { max: 3 },
      amber: { min: 3, max: 5 },
      red: { min: 5 }
    },
    critical: true,
    dataSource: 'US Treasury API',
    updateFrequency: 'Daily',
    status: {
      level: 'green',
      value: 2.4,
      trend: 'stable',
      lastUpdate: new Date().toISOString(),
      dataSource: 'LIVE'
    }
  },
  {
    id: 'unemployment_rate',
    name: 'Unemployment Rate',
    domain: 'economy',
    description: 'Weekly unemployment insurance claims',
    unit: '%',
    thresholds: {
      green: { max: 5 },
      amber: { min: 5, max: 8 },
      red: { min: 8 }
    },
    dataSource: 'FRED API',
    updateFrequency: 'Weekly',
    status: {
      level: 'amber',
      value: 6.2,
      trend: 'up',
      lastUpdate: new Date().toISOString(),
      dataSource: 'LIVE'
    }
  },
  {
    id: 'vix_volatility',
    name: 'VIX Volatility Index',
    domain: 'economy',
    description: 'Market fear gauge measuring expected volatility',
    unit: 'index',
    thresholds: {
      green: { max: 20 },
      amber: { min: 20, max: 30 },
      red: { min: 30 }
    },
    dataSource: 'CBOE',
    updateFrequency: 'Real-time',
    status: {
      level: 'amber',
      value: 24.8,
      trend: 'up',
      lastUpdate: new Date().toISOString(),
      dataSource: 'LIVE'
    }
  },
  // Global Conflict Indicators
  {
    id: 'global_conflict_index',
    name: 'Global Conflict Intensity',
    domain: 'global_conflict',
    description: 'Active military conflicts and tensions worldwide',
    unit: 'index',
    thresholds: {
      green: { max: 40 },
      amber: { min: 40, max: 70 },
      red: { min: 70 }
    },
    critical: true,
    dataSource: 'ACLED API',
    updateFrequency: 'Daily',
    status: {
      level: 'red',
      value: 78,
      trend: 'up',
      lastUpdate: new Date().toISOString(),
      dataSource: 'LIVE'
    }
  },
  {
    id: 'taiwan_zone',
    name: 'Taiwan Exclusion Zone',
    domain: 'global_conflict',
    description: 'Chinese military exclusion zones around Taiwan',
    unit: 'zones',
    thresholds: {
      green: { max: 0 },
      amber: { min: 1, max: 2 },
      red: { min: 3 }
    },
    critical: true,
    dataSource: 'Maritime Safety',
    updateFrequency: 'Daily',
    status: {
      level: 'amber',
      value: 1,
      trend: 'stable',
      lastUpdate: new Date().toISOString(),
      dataSource: 'LIVE'
    }
  },
  // Energy Indicators
  {
    id: 'hormuz_war_risk',
    name: 'Strait of Hormuz War Risk Premium',
    domain: 'energy',
    description: 'War risk insurance premiums for oil tankers',
    unit: '%',
    thresholds: {
      green: { max: 0.025 },
      amber: { min: 0.025, max: 0.1 },
      red: { min: 0.1 }
    },
    dataSource: 'Lloyd\'s Market',
    updateFrequency: 'Daily',
    status: {
      level: 'green',
      value: 0.018,
      trend: 'stable',
      lastUpdate: new Date().toISOString(),
      dataSource: 'LIVE'
    }
  },
  {
    id: 'mbridge_settlement',
    name: 'mBridge Oil Settlement Share',
    domain: 'energy',
    description: 'Oil transactions settled via mBridge vs USD',
    unit: '%',
    thresholds: {
      green: { max: 5 },
      amber: { min: 5, max: 15 },
      red: { min: 15 }
    },
    dataSource: 'Central Bank Reports',
    updateFrequency: 'Monthly',
    status: {
      level: 'amber',
      value: 8.2,
      trend: 'up',
      lastUpdate: new Date().toISOString(),
      dataSource: 'LIVE'
    }
  },
  // AI/Tech Indicators
  {
    id: 'ai_progress_rate',
    name: 'AI Capability Progress Rate',
    domain: 'ai_tech',
    description: 'Rate of advancement in AI capabilities',
    unit: 'improvement %/year',
    thresholds: {
      green: { max: 50 },
      amber: { min: 50, max: 200 },
      red: { min: 200 }
    },
    dataSource: 'AI Benchmarks',
    updateFrequency: 'Monthly',
    status: {
      level: 'amber',
      value: 125,
      trend: 'up',
      lastUpdate: new Date().toISOString(),
      dataSource: 'LIVE'
    }
  },
  // Domestic Control Indicators
  {
    id: 'ice_detention',
    name: 'ICE Detention Capacity',
    domain: 'domestic_control',
    description: 'ICE detention bed capacity utilization',
    unit: '%',
    thresholds: {
      green: { max: 75 },
      amber: { min: 75, max: 90 },
      red: { min: 90 }
    },
    dataSource: 'ICE Reports',
    updateFrequency: 'Weekly',
    status: {
      level: 'amber',
      value: 82,
      trend: 'up',
      lastUpdate: new Date().toISOString(),
      dataSource: 'LIVE'
    }
  }
];

export const mockHOPIScore: HOPIScore = {
  score: 0.42,
  confidence: 94.5,
  phase: 3,
  targetPhase: 4,
  domains: {
    economy: {
      score: 0.35,
      weight: 1.0,
      indicators: ['treasury_tail', 'unemployment_rate', 'vix_volatility'],
      criticalAlerts: []
    },
    global_conflict: {
      score: 0.68,
      weight: 1.5,
      indicators: ['global_conflict_index', 'taiwan_zone'],
      criticalAlerts: ['global_conflict_index']
    },
    energy: {
      score: 0.45,
      weight: 1.0,
      indicators: ['hormuz_war_risk', 'mbridge_settlement'],
      criticalAlerts: ['mbridge_settlement']
    },
    ai_tech: {
      score: 0.30,
      weight: 0.75,
      indicators: ['ai_progress_rate'],
      criticalAlerts: []
    },
    domestic_control: {
      score: 0.25,
      weight: 0.75,
      indicators: ['ice_detention'],
      criticalAlerts: []
    }
  },
  timestamp: new Date().toISOString()
};

export const mockSystemStatus: SystemStatus = {
  operational: true,
  lastUpdate: new Date().toISOString(),
  activeAlerts: 2,
  dataQuality: 94.5
};