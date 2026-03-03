// Indicator descriptions for all 34 research indicators
export interface IndicatorDescription {
  id: string;
  name: string;
  whatWeTrack?: string;
  whyItMatters: string;
  realWorldImpact?: string;
  thresholds: {
    green: string;
    amber: string;
    red: string;
  };
  actionGuidance?: {
    green: string;
    amber: string;
    red: string;
  };
  historicalContext?: string;
  methodology?: string;
  references?: string[];
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

  // FLIGHT & AIRSPACE
  flight_01_notams: {
    id: 'flight_01_notams',
    name: 'Conflict NOTAMs',
    whyItMatters: 'When airspace closes due to military conflict, it disrupts flights, reroutes cargo, and drives up costs for everything shipped by air. Multiple closures signal an expanding conflict zone.',
    thresholds: {
      green: 'Normal airspace operations',
      amber: 'Conflict zones affecting some routes — expect delays and cost increases',
      red: 'Multiple airspace closures — significant travel and cargo disruption',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Review travel plans to affected regions. Expect shipping delays.',
      red: 'Avoid travel to affected regions. Stock up on imported goods that may be delayed.',
    },
  },
  flight_02_bans: {
    id: 'flight_02_bans',
    name: 'US Flight Route Bans',
    whyItMatters: 'FAA flight bans are issued when airspace is too dangerous for civilian aircraft. These directly affect travel options and air cargo routes.',
    thresholds: {
      green: 'No active bans',
      amber: 'Some routes restricted — check before booking travel',
      red: 'Major route disruptions — travel significantly impacted',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Check FAA advisories before booking international flights.',
      red: 'Postpone non-essential international travel. Review cargo alternatives.',
    },
  },
  flight_03_diversions: {
    id: 'flight_03_diversions',
    name: 'Major Route Diversions',
    whyItMatters: 'When airlines divert around conflict zones, flights get longer, fuel costs rise, and ticket prices follow. This is often the first consumer-visible impact of distant conflicts.',
    thresholds: {
      green: 'Normal routing',
      amber: 'Some routes diverted — higher costs and longer flights',
      red: 'Major diversions — expect significant price increases',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Book essential travel early to lock in prices.',
      red: 'Expect 20-40% higher airfare. Consider alternative transport.',
    },
  },

  // BANKING & FINANCE
  bank_01_fdic_problem: {
    id: 'bank_01_fdic_problem',
    name: 'FDIC Problem Banks',
    whyItMatters: 'The FDIC maintains a confidential list of banks at risk of failure. When the number climbs, it means banking system stress is building. The 2008 crisis peaked at 884 problem banks.',
    thresholds: {
      green: 'Banking system healthy',
      amber: 'Growing number of stressed banks — verify your deposits are FDIC-insured',
      red: 'Systemic banking stress — diversify where you keep money',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Confirm all deposits are at FDIC-insured institutions and under $250K per account.',
      red: 'Spread deposits across multiple FDIC-insured banks. Keep extra cash on hand.',
    },
  },
  bank_02_failures: {
    id: 'bank_02_failures',
    name: 'Bank Failures YTD',
    whyItMatters: 'Bank failures are rare in healthy economies. Multiple failures in a year signal systemic problems. SVB, Signature, and First Republic all failed within weeks in 2023.',
    thresholds: {
      green: 'No bank failures — system stable',
      amber: 'Isolated failures — monitor your bank\'s health',
      red: 'Multiple failures — banking crisis territory',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Check your bank\'s financial health rating. Ensure FDIC coverage.',
      red: 'Move excess deposits to Treasury-only money market. Increase cash reserves.',
    },
  },
  bank_03_deposit_outflow: {
    id: 'bank_03_deposit_outflow',
    name: 'Large Deposit Outflows',
    whyItMatters: 'When large depositors pull money out of banks, it signals institutional fear. These outflows preceded SVB\'s collapse by weeks.',
    thresholds: {
      green: 'Normal deposit flows',
      amber: 'Elevated outflows — smart money is moving',
      red: 'Deposit flight underway — bank liquidity at risk',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Consider moving savings to Treasury-direct or money market.',
      red: 'Reduce bank exposure. Increase cash and short-term Treasury holdings.',
    },
  },

  // TRAVEL & MOVEMENT
  travel_01_advisories: {
    id: 'travel_01_advisories',
    name: 'Level 3-4 Advisories',
    whyItMatters: 'State Department Level 3-4 advisories cover countries where travel is dangerous. More countries on the list means more of the world is unstable.',
    thresholds: {
      green: 'Normal advisory levels',
      amber: 'Elevated global instability — review travel plans',
      red: 'Widespread travel danger — large portions of the world restricted',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Check advisories before booking any international travel.',
      red: 'Limit international travel to essential only. Ensure passports are current.',
    },
  },
  travel_02_border_status: {
    id: 'travel_02_border_status',
    name: 'Border Restriction Level',
    whyItMatters: 'Border restrictions affect movement, trade, and the ability to relocate if needed. High restriction levels can appear suddenly during crises.',
    thresholds: {
      green: 'Normal border operations',
      amber: 'Increased restrictions — expect delays at crossings',
      red: 'Significant restrictions — movement is being controlled',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Ensure all family ID documents are current. Plan for crossing delays.',
      red: 'Keep passports and documents ready. Understand your movement options.',
    },
  },
  travel_03_passport_delays: {
    id: 'travel_03_passport_delays',
    name: 'Passport Processing',
    whyItMatters: 'Long passport processing times mean you can\'t get travel documents quickly if you need them. During COVID, waits exceeded 18 weeks.',
    thresholds: {
      green: 'Normal processing times',
      amber: 'Processing delays — renew early if expiring within 12 months',
      red: 'Severe delays — getting new documents will take months',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Renew passports if expiring within a year. Get passport cards.',
      red: 'Expedite any pending passport applications. Ensure all family members have current documents.',
    },
  },

