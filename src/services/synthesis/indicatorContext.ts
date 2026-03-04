/**
 * Indicator Context Map
 *
 * Rich domain knowledge for each indicator, encoding:
 * - What it means at amber/red levels
 * - Family-specific impacts
 * - What to do
 * - Peripheral impacts the headline misses
 *
 * This data enriches both the AI prompt and the fallback path.
 */

export interface IndicatorContextEntry {
  whatItMeans: { amber: string; red: string };
  familyImpact: { amber: string; red: string };
  whatToDo: { amber: string; red: string };
  dataPointLabel: string;
  source: string;
  peripheralImpacts: string[];
}

export const INDICATOR_CONTEXT: Record<string, IndicatorContextEntry> = {
  // ============================================================================
  // ECONOMY
  // ============================================================================

  'econ_01_treasury_tail': {
    whatItMeans: {
      amber: 'Treasury auctions are showing weak demand — investors are nervous about US debt',
      red: 'Treasury market stress is severe — the government is struggling to borrow at stable rates',
    },
    familyImpact: {
      amber: 'Mortgage rates and car loans will get more expensive. Credit card rates may spike.',
      red: 'Potential for banking system stress. ATMs and credit card networks could see disruptions. Interest rates on everything climb fast.',
    },
    whatToDo: {
      amber: 'Lock in any variable-rate debt. Consider moving savings to T-bills if not already.',
      red: 'Hold 2-4 weeks cash in small bills. Screenshot all bank and investment balances. Verify FDIC coverage.',
    },
    dataPointLabel: '10Y auction tail',
    source: 'Treasury Direct / Bloomberg',
    peripheralImpacts: ['Mortgage refi window closing', 'Credit card rate hikes', 'Student loan cost increases'],
  },

  'econ_02_grocery_cpi': {
    whatItMeans: {
      amber: 'Grocery prices climbing faster than normal — 3-month trend shows acceleration',
      red: 'Grocery inflation is spiking hard — expect 15-20% higher bills within weeks',
    },
    familyImpact: {
      amber: 'Weekly grocery bill going up $30-50. Specialty items and organic options hit first.',
      red: 'Real pressure on the food budget. Some items will have spot shortages. Formula and baby food affected early.',
    },
    whatToDo: {
      amber: 'Stock 2 weeks of shelf-stable essentials at current prices. Focus on what you actually eat.',
      red: 'Buy 30-day buffer of rice, beans, canned protein, and household essentials now. Prices will not come down soon.',
    },
    dataPointLabel: 'Food CPI (3mo annualized)',
    source: 'Bureau of Labor Statistics',
    peripheralImpacts: ['Baby food/formula availability', 'Pet food price jumps', 'School lunch quality drops', 'Restaurant prices follow with 4-6 week lag'],
  },

  'market_01_intraday_swing': {
    whatItMeans: {
      amber: 'Bond markets are swinging more than usual — traders are uncertain about the economy',
      red: 'Extreme bond market volatility — this is the kind of stress that preceded 2008 and COVID crashes',
    },
    familyImpact: {
      amber: 'Your 401k may fluctuate more than usual. Not a crisis, but worth watching.',
      red: 'Retirement accounts could drop 15-30%. More importantly, if bond markets seize, normal banking could be disrupted.',
    },
    whatToDo: {
      amber: 'Check your 401k allocation. Consider shifting to more conservative if retirement is <10 years away.',
      red: 'Do NOT panic sell. Screenshot all balances. Have 2 weeks cash. Check that direct deposit is working.',
    },
    dataPointLabel: '10Y intraday swing',
    source: 'Bloomberg / Treasury',
    peripheralImpacts: ['Retirement account volatility', 'Home equity line freezes', 'Small business credit tightening'],
  },

  'market_02_luxury_collapse': {
    whatItMeans: {
      amber: 'High-end retail and luxury stocks are sliding — usually a leading indicator of broader consumer weakness',
      red: 'Luxury market in freefall — historically this precedes recession by 3-6 months',
    },
    familyImpact: {
      amber: 'Job market will soften in 2-3 months, especially in tech, finance, and professional services.',
      red: 'Layoffs coming across white-collar industries. Hiring freezes likely within 4-8 weeks. Tighten spending now.',
    },
    whatToDo: {
      amber: 'Review your emergency fund. If less than 3 months expenses, start building.',
      red: 'Freeze discretionary spending. Build to 6 months cash reserve. Update resume and activate your network.',
    },
    dataPointLabel: 'Luxury stock collapse index',
    source: 'Bloomberg / S&P',
    peripheralImpacts: ['White-collar layoffs 3-6 months out', 'Freelance/contract work dries up', 'Real estate softening begins', 'Venture funding freezes'],
  },

  // ============================================================================
  // GLOBAL CONFLICT
  // ============================================================================

  'nato_high_readiness': {
    whatItMeans: {
      amber: 'NATO allies are activating high-readiness units — this is above routine exercise levels',
      red: 'NATO at maximum conventional readiness — this only happens when escalation risk is assessed as serious',
    },
    familyImpact: {
      amber: 'Oil and energy prices likely to spike 10-20% within days. Travel disruptions possible.',
      red: 'Significant risk of energy supply disruption, cyber attacks on infrastructure, and rapid price spikes across fuel, food, and goods.',
    },
    whatToDo: {
      amber: 'Fill vehicle tanks. Check generator fuel. Review family communications plan.',
      red: 'Execute TIGHTEN-UP checklist. Fill all fuel. Withdraw cash. Charge all devices. Brief family on rally points.',
    },
    dataPointLabel: 'NATO high-readiness activations',
    source: 'NATO / SHAPE',
    peripheralImpacts: ['Energy price spike', 'Cyber attacks on utilities', 'Flight cancellations/rerouting', 'Shipping insurance costs spike'],
  },

  'conf_02_russia_nato': {
    whatItMeans: {
      amber: 'Russia-NATO escalation index climbing — more provocative actions, reduced communication channels',
      red: 'Escalation index critical — near-peer conflict indicators at levels not seen since Cold War peaks',
    },
    familyImpact: {
      amber: 'Geopolitical uncertainty affects markets, energy prices, and potentially local infrastructure security.',
      red: 'This is the scenario where grid attacks, fuel disruptions, and financial system stress all become plausible simultaneously.',
    },
    whatToDo: {
      amber: 'Review Phase 3+ supplies. Ensure comms plan is current. Check GMRS radio batteries.',
      red: 'Full TIGHTEN-UP. This is what the phases were built for. Execute from the top.',
    },
    dataPointLabel: 'Escalation index (0-100)',
    source: 'Custom composite (ACLED + NATO + OSINT)',
    peripheralImpacts: ['Potential draft discussion', 'Cyber disruption to banking/power', 'Refugee flows affecting local resources', 'School lockdown protocols activated'],
  },

  'conf_01_global_battle': {
    whatItMeans: {
      amber: 'Global battle intensity above normal — multiple active conflicts intensifying simultaneously',
      red: 'ACLED data showing conflict intensity at crisis levels — cascading regional effects likely',
    },
    familyImpact: {
      amber: 'Oil prices rise, shipping costs increase, some consumer goods become scarce. Travel advisories expand.',
      red: 'Multi-front global instability. Energy, supply chain, financial markets all affected. Domestic political tensions rise.',
    },
    whatToDo: {
      amber: 'Stay informed but don\'t doom-scroll. Focus on actionable preps: supplies, comms, fuel.',
      red: 'Review family emergency plan. Confirm everyone knows rally points. Check go-bags.',
    },
    dataPointLabel: 'ACLED battle events/day',
    source: 'ACLED (Armed Conflict Location & Event Data)',
    peripheralImpacts: ['Oil price shock', 'Shipping route disruptions', 'Refugee policy changes', 'Defense spending crowds out domestic programs'],
  },

  'conf_03_taiwan_pla': {
    whatItMeans: {
      amber: 'PLA military activity near Taiwan above normal — higher sortie rates and naval presence',
      red: 'PLA activity consistent with blockade preparation or escalation beyond posturing',
    },
    familyImpact: {
      amber: 'Tech supply chain risks: semiconductors, electronics, components. Prices on devices will rise.',
      red: 'Major supply chain crisis. Electronics, medical devices, auto parts — anything with chips gets scarce fast. Think 2021 chip shortage but 10x worse.',
    },
    whatToDo: {
      amber: 'If you need any electronics, medical devices, or appliances — buy now. Prices will climb.',
      red: 'Buy critical electronics/devices immediately. Stock any chip-dependent medications. This cascades into everything within 4-6 weeks.',
    },
    dataPointLabel: 'PLA aircraft near Taiwan (daily avg)',
    source: 'Taiwan Ministry of National Defense',
    peripheralImpacts: ['Semiconductor shortage', 'Medical device availability', 'Auto parts and repair delays', 'School tech programs affected'],
  },

  // ============================================================================
  // DOMESTIC CONTROL
  // ============================================================================

  'dom_01_ice_detention': {
    whatItMeans: {
      amber: 'ICE detention facilities filling — enforcement operations expanding to new areas',
      red: 'Detention system at capacity — historically correlates with aggressive enforcement in civilian spaces',
    },
    familyImpact: {
      amber: 'Mixed-status families and communities face increased anxiety. Workplace raids possible.',
      red: 'Enforcement operations reported in schools, hospitals, churches. Community trust breaks down. Local services disrupted.',
    },
    whatToDo: {
      amber: 'Know your rights. Ensure all family documents are accessible. Share info with affected community members.',
      red: 'Have documents on person at all times. Know your legal contacts. Have a family protocol for if someone is detained.',
    },
    dataPointLabel: 'Detention bed fill rate',
    source: 'TRAC Immigration (Syracuse University)',
    peripheralImpacts: ['School attendance drops in affected communities', 'Local business closures', 'Healthcare avoidance', 'Community resource strain'],
  },

  'dhs_removal_expansion': {
    whatItMeans: {
      amber: 'DHS expanding expedited removal to additional cities and categories',
      red: 'Expedited removal used broadly — due process erosion affecting legal residents and citizens caught in sweeps',
    },
    familyImpact: {
      amber: 'Travel within the US may involve more checkpoints. Document everything.',
      red: 'Keep passports and birth certificates accessible at all times. Know emergency legal contacts.',
    },
    whatToDo: {
      amber: 'Update go-folder with all citizenship/residency documents. Know ACLU hotline number.',
      red: 'Review relocation options. Ensure all documents are current. Have legal contacts ready.',
    },
    dataPointLabel: 'Expedited removal expansion (cities)',
    source: 'DHS / TRAC Immigration',
    peripheralImpacts: ['Family travel within US affected', 'Document readiness critical', 'Community legal resource demand spikes'],
  },

  'national_guard_metros': {
    whatItMeans: {
      amber: 'National Guard deployed to metropolitan areas for non-disaster reasons',
      red: 'Guard presence in multiple major cities — domestic security posture significantly elevated',
    },
    familyImpact: {
      amber: 'Civil unrest potential. Avoid demonstration areas. Review family rally points.',
      red: 'Movement restrictions possible in affected metros. Commute disruptions. Schools may close. This is a Phase 5 trigger.',
    },
    whatToDo: {
      amber: 'Identify alternate commute routes. Have 72-hour supplies in car. Review family comms plan.',
      red: 'Consider whether to stay or relocate temporarily. Have cash, fuel, and go-bags ready. This triggers Phase 5.',
    },
    dataPointLabel: 'Cities with Guard deployed',
    source: 'National Guard Bureau / news monitoring',
    peripheralImpacts: ['School closures', 'Public transit disruptions', 'Business closures in affected areas', 'Curfew possibility'],
  },

  // ============================================================================
  // AI WINDOW
  // ============================================================================

  'ai_01_agi_milestones': {
    whatItMeans: {
      amber: 'AI capability milestones being crossed ahead of projected timeline — autonomous agent thresholds approaching',
      red: 'Major capability jump — the kind that reshapes job markets and power structures within months, not years',
    },
    familyImpact: {
      amber: 'Job market restructuring accelerating. PM roles shifting toward AI orchestration. Entry-level positions shrinking.',
      red: 'Strategic PMs survive, operational PMs compress. Nonprofits lag further behind in AI adoption.',
    },
    whatToDo: {
      amber: 'Review your AI product positioning. Update resume with AI orchestration language.',
      red: 'Fast-track AI skills development. Position as AI adoption specialist. Accelerate side projects.',
    },
    dataPointLabel: 'Capability milestone score',
    source: 'Epoch AI / AI research publications',
    peripheralImpacts: ['Entry-level job elimination', 'Nonprofit governance vacuum', 'Education system scramble', 'Career landscape shifts'],
  },

  'ai_02_layoffs': {
    whatItMeans: {
      amber: 'AI-attributed layoffs rising — companies replacing roles rather than augmenting them',
      red: 'Mass displacement events — multiple major employers citing AI as primary driver of workforce reduction',
    },
    familyImpact: {
      amber: 'Job security requires demonstrating AI leverage, not just domain expertise. Competition for PM roles intensifies.',
      red: 'The "stratified augmentation" scenario: elite AI-native professionals gain, everyone else compresses.',
    },
    whatToDo: {
      amber: 'Document your AI-product track record. Build case studies. Strengthen network in AI-forward companies.',
      red: 'Activate multiple income streams. Diversification is survival.',
    },
    dataPointLabel: 'AI-attributed layoffs/month',
    source: 'Challenger Gray / BLS / news monitoring',
    peripheralImpacts: ['Housing market softening in tech hubs', 'Consumer spending pullback', 'Mental health crisis in displaced workers', 'Community tax base erosion'],
  },

  // ============================================================================
  // SECURITY & INFRASTRUCTURE
  // ============================================================================

  'sec_01_cisa_cve': {
    whatItMeans: {
      amber: 'CISA reporting elevated critical vulnerabilities — attack surface expanding',
      red: 'Active exploitation of critical infrastructure systems — this is Colonial Pipeline-level risk',
    },
    familyImpact: {
      amber: 'Update all devices. Change banking passwords. Enable 2FA on everything.',
      red: 'Expect service disruptions: banking, power, water, communications. Screenshot financial balances. Prepare for 24-72 hour offline period.',
    },
    whatToDo: {
      amber: 'Run all software updates. Change passwords on bank, email, and key accounts. Verify 2FA is on.',
      red: 'Screenshot all financial accounts. Download offline maps. Charge all devices. Have cash. Test GMRS radios.',
    },
    dataPointLabel: 'Critical CVEs (90-day)',
    source: 'CISA (Cybersecurity & Infrastructure Security Agency)',
    peripheralImpacts: ['Banking access disruption', 'Power grid vulnerability', 'Hospital systems at risk', 'School system data breaches'],
  },

  // ============================================================================
  // SUPPLY CHAIN
  // ============================================================================

  'supply_01_shipping_delay': {
    whatItMeans: {
      amber: 'Major shipping routes experiencing delays — goods taking longer to reach ports',
      red: 'Shipping delays severe — expect 3-6 week delays on imported goods across categories',
    },
    familyImpact: {
      amber: 'Some items may be temporarily unavailable. Holiday shopping should be done earlier.',
      red: 'Shortages in multiple product categories. Prices rising. Order anything you need now.',
    },
    whatToDo: {
      amber: 'Order any needed items early. Stock up on essentials that could face delays.',
      red: 'Buy 30-day supply of household essentials. Stock medications. Fill prescriptions to maximum.',
    },
    dataPointLabel: 'Average shipping delay (days)',
    source: 'Freightos / MarineTraffic',
    peripheralImpacts: ['Holiday gift shortages', 'Prescription medication delays', 'Auto parts unavailable', 'Construction material delays'],
  },

  'supply_02_pharmacy_shortage': {
    whatItMeans: {
      amber: 'Critical medication shortages increasing — supply chain stress reaching pharmacies',
      red: 'Widespread medication shortages — families need to act on prescriptions immediately',
    },
    familyImpact: {
      amber: 'Some medications may require substitutions. Refill timing becomes important.',
      red: 'Get all prescriptions filled to maximum allowed (90-day if possible). Some medications may be unavailable.',
    },
    whatToDo: {
      amber: 'Call pharmacy about 90-day refills for all family medications. Check OTC stock (Tylenol, Benadryl, etc.).',
      red: 'Fill every prescription NOW. Stock 30-day OTC medicine supply. Contact doctor about alternatives for anything in shortage.',
    },
    dataPointLabel: 'Critical medication shortages',
    source: 'FDA Drug Shortage Database',
    peripheralImpacts: ['Pediatric medication gaps', 'Elderly care complications', 'Mental health med shortages (SSRIs)', 'Veterinary medication affected too'],
  },

  // ============================================================================
  // OIL AXIS
  // ============================================================================

  'oil_01_hormuz_risk': {
    whatItMeans: {
      amber: 'Shipping insurance through Strait of Hormuz rising — military escorts being discussed',
      red: 'Hormuz functionally restricted — 20% of global oil transits through this strait',
    },
    familyImpact: {
      amber: 'Gas prices rising 15-25% within days. Heating oil cost increases if this persists.',
      red: 'Gas price spike of 40-60%. Heating oil becomes expensive. Fill tanks now.',
    },
    whatToDo: {
      amber: 'Fill vehicle tanks. Consider topping off heating oil.',
      red: 'Call for heating oil delivery immediately. Fill all vehicle tanks. This affects commute and heating costs significantly.',
    },
    dataPointLabel: 'War-risk insurance premium (%)',
    source: 'Lloyd\'s of London / shipping industry data',
    peripheralImpacts: ['Heating oil costs spike', 'Commute costs spike', 'Delivery service surcharges', 'Food transport costs → grocery prices'],
  },

  // ============================================================================
  // ENERGY
  // ============================================================================

  'energy_01_grid_warning': {
    whatItMeans: {
      amber: 'Grid operator issuing capacity warnings — demand approaching available supply',
      red: 'Rolling blackouts possible — grid under severe stress',
    },
    familyImpact: {
      amber: 'Power outages possible during peak hours. Charge devices before afternoon.',
      red: 'Extended outages likely. Medical equipment on battery backup. Refrigerated medications at risk.',
    },
    whatToDo: {
      amber: 'Charge all devices. Check flashlight batteries. Have candles/lanterns ready.',
      red: 'Full blackout prep. Coolers with ice for refrigerated items. Generator if available. Check on elderly neighbors.',
    },
    dataPointLabel: 'Grid capacity margin (%)',
    source: 'NERC / Regional grid operator',
    peripheralImpacts: ['Medical equipment risk', 'Food spoilage', 'Work-from-home disruption', 'School closures possible'],
  },

  // ============================================================================
  // INFORMATION WARFARE
  // ============================================================================

  'info_02_deepfake_shocks': {
    whatItMeans: {
      amber: 'Deepfake content causing market movements — information verification becoming harder',
      red: 'Major deepfake events causing panic or market crashes — trust in information breaking down',
    },
    familyImpact: {
      amber: 'Be skeptical of viral content. Verify before acting on alarming news.',
      red: 'Market volatility from false information. Verify everything through multiple sources before major decisions.',
    },
    whatToDo: {
      amber: 'Establish trusted news sources. Verify alarming claims before sharing or acting.',
      red: 'Pause before reacting to breaking news. Wait 30 minutes for verification. Don\'t make financial moves based on unverified reports.',
    },
    dataPointLabel: 'Deepfake market impact events',
    source: 'Custom monitoring / news analysis',
    peripheralImpacts: ['Market flash crashes', 'Social media panic', 'Political manipulation', 'Scam vulnerability increases'],
  },

  // ============================================================================
  // RIGHTS & GOVERNANCE
  // ============================================================================

  'rights_01_legiscan': {
    whatItMeans: {
      amber: 'AI surveillance bills accelerating through state legislatures',
      red: 'Surveillance legislation passing in multiple states simultaneously — rapid erosion of privacy protections',
    },
    familyImpact: {
      amber: 'Digital privacy increasingly compromised. Review your digital security practices.',
      red: 'Assume digital communications are monitored. Prioritize encrypted channels.',
    },
    whatToDo: {
      amber: 'Audit your digital footprint. Verify encrypted backups. Review password manager setup.',
      red: 'Activate full digital resilience plan. Encrypted comms priority. Local-only security cameras.',
    },
    dataPointLabel: 'AI surveillance bills/month',
    source: 'LegiScan / EFF Tracker',
    peripheralImpacts: ['Digital privacy erosion', 'Community organizing affected', 'Journalism implications'],
  },
};

/**
 * Get context for an indicator ID
 * Falls back to a generic entry if not found
 */
export function getIndicatorContext(indicatorId: string): IndicatorContextEntry | null {
  return INDICATOR_CONTEXT[indicatorId] || null;
}

/**
 * Get all indicator IDs that have context
 */
export function getContextualIndicatorIds(): string[] {
  return Object.keys(INDICATOR_CONTEXT);
}
