/**
 * Evidence Generator for Trust Layer
 *
 * Generates evidence trails, situation briefs, and reasoning chains
 * for synthesis cards based on matched indicators and patterns.
 */

import { IndicatorData } from '../../types';
import { ScoredPattern } from './cardScorer';
import {
  EvidenceSignal,
  SourceType,
  getSource,
  computeConfidence,
} from '../../data/sourceRegistry';
import { formatValue } from '../../data/indicatorDisplay';
import {
  InsightCardWithEvidence,
  SituationBrief,
  ReasoningChain,
  ActionItem,
} from '../../types/trust';
import { INDICATOR_TRANSLATIONS, getDisplayName, getImpact } from '../../data/indicatorTranslations';
import { getIndicatorContext } from './indicatorContext';

/**
 * Map indicator IDs to their data sources
 */
const INDICATOR_SOURCE_MAP: Record<string, string> = {
  econ_01_treasury_tail: 'treasury',
  econ_02_grocery_cpi: 'bls',
  market_01_intraday_swing: 'yahoo_finance',
  green_g1_gdp_rates: 'fred',
  job_01_strike_days: 'cornell_ilr',
  power_01_ai_surveillance: 'legiscan',
  civil_01_acled_protests: 'acled',
  cyber_01_cisa_kev: 'cisa',
  grid_01_pjm_outages: 'pjm',
  bio_01_h2h_countries: 'who',
  oil_01_russian_brics: 'crea',
  oil_02_mbridge_settlements: 'bis',
  ofac_01_designations: 'treasury',
  oil_04_refinery_ratio: 'eia',
  labor_ai_01_layoffs: 'bloomberg',
  cyber_02_ai_ransomware: 'cisa',
  info_02_deepfake_shocks: 'reuters',
  compute_01_training_cost: 'epoch_ai',
  global_conflict_intensity: 'acled',
  taiwan_pla_activity: 'taiwan_mnd',
  nato_high_readiness: 'nato',
  nuclear_01_tests: 'sipri',
  russia_nato_escalation: 'nato',
  defense_spending_growth: 'sipri',
  dc_control_countdown: 'legiscan',
  national_guard_metros: 'ap',
  ice_detention_surge: 'ice',
  dhs_removal_expansion: 'dhs',
  hill_control_legislation: 'legiscan',
  liberty_litigation_count: 'trac',
  supply_01_port_congestion: 'marine_traffic',
  supply_02_freight_index: 'freightos',
  supply_03_chip_lead_time: 'bloomberg',
  spr_01_level: 'eia',
  energy_02_nat_gas_storage: 'eia',
  energy_03_grid_emergency: 'doe',
  bank_01_failures: 'fdic',
  bank_02_discount_window: 'fed',
  bank_03_deposit_flow: 'fed',
  flight_01_ground_stops: 'faa',
  flight_02_delay_pct: 'faa',
  flight_03_tfr_count: 'faa',
  travel_01_advisories: 'state_dept',
  travel_02_border_wait: 'dhs',
  travel_03_tsa_throughput: 'dhs',
};

const OFFICIAL_SOURCE = /FRED|BLS|BEA|EIA|FDA|FEMA|CISA|Weather Service|TSA|FDIC|Treasury|State Department|Federal Reserve|Labor|WHO|World Health/i;

/**
 * Evidence for one indicator: the real reading and where it came from.
 * No generated headlines; the source is the one the API reports.
 */
