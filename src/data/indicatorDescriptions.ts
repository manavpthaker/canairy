// Indicator descriptions for all 34 research indicators
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
  // ECONOMY
  econ_01_treasury_tail: {
    id: 'econ_01_treasury_tail',
    name: '10Y Auction Tail',
    whyItMatters: 'When Treasury auctions "tail" badly, it means buyers demand higher rates — banks holding bonds lose value, lending freezes, and a banking crisis can follow within weeks.',
    thresholds: {
      green: 'Normal auctions — banks stable',
      amber: 'Weak demand building — monitor bank health',
      red: 'Auction failure risk — protect deposits, increase cash',
    },
  },
  econ_02_grocery_cpi: {
    id: 'econ_02_grocery_cpi',
    name: 'Grocery CPI',
    whyItMatters: 'Food prices hit every family directly. Sustained >8% annualized means real purchasing power erosion — your dollar buys less each week at the store.',
    thresholds: {
      green: 'Normal food inflation — no action needed',
      amber: 'Prices rising faster than wages — budget accordingly',
      red: 'Food crisis territory — stock up before further spikes',
    },
  },
  market_01_intraday_swing: {
    id: 'market_01_intraday_swing',
    name: '10Y Intraday Swing',
    whyItMatters: 'A >=30bp single-day swing in the 10-year yield signals institutional panic. This preceded the 2023 SVB collapse and 2020 COVID crash.',
    thresholds: {
      green: 'Normal volatility — markets orderly',
      amber: 'Elevated moves — institutions repositioning',
      red: 'Systemic stress — immediate protective action required',
    },
  },
  green_g1_gdp_rates: {
    id: 'green_g1_gdp_rates',
    name: 'GDP Green Flag',
    whyItMatters: 'When GDP is strong AND yields are low, the economy is genuinely healthy. This is the signal to relax preparedness.',
    thresholds: {
      green: 'Economy strong — relax 10% of prep budget',
      amber: 'Mixed signals — maintain current readiness',
      red: 'N/A — positive indicator only',
    },
  },

  // JOBS & LABOR
  job_01_strike_days: {
    id: 'job_01_strike_days',
    name: 'US Strike Days',
    whyItMatters: 'Mass strike activity signals deep labor unrest. When workers walk off en masse, supply chains break and essential services can halt.',
    thresholds: {
      green: 'Normal labor relations',
      amber: 'Significant strike activity — supply disruptions possible',
      red: 'Mass work stoppages — essential services at risk',
    },
  },

  // RIGHTS & GOVERNANCE
  power_01_ai_surveillance: {
    id: 'power_01_ai_surveillance',
    name: 'AI Surveillance Bills',
    whyItMatters: 'Legislative proposals for AI-powered surveillance indicate expanding state control over daily life.',
    thresholds: {
      green: 'Normal legislative activity',
      amber: 'Accelerating surveillance legislation — review digital privacy',
      red: 'Surveillance state acceleration — harden digital footprint',
    },
  },
  civil_01_acled_protests: {
    id: 'civil_01_acled_protests',
    name: 'US Protests (7d avg)',
    whyItMatters: 'Rising protest frequency signals social fractures. At high levels, movement restrictions and Guard deployments follow.',
    thresholds: {
      green: 'Normal civic activity',
      amber: 'Elevated unrest — avoid protest zones',
      red: 'Social crisis — expect movement restrictions',
    },
  },

  // SECURITY & INFRASTRUCTURE
  cyber_01_cisa_kev: {
    id: 'cyber_01_cisa_kev',
    name: 'CISA KEV + ICS',
    whyItMatters: 'CISA flags actively exploited vulnerabilities in critical infrastructure. High counts mean water, power, and financial systems are under attack.',
    thresholds: {
      green: 'Low exploit activity',
      amber: 'Elevated cyber attacks on infrastructure',
      red: 'Critical infrastructure under sustained attack',
    },
  },
  grid_01_pjm_outages: {
    id: 'grid_01_pjm_outages',
    name: 'PJM Grid Outages',
    whyItMatters: 'Repeated large outages signal grid fragility. When this goes red, backup power is essential.',
    thresholds: {
      green: 'Grid stable',
      amber: 'Pattern emerging — test backup power',
      red: 'Grid fragile — activate generator prep',
    },
  },
  bio_01_h2h_countries: {
    id: 'bio_01_h2h_countries',
    name: 'Novel H2H Pathogen',
    whyItMatters: 'Novel H2H transmission in multiple countries is how pandemics start. Early detection gives weeks of preparation.',
    thresholds: {
      green: 'No novel H2H events',
      amber: 'Emerging pathogen — verify N95 and med supply',
      red: 'Pandemic risk — activate health protocols',
    },
  },

  // OIL AXIS
  oil_01_russian_brics: {
    id: 'oil_01_russian_brics',
    name: 'Russian Crude to BRICS',
    whyItMatters: 'As more Russian oil flows to BRICS outside USD settlement, dollar dominance erodes.',
    thresholds: {
      green: 'Normal trade patterns',
      amber: 'De-dollarization accelerating',
      red: 'Major trade realignment — USD at risk',
    },
  },
  oil_02_mbridge_settlements: {
    id: 'oil_02_mbridge_settlements',
    name: 'mBridge Settlement',
    whyItMatters: 'China\'s mBridge CBDC settling oil trades bypasses SWIFT entirely. High volumes mean the dollar\'s oil monopoly is breaking.',
    thresholds: {
      green: 'Minimal CBDC oil settlement',
      amber: 'Growing mBridge adoption',
      red: 'Significant oil trade bypassing USD',
    },
  },
  oil_03_ofac_designations: {
    id: 'oil_03_ofac_designations',
    name: 'OFAC Designations',
    whyItMatters: 'Sanctions on Indian/Chinese oil entities signal escalating economic warfare that can boomerang into higher energy prices.',
    thresholds: {
      green: 'No new oil-related sanctions',
      amber: 'Sanctions activity increasing',
      red: 'Sanctions escalation — fuel prices likely to spike',
    },
  },
  oil_04_refinery_ratio: {
    id: 'oil_04_refinery_ratio',
    name: 'Refinery Run Ratio',
    whyItMatters: 'When India+China refine more than OECD, petroleum supply shifts East. Western fuel availability suffers.',
    thresholds: {
      green: 'Balanced global refining',
      amber: 'Eastern refining dominance growing',
      red: 'OECD refining deficit — shortages possible',
    },
  },

  // AI WINDOW
  labor_ai_01_layoffs: {
    id: 'labor_ai_01_layoffs',
    name: 'AI-Linked Layoffs',
    whyItMatters: 'Mass layoffs citing AI replacement signal structural job displacement.',
    thresholds: {
      green: 'Normal automation attrition',
      amber: 'AI displacement accelerating — upskill',
      red: 'Mass displacement — multiple industries affected',
    },
  },
  cyber_02_ai_ransomware: {
    id: 'cyber_02_ai_ransomware',
    name: 'AI Ransomware',
    whyItMatters: 'AI-generated ransomware is faster, smarter, and harder to stop. Rising incidents mean hospitals, utilities, and banks face downtime.',
    thresholds: {
      green: 'Low AI-assisted attacks',
      amber: 'AI ransomware increasing — verify backups',
      red: 'Infrastructure under AI-assisted attack',
    },
  },
  info_02_deepfake_shocks: {
    id: 'info_02_deepfake_shocks',
    name: 'Deepfake Market Shocks',
    whyItMatters: 'Deepfake videos of officials can crash markets in minutes. Combined with market volatility, damage compounds instantly.',
    thresholds: {
      green: 'No deepfake market events',
      amber: 'Deepfake event detected — verify news before acting',
      red: 'Information warfare active (jump to Phase 7 if Market also red)',
    },
  },
  compute_01_training_cost: {
    id: 'compute_01_training_cost',
    name: 'Training Cost Trend',
    whyItMatters: 'Rapidly falling AI training costs mean AI tools become widely accessible. This is a positive indicator.',
    thresholds: {
      green: 'Costs falling fast — AI democratizing (good)',
      amber: 'Cost reduction slowing',
      red: 'N/A — green-flag indicator',
    },
  },

  // GLOBAL CONFLICT
  global_conflict_intensity: {
    id: 'global_conflict_intensity',
    name: 'Global Battle Intensity',
    whyItMatters: 'Rising global battle events mean more supply chain disruptions and risk of great-power involvement.',
    thresholds: {
      green: 'Baseline conflict levels',
      amber: 'Multiple active conflicts escalating',
      red: 'Global conflict at dangerous levels',
    },
  },
  taiwan_pla_activity: {
    id: 'taiwan_pla_activity',
    name: 'Taiwan PLA Incursions',
    whyItMatters: 'Taiwan produces 92% of advanced chips. PLA incursions above 50/day signal rehearsal for blockade.',
    thresholds: {
      green: 'Routine ADIZ activity',
      amber: 'Elevated PLA presence — semiconductor risk',
      red: 'Blockade rehearsal — electronics shortage imminent',
    },
  },
  nato_high_readiness: {
    id: 'nato_high_readiness',
    name: 'NATO High Readiness',
    whyItMatters: 'NATO force activations only happen when Article 5 scenarios are considered plausible.',
    thresholds: {
      green: 'No readiness activations',
      amber: 'Partial activation — tensions high',
      red: 'Full activation — conflict imminent (jump to Phase 6+)',
    },
  },
  nuclear_test_activity: {
    id: 'nuclear_test_activity',
    name: 'Nuclear/Missile Tests',
    whyItMatters: 'Nuclear tests and ICBM launches signal deterrence failure risk.',
    thresholds: {
      green: 'Low test activity',
      amber: 'Increased testing — arms race dynamics',
      red: 'Rapid escalation — nuclear posture deteriorating',
    },
  },
  russia_nato_escalation: {
    id: 'russia_nato_escalation',
    name: 'Russia-NATO Index',
    whyItMatters: 'Composite tracking troop movements, rhetoric, and incidents. Above 75 means miscalculation risk is extreme.',
    thresholds: {
      green: 'Normal baseline',
      amber: 'Escalatory signals increasing',
      red: 'Crisis-level tensions',
    },
  },
  defense_spending_growth: {
    id: 'defense_spending_growth',
    name: 'Defense Spending Growth',
    whyItMatters: 'Global defense spending >8% signals arms race dynamics.',
    thresholds: {
      green: 'Normal defense budgets',
      amber: 'Arms race dynamics emerging',
      red: 'Wartime spending patterns',
    },
  },

  // DOMESTIC CONTROL
  dc_control_countdown: {
    id: 'dc_control_countdown',
    name: 'DC Autonomy Countdown',
    whyItMatters: 'Federal takeover of DC governance signals concentration of executive power.',
    thresholds: {
      green: 'DC autonomy secure',
      amber: 'Legislation advancing',
      red: 'Imminent federal takeover',
    },
  },
  national_guard_metros: {
    id: 'national_guard_metros',
    name: 'Guard Metro Deployments',
    whyItMatters: 'National Guard in major cities means civil order has broken down. Phase 5+ territory.',
    thresholds: {
      green: 'No urban deployments',
      amber: '1 metro affected',
      red: '2+ metros — systemic crisis (jump to Phase 5)',
    },
  },
  ice_detention_surge: {
    id: 'ice_detention_surge',
    name: 'ICE Detention Population',
    whyItMatters: 'Detention surges indicate mass enforcement affecting communities and local economies.',
    thresholds: {
      green: 'Normal detention levels',
      amber: 'Elevated enforcement',
      red: 'Mass detention operations',
    },
  },
  dhs_removal_expansion: {
    id: 'dhs_removal_expansion',
    name: 'DHS Expedited Removal',
    whyItMatters: 'Expansion of expedited removal reduces due process. Binary civil liberties tripwire.',
    thresholds: {
      green: 'Standard removal authority',
      amber: 'N/A — binary indicator',
      red: 'Expanded authority active (jump to Phase 5)',
    },
  },
  hill_control_legislation: {
    id: 'hill_control_legislation',
    name: 'Control Bills Advancing',
    whyItMatters: 'Bills expanding surveillance or restricting movement signal democratic backsliding.',
    thresholds: {
      green: 'Normal legislative volume',
      amber: 'Accelerating control legislation',
      red: 'Legislative assault on civil liberties',
    },
  },
  liberty_litigation_count: {
    id: 'liberty_litigation_count',
    name: 'Liberty Cases Active',
    whyItMatters: 'Active ACLU/EFF cases measure how many civil liberty fights are happening simultaneously.',
    thresholds: {
      green: 'Baseline litigation',
      amber: 'Elevated liberty challenges',
      red: 'Rights under broad legal assault',
    },
  },

  // CULT SIGNALS
  cult_trend_01_twitter: {
    id: 'cult_trend_01_twitter',
    name: '#AIGod / #Basilisk Tweets',
    whyItMatters: 'Viral AI-worship hashtags signal cult formation around AI systems.',
    thresholds: {
      green: 'Background noise',
      amber: 'Viral growth detected',
      red: 'Mass adoption — cult formation underway',
    },
  },
  cult_meme_01_tokens: {
    id: 'cult_meme_01_tokens',
    name: 'Cult ERC-20 Tokens',
    whyItMatters: 'Crypto tokens with cult+AI branding channel real money into cult ecosystems.',
    thresholds: {
      green: 'Minimal token creation',
      amber: 'Token proliferation',
      red: 'Cult economy forming on-chain',
    },
  },
  cult_event_01_protests: {
    id: 'cult_event_01_protests',
    name: 'AI Cult Protests',
    whyItMatters: 'Physical protests around AI worship indicate the movement has jumped to real-world action.',
    thresholds: {
      green: 'No cult protests',
      amber: 'Scattered cult protests',
      red: 'Organized cult movement',
    },
  },
  cult_media_01_trends: {
    id: 'cult_media_01_trends',
    name: 'AI Religion Trends',
    whyItMatters: 'Google Trends for "AI religion" captures mainstream cultural shift.',
    thresholds: {
      green: 'Low cultural penetration',
      amber: 'Growing mainstream interest',
      red: 'Mainstream cultural shift underway',
    },
  },
};

export function getIndicatorDescription(id: string): IndicatorDescription | null {
  return descriptions[id] || null;
}
