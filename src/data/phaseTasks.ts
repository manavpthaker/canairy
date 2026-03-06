/**
 * Phase Tasks - Complete Tier System
 *
 * Maps phases 0-9 into 6 actionable tiers with specific tasks.
 * Each task has time estimates, costs, and completion tracking.
 */

export interface PhaseTask {
  id: string;
  title: string;
  description: string;
  timeEstimate: string;
  costEstimate?: string;
  effort: 'quick' | 'afternoon' | 'weekend' | 'project' | 'involved';
  category: 'training' | 'financial' | 'supplies' | 'health' | 'comms' | 'documents' | 'digital' | 'home';
  seasonal?: boolean;
  refreshInterval?: string;
  keyword: string; // For dedup matching against AI actions
  domains: string[];
}

export interface TaskTier {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  minPhaseToShow: number;
  conditionNote?: string;
  tasks: PhaseTask[];
}

// ============================================================================
// TIER 1: THE BASICS (Phases 0 + 1)
// ============================================================================
const TIER_BASICS: TaskTier = {
  id: 'basics',
  title: 'The Basics',
  subtitle: 'Getting your house in order',
  description: 'Every household should have this. Most of it takes an afternoon.',
  minPhaseToShow: 0,
  tasks: [
    {
      id: 'basics-cpr',
      title: 'Take a CPR and First Aid class',
      description: 'The one skill that could save a life in 3 minutes. Red Cross or community classes available.',
      timeEstimate: '~4 hrs',
      costEstimate: '$50-80',
      effort: 'afternoon',
      category: 'training',
      keyword: 'cpr',
      domains: ['security_infrastructure'],
    },
    {
      id: 'basics-cash',
      title: 'Keep $300-500 cash at home',
      description: 'Small bills in a drawer. For when the power\'s out and card machines don\'t work.',
      timeEstimate: '~15 min',
      costEstimate: '$300-500',
      effort: 'quick',
      category: 'financial',
      keyword: 'cash',
      domains: ['economy'],
    },
    {
      id: 'basics-food',
      title: 'Stock 72 hours of shelf-stable food',
      description: 'Canned goods, rice, pasta — food you actually eat. Enough for 3-4 days without shopping.',
      timeEstimate: '~1 hr',
      costEstimate: '$75-100',
      effort: 'quick',
      category: 'supplies',
      seasonal: true,
      refreshInterval: '6 months',
      keyword: 'food',
      domains: ['supply_chain'],
    },
    {
      id: 'basics-water',
      title: 'Store 9 gallons of water',
      description: '1 gallon per person per day for 3 days. Water bottles plus gallon jugs.',
      timeEstimate: '~10 min',
      costEstimate: '$10-15',
      effort: 'quick',
      category: 'supplies',
      seasonal: true,
      refreshInterval: '12 months',
      keyword: 'water',
      domains: ['supply_chain'],
    },
    {
      id: 'basics-firstaid',
      title: 'Assemble a first aid kit',
      description: 'Bandages, antiseptic, thermometer, pain relievers, any regular medications.',
      timeEstimate: '~30 min',
      costEstimate: '$40-60',
      effort: 'quick',
      category: 'health',
      keyword: 'first aid',
      domains: ['security_infrastructure'],
    },
    {
      id: 'basics-radio',
      title: 'Get an emergency radio',
      description: 'Hand-crank or battery-powered with NOAA weather channels. Know where it is.',
      timeEstimate: '~15 min',
      costEstimate: '$30-50',
      effort: 'quick',
      category: 'comms',
      keyword: 'radio',
      domains: ['security_infrastructure'],
    },
    {
      id: 'basics-documents',
      title: 'Organize important documents',
      description: 'Passports, birth certificates, insurance cards in one folder. Phone photos as backup.',
      timeEstimate: '~45 min',
      effort: 'afternoon',
      category: 'documents',
      keyword: 'document',
      domains: ['domestic_control'],
    },
    {
      id: 'basics-contacts',
      title: 'Write down emergency contacts',
      description: 'Family, doctors, neighbors on paper in the kitchen. When phones are dead, you need numbers.',
      timeEstimate: '~20 min',
      effort: 'quick',
      category: 'comms',
      keyword: 'contact',
      domains: ['security_infrastructure'],
    },
  ],
};