function generateEvidenceFromIndicator(indicator: IndicatorData): EvidenceSignal {
  const mapped = INDICATOR_SOURCE_MAP[indicator.id];
  const source = mapped
    ? getSource(mapped)
    : {
        id: indicator.id,
        name: indicator.dataSource,
        abbreviation: indicator.dataSource,
        type: (OFFICIAL_SOURCE.test(indicator.dataSource) ? 'government-official' : 'industry-data') as SourceType,
        description: indicator.description,
        url: indicator.sourceUrl ?? '',
      };

  const headline = `${getDisplayName(indicator.id)}: ${formatValue(indicator.status.value, indicator.unit)}`;

  const dataPoint = indicator.status.value !== undefined && indicator.status.value !== null
    ? formatValue(indicator.status.value, indicator.unit)
    : undefined;

  // Determine reliability based on source type
  const reliability =
    source.type === 'government-official' || source.type === 'international-org'
      ? 'official'
      : source.type === 'academic-research'
      ? 'authoritative'
      : source.type === 'wire-service' || source.type === 'industry-data'
      ? 'reporting'
      : 'preliminary';

  // Generate relevance text
  const relevance = indicator.description || `This indicator tracks ${indicator.domain.replace(/_/g, ' ')} conditions.`;

  return {
    id: `evidence-${indicator.id}`,
    headline,
    source,
    date: new Date(indicator.status.lastUpdate),
    url: indicator.sourceUrl,
    dataPoint,
    reliability,
    relevance,
    indicatorId: indicator.id,
  };
}

/**
 * Situation brief built only from the matched readings and the written
 * guidance for each indicator. No canned narratives or historical claims.
 */
function generateSituationBrief(
  _patternId: string,
  indicators: IndicatorData[]
): SituationBrief {
  const elevated = indicators.filter(
    (i): i is IndicatorData & { status: { level: 'amber' | 'red' } } =>
      i.status.level === 'amber' || i.status.level === 'red'
  );

  const paragraphs = elevated.map(ind => {
    const context = getIndicatorContext(ind.id);
    const reading = `${getDisplayName(ind.id)} is at ${formatValue(ind.status.value, ind.unit)} (${ind.status.level}).`;
    if (!context) return reading;
    return `${reading} ${context.whatItMeans[ind.status.level]} ${context.familyImpact[ind.status.level]}`;
  });

  return {
    narrative: paragraphs.length > 0
      ? paragraphs.join('\n\n')
      : 'None of the indicators behind this card are elevated right now.',
    timeHorizon: 'Readings update hourly; each source publishes on its own schedule.',
    generatedAt: new Date(),
  };
}

/**
 * Generate reasoning chain for a pattern
 */
function generateReasoningChain(
  pattern: ScoredPattern,
  indicators: IndicatorData[]
): ReasoningChain {
  const indicatorNames = indicators
    .map(i => INDICATOR_TRANSLATIONS[i.id]?.displayName || i.name)
    .join(', ');

  const impacts = indicators
    .map(i => getImpact(i.id, i.status.level as 'amber' | 'red'))
    .filter(Boolean);

  return {
    observation: `${indicatorNames} ${indicators.length > 1 ? 'are' : 'is'} showing ${indicators[0]?.status.level} status. ${pattern.pattern.outcomeTemplate.split('.')[0]}.`,

    interpretation: `When these indicators align, it historically indicates conditions that affect household budgets, supply availability, or safety. The pattern matches scenarios we've studied from past events.`,

    implication: impacts.length > 0
      ? impacts.join(' ')
      : `Your household may experience impacts related to ${indicators[0]?.domain.replace(/_/g, ' ')} in the coming weeks.`,

    recommendation: pattern.pattern.actionTemplate
      ? `${pattern.pattern.actionTemplate} now because timing matters. Acting before conditions worsen locks in current prices/availability and provides buffer if things escalate.`
      : 'Taking preparatory action now provides optionality regardless of how the situation develops.',

    assumptions: [
      'Current trends continue at similar pace',
      'No major policy interventions change the trajectory',
      'Historical patterns remain predictive of outcomes',
    ],

    counterpoints: [
      'Conditions may improve faster than expected if underlying causes resolve',
      'Buffer inventories (retail, supply chain) may delay consumer impact',
      'Our historical comparisons may not fully apply to current circumstances',
    ],

    updateTriggers: [
      `If indicator levels improve to green → recommendation downgrades`,
      `If additional indicators turn red → recommendation escalates to "do this today"`,
      `If 48 hours pass without change → situation is stabilizing`,
    ],
  };
}

