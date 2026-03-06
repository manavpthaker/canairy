import { IndicatorData, HOPIScore, SystemStatus } from '../types';

const now = new Date().toISOString();

export const mockIndicators: IndicatorData[] = [
  // ═══════════════════════════════════════════
  // ECONOMY (4 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'econ_01_treasury_tail',
    name: '10Y Auction Tail',
    domain: 'economy',
    description: '10-year Treasury auction tail in basis points — measures bond market stress',
    unit: 'bps',
    thresholds: { green: { max: 3 }, amber: { min: 3, max: 7 }, red: { min: 7 }, threshold_amber: 3, threshold_red: 7 },
    critical: false,
    enabled: true,
    dataSource: 'US Treasury API',
    sourceUrl: 'https://www.treasurydirect.gov/auctions/auction-query/',
    updateFrequency: 'Per auction',
    status: { level: 'green', value: 2.1, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'econ_02_grocery_cpi',
    name: 'Grocery CPI',
    domain: 'economy',
    description: 'Grocery CPI 3-month annualized — tracks food price inflation hitting families',
    unit: '%',
    thresholds: { green: { max: 4 }, amber: { min: 4, max: 8 }, red: { min: 8 }, threshold_amber: 4, threshold_red: 8 },
    enabled: true,
    dataSource: 'FRED API',
    sourceUrl: 'https://fred.stlouisfed.org/series/CPIUFDSL',
    updateFrequency: 'Monthly',
    status: { level: 'amber', value: 5.4, trend: 'up', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'market_01_intraday_swing',
    name: '10Y Intraday Swing',
    domain: 'economy',
    description: '10-year Treasury intraday swing in basis points — extreme moves signal systemic stress',
    unit: 'bps',
    thresholds: { green: { max: 20 }, amber: { min: 20, max: 30 }, red: { min: 30 }, threshold_amber: 20, threshold_red: 30 },
    critical: true,
    enabled: true,
    dataSource: 'Yahoo Finance',
    sourceUrl: 'https://finance.yahoo.com/quote/%5ETNX/',
    updateFrequency: 'Real-time',
    status: { level: 'amber', value: 24.3, trend: 'up', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'green_g1_gdp_rates',
    name: 'GDP Green Flag',
    domain: 'economy',
    description: 'US real GDP ≥4% y/y for 2 quarters AND 10Y yield <4% — positive signal to relax preparedness',
    unit: 'condition',
    thresholds: { green: { max: 1 }, amber: { min: 0, max: 1 }, red: { min: 0 }, threshold_amber: 1, threshold_red: 0 },
    greenFlag: true,
    enabled: true,
    dataSource: 'BEA / FRED',
    sourceUrl: 'https://www.bea.gov/data/gdp/gross-domestic-product',
    updateFrequency: 'Quarterly',
    status: { level: 'amber', value: 0, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'luxury_01_collapse',
    name: 'Luxury Sector Index',
    domain: 'economy',
    description: 'S&P Luxury Index 30-day drawdown — high-end spending collapse signals recession',
    unit: '%',
    thresholds: { green: { max: 5 }, amber: { min: 5, max: 15 }, red: { min: 15 }, threshold_amber: 5, threshold_red: 15 },
    critical: true,
    enabled: true,
    dataSource: 'Bloomberg / S&P',
    sourceUrl: 'https://www.spglobal.com/spdji/en/indices/',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 3.2, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },

  // ═══════════════════════════════════════════
  // JOBS & LABOR (3 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'job_01_jobless_claims',
    name: 'Initial Jobless Claims',
    domain: 'jobs_labor',
    description: 'Weekly initial unemployment claims — earliest recession signal',
    unit: 'K claims',
    thresholds: { green: { max: 250 }, amber: { min: 250, max: 350 }, red: { min: 350 }, threshold_amber: 250, threshold_red: 350 },
    enabled: true,
    dataSource: 'DOL',
    sourceUrl: 'https://www.dol.gov/ui/data.pdf',
    updateFrequency: 'Weekly',
    status: { level: 'green', value: 218, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'supply_pharmacy_shortage',
    name: 'Drug Shortages',
    domain: 'jobs_labor',
    description: 'Critical medications in FDA shortage database — supply chain health indicator',
    unit: 'drugs',
    thresholds: { green: { max: 100 }, amber: { min: 100, max: 200 }, red: { min: 200 }, threshold_amber: 100, threshold_red: 200 },
    enabled: true,
    dataSource: 'FDA',
    sourceUrl: 'https://www.accessdata.fda.gov/scripts/drugshortages',
    updateFrequency: 'Daily',
    status: { level: 'amber', value: 142, trend: 'up', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'job_01_strike_days',
    name: 'US Strike Days',
    domain: 'jobs_labor',
    description: 'US strike worker-days per month — labor unrest signals economic friction',
    unit: 'worker-days',
    thresholds: { green: { max: 100000 }, amber: { min: 100000, max: 500000 }, red: { min: 500000 }, threshold_amber: 100000, threshold_red: 500000 },
    enabled: true,
    dataSource: 'Cornell ILR',
    sourceUrl: 'https://striketracker.ilr.cornell.edu/',
    updateFrequency: 'Monthly',
    status: { level: 'green', value: 78000, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },

  // ═══════════════════════════════════════════
  // RIGHTS & GOVERNANCE (2 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'power_01_ai_surveillance',
    name: 'AI Surveillance Bills',
    domain: 'rights_governance',
    description: 'AI-surveillance bills advancing per month — tracks erosion of civil liberties',
    unit: 'bills',
    thresholds: { green: { max: 3 }, amber: { min: 3, max: 10 }, red: { min: 10 }, threshold_amber: 3, threshold_red: 10 },
    enabled: true,
    dataSource: 'LegiScan API',
    sourceUrl: 'https://legiscan.com/gaits/search?state=ALL&keyword=surveillance',
    updateFrequency: 'Weekly',
    status: { level: 'amber', value: 6, trend: 'up', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'civil_01_acled_protests',
    name: 'US Protests (7d avg)',
    domain: 'rights_governance',
    description: 'ACLED US protests 7-day average — social unrest thermometer',
    unit: 'protests/day',
    thresholds: { green: { max: 25 }, amber: { min: 25, max: 75 }, red: { min: 75 }, threshold_amber: 25, threshold_red: 75 },
    enabled: true,
    dataSource: 'ACLED API',
    sourceUrl: 'https://acleddata.com/data-export-tool/',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 18, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'power_02_dod_autonomy',
    name: 'DoD Autonomous Systems',
    domain: 'rights_governance',
    description: 'DoD autonomous weapons programs with auto-execute authority — AI warfare governance risk',
    unit: 'programs',
    thresholds: { green: { max: 0 }, amber: { min: 0, max: 2 }, red: { min: 3 }, threshold_amber: 1, threshold_red: 3 },
    enabled: true,
    dataSource: 'DoD / CBO Reports',
    sourceUrl: 'https://www.cbo.gov/topics/defense-and-national-security',
    updateFrequency: 'Quarterly',
    status: { level: 'green', value: 0, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'liberty_01_litigation',
    name: 'Major Liberty Cases',
    domain: 'rights_governance',
    description: 'ACLU/EFF major civil liberty cases filed (90-day count) — legal battleground indicator',
    unit: 'cases',
    thresholds: { green: { max: 5 }, amber: { min: 5, max: 15 }, red: { min: 15 }, threshold_amber: 5, threshold_red: 15 },
    enabled: true,
    dataSource: 'ACLU / Court Records',
    sourceUrl: 'https://www.aclu.org/court-cases',
    updateFrequency: 'Weekly',
    status: { level: 'amber', value: 8, trend: 'up', lastUpdate: now, dataSource: 'LIVE' }
  },

  // ═══════════════════════════════════════════
  // SECURITY & INFRASTRUCTURE (3 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'cyber_01_cisa_kev',
    name: 'CISA KEV + ICS',
    domain: 'security_infrastructure',
    description: 'CISA Known Exploited Vulnerabilities + ICS advisories (90-day count) — cyber threat level',
    unit: 'vulns',
    thresholds: { green: { max: 2 }, amber: { min: 2, max: 5 }, red: { min: 5 }, threshold_amber: 2, threshold_red: 5 },
    enabled: true,
    dataSource: 'CISA JSON Feed',
    sourceUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    updateFrequency: 'Daily',
    status: { level: 'amber', value: 4, trend: 'up', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'grid_01_pjm_outages',
    name: 'PJM Grid Outages',
    domain: 'security_infrastructure',
    description: 'PJM outages affecting ≥50k customers per quarter — grid fragility indicator',
    unit: 'outages',
    thresholds: { green: { max: 1 }, amber: { min: 1, max: 2 }, red: { min: 2 }, threshold_amber: 1, threshold_red: 2 },
    enabled: true,
    dataSource: 'DOE OE-417',
    sourceUrl: 'https://www.oe.energy.gov/oe417.htm',
    updateFrequency: 'Quarterly',
    status: { level: 'green', value: 1, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'bio_01_h2h_countries',
    name: 'Novel H2H Pathogen',
    domain: 'security_infrastructure',
    description: 'Countries with novel human-to-human transmission events (14-day count)',
    unit: 'countries',
    thresholds: { green: { max: 0 }, amber: { min: 0, max: 2 }, red: { min: 3 }, threshold_amber: 1, threshold_red: 3 },
    enabled: true,
    dataSource: 'WHO DON RSS',
    sourceUrl: 'https://www.who.int/emergencies/disease-outbreak-news',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 0, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },

  // ═══════════════════════════════════════════
  // OIL AXIS (4 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'oil_01_russian_brics',
    name: 'Russian Crude to BRICS',
    domain: 'oil_axis',
    description: 'Share of Russian crude going to BRICS nations (30-day %) — de-dollarization signal',
    unit: '%',
    thresholds: { green: { max: 60 }, amber: { min: 60, max: 75 }, red: { min: 75 }, threshold_amber: 60, threshold_red: 75 },
    enabled: true,
    dataSource: 'CREA',
    sourceUrl: 'https://energyandcleanair.org/russia-fossil-tracker/',
    updateFrequency: 'Monthly',
    status: { level: 'amber', value: 68, trend: 'up', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'oil_02_mbridge_settlements',
    name: 'mBridge Settlement',
    domain: 'oil_axis',
    description: 'mBridge energy settlement volume (USD millions/day) — CBDC oil trade bypass',
    unit: 'M USD/day',
    thresholds: { green: { max: 50 }, amber: { min: 50, max: 300 }, red: { min: 300 }, threshold_amber: 50, threshold_red: 300 },
    enabled: false,
    dataSource: 'BIS Reports',
    sourceUrl: 'https://www.bis.org/about/bisih/topics/cbdc/mbridge.htm',
    updateFrequency: 'Quarterly',
    status: { level: 'green', value: 32, trend: 'up', lastUpdate: now, dataSource: 'MOCK' }
  },
  {
    id: 'oil_04_refinery_ratio',
    name: 'Refinery Run Ratio',
    domain: 'oil_axis',
    description: 'Refinery run-rate ratio (India+China)/OECD — measures oil processing shift to East',
    unit: 'ratio',
    thresholds: { green: { max: 1.2 }, amber: { min: 1.2, max: 1.4 }, red: { min: 1.4 }, threshold_amber: 1.2, threshold_red: 1.4 },
    enabled: true,
    dataSource: 'JODI API',
    sourceUrl: 'https://www.jodidata.org/oil/',
    updateFrequency: 'Monthly',
    status: { level: 'green', value: 1.15, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'oil_03_jodi_inventory',
    name: 'Global Oil Inventory',
    domain: 'oil_axis',
    description: 'JODI global crude oil inventory days of cover — supply buffer indicator',
    unit: 'days',
    thresholds: { green: { min: 60 }, amber: { min: 45, max: 60 }, red: { max: 45 }, threshold_amber: 60, threshold_red: 45 },
    enabled: true,
    dataSource: 'JODI / IEA',
    sourceUrl: 'https://www.jodidata.org/oil/',
    updateFrequency: 'Monthly',
    status: { level: 'green', value: 65, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'spr_01_level',
    name: 'Strategic Petroleum Reserve',
    domain: 'oil_axis',
    description: 'US SPR crude oil stockpile in million barrels — national energy security buffer',
    unit: 'million bbl',
    thresholds: { green: { min: 450 }, amber: { min: 350, max: 450 }, red: { max: 350 }, threshold_amber: 450, threshold_red: 350 },
    critical: true,
    enabled: true,
    dataSource: 'EIA',
    sourceUrl: 'https://www.eia.gov/petroleum/supply/weekly/',
    updateFrequency: 'Weekly',
    status: { level: 'amber', value: 370, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'ofac_01_designations',
    name: 'OFAC Sanctions (Oil)',
    domain: 'oil_axis',
    description: 'OFAC sanctions designations targeting oil trade entities (30-day count)',
    unit: 'designations',
    thresholds: { green: { max: 2 }, amber: { min: 2, max: 8 }, red: { min: 8 }, threshold_amber: 2, threshold_red: 8 },
    enabled: true,
    dataSource: 'OFAC / Treasury',
    sourceUrl: 'https://ofac.treasury.gov/recent-actions',
    updateFrequency: 'Weekly',
    status: { level: 'green', value: 1, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },

  // ═══════════════════════════════════════════
  // AI WINDOW (4 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'labor_ai_01_layoffs',
    name: 'AI-Linked Layoffs',
    domain: 'ai_window',
    description: 'Monthly workers laid off citing AI/automation — labor displacement signal',
    unit: 'workers',
    thresholds: { green: { max: 5000 }, amber: { min: 5000, max: 25000 }, red: { min: 25000 }, threshold_amber: 5000, threshold_red: 25000 },
    enabled: false,
    dataSource: 'Layoffs.fyi',
    sourceUrl: 'https://layoffs.fyi/',
    updateFrequency: 'Monthly',
    status: { level: 'green', value: 3200, trend: 'stable', lastUpdate: now, dataSource: 'MOCK' }
  },
  {
    id: 'cyber_02_ai_ransomware',
    name: 'AI Ransomware',
    domain: 'ai_window',
    description: 'AI-assisted ransomware incidents (90-day count) — emerging cyber threat vector',
    unit: 'incidents',
    thresholds: { green: { max: 3 }, amber: { min: 3, max: 6 }, red: { min: 6 }, threshold_amber: 3, threshold_red: 6 },
    enabled: true,
    dataSource: 'CISA ICS',
    sourceUrl: 'https://www.cisa.gov/stopransomware/ransomware-alerts',
    updateFrequency: 'Weekly',
    status: { level: 'amber', value: 4, trend: 'up', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'info_02_deepfake_shocks',
    name: 'Deepfake Market Shocks',
    domain: 'ai_window',
    description: 'Deepfake-triggered market events per quarter — information warfare indicator',
    unit: 'events',
    thresholds: { green: { max: 0 }, amber: { min: 0, max: 1 }, red: { min: 2 }, threshold_amber: 1, threshold_red: 2 },
    critical: true,
    enabled: true,
    dataSource: 'Composite',
    sourceUrl: 'https://www.sec.gov/news/market-alerts',
    updateFrequency: 'Continuous',
    status: { level: 'green', value: 0, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'compute_01_training_cost',
    name: 'Training Cost Trend',
    domain: 'ai_window',
    description: '$/training-FLOP 6-month change (%) — green flag when costs drop fast',
    unit: '%',
    thresholds: { green: { max: -30 }, amber: { min: -30, max: 0 }, red: { min: 0 }, threshold_amber: -30, threshold_red: 0 },
    greenFlag: true,
    enabled: true,
    dataSource: 'Epoch AI',
    sourceUrl: 'https://epochai.org/trends',
    updateFrequency: 'Monthly',
    status: { level: 'green', value: -42, trend: 'down', lastUpdate: now, dataSource: 'LIVE' }
  },

  // ═══════════════════════════════════════════
  // GLOBAL CONFLICT (6 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'global_conflict_intensity',
    name: 'Global Battle Intensity',
    domain: 'global_conflict',
    description: 'ACLED global battle-related events 90-day average — worldwide conflict temperature',
    unit: 'events/day',
    thresholds: { green: { max: 500 }, amber: { min: 500, max: 1000 }, red: { min: 2000 }, threshold_amber: 500, threshold_red: 2000 },
    enabled: false,
    dataSource: 'ACLED API',
    sourceUrl: 'https://acleddata.com/dashboard/',
    updateFrequency: 'Daily',
    status: { level: 'amber', value: 720, trend: 'up', lastUpdate: now, dataSource: 'MOCK' }
  },
  {
    id: 'taiwan_pla_activity',
    name: 'Taiwan PLA Incursions',
    domain: 'global_conflict',
    description: 'PLA aircraft incursions into Taiwan ADIZ (14-day average) — strait escalation gauge',
    unit: 'aircraft/day',
    thresholds: { green: { max: 20 }, amber: { min: 20, max: 50 }, red: { min: 100 }, threshold_amber: 20, threshold_red: 100 },
    enabled: true,
    dataSource: 'Taiwan MND',
    sourceUrl: 'https://www.mnd.gov.tw/english/',
    updateFrequency: 'Daily',
    status: { level: 'amber', value: 28, trend: 'up', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'nato_high_readiness',
    name: 'NATO High Readiness',
    domain: 'global_conflict',
    description: 'NATO high-readiness force activations — Article 5 proximity indicator',
    unit: 'activations',
    thresholds: { green: { max: 0 }, amber: { min: 0, max: 1 }, red: { min: 2 }, threshold_amber: 1, threshold_red: 2 },
    critical: true,
    enabled: true,
    dataSource: 'NATO / News',
    sourceUrl: 'https://www.nato.int/cps/en/natohq/news.htm',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 0, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'nuclear_01_tests',
    name: 'Nuclear/Missile Tests',
    domain: 'global_conflict',
    description: 'Nuclear detonation or ICBM tests (90-day count) — existential threat signal',
    unit: 'tests',
    thresholds: { green: { max: 2 }, amber: { min: 2, max: 5 }, red: { min: 10 }, threshold_amber: 2, threshold_red: 10 },
    enabled: true,
    dataSource: 'CNS',
    sourceUrl: 'https://www.ctbto.org/specials/testing-times/',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 1, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'hormuz_war_risk',
    name: 'Hormuz War Risk Premium',
    domain: 'global_conflict',
    description: 'Shipping war risk insurance premium for Strait of Hormuz transit — oil chokepoint risk',
    unit: '%',
    thresholds: { green: { max: 0.5 }, amber: { min: 0.5, max: 2 }, red: { min: 2 }, threshold_amber: 0.5, threshold_red: 2 },
    enabled: true,
    dataSource: "Lloyd's",
    sourceUrl: 'https://www.lloyds.com/market-resources/marine',
    updateFrequency: 'Weekly',
    status: { level: 'green', value: 0.3, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'taiwan_exclusion_zone',
    name: 'Taiwan Exclusion Zone',
    domain: 'global_conflict',
    description: 'Active Chinese military exclusion zones near Taiwan — blockade precursor signal',
    unit: 'zones',
    thresholds: { green: { max: 0 }, amber: { min: 0, max: 1 }, red: { min: 2 }, threshold_amber: 1, threshold_red: 2 },
    critical: true,
    enabled: true,
    dataSource: 'Taiwan MND',
    sourceUrl: 'https://www.mnd.gov.tw/english/',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 0, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'russia_nato_escalation',
    name: 'Russia-NATO Index',
    domain: 'global_conflict',
    description: 'Russia-NATO escalation composite index — European theater risk',
    unit: 'index',
    thresholds: { green: { max: 30 }, amber: { min: 30, max: 60 }, red: { min: 80 }, threshold_amber: 30, threshold_red: 80 },
    enabled: false,
    dataSource: 'Composite',
    sourceUrl: 'https://www.iiss.org/research-paper/',
    updateFrequency: 'Daily',
    status: { level: 'amber', value: 45, trend: 'up', lastUpdate: now, dataSource: 'MOCK' }
  },
  {
    id: 'defense_spending_growth',
    name: 'Defense Spending Growth',
    domain: 'global_conflict',
    description: 'Global defense spending year-over-year growth — arms race indicator',
    unit: '%',
    thresholds: { green: { max: 5 }, amber: { min: 5, max: 8 }, red: { min: 15 }, threshold_amber: 5, threshold_red: 15 },
    enabled: false,
    dataSource: 'SIPRI',
    sourceUrl: 'https://www.sipri.org/databases/milex',
    updateFrequency: 'Annual',
    status: { level: 'amber', value: 6.2, trend: 'up', lastUpdate: now, dataSource: 'MOCK' }
  },

  // ═══════════════════════════════════════════
  // DOMESTIC CONTROL (6 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'dc_control_countdown',
    name: 'DC Autonomy Countdown',
    domain: 'domestic_control',
    description: 'Days until DC autonomy revocation — federal control signal',
    unit: 'days',
    thresholds: { green: { min: 730 }, amber: { min: 365, max: 730 }, red: { max: 180 }, threshold_amber: 730, threshold_red: 365 },
    enabled: false,
    dataSource: 'Congress.gov',
    sourceUrl: 'https://www.congress.gov/search?q=%7B%22congress%22%3A%22all%22%2C%22source%22%3A%22all%22%2C%22search%22%3A%22district+of+columbia%22%7D',
    updateFrequency: 'Weekly',
    status: { level: 'green', value: 900, trend: 'stable', lastUpdate: now, dataSource: 'MOCK' }
  },
  {
    id: 'national_guard_metros',
    name: 'Guard Metro Deployments',
    domain: 'domestic_control',
    description: 'Major metros with National Guard deployment — domestic militarization signal',
    unit: 'metros',
    thresholds: { green: { max: 0 }, amber: { min: 0, max: 1 }, red: { min: 2 }, threshold_amber: 1, threshold_red: 2 },
    critical: true,
    enabled: true,
    dataSource: 'News Aggregator',
    sourceUrl: 'https://www.nationalguard.mil/News/',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 0, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'ice_detention_surge',
    name: 'ICE Detention Population',
    domain: 'domestic_control',
    description: 'ICE detention population — immigration enforcement intensity',
    unit: 'detainees',
    thresholds: { green: { max: 50000 }, amber: { min: 50000, max: 80000 }, red: { min: 150000 }, threshold_amber: 50000, threshold_red: 150000 },
    enabled: true,
    unavailable: true, // ICE page scraping needs update - can be fixed
    dataSource: 'ICE Statistics',
    sourceUrl: 'https://www.ice.gov/detain/detention-management',
    updateFrequency: 'Weekly',
    status: { level: 'unknown', value: null, trend: 'unknown', lastUpdate: now, dataSource: 'UNAVAILABLE' }
  },
  {
    id: 'dhs_removal_expansion',
    name: 'DHS Expedited Removal',
    domain: 'domestic_control',
    description: 'DHS expedited removal expansion status — civil liberties erosion indicator',
    unit: 'status',
    thresholds: { green: { max: 0 }, amber: { min: 0, max: 0 }, red: { min: 1 }, threshold_amber: 0, threshold_red: 1 },
    critical: true,
    enabled: true,
    dataSource: 'Federal Register',
    sourceUrl: 'https://www.federalregister.gov/agencies/homeland-security-department',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 0, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'hill_control_legislation',
    name: 'Control Bills Advancing',
    domain: 'domestic_control',
    description: 'Control-oriented bills advancing in Congress (30-day count)',
    unit: 'bills',
    thresholds: { green: { max: 3 }, amber: { min: 3, max: 5 }, red: { min: 10 }, threshold_amber: 3, threshold_red: 10 },
    enabled: true,
    dataSource: 'LegiScan API',
    sourceUrl: 'https://legiscan.com/US',
    updateFrequency: 'Weekly',
    status: { level: 'amber', value: 4, trend: 'up', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'liberty_litigation_count',
    name: 'Liberty Cases Active',
    domain: 'domestic_control',
    description: 'Major civil liberty cases currently active — legal battleground indicator',
    unit: 'cases',
    thresholds: { green: { max: 5 }, amber: { min: 5, max: 10 }, red: { min: 20 }, threshold_amber: 5, threshold_red: 20 },
    enabled: true,
    dataSource: 'ACLU / EFF',
    sourceUrl: 'https://www.aclu.org/court-cases',
    updateFrequency: 'Weekly',
    status: { level: 'amber', value: 8, trend: 'up', lastUpdate: now, dataSource: 'LIVE' }
  },

  // ═══════════════════════════════════════════
  // SUPPLY CHAIN (3 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'supply_01_port_congestion',
    name: 'Port Congestion',
    domain: 'supply_chain',
    description: 'Vessels waiting at LA/Long Beach ports — supply chain bottleneck indicator',
    unit: 'vessels',
    thresholds: { green: { max: 15 }, amber: { min: 15, max: 40 }, red: { min: 40 }, threshold_amber: 15, threshold_red: 40 },
    enabled: true,
    dataSource: 'Port of LA / Marine Traffic',
    sourceUrl: 'https://www.portoflosangeles.org/',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 12, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'supply_02_freight_index',
    name: 'Container Freight Rate',
    domain: 'supply_chain',
    description: 'Freightos Baltic Index container rate (USD/FEU) — shipping cost indicator',
    unit: 'USD/FEU',
    thresholds: { green: { max: 3000 }, amber: { min: 3000, max: 6000 }, red: { min: 6000 }, threshold_amber: 3000, threshold_red: 6000 },
    enabled: true,
    dataSource: 'Freightos Baltic Index',
    sourceUrl: 'https://fbx.freightos.com/',
    updateFrequency: 'Weekly',
    status: { level: 'green', value: 2500, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'supply_03_chip_lead_time',
    name: 'Semiconductor Lead Time',
    domain: 'supply_chain',
    description: 'Average chip delivery lead time in weeks — tech supply chain stress',
    unit: 'weeks',
    thresholds: { green: { max: 14 }, amber: { min: 14, max: 26 }, red: { min: 26 }, threshold_amber: 14, threshold_red: 26 },
    enabled: true,
    dataSource: 'Industry Reports',
    sourceUrl: 'https://www.semiconductors.org/',
    updateFrequency: 'Monthly',
    status: { level: 'amber', value: 18, trend: 'down', lastUpdate: now, dataSource: 'LIVE' }
  },

  // ═══════════════════════════════════════════
  // ENERGY (2 indicators - SPR consolidated to oil_axis)
  // ═══════════════════════════════════════════
  {
    id: 'energy_02_nat_gas_storage',
    name: 'Natural Gas Storage',
    domain: 'energy',
    description: 'Natural gas working storage in billion cubic feet — heating/power buffer',
    unit: 'Bcf',
    thresholds: { green: { min: 2500 }, amber: { min: 1800, max: 2500 }, red: { max: 1800 }, threshold_amber: 2500, threshold_red: 1800 },
    enabled: true,
    dataSource: 'EIA Natural Gas Storage',
    sourceUrl: 'https://www.eia.gov/naturalgas/storage/',
    updateFrequency: 'Weekly',
    status: { level: 'green', value: 2650, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'energy_03_grid_emergency',
    name: 'Grid Emergency Declarations',
    domain: 'energy',
    description: 'Active grid emergency declarations (DOE OE-417) — power reliability indicator',
    unit: 'declarations',
    thresholds: { green: { max: 1 }, amber: { min: 1, max: 3 }, red: { min: 3 }, threshold_amber: 1, threshold_red: 3 },
    critical: true,
    enabled: true,
    dataSource: 'DOE OE-417 Reports',
    sourceUrl: 'https://www.oe.energy.gov/oe417.htm',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 0, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },

  // ═══════════════════════════════════════════
  // BANKING (3 indicators — added to economy)
  // ═══════════════════════════════════════════
  {
    id: 'bank_01_failures',
    name: 'Bank Failures (90d)',
    domain: 'economy',
    description: 'FDIC bank failures in last 90 days — financial system stress',
    unit: 'banks',
    thresholds: { green: { max: 1 }, amber: { min: 1, max: 3 }, red: { min: 3 }, threshold_amber: 1, threshold_red: 3 },
    critical: true,
    enabled: true,
    dataSource: 'FDIC Failed Bank List',
    sourceUrl: 'https://www.fdic.gov/resources/resolutions/bank-failures/failed-bank-list/',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 0, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'bank_02_discount_window',
    name: 'Fed Discount Window',
    domain: 'economy',
    description: 'Federal Reserve discount window borrowing ($ billions) — bank liquidity stress',
    unit: 'billion USD',
    thresholds: { green: { max: 5 }, amber: { min: 5, max: 50 }, red: { min: 50 }, threshold_amber: 5, threshold_red: 50 },
    enabled: true,
    dataSource: 'Federal Reserve H.4.1',
    sourceUrl: 'https://www.federalreserve.gov/releases/h41/',
    updateFrequency: 'Weekly',
    status: { level: 'green', value: 2.1, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'bank_03_deposit_flow',
    name: 'Weekly Deposit Change',
    domain: 'economy',
    description: 'Week-over-week change in commercial bank deposits ($ billions) — bank run indicator',
    unit: 'billion USD',
    thresholds: { green: { min: -20 }, amber: { min: -50, max: -20 }, red: { max: -50 }, threshold_amber: -20, threshold_red: -50 },
    critical: true,
    enabled: true,
    dataSource: 'Federal Reserve H.8',
    sourceUrl: 'https://www.federalreserve.gov/releases/h8/',
    updateFrequency: 'Weekly',
    status: { level: 'green', value: 5.2, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },

  // ═══════════════════════════════════════════
  // FLIGHTS / AIRSPACE (3 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'flight_01_ground_stops',
    name: 'FAA Ground Stops',
    domain: 'security_infrastructure',
    description: 'Active FAA ground stop programs — major airspace disruption signal',
    unit: 'ground stops',
    thresholds: { green: { max: 2 }, amber: { min: 2, max: 5 }, red: { min: 5 }, threshold_amber: 2, threshold_red: 5 },
    critical: true,
    enabled: true,
    dataSource: 'FAA NAS Status',
    sourceUrl: 'https://nasstatus.faa.gov/',
    updateFrequency: 'Real-time',
    status: { level: 'green', value: 1, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'flight_02_delay_pct',
    name: 'System-Wide Delays',
    domain: 'security_infrastructure',
    description: 'Percentage of major airports with active delays — air travel disruption',
    unit: '%',
    thresholds: { green: { max: 10 }, amber: { min: 10, max: 25 }, red: { min: 25 }, threshold_amber: 10, threshold_red: 25 },
    enabled: true,
    dataSource: 'FAA NAS Status',
    sourceUrl: 'https://nasstatus.faa.gov/',
    updateFrequency: 'Real-time',
    status: { level: 'green', value: 8, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'flight_03_tfr_count',
    name: 'Active TFRs',
    domain: 'security_infrastructure',
    description: 'Temporary Flight Restrictions active — airspace security/VIP indicator',
    unit: 'TFRs',
    thresholds: { green: { max: 20 }, amber: { min: 20, max: 40 }, red: { min: 40 }, threshold_amber: 20, threshold_red: 40 },
    enabled: true,
    dataSource: 'FAA TFR System',
    sourceUrl: 'https://tfr.faa.gov/',
    updateFrequency: 'Real-time',
    status: { level: 'green', value: 15, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },

  // ═══════════════════════════════════════════
  // TRAVEL (3 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'travel_01_advisories',
    name: 'Level 4 Travel Advisories',
    domain: 'domestic_control',
    description: 'Countries with "Do Not Travel" advisory — global instability indicator',
    unit: 'countries',
    thresholds: { green: { max: 15 }, amber: { min: 15, max: 25 }, red: { min: 25 }, threshold_amber: 15, threshold_red: 25 },
    enabled: true,
    dataSource: 'State Department',
    sourceUrl: 'https://travel.state.gov/content/travel/en/traveladvisories.html',
    updateFrequency: 'Daily',
    status: { level: 'amber', value: 19, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'travel_02_border_wait',
    name: 'Border Wait Times',
    domain: 'domestic_control',
    description: 'Average US border crossing wait time in minutes — mobility friction indicator',
    unit: 'minutes',
    thresholds: { green: { max: 30 }, amber: { min: 30, max: 60 }, red: { min: 60 }, threshold_amber: 30, threshold_red: 60 },
    enabled: true,
    dataSource: 'CBP Border Wait Times',
    sourceUrl: 'https://bwt.cbp.gov/',
    updateFrequency: 'Real-time',
    status: { level: 'green', value: 22, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'travel_03_tsa_throughput',
    name: 'TSA Throughput',
    domain: 'domestic_control',
    description: 'TSA checkpoint volume as % of 2019 baseline — air travel demand signal',
    unit: '% of 2019',
    thresholds: { green: { min: 85 }, amber: { min: 60, max: 85 }, red: { max: 60 }, threshold_amber: 85, threshold_red: 60 },
    enabled: true,
    dataSource: 'TSA Passenger Volumes',
    sourceUrl: 'https://www.tsa.gov/travel/passenger-volumes',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 97, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },

  // ═══════════════════════════════════════════
  // SOCIAL COHESION (5 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'education_01_closures',
    name: 'School Closures',
    domain: 'social_cohesion',
    description: 'K-12 schools with unplanned closures (7-day count) — community stability indicator',
    unit: 'schools',
    thresholds: { green: { max: 50 }, amber: { min: 50, max: 200 }, red: { min: 200 }, threshold_amber: 50, threshold_red: 200 },
    enabled: true,
    dataSource: 'NCES / State Education Depts',
    sourceUrl: 'https://nces.ed.gov/',
    updateFrequency: 'Weekly',
    status: { level: 'green', value: 28, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'cult_trend_01_twitter',
    name: '#AIGod / #Basilisk Tweets',
    domain: 'social_cohesion',
    description: 'X/Twitter 24h volume of #AIGod, #Basilisk, #JoinTheComet — cult formation signal',
    unit: 'tweets',
    thresholds: { green: { max: 10000 }, amber: { min: 10000, max: 50000 }, red: { min: 50000 }, threshold_amber: 10000, threshold_red: 50000 },
    enabled: false,
    dataSource: 'X API',
    sourceUrl: 'https://x.com/search?q=%23AIGod',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 4200, trend: 'stable', lastUpdate: now, dataSource: 'MOCK' }
  },
  {
    id: 'cult_meme_01_tokens',
    name: 'Cult ERC-20 Tokens',
    domain: 'social_cohesion',
    description: 'New ERC-20 tokens with cult+AI in name (7-day count) — blockchain cult signal',
    unit: 'tokens',
    thresholds: { green: { max: 5 }, amber: { min: 5, max: 20 }, red: { min: 20 }, threshold_amber: 5, threshold_red: 20 },
    enabled: false,
    dataSource: 'Etherscan',
    sourceUrl: 'https://etherscan.io/tokens',
    updateFrequency: 'Weekly',
    status: { level: 'green', value: 2, trend: 'stable', lastUpdate: now, dataSource: 'MOCK' }
  },
  {
    id: 'cult_event_01_protests',
    name: 'AI Cult Protests',
    domain: 'social_cohesion',
    description: 'ACLED protests mentioning AI + god/cult/church (30-day count)',
    unit: 'protests',
    thresholds: { green: { max: 1 }, amber: { min: 1, max: 4 }, red: { min: 4 }, threshold_amber: 1, threshold_red: 4 },
    enabled: false,
    dataSource: 'ACLED API',
    sourceUrl: 'https://acleddata.com/data-export-tool/',
    updateFrequency: 'Monthly',
    status: { level: 'green', value: 0, trend: 'stable', lastUpdate: now, dataSource: 'MOCK' }
  },
  {
    id: 'cult_media_01_trends',
    name: 'AI Religion Trends',
    domain: 'social_cohesion',
    description: 'Google Trends score for "AI religion" (US weekly) — cultural shift signal',
    unit: 'score',
    thresholds: { green: { max: 15 }, amber: { min: 15, max: 40 }, red: { min: 40 }, threshold_amber: 15, threshold_red: 40 },
    enabled: false,
    dataSource: 'Google Trends',
    sourceUrl: 'https://trends.google.com/trends/explore?q=AI%20religion&geo=US',
    updateFrequency: 'Weekly',
    status: { level: 'green', value: 8, trend: 'stable', lastUpdate: now, dataSource: 'MOCK' }
  },

  // ═══════════════════════════════════════════
  // WATER INFRASTRUCTURE (3 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'water_01_reservoir_level',
    name: 'Major Reservoir Levels',
    domain: 'water_infrastructure',
    description: 'Average capacity of top 25 US reservoirs — drought and water supply indicator',
    unit: '% capacity',
    thresholds: { green: { min: 70 }, amber: { min: 40, max: 70 }, red: { max: 40 }, threshold_amber: 70, threshold_red: 40 },
    enabled: true,
    unavailable: true, // Data source parsing issue - can be fixed
    dataSource: 'USBR / USACE',
    sourceUrl: 'https://www.usbr.gov/uc/water/',
    updateFrequency: 'Weekly',
    status: { level: 'unknown', value: null, trend: 'unknown', lastUpdate: now, dataSource: 'UNAVAILABLE' }
  },
  {
    id: 'water_02_treatment_alerts',
    name: 'Treatment Plant Alerts',
    domain: 'water_infrastructure',
    description: 'EPA drinking water advisories and boil notices — water safety signal',
    unit: 'active alerts',
    thresholds: { green: { max: 5 }, amber: { min: 5, max: 15 }, red: { min: 15 }, threshold_amber: 5, threshold_red: 15 },
    enabled: true,
    dataSource: 'EPA SDWIS',
    sourceUrl: 'https://www.epa.gov/ground-water-and-drinking-water',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 3, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  // REMOVED: water_03_drought_monitor - USDM API no longer accessible, no alternative source

  // ═══════════════════════════════════════════
  // TELECOMMUNICATIONS (3 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'telecom_01_bgp_anomalies',
    name: 'BGP Route Anomalies',
    domain: 'telecommunications',
    description: 'Major internet routing anomalies detected — potential outages or attacks',
    unit: 'events/day',
    thresholds: { green: { max: 5 }, amber: { min: 5, max: 20 }, red: { min: 20 }, threshold_amber: 5, threshold_red: 20 },
    enabled: true,
    dataSource: 'BGPStream / CAIDA',
    sourceUrl: 'https://bgpstream.caida.org/',
    updateFrequency: 'Real-time',
    status: { level: 'green', value: 2, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'telecom_02_cell_outages',
    name: 'Cell Network Outages',
    domain: 'telecommunications',
    description: 'Major carrier outages affecting >100K users — communication reliability',
    unit: 'active outages',
    thresholds: { green: { max: 1 }, amber: { min: 1, max: 3 }, red: { min: 3 }, threshold_amber: 1, threshold_red: 3 },
    enabled: true,
    unavailable: true, // FCC endpoint timeout - can be fixed
    dataSource: 'Downdetector / FCC',
    sourceUrl: 'https://downdetector.com/',
    updateFrequency: 'Real-time',
    status: { level: 'unknown', value: null, trend: 'unknown', lastUpdate: now, dataSource: 'UNAVAILABLE' }
  },
  {
    id: 'telecom_03_undersea_cable',
    name: 'Undersea Cable Status',
    domain: 'telecommunications',
    description: 'Active undersea cable damage or suspicious activity — international connectivity',
    unit: 'incidents',
    thresholds: { green: { max: 0 }, amber: { min: 1, max: 2 }, red: { min: 2 }, threshold_amber: 1, threshold_red: 2 },
    enabled: true,
    dataSource: 'TeleGeography',
    sourceUrl: 'https://www.submarinecablemap.com/',
    updateFrequency: 'Daily',
    status: { level: 'green', value: 0, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },

  // ═══════════════════════════════════════════
  // HOUSING & MORTGAGE (3 indicators)
  // ═══════════════════════════════════════════
  {
    id: 'housing_01_delinquency',
    name: 'Mortgage Delinquency',
    domain: 'housing_mortgage',
    description: '90+ day delinquency rate on mortgages — foreclosure wave indicator',
    unit: '%',
    thresholds: { green: { max: 2 }, amber: { min: 2, max: 4 }, red: { min: 4 }, threshold_amber: 2, threshold_red: 4 },
    enabled: true,
    dataSource: 'MBA / FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/DRSFRMACBS',
    updateFrequency: 'Quarterly',
    status: { level: 'green', value: 1.2, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'housing_02_foreclosure',
    name: 'Foreclosure Filings',
    domain: 'housing_mortgage',
    description: 'Monthly foreclosure filings vs. 2019 baseline — housing crisis signal',
    unit: '% of baseline',
    thresholds: { green: { max: 100 }, amber: { min: 100, max: 150 }, red: { min: 150 }, threshold_amber: 100, threshold_red: 150 },
    enabled: true,
    dataSource: 'ATTOM / RealtyTrac',
    sourceUrl: 'https://www.attomdata.com/news/market-trends/foreclosures/',
    updateFrequency: 'Monthly',
    status: { level: 'green', value: 85, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },
  {
    id: 'housing_03_rate_shock',
    name: 'ARM Reset Exposure',
    domain: 'housing_mortgage',
    description: 'ARMs resetting in next 12 months as % of total mortgages — payment shock risk',
    unit: '%',
    thresholds: { green: { max: 3 }, amber: { min: 3, max: 8 }, red: { min: 8 }, threshold_amber: 3, threshold_red: 8 },
    enabled: true,
    dataSource: 'MBA',
    sourceUrl: 'https://www.mba.org/news-and-research',
    updateFrequency: 'Quarterly',
    status: { level: 'green', value: 2.1, trend: 'stable', lastUpdate: now, dataSource: 'LIVE' }
  },

  // REMOVED: FOOD PRODUCTION domain (4 indicators)
  // food_01_crop_condition - USDA NASS API requires separate key, no alternative
  // food_02_livestock_disease - USDA APHIS times out, no alternative
  // food_03_fertilizer_price - World Bank scraping failed, no alternative
  // food_04_processing_capacity - USDA AMS API changed, no alternative
];

export const mockHOPIScore: HOPIScore = {
  score: 0.32,
  confidence: 88,
  phase: 3,
  targetPhase: 3,
  domains: {
    economy: {
      score: 0.28,
      weight: 1.0,
      indicators: ['econ_01_treasury_tail', 'econ_02_grocery_cpi', 'market_01_intraday_swing', 'green_g1_gdp_rates'],
      criticalAlerts: []
    },
    jobs_labor: {
      score: 0.10,
      weight: 1.0,
      indicators: ['job_01_strike_days'],
      criticalAlerts: []
    },
    rights_governance: {
      score: 0.22,
      weight: 1.0,
      indicators: ['power_01_ai_surveillance', 'civil_01_acled_protests'],
      criticalAlerts: []
    },
    security_infrastructure: {
      score: 0.18,
      weight: 1.25,
      indicators: ['cyber_01_cisa_kev', 'grid_01_pjm_outages', 'bio_01_h2h_countries'],
      criticalAlerts: []
    },
    oil_axis: {
      score: 0.25,
      weight: 1.0,
      indicators: ['oil_01_russian_brics', 'oil_02_mbridge_settlements', 'ofac_01_designations', 'oil_04_refinery_ratio', 'spr_01_level', 'oil_03_jodi_inventory'],
      criticalAlerts: []
    },
    ai_window: {
      score: 0.15,
      weight: 1.0,
      indicators: ['labor_ai_01_layoffs', 'cyber_02_ai_ransomware', 'info_02_deepfake_shocks', 'compute_01_training_cost'],
      criticalAlerts: []
    },
    global_conflict: {
      score: 0.38,
      weight: 1.5,
      indicators: ['global_conflict_intensity', 'taiwan_pla_activity', 'nato_high_readiness', 'nuclear_01_tests', 'hormuz_war_risk', 'taiwan_exclusion_zone', 'russia_nato_escalation', 'defense_spending_growth'],
      criticalAlerts: []
    },
    domestic_control: {
      score: 0.30,
      weight: 1.25,
      indicators: ['dc_control_countdown', 'national_guard_metros', 'ice_detention_surge', 'dhs_removal_expansion', 'hill_control_legislation', 'liberty_litigation_count'],
      criticalAlerts: []
    },
    supply_chain: {
      score: 0.18,
      weight: 1.25,
      indicators: ['supply_01_port_congestion', 'supply_02_freight_index', 'supply_03_chip_lead_time'],
      criticalAlerts: []
    },
    energy: {
      score: 0.20,
      weight: 1.25,
      indicators: ['energy_02_nat_gas_storage', 'energy_03_grid_emergency'],
      criticalAlerts: []
    },
    social_cohesion: {
      score: 0.05,
      weight: 0.75,
      indicators: ['cult_trend_01_twitter', 'cult_meme_01_tokens', 'cult_event_01_protests', 'cult_media_01_trends'],
      criticalAlerts: []
    },
    water_infrastructure: {
      score: 0.12,
      weight: 1.25,
      indicators: ['water_01_reservoir_level', 'water_02_treatment_alerts'],
      criticalAlerts: []
    },
    telecommunications: {
      score: 0.05,
      weight: 1.0,
      indicators: ['telecom_01_bgp_anomalies', 'telecom_02_cell_outages', 'telecom_03_undersea_cable'],
      criticalAlerts: []
    },
    housing_mortgage: {
      score: 0.08,
      weight: 1.0,
      indicators: ['housing_01_delinquency', 'housing_02_foreclosure', 'housing_03_rate_shock'],
      criticalAlerts: []
    },
    // food_production domain removed - no working data sources
  },
  timestamp: now
};

export const mockSystemStatus: SystemStatus = {
  operational: true,
  lastUpdate: now,
  activeAlerts: 0,
  dataQuality: 88
};
