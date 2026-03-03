import { Phase } from '../types';

/**
 * Complete phase definitions from the research document.
 * Phases 0–9 (with 2.5) define the household resilience ladder.
 */
export const PHASES: Phase[] = [
  {
    number: 0,
    name: 'Foundations',
    description: 'Baseline training, security hygiene, and mindset',
    triggers: ['Default — start here'],
    actions: [
      'CPR / First Aid / Stop-the-Bleed training',
      'Bitwarden + FIDO2 security setup',
      'Start resilience notebook',
      'Practice SCAN → DECIDE → ACT walks',
      'Baseline fitness & lab work',
      'Pepper gel + 1000-lumen light EDC',
    ],
    color: '#10B981',
  },
  {
    number: 1,
    name: '72-Hour Bin',
    description: 'Basic 72-hour survival kit assembled and tested',
    triggers: ['Normal / green overall'],
    actions: [
      '48× Mainstay water + low-sugar food kit',
      'Crank NOAA radio',
      '$500 cash (small bills)',
      'CO alarm + ABC extinguisher',
      'Anker C1000 charged to ~60% SoC',
    ],
    color: '#10B981',
  },
  {
    number: 2,
    name: 'Digital & Comms',
    description: 'Communications hardened, digital backup complete',
    triggers: ['Any 1 amber in Economy / Rights / Security'],
    actions: [
      'Password manager fully configured',
      '2× power banks charged',
      'Laminated emergency contacts card',
      'GMRS handhelds set (Ch 7 / CTCSS 23)',
      'Print PACE card (Primary, Alternate, Contingency, Emergency)',
      'Quarterly backup test scheduled',
    ],
    color: '#10B981',
  },
  {
    number: 2.5,
    name: 'Liquidity & Docs',
    description: 'Financial buffers and critical documents secured',
    triggers: ['Any 2 ambers OR GDP green-flag is false'],
    actions: [
      '3-month T-bill ladder established',
      '5% gold + 5% USD-hedge allocation',
      'Dual cloud vaults + IronKey USB',
      'Passport card / Real-ID in wallets',
      'Go-folder staged by front door',
    ],
    color: '#F59E0B',
  },
  {
    number: 3,
    name: 'Air, Health, Mobile',
    description: 'Health supplies cached, mobile comms operational',
    triggers: ['1 red anywhere OR 2 ambers sustained 7 days'],
    actions: [
      'HEPA filter running',
      'N95 cache verified (50+ per person)',
      'C1000 moved to shelter as UPS',
      'inReach Mini in Faraday pouch',
      'Weekly modem-off comms drill',
    ],
    color: '#F59E0B',
  },
  {
    number: 4,
    name: 'Dry-Basement / Perimeter',
    description: 'Physical security hardened, movement restricted',
    triggers: ['ACLED protests or CYBER turns red, OR 2 total reds'],
    actions: [
      'Avoid protest zones',
      'Minor family curfew implemented',
      'Top off fuel & cash',
      'Utility pump staged in basement',
      'Door strike-plates / door bar installed',
    ],
    color: '#F59E0B',
  },
  {
    number: 5,
    name: 'Oil-Tank → Generator Prep',
    description: 'Backup power system staged and tested',
    triggers: ['OIL-01 or OIL-02 red, OR 10Y swing ≥30 bp event'],
    actions: [
      'Dose PRI-D fuel stabilizer',
      'Buy Racor 500FG filter + 2 spares',
      'Choose day-tank vs direct feed layout',
      'Battery tender on genset',
      'Write "1-hour morning charge" routine for C1000',
    ],
    color: '#F97316',
  },
  {
    number: 6,
    name: 'Shelter Nook Build',
    description: 'Dedicated shelter space configured with comms and organization',
    triggers: ['2+ reds sustained ≥48 hours'],
    actions: [
      'Tyvek clean-out of shelter space',
      'Shelves / bins organized',
      'PoE NVR camera on isolated VLAN',
      'Roles matrix posted (Ops / Comms / Med / Logistics)',
      'Soft-skill ledger whiteboard',
    ],
    color: '#F97316',
  },
  {
    number: 7,
    name: 'Harden + Genset Live',
    description: 'Generator installed and running, structure hardened',
    triggers: ['Local Guard activation OR court-injunction chaos + 2 reds'],
    actions: [
      'Install 18–22 kW diesel genset + ATS',
      'Lightning & surge protection',
      'Circuit power-budget + daily run schedule',
      'Steel / plywood wrap for shelter nook',
    ],
    color: '#EF4444',
  },
  {
    number: 8,
    name: 'Water & Circuits',
    description: 'Water independence and offline digital capability',
    triggers: ['Grid instability pattern (3+ PJM outages/quarter)'],
    actions: [
      'Rainwater totes + RV pump + filters installed',
      'Integrate shelter circuits to ATS',
      'Download local 7B LLM & first-aid videos for offline use',
    ],
    color: '#EF4444',
  },
  {
    number: 9,
    name: 'Optional Safe-Room',
    description: 'FEMA/ICC-500 rated safe room (wind/blast protection)',
    triggers: ['Only if near-absolute wind/blast protection desired'],
    actions: [
      'FEMA / ICC-500 engineered safe room',
      'Not required for most scenarios — discretionary hardening',
    ],
    color: '#991B1B',
  },
];