  // SUPPLY CHAIN
  sc_01_shipping_rates: {
    id: 'sc_01_shipping_rates',
    name: 'Container Shipping Rates',
    whyItMatters: 'Container shipping costs directly affect the price of everything imported — electronics, clothes, furniture, food ingredients. When rates spike, retail prices follow within 2-3 months.',
    thresholds: {
      green: 'Normal shipping costs',
      amber: 'Rates rising — imported goods will get more expensive',
      red: 'Crisis-level rates — significant retail price increases coming',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Make planned purchases of imported goods sooner rather than later.',
      red: 'Buy durable goods now before prices rise. Stock essentials.',
    },
  },
  sc_02_port_congestion: {
    id: 'sc_02_port_congestion',
    name: 'Port Congestion Index',
    whyItMatters: 'Port congestion means goods are stuck on ships or at docks. During the 2021 crisis, ships waited weeks to unload, causing widespread shortages.',
    thresholds: {
      green: 'Ports flowing normally',
      amber: 'Growing backlogs — some goods may be delayed',
      red: 'Major congestion — shortages of imported goods likely',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Expect some product shortages. Buy essentials when you see them.',
      red: 'Stock up on household essentials. Expect 4-8 week delays on orders.',
    },
  },
  sc_03_food_disruption: {
    id: 'sc_03_food_disruption',
    name: 'Food Supply Disruption',
    whyItMatters: 'Food supply disruptions mean empty shelves and price spikes. The US imports 15% of its food — disruptions anywhere in the chain affect your grocery store.',
    thresholds: {
      green: 'Food supply chain healthy',
      amber: 'Some disruptions — selective shortages possible',
      red: 'Significant disruptions — stock up on staples',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Add extra shelf-stable foods to your pantry each shopping trip.',
      red: 'Build a 2-week food buffer. Focus on rice, beans, canned goods, frozen vegetables.',
    },
  },
  sc_04_chip_lead_time: {
    id: 'sc_04_chip_lead_time',
    name: 'Semiconductor Lead Times',
    whyItMatters: 'Semiconductors are in everything — cars, phones, appliances, medical devices. Long lead times caused car prices to spike 25% in 2021.',
    thresholds: {
      green: 'Normal availability',
      amber: 'Extended waits — buy electronics and vehicles sooner',
      red: 'Severe shortage — expect price spikes and limited availability',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Make planned electronics or vehicle purchases earlier.',
      red: 'Buy essential electronics now. Expect 3-6 month delays on orders.',
    },
  },

  // ENERGY & POWER
  energy_01_spr: {
    id: 'energy_01_spr',
    name: 'Strategic Petroleum Reserve',
    whyItMatters: 'The SPR is America\'s emergency oil buffer. At low levels, the government has fewer options to control fuel prices during a crisis. It was drawn down to 40-year lows in 2022.',
    thresholds: {
      green: 'Healthy reserve levels — buffer available',
      amber: 'Reserve drawn down — less buffer for emergencies',
      red: 'Critically low — no meaningful emergency buffer',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Keep vehicles fueled above half tank.',
      red: 'Keep all vehicles fully fueled. Consider fuel storage if you have a generator.',
    },
  },
  energy_02_gas_supply: {
    id: 'energy_02_gas_supply',
    name: 'Gasoline Supply Days',
    whyItMatters: 'Days of gasoline supply measures how long current inventories would last at current consumption. Below 20 days has historically preceded price spikes and spot shortages.',
    thresholds: {
      green: 'Adequate supply',
      amber: 'Supply tightening — prices likely rising',
      red: 'Low supply — shortages and rationing possible',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Fill up when you see low prices. Don\'t let tanks go below half.',
      red: 'Keep all vehicles topped off. Have alternative transportation plans.',
    },
  },
  energy_03_natgas: {
    id: 'energy_03_natgas',
    name: 'Natural Gas Storage',
    whyItMatters: 'Natural gas heats 47% of US homes. When storage is below the 5-year average, heating bills spike and shortages during cold snaps become possible.',
    thresholds: {
      green: 'Storage at normal levels',
      amber: 'Below average — heating costs will be higher',
      red: 'Well below average — expect significant heating cost increases',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Budget for higher heating bills. Check insulation and weatherization.',
      red: 'Prepare backup heating. Weatherize your home. Lock in utility rates if possible.',
    },
  },
  energy_04_grid_stress: {
    id: 'energy_04_grid_stress',
    name: 'Regional Grid Stress',
    whyItMatters: 'Grid stress means the electrical system is being pushed to its limits. At high levels, rolling blackouts become likely. Texas in 2021 showed how quickly grid failure cascades.',
    thresholds: {
      green: 'Grid operating normally',
      amber: 'Grid under pressure — brownouts possible during peak',
      red: 'Grid at risk — rolling blackouts likely',
    },
    actionGuidance: {
      green: 'No action needed',
      amber: 'Charge all devices and power banks. Test backup power.',
      red: 'Activate backup power plan. Fill water containers. Charge everything.',
    },
  },
};

export function getIndicatorDescription(id: string): IndicatorDescription | null {
  return descriptions[id] || null;
}