/**
 * Generate action items for a pattern
 */
function generateActionItems(
  pattern: ScoredPattern,
  indicators: IndicatorData[]
): ActionItem[] {
  const actions: ActionItem[] = [];
  const severity = pattern.pattern.baseSeverity;

  // Primary action from pattern
  if (pattern.pattern.actionTemplate) {
    actions.push({
      id: `action-${pattern.pattern.id}-primary`,
      task: pattern.pattern.actionTemplate,
      why: 'Primary recommended action based on current conditions',
      effort: severity >= 7 ? 'moderate' : 'quick',
      timeEstimate: severity >= 7 ? '1-2 hours' : '30 minutes',
      priority: severity >= 7 ? 'critical' : 'recommended',
    });
  }

  // Add domain-specific secondary actions
  const domains = [...new Set(indicators.map(i => i.domain))];

  if (domains.includes('economy')) {
    actions.push({
      id: `action-${pattern.pattern.id}-cash`,
      task: 'Verify cash on hand (2 weeks minimum)',
      why: 'Cash provides buffer if card systems have issues',
      effort: 'quick',
      timeEstimate: '15 minutes',
      priority: severity >= 7 ? 'critical' : 'recommended',
    });
  }

  if (domains.includes('supply_chain') || domains.includes('energy')) {
    actions.push({
      id: `action-${pattern.pattern.id}-supplies`,
      task: 'Check shelf-stable supply levels',
      why: 'Stocking up at current prices beats paying peak prices later',
      effort: 'moderate',
      timeEstimate: '1 hour + shopping trip',
      priority: 'recommended',
    });
  }

  if (domains.includes('security_infrastructure')) {
    actions.push({
      id: `action-${pattern.pattern.id}-security`,
      task: 'Run software updates on all devices',
      why: 'Unpatched devices are primary entry points for attacks',
      effort: 'quick',
      timeEstimate: '20 minutes',
      priority: 'recommended',
    });
  }

  // Always add a planning action
  actions.push({
    id: `action-${pattern.pattern.id}-plan`,
    task: 'Review family emergency communication plan',
    why: 'Ensure everyone knows rally points and emergency contacts',
    effort: 'quick',
    timeEstimate: '15 minutes',
    priority: 'optional',
  });

  return actions;
}

/**
 * Generate a full InsightCardWithEvidence from a scored pattern
 */
export function generateInsightCardWithEvidence(
  scored: ScoredPattern,
  _indicators: IndicatorData[]  // Available for future use (e.g., broader context)
): InsightCardWithEvidence {
  // Get matched indicators
  const matchedIndicators = scored.matchedIndicators;

  // Generate evidence signals
  const evidence = matchedIndicators.map(generateEvidenceFromIndicator);

  // Compute confidence
  const confidence = computeConfidence(evidence);

  // Generate trust layer content
  const situationBrief = generateSituationBrief(scored.pattern.id, matchedIndicators);
  const reasoningChain = generateReasoningChain(scored, matchedIndicators);
  const actions = generateActionItems(scored, matchedIndicators);

  // Determine urgency
  const urgency: 'today' | 'week' | 'knowing' =
    scored.severityScore >= 70 ? 'today' :
    scored.severityScore >= 40 ? 'week' : 'knowing';

  return {
    id: scored.pattern.id,
    headline: scored.pattern.headlineTemplate,
    body: scored.pattern.outcomeTemplate,
    urgency,
    domains: scored.pattern.domains,
    indicatorIds: matchedIndicators.map(i => i.id),
    severity: scored.pattern.baseSeverity,
    action: scored.pattern.actionTemplate
      ? {
          label: scored.pattern.actionTemplate,
          href: scored.pattern.actionHref || '/action-plan',
        }
      : undefined,
    confidence,
    evidence,
    situationBrief,
    reasoningChain,
    actions,
    patternId: scored.pattern.id,
    generatedAt: new Date(),
  };
}