export function getPhaseByNumber(num: number): Phase | undefined {
  return PHASES.find((p) => p.number === num);
}

export function getPhaseColor(num: number): string {
  const phase = getPhaseByNumber(num);
  return phase?.color ?? '#6B7280';
}

/**
 * Action Protocol 48-hour checklist — activated when ≥2 indicators hit RED.
 */
export const ACTION_CHECKLIST = [
  { id: 'ac-1', text: 'Verify cash reserves ($500+ small bills)', category: 'Financial' },
  { id: 'ac-2', text: 'Fill all vehicle fuel tanks', category: 'Supplies' },
  { id: 'ac-3', text: 'Refill all prescriptions (90-day if possible)', category: 'Health' },
  { id: 'ac-4', text: 'Top off food & water supply (2-week min)', category: 'Supplies' },
  { id: 'ac-5', text: 'Charge all power banks and backup batteries', category: 'Comms' },
  { id: 'ac-6', text: 'Test GMRS radios and comms plan', category: 'Comms' },
  { id: 'ac-7', text: 'Verify go-folder is current and by front door', category: 'Docs' },
  { id: 'ac-8', text: 'Screenshot all bank/investment balances', category: 'Financial' },
  { id: 'ac-9', text: 'Brief family on current phase actions', category: 'Family' },
  { id: 'ac-10', text: 'Confirm meeting locations (primary + backup)', category: 'Family' },
  { id: 'ac-11', text: 'Run HEPA filter, verify N95 cache', category: 'Health' },
  { id: 'ac-12', text: 'Check generator fuel and battery tender', category: 'Power' },
];

/** @deprecated Use ACTION_CHECKLIST */
export const TIGHTEN_UP_CHECKLIST = ACTION_CHECKLIST;

/**
 * Critical jump rules — bypass normal phase progression.
 * These force minimum phase levels when specific conditions are met.
 */
export const CRITICAL_JUMP_RULES = [
  {
    id: 'jump-1',
    condition: 'Market Volatility + Deepfake Shocks both RED',
    indicatorIds: ['market_01_intraday_swing', 'info_02_deepfake_shocks'],
    minPhase: 7,
    timeLimit: '3 hours',
  },
  {
    id: 'jump-2',
    condition: 'NATO Readiness RED + Russia-NATO index ≥ 75',
    indicatorIds: ['nato_high_readiness', 'russia_nato_escalation'],
    minPhase: 6,
    timeLimit: 'Immediate',
  },
  {
    id: 'jump-3',
    condition: 'National Guard Metro RED',
    indicatorIds: ['national_guard_metros'],
    minPhase: 5,
    timeLimit: 'Immediate',
  },
  {
    id: 'jump-4',
    condition: 'DHS Expedited Removal RED',
    indicatorIds: ['dhs_removal_expansion'],
    minPhase: 5,
    timeLimit: 'Immediate',
  },
];