// ============================================================================
// TIER 2: FINANCIALLY SECURE (Phase 2.5)
// ============================================================================
const TIER_FINANCIAL: TaskTier = {
  id: 'financially-secure',
  title: 'Financially Secure',
  subtitle: 'Your money works even when systems don\'t',
  description: 'A financial cushion that turns uncertainty into runway.',
  minPhaseToShow: 2,
  tasks: [
    {
      id: 'finance-emergency-fund',
      title: 'Build a 3-month expense cushion',
      description: 'Three months of essentials in high-yield savings or short-term T-bills (4-5% right now).',
      timeEstimate: '~1 hr to set up',
      effort: 'involved',
      category: 'financial',
      keyword: 'emergency fund',
      domains: ['economy'],
    },
    {
      id: 'finance-non-dollar',
      title: 'Open a small non-dollar position',
      description: '$500-1000 in gold, foreign currency ETF, or crypto. Insurance against dollar weakness.',
      timeEstimate: '~1 hr',
      costEstimate: '$500-1000',
      effort: 'afternoon',
      category: 'financial',
      keyword: 'non-dollar',
      domains: ['economy', 'oil_axis'],
    },
    {
      id: 'finance-go-folder',
      title: 'Build your go-folder',
      description: 'Physical folder with passports, certificates, insurance, tax return. Two copies.',
      timeEstimate: '~2 hrs',
      effort: 'afternoon',
      category: 'documents',
      keyword: 'go-folder',
      domains: ['domestic_control'],
    },
    {
      id: 'finance-dual-backup',
      title: 'Set up dual-jurisdiction data backup',
      description: 'Critical files in domestic cloud + international (Swiss Proton Drive). Data exists if US systems lock up.',
      timeEstimate: '~1 hr',
      effort: 'afternoon',
      category: 'digital',
      keyword: 'backup',
      domains: ['security_infrastructure'],
    },
    {
      id: 'finance-beneficiaries',
      title: 'Review beneficiaries and account access',
      description: 'Ensure spouse is on every account. Write down access info in go-folder.',
      timeEstimate: '~1 hr',
      effort: 'afternoon',
      category: 'financial',
      keyword: 'beneficiary',
      domains: ['economy'],
    },
  ],
};

// ============================================================================
// TIER 3: CONNECTED & PROTECTED (Phases 2 + 3)
// ============================================================================
const TIER_CONNECTED: TaskTier = {
  id: 'connected-protected',
  title: 'Connected & Protected',
  subtitle: 'Comms, health, and digital resilience',
  description: 'If internet goes down or air quality tanks, your family stays connected and breathing clean.',
  minPhaseToShow: 2,
  tasks: [
    {
      id: 'connected-passwords',
      title: 'Lock down your digital life',
      description: 'Password manager (Bitwarden) + 2FA on email, bank, and financial accounts.',
      timeEstimate: '~2 hrs',
      effort: 'afternoon',
      category: 'digital',
      keyword: '2fa',
      domains: ['security_infrastructure'],
    },
    {
      id: 'connected-backup',
      title: 'Set up encrypted cloud backup',
      description: 'Photos, documents, financial records. Recover on a new device in 30 minutes.',
      timeEstimate: '~1 hr',
      effort: 'afternoon',
      category: 'digital',
      keyword: 'backup',
      domains: ['security_infrastructure'],
    },
    {
      id: 'connected-powerbanks',
      title: 'Get two 20,000mAh power banks',
      description: 'Keeps phones alive for 4-5 days without grid power. Charge monthly.',
      timeEstimate: '~5 min to order',
      costEstimate: '$40-60',
      effort: 'quick',
      category: 'supplies',
      keyword: 'power bank',
      domains: ['energy'],
    },
    {
      id: 'connected-radios',
      title: 'Get GMRS radios for the family',
      description: 'When cell networks jam, you can still reach each other. Program family and neighbor channels.',
      timeEstimate: '~30 min to set up',
      costEstimate: '$80-120',
      effort: 'quick',
      category: 'comms',
      keyword: 'radio',
      domains: ['security_infrastructure'],
    },
    {
      id: 'connected-offline-phone',
      title: 'Keep an offline phone in a Faraday pouch',
      description: 'Prepaid phone with key numbers, stored in signal-blocking pouch. Backup if main phones compromised.',
      timeEstimate: '~30 min to set up',
      costEstimate: '$50-80',
      effort: 'quick',
      category: 'comms',
      keyword: 'faraday',
      domains: ['security_infrastructure'],
    },
    {
      id: 'connected-rx',
      title: 'Get 90-day buffer on prescriptions',
      description: 'Call pharmacy and switch all recurring prescriptions to 90-day fills.',
      timeEstimate: '~15 min phone call',
      effort: 'quick',
      category: 'health',
      keyword: 'prescription',
      domains: ['supply_chain'],
    },
    {
      id: 'connected-n95',
      title: 'Stock 20 N95 masks per person',
      description: 'For wildfire smoke, pandemics, or shelter-in-place. Get kid sizes if needed.',
      timeEstimate: '~5 min to order',
      costEstimate: '$15-25',
      effort: 'quick',
      category: 'health',
      seasonal: true,
      refreshInterval: '24 months',
      keyword: 'n95',
      domains: ['security_infrastructure'],
    },
    {
      id: 'connected-hepa',
      title: 'Build a Corsi-Rosenthal box',
      description: 'Box fan + MERV-13 filters. Clean air in any room during smoke or bio events.',
      timeEstimate: '~30 min to build',
      costEstimate: '$60',
      effort: 'quick',
      category: 'health',
      keyword: 'hepa',
      domains: ['security_infrastructure'],
    },
    {
      id: 'connected-seal-kit',
      title: 'Assemble a room seal kit',
      description: 'Plastic sheeting + duct tape + pre-cut pieces for windows. Seal a room in 5 minutes.',
      timeEstimate: '~30 min to prep',
      costEstimate: '$20',
      effort: 'quick',
      category: 'health',
      keyword: 'seal',
      domains: ['security_infrastructure'],
    },
  ],
};

