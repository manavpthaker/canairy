// Indicator descriptions for enhanced UI
export interface IndicatorDescription {
  id: string;
  name: string;
  whyItMatters: string;
  thresholds: {
    green: string;
    amber: string;
    red: string;
  };
}

const descriptions: Record<string, IndicatorDescription> = {
  treasury_tail: {
    id: 'treasury_tail',
    name: 'Treasury Tail Risk',
    whyItMatters: 'Indicates banking system stress and potential financial instability.',
    thresholds: {
      green: 'Normal market functioning - banks are stable',
      amber: 'Some stress building - monitor bank health',
      red: 'Banking crisis risk elevated - protect deposits'
    }
  },
  taiwan_zone: {
    id: 'taiwan_zone',
    name: 'Taiwan Exclusion Zone',
    whyItMatters: 'Taiwan produces 90% of advanced semiconductors. Disruption would cause severe shortages.',
    thresholds: {
      green: 'Normal operations - no restrictions',
      amber: 'Tensions rising - diplomatic concerns',
      red: 'Active exclusion zone - supply disruption imminent'
    }
  },
  hormuz_war_risk: {
    id: 'hormuz_war_risk',
    name: 'Strait of Hormuz War Risk',
    whyItMatters: '20% of global oil passes through this chokepoint. Closure would spike energy prices.',
    thresholds: {
      green: 'Normal shipping - no threats',
      amber: 'Increased tensions - higher insurance costs',
      red: 'Imminent conflict - oil prices could double'
    }
  },
  vix_volatility: {
    id: 'vix_volatility',
    name: 'VIX Volatility Index',
    whyItMatters: 'Market fear gauge that often precedes crashes and economic uncertainty.',
    thresholds: {
      green: 'Calm markets - low volatility expected',
      amber: 'Market concern - increased uncertainty',
      red: 'High fear - major market stress likely'
    }
  },
  ice_detention: {
    id: 'ice_detention',
    name: 'ICE Detention Capacity',
    whyItMatters: 'Indicates level of immigration enforcement activity in communities.',
    thresholds: {
      green: 'Normal capacity - routine operations',
      amber: 'High capacity - increased enforcement',
      red: 'At capacity - mass enforcement operations'
    }
  },
  unemployment_rate: {
    id: 'unemployment_rate',
    name: 'Unemployment Rate',
    whyItMatters: 'Direct indicator of economic health and job market stability.',
    thresholds: {
      green: 'Full employment - healthy job market',
      amber: 'Rising unemployment - economic softening',
      red: 'High unemployment - recession conditions'
    }
  },
  global_conflict_index: {
    id: 'global_conflict_index',
    name: 'Global Conflict Index',
    whyItMatters: 'Tracks worldwide military tensions that could escalate or disrupt supply chains.',
    thresholds: {
      green: 'Peaceful conditions - isolated conflicts only',
      amber: 'Multiple tensions - regional instability',
      red: 'Major conflicts - global impact likely'
    }
  },
  mbridge_settlement: {
    id: 'mbridge_settlement',
    name: 'mBridge Settlement Volume',
    whyItMatters: 'Tracks adoption of China-led digital currency system that could threaten dollar dominance.',
    thresholds: {
      green: 'Minimal adoption - dollar remains dominant',
      amber: 'Growing adoption - gradual shift away from dollar',
      red: 'Rapid adoption - significant threat to dollar'
    }
  }
};

export function getIndicatorDescription(id: string): IndicatorDescription | null {
  return descriptions[id] || null;
}