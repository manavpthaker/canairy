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
    whyItMatters: 'When airspace closes due to military conflict, it disrupts flights, reroutes cargo, and drives up costs. Multiple closures signal expanding conflict zones that can affect travel plans and import prices.',
    thresholds: {
      green: 'No conflict-related airspace closures',
      amber: '1-2 conflict NOTAMs active — some routes affected',
      red: '3+ conflict closures — widespread airspace disruption',
    },
    actionGuidance: {
      green: 'Normal flying conditions. No action needed.',
      amber: 'Check flight routes before booking. Consider travel insurance. Monitor affected regions for escalation.',
      red: 'Avoid non-essential international travel. Expect cargo delays and price increases on imported goods within weeks. Confirm any upcoming flights directly with airlines.',
    },
  },
  flight_02_bans: {
    id: 'flight_02_bans',
    name: 'US Flight Route Bans',
    whyItMatters: 'FAA flight bans are issued when airspace is too dangerous for civilian aircraft. These directly impact travel options and cargo delivery, and signal that the US government considers a conflict zone genuinely hazardous.',
    thresholds: {
      green: 'No active FAA flight bans',
      amber: '1-2 FAA bans active — limited route impact',
      red: '3+ FAA bans — significant airspace denied to US carriers',
    },
    actionGuidance: {
      green: 'All routes open. Fly normally.',
      amber: 'Review travel plans to affected regions. Rebook if routes pass through banned zones. Expect minor delays on some cargo.',
      red: 'Postpone travel to affected regions. Stock up on items that rely on air freight from banned zones. Prepare for shipping delays on time-sensitive goods.',
    },
  },
  flight_03_diversions: {
    id: 'flight_03_diversions',
    name: 'Major Route Diversions',
    whyItMatters: 'Airlines diverting around conflict zones means longer flights, higher fuel costs, and ticket price increases. Diversions add hours to routes and the fuel surcharges get passed to consumers.',
    thresholds: {
      green: 'No major route diversions active',
      amber: '1-2 major routes diverted — moderate cost impact',
      red: '3+ major diversions — significant cost and schedule disruptions',
    },
    actionGuidance: {
      green: 'Flights operating normal routes. No price impact expected.',
      amber: 'Book flights early to lock in prices. Budget 10-20% more for affected routes. Allow extra connection time.',
      red: 'Expect airfare spikes across many routes. Complete any essential travel soon before prices climb further. Budget for significantly higher shipping costs on air-freighted goods.',
    },
  },

  // BANKING
  bank_01_fdic_problem: {
    id: 'bank_01_fdic_problem',
    name: 'FDIC Problem Banks',
    whyItMatters: 'The FDIC maintains a confidential list of at-risk banks. The published count reveals banking system stress. The 2008 crisis peaked at 884 problem banks. Rising numbers mean the banking system is under strain.',
    thresholds: {
      green: 'Problem bank count at historical lows',
      amber: 'Problem banks rising above baseline — stress building',
      red: 'Problem bank count surging — systemic banking stress',
    },
    actionGuidance: {
      green: 'Banking system healthy. Ensure deposits are within FDIC limits ($250K per depositor per bank) as standard practice.',
      amber: 'Verify your banks are well-capitalized. Spread deposits across multiple FDIC-insured institutions. Keep 1-2 months expenses in cash at home.',
      red: 'Ensure no single bank holds more than $250K of your deposits. Keep 2-3 months cash on hand. Consider moving funds to the largest, best-capitalized banks. Have backup payment methods ready.',
    },
  },
  bank_02_failures: {
    id: 'bank_02_failures',
    name: 'Bank Failures YTD',
    whyItMatters: 'Bank failures are rare in healthy economies — often zero per year. SVB, Signature, and First Republic all failed within weeks in 2023, showing how quickly contagion spreads. Each failure erodes confidence system-wide.',
    thresholds: {
      green: '0 failures — banking system stable',
      amber: '1-2 failures — isolated stress',
      red: '3+ failures — systemic contagion risk',
    },
    actionGuidance: {
      green: 'No concerns. Standard FDIC insurance practices are sufficient.',
      amber: 'Check if your bank is on any watch lists. Ensure deposits are FDIC-insured. Keep extra cash accessible outside the banking system.',
      red: 'Move deposits to systemically important banks (too-big-to-fail). Maintain 3+ months of expenses in physical cash. Have a plan to access funds if your bank freezes withdrawals temporarily. Pay essential bills ahead.',
    },
  },
  bank_03_deposit_outflow: {
    id: 'bank_03_deposit_outflow',
    name: 'Large Deposit Outflows',
    whyItMatters: 'When large depositors pull money from banks, it signals institutional fear. Smart money moves first. Large deposit outflows preceded the SVB collapse by weeks — by the time regular depositors noticed, it was too late.',
    thresholds: {
      green: 'Deposit flows normal',
      amber: 'Notable outflows from vulnerable banks',
      red: 'Broad deposit flight underway',
    },
    actionGuidance: {
      green: 'Deposit flows stable. No action needed.',
      amber: 'Follow the smart money — review where your deposits are held. Move funds from smaller or weaker banks to well-capitalized institutions. Increase cash on hand.',
      red: 'Ensure all deposits are within FDIC insurance limits immediately. Withdraw enough cash for 1-2 months of essentials. Prepare for potential ATM limits or brief bank holidays. Do not panic — FDIC insurance works, but access may be delayed.',
    },
  },

  // TRAVEL
  travel_01_advisories: {
    id: 'travel_01_advisories',
    name: 'Level 3-4 Advisories',
    whyItMatters: 'State Department Level 3 means "Reconsider Travel" and Level 4 means "Do Not Travel." More countries at these levels means more of the world is unstable, reducing safe travel options and signaling broader geopolitical deterioration.',
    thresholds: {
      green: 'Few countries at Level 3-4 — normal baseline',
      amber: 'Above-average Level 3-4 count — instability spreading',
      red: 'Historically high Level 3-4 count — widespread global instability',
    },
    actionGuidance: {
      green: 'Travel freely with normal precautions. Keep passport current.',
      amber: 'Review advisories before booking any international travel. Purchase comprehensive travel insurance. Register with STEP (Smart Traveler Enrollment Program) for all trips.',
      red: 'Limit international travel to essential trips only. Ensure passports are renewed well before expiration. Have evacuation insurance. Keep copies of all documents in multiple locations. Consider whether family members abroad should return.',
    },
  },
  travel_02_border_status: {
    id: 'travel_02_border_status',
    name: 'Border Restriction Level',
    whyItMatters: 'Border restrictions can appear suddenly during crises — COVID saw near-total global border closure within weeks. High restrictions trap travelers abroad and prevent reunification of families across borders.',
    thresholds: {
      green: 'Borders open — normal travel',
      amber: 'Some border restrictions emerging',
      red: 'Widespread border closures or severe restrictions',
    },
    actionGuidance: {
      green: 'Borders open. Travel normally but keep documents current.',
      amber: 'If family members are abroad, discuss contingency plans. Ensure all travel documents are valid for 6+ months. Stock up on any medications or goods that come from affected countries.',
      red: 'Bring family members home if possible before further closures. Do not begin non-essential international travel. Ensure you have 90-day supplies of any imported medications. Prepare for disruptions to imported goods.',
    },
  },
  travel_03_passport_delays: {
    id: 'travel_03_passport_delays',
    name: 'Passport Processing',
    whyItMatters: 'Long passport processing times mean you cannot get travel documents quickly when you need them. During COVID, processing exceeded 18 weeks. In a crisis, the ability to leave quickly depends on having valid documents already in hand.',
    thresholds: {
      green: 'Processing under 6 weeks — normal times',
      amber: '6-10 weeks — delays building',
      red: '10+ weeks — severely delayed, emergency travel compromised',
    },
    actionGuidance: {
      green: 'Renew passports if within 12 months of expiration. Standard processing is fine.',
      amber: 'Renew all family passports immediately if within 18 months of expiration. Pay for expedited processing. Ensure children have valid passports.',
      red: 'If anyone in the family lacks a valid passport, pursue emergency processing immediately. Keep all travel documents in a go-bag. Having valid passports is a critical preparedness item — do not delay.',
    },
  },

  // SUPPLY CHAIN
  sc_01_shipping_rates: {
    id: 'sc_01_shipping_rates',
    name: 'Container Shipping Rates',
    whyItMatters: 'Container shipping rates directly impact the price of everything imported — which is most consumer goods. When rates spike, retail prices follow 2-3 months later. The 2021 shipping crisis saw rates jump 10x and emptied store shelves.',
    thresholds: {
      green: 'Shipping rates at normal levels',
      amber: 'Rates elevated — consumer price increases coming',
      red: 'Rates at crisis levels — significant inflation and shortages ahead',
    },
    actionGuidance: {
      green: 'Supply chains flowing normally. Shop as usual.',
      amber: 'Stock up on imported goods you rely on (electronics, certain foods, clothing). Buy holiday gifts early. Expect price increases in 2-3 months on many products.',
      red: 'Buy essential imported items now before prices spike further. Stock up on non-perishable goods. Consider domestic alternatives for key products. Budget for 15-30% price increases on many consumer goods.',
    },
  },
  sc_02_port_congestion: {
    id: 'sc_02_port_congestion',
    name: 'Port Congestion Index',
    whyItMatters: 'Port congestion means goods are stuck on ships and docks instead of reaching stores and factories. The 2021 crisis saw 100+ ships anchored off LA/Long Beach and caused widespread shortages of everything from furniture to auto parts.',
    thresholds: {
      green: 'Ports flowing — no significant delays',
      amber: 'Congestion building — delays of 1-2 weeks on some goods',
      red: 'Severe congestion — multi-week delays, shortages likely',
    },
    actionGuidance: {
      green: 'Supply chains clear. No action needed.',
      amber: 'Order essential items earlier than usual. Don\'t wait until last minute for important purchases. Check if any medications are import-dependent.',
      red: 'Stock up on essentials now — shortages are coming. Maintain 30-day supply of medications, baby supplies, and pet food. Buy durable goods you\'ve been putting off. Expect empty shelves on some products for weeks.',
    },
  },
  sc_03_food_disruption: {
    id: 'sc_03_food_disruption',
    name: 'Food Supply Disruption',
    whyItMatters: 'The US imports 15% of its food supply, including 50% of fresh fruit and 20% of vegetables. Disruptions anywhere in the global food chain affect grocery stores. Climate events, trade wars, and conflicts can all interrupt food flows.',
    thresholds: {
      green: 'Food supply chains stable',
      amber: 'Disruptions detected — some food categories affected',
      red: 'Major food supply disruption — widespread shortages possible',
    },
    actionGuidance: {
      green: 'Food supply normal. Maintain a standard 2-week pantry as best practice.',
      amber: 'Build pantry to 30 days of non-perishable food. Stock up on items you know are imported. Start a small garden or join a community garden. Buy a chest freezer if you don\'t have one.',
      red: 'Extend pantry to 60-90 days. Focus on calories and nutrition — rice, beans, canned goods, peanut butter, oats. Connect with local farms and farmers markets. Preserve food if you can. Prioritize feeding plans for children and elderly family members.',
    },
  },
  sc_04_chip_lead_time: {
    id: 'sc_04_chip_lead_time',
    name: 'Semiconductor Lead Times',
    whyItMatters: 'Semiconductors are in everything: cars, phones, appliances, medical devices. When lead times stretch, production halts cascade across industries. The 2021 chip shortage caused a 25% spike in car prices and made appliances unavailable for months.',
    thresholds: {
      green: 'Lead times normal — chips available',
      amber: 'Lead times stretching — some products affected',
      red: 'Severe shortage — widespread production delays',
    },
    actionGuidance: {
      green: 'Electronics and vehicles available normally. No rush on purchases.',
      amber: 'If you need a car, computer, or major appliance in the next 6 months, buy now before prices rise and availability drops. Repair rather than replace when possible.',
      red: 'Buy any essential electronics or appliances immediately — prices will rise 20%+ and wait times will stretch to months. If your car is aging, secure a replacement now. Stock spare phone chargers and basic electronics. Expect long waits for repairs on anything with a chip.',
    },
  },

  // ENERGY
  energy_01_spr: {
    id: 'energy_01_spr',
    name: 'Strategic Petroleum Reserve',
    whyItMatters: 'The SPR is America\'s emergency oil buffer — designed to cushion supply shocks. It was drawn to 40-year lows in 2022. When the SPR is depleted, there is no government backstop against an oil supply crisis, and prices can spike unchecked.',
    thresholds: {
      green: 'SPR at healthy levels — buffer available',
      amber: 'SPR below historical average — reduced buffer',
      red: 'SPR critically low — no meaningful emergency buffer',
    },
    actionGuidance: {
      green: 'Energy reserves adequate. No special action needed.',
      amber: 'Keep vehicles fueled above half tank as a habit. Consider fuel-efficient driving practices. Budget for potential energy price increases.',
      red: 'Keep all vehicle tanks full at all times. Fill up gas tanks and portable fuel containers (safely stored). Consider a home generator if you don\'t have one. Budget for significantly higher gas and heating costs. Reduce discretionary driving.',
    },
  },
  energy_02_gas_supply: {
    id: 'energy_02_gas_supply',
    name: 'Gasoline Supply Days',
    whyItMatters: 'Gasoline supply measured in days of demand. Below 20 days has historically preceded price spikes and spot shortages. When supply gets thin, a single refinery outage or pipeline disruption can cause regional gas lines.',
    thresholds: {
      green: '25+ days supply — comfortable buffer',
      amber: '20-25 days supply — thinning buffer',
      red: 'Below 20 days — shortage risk elevated',
    },
    actionGuidance: {
      green: 'Gas supply healthy. Fill up on your normal schedule.',
      amber: 'Fill up gas tanks when they hit half. Keep a jerry can of fuel in safe storage. Plan to reduce non-essential driving if supply drops further.',
      red: 'Fill all vehicles completely and keep them topped off. Store fuel safely (proper containers, ventilated area). Consolidate errands to minimize driving. Charge all battery-powered tools and devices. Have a plan if gas stations run dry in your area for 3-5 days.',
    },
  },
  energy_03_natgas: {
    id: 'energy_03_natgas',
    name: 'Natural Gas Storage',
    whyItMatters: 'Natural gas heats 47% of US homes and generates 40% of electricity. When storage falls below the 5-year average, heating bills spike and electricity costs rise. A cold snap with low storage can cause rolling blackouts.',
    thresholds: {
      green: 'Storage at or above 5-year average',
      amber: 'Storage below 5-year average — prices rising',
      red: 'Storage critically below average — heating crisis risk',
    },
    actionGuidance: {
      green: 'Energy supply stable. Normal heating and electricity costs expected.',
      amber: 'Budget for higher heating bills. Weatherize your home — seal drafts, add insulation. Set thermostat 2-3 degrees lower and use blankets. Service your furnace before winter.',
      red: 'Prepare for heating bills 50-100% above normal. Buy space heaters as backup (electric or propane with ventilation). Stock warm blankets and sleeping bags. Seal all drafts. If you have a fireplace, stock firewood. Consider temporarily relocating elderly family members to well-heated homes.',
    },
  },
  energy_04_grid_stress: {
    id: 'energy_04_grid_stress',
    name: 'Regional Grid Stress',
    whyItMatters: 'When the electrical grid is pushed to its limits, blackouts follow. Texas 2021 showed how quickly grid failure cascades — millions lost power for days in freezing temperatures, resulting in hundreds of deaths. Grid stress events are becoming more frequent.',
    thresholds: {
      green: 'Grid operating with adequate reserves',
      amber: 'Grid reserves thin — conservation alerts issued',
      red: 'Grid emergency — rolling blackouts possible',
    },
    actionGuidance: {
      green: 'Grid stable. Ensure you have basic outage supplies (flashlights, batteries) as standard practice.',
      amber: 'Charge all devices and battery packs. Fill bathtubs with water (for flushing if pumps lose power). Set AC/heat to reduce grid demand. Test your generator if you have one. Freeze water bottles to keep freezer cold longer during outages.',
      red: 'Charge everything now — phones, laptops, battery banks, power tools. Fill all water containers. Run generator test. Move medications that need refrigeration to a cooler with ice. Charge all devices. Unplug sensitive electronics. If you rely on electric medical equipment, activate your backup plan or relocate to a facility with backup power.',
    },
  },
};

export function getIndicatorDescription(id: string): IndicatorDescription | null {
  return descriptions[id] || null;
}