// ============================================================================
// TIER 4: THE BASEMENT (Phases 4 + 6)
// ============================================================================
const TIER_BASEMENT: TaskTier = {
  id: 'basement',
  title: 'The Basement',
  subtitle: 'Making your space work for you',
  description: 'A clean, dry, organized space that doubles as supply room and shelter. Multi-weekend project.',
  minPhaseToShow: 4,
  conditionNote: 'Current conditions suggest getting your basement ready. Do these in order.',
  tasks: [
    {
      id: 'basement-assess',
      title: 'Assess the basement',
      description: 'Walk the space. Look for cracks, moisture, mold, debris. Take photos.',
      timeEstimate: '~30 min',
      effort: 'quick',
      category: 'home',
      keyword: 'assess',
      domains: ['security_infrastructure'],
    },
    {
      id: 'basement-downspouts',
      title: 'Fix water management outside',
      description: 'Extend downspouts 4+ feet from foundation. Clean gutters. Grade soil away from house.',
      timeEstimate: '~2-3 hrs',
      costEstimate: '$50-100',
      effort: 'afternoon',
      category: 'home',
      keyword: 'downspout',
      domains: ['security_infrastructure'],
    },
    {
      id: 'basement-cracks',
      title: 'Seal visible cracks',
      description: 'Hydraulic cement for anything wider than hairline. Moisture prevention, not structural.',
      timeEstimate: '~1-2 hrs',
      costEstimate: '$20-40',
      effort: 'afternoon',
      category: 'home',
      keyword: 'crack',
      domains: ['security_infrastructure'],
    },
    {
      id: 'basement-sensors',
      title: 'Install leak sensors and CO detector',
      description: 'Water sensors near walls/drains. CO detector near any fuel equipment. Phone alerts.',
      timeEstimate: '~30 min',
      costEstimate: '$80',
      effort: 'quick',
      category: 'home',
      keyword: 'sensor',
      domains: ['security_infrastructure'],
    },
    {
      id: 'basement-cleanout',
      title: 'Do the big clean-out',
      description: 'Full PPE: Tyvek, P100 respirator, gloves. Remove everything, HEPA vacuum, run dehumidifier.',
      timeEstimate: 'A full weekend',
      costEstimate: '$100-150',
      effort: 'weekend',
      category: 'home',
      keyword: 'cleanout',
      domains: ['security_infrastructure'],
    },
    {
      id: 'basement-shelving',
      title: 'Set up shelving and supply bins',
      description: 'Wire shelving, labeled clear bins: food, water, medical, comms, documents, tools.',
      timeEstimate: '~3-4 hrs',
      costEstimate: '$200-300',
      effort: 'afternoon',
      category: 'home',
      keyword: 'shelving',
      domains: ['supply_chain'],
    },
    {
      id: 'basement-lighting',
      title: 'Add lighting and a radio',
      description: 'Battery LED lanterns, hand-crank radio, phone charging cable. Spend 24 hours informed.',
      timeEstimate: '~30 min',
      costEstimate: '$60-80',
      effort: 'quick',
      category: 'supplies',
      keyword: 'lighting',
      domains: ['security_infrastructure'],
    },
  ],
};

// ============================================================================
// TIER 5: ENERGY INDEPENDENCE (Phases 5 + 7)
// ============================================================================
const TIER_ENERGY: TaskTier = {
  id: 'energy-independence',
  title: 'Energy Independence',
  subtitle: 'Your house runs when the grid doesn\'t',
  description: 'Turn your oil tank from heating system into complete backup power infrastructure.',
  minPhaseToShow: 5,
  conditionNote: 'Energy and conflict indicators suggest accelerating power independence.',
  tasks: [
    {
      id: 'energy-fuel-sample',
      title: 'Get fuel sampled',
      description: 'Tech pulls sample from tank bottom. Check for water, sludge, bacteria, fuel quality.',
      timeEstimate: '~1 hr (tech visit)',
      costEstimate: '$50-100',
      effort: 'quick',
      category: 'home',
      keyword: 'fuel sample',
      domains: ['energy', 'oil_axis'],
    },
    {
      id: 'energy-biocide',
      title: 'Add stabilizer and biocide',
      description: 'Extends fuel shelf life, kills tank bacteria. Do once a year with oil delivery.',
      timeEstimate: '~15 min',
      costEstimate: '$30-50',
      effort: 'quick',
      category: 'home',
      keyword: 'biocide',
      domains: ['energy'],
    },
    {
      id: 'energy-racor-filter',
      title: 'Install a Racor fuel filter',
      description: 'Catches water and particulate before it reaches burner or generator.',
      timeEstimate: '~2 hrs',
      costEstimate: '$80-120',
      effort: 'afternoon',
      category: 'home',
      keyword: 'racor',
      domains: ['energy'],
    },
    {
      id: 'energy-fuel-strategy',
      title: 'Decide: direct draw vs day tank',
      description: 'Generator needs fuel. Direct draw from main tank (simpler) or small day tank (safer).',
      timeEstimate: '~30 min research',
      effort: 'quick',
      category: 'home',
      keyword: 'day tank',
      domains: ['energy'],
    },
    {
      id: 'energy-assessment',
      title: 'Get electrician assessment',
      description: '18-22kW diesel standby generator + ATS. Panel work, placement, permits.',
      timeEstimate: 'One afternoon',
      costEstimate: '$200',
      effort: 'afternoon',
      category: 'home',
      keyword: 'electrician',
      domains: ['energy'],
    },
    {
      id: 'energy-generator-install',
      title: 'Install standby generator',
      description: '18-22kW diesel genset with ATS. Auto-starts when grid goes down. Powers essentials.',
      timeEstimate: '2-3 days (professional)',
      costEstimate: '$8,000-12,000',
      effort: 'project',
      category: 'home',
      keyword: 'generator',
      domains: ['energy'],
    },
    {
      id: 'energy-shelter-circuits',
      title: 'Wire basement to generator',
      description: 'Basement lights, outlets, dehumidifier on essential panel. Shelter has power.',
      timeEstimate: 'Part of install',
      effort: 'quick',
      category: 'home',
      keyword: 'circuit',
      domains: ['energy', 'security_infrastructure'],
    },
  ],
};

// ============================================================================
// TIER 6: WATER & BEYOND (Phases 8 + 9)
// ============================================================================
const TIER_ADVANCED: TaskTier = {
  id: 'advanced',
  title: 'Water & Beyond',
  subtitle: 'Advanced resilience infrastructure',
  description: 'Significant projects. Most families never go this far — and that\'s fine.',
  minPhaseToShow: 7,
  conditionNote: 'Multiple indicators suggest investing in long-term infrastructure.',
  tasks: [
    {
      id: 'adv-rainwater',
      title: 'Install rainwater collection',
      description: 'Tote bank, PEX plumbing, RV pump, dual filters. Long-term water independence.',
      timeEstimate: 'Multiple weekends',
      costEstimate: '$2,000-3,000',
      effort: 'project',
      category: 'home',
      keyword: 'rainwater',
      domains: ['supply_chain'],
    },
    {
      id: 'adv-indoor-filter',
      title: 'Set up indoor water filtration',
      description: 'Gravity filter (Berkey) + UV purification. Turns any water into drinking water.',
      timeEstimate: '~2 hrs',
      costEstimate: '$300-500',
      effort: 'afternoon',
      category: 'home',
      keyword: 'filter',
      domains: ['supply_chain'],
    },
    {
      id: 'adv-saferoom',
      title: 'Assess safe room options',
      description: 'FEMA/ICC 500 standard. Concrete reinforcement, blast door, ventilation. Engineering first.',
      timeEstimate: 'Assessment first',
      costEstimate: '$5,000-15,000',
      effort: 'project',
      category: 'home',
      keyword: 'safe room',
      domains: ['security_infrastructure', 'global_conflict'],
    },
  ],
};

// ============================================================================
// EXPORTS
// ============================================================================

export const TASK_TIERS: TaskTier[] = [
  TIER_BASICS,
  TIER_FINANCIAL,
  TIER_CONNECTED,
  TIER_BASEMENT,
  TIER_ENERGY,
  TIER_ADVANCED,
];

export function getTierById(tierId: string): TaskTier | undefined {
  return TASK_TIERS.find(t => t.id === tierId);
}

export function getTaskById(taskId: string): PhaseTask | undefined {
  for (const tier of TASK_TIERS) {
    const task = tier.tasks.find(t => t.id === taskId);
    if (task) return task;
  }
  return undefined;
}

export function getVisibleTiers(systemPhase: number | 'tighten-up'): TaskTier[] {
  const phase = systemPhase === 'tighten-up' ? 7 : systemPhase;
  return TASK_TIERS.filter(tier => tier.minPhaseToShow <= phase);
}

export function getTasksForPhase(systemPhase: number): PhaseTask[] {
  const tiers = getVisibleTiers(systemPhase);
  return tiers.flatMap(tier => tier.tasks);
}

export function computeReadinessFromTiers(
  completedTaskIds: Set<string>
): { effectivePhase: number; description: string } {
  const isTierComplete = (tier: TaskTier) =>
    tier.tasks.every(t => completedTaskIds.has(t.id));

  const basicsComplete = isTierComplete(TIER_BASICS);
  const financeComplete = isTierComplete(TIER_FINANCIAL);
  const connectedComplete = isTierComplete(TIER_CONNECTED);
  const basementComplete = isTierComplete(TIER_BASEMENT);
  const energyComplete = isTierComplete(TIER_ENERGY);
  const advancedComplete = isTierComplete(TIER_ADVANCED);

  if (advancedComplete) return { effectivePhase: 9, description: 'Fully resilient' };
  if (energyComplete) return { effectivePhase: 7, description: 'Energy independent' };
  if (basementComplete) return { effectivePhase: 6, description: 'Shelter ready' };
  if (connectedComplete) return { effectivePhase: 3, description: 'Connected and protected' };
  if (financeComplete) return { effectivePhase: 2.5, description: 'Financially buffered' };
  if (basicsComplete) return { effectivePhase: 1, description: 'Basics covered' };
  return { effectivePhase: 0, description: 'Getting started' };
}

export function getTierProgress(tier: TaskTier, completedTaskIds: Set<string>): {
  completed: number;
  total: number;
  percentage: number;
} {
  const completed = tier.tasks.filter(t => completedTaskIds.has(t.id)).length;
  const total = tier.tasks.length;
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

// Get the phase description for display
export function getPhaseDescription(phase: number): string {
  const descriptions: Record<number, string> = {
    0: '72-hour basics',
    1: 'Essential preparedness',
    2: 'Digital and financial buffer',
    3: 'Comms and health resilience',
    4: 'Shelter preparation',
    5: 'Energy infrastructure',
    6: 'Shelter completion',
    7: 'Power independence',
    8: 'Water independence',
    9: 'Full resilience',
  };
  return descriptions[phase] || 'Unknown phase';
}
