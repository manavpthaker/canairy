import { IndicatorData, AlertLevel, Domain, DOMAIN_META } from '../types';
import { getIndicatorDescription } from '../data/indicatorDescriptions';

export interface SituationNarrative {
  headline: string;
  explanation: string;
  whatToDoAboutIt: string;
  riskLevel: 'elevated' | 'serious' | 'critical';
  keyIndicators: Array<{
    id: string;
    name: string;
    whyItMatters: string;
    currentLevel: AlertLevel;
    currentValue: number | string;
  }>;
}

const DOMAIN_CONNECTORS: Record<string, string> = {
  'economy+security_infrastructure': 'Financial markets are under stress at the same time infrastructure reliability is declining. When both happen together, it can affect access to money and essential services.',
  'economy+global_conflict': 'Economic indicators are weakening while international tensions are rising. This combination historically disrupts supply chains and raises costs.',
  'economy+supply_chain': 'Economic instability combined with supply chain disruptions means both prices and availability of goods are under pressure.',
  'economy+energy': 'Financial stress combined with energy supply problems hits household budgets from multiple directions — higher costs and potentially less reliable power.',
  'security_infrastructure+global_conflict': 'Domestic infrastructure is strained while global conflicts expand. Flight disruptions, cyber threats, and supply chain breaks tend to cascade together.',
  'security_infrastructure+energy': 'Infrastructure problems and energy supply stress are compounding. Power grid reliability and essential services may be affected.',
  'global_conflict+supply_chain': 'Active conflicts are disrupting trade routes and supply chains. Shipping diversions and airspace closures are driving up costs for imported goods.',
  'global_conflict+energy': 'Conflict is threatening energy supply routes. Oil and gas markets are volatile, which will affect fuel and heating costs.',
  'supply_chain+energy': 'Supply chains and energy systems are both under pressure. This combination can cause cascading shortages across multiple sectors.',
  'domestic_control+rights_governance': 'Both government control measures and civil liberties protections are shifting. Stay informed about changes that affect your rights and movement.',
};

const FAMILY_IMPACT: Record<string, string> = {
  economy: 'Your savings, investments, and cost of living could be affected.',
  jobs_labor: 'Job market disruptions and strikes can affect income stability.',
  rights_governance: 'Changes in governance may affect your freedoms and legal protections.',
  security_infrastructure: 'Essential services like power, water, internet, and travel could face disruptions.',
  oil_axis: 'Energy markets are shifting in ways that will affect fuel and heating costs.',
  ai_window: 'AI-driven changes are accelerating — affecting jobs, security, and information reliability.',
  global_conflict: 'International tensions can disrupt supply chains, raise prices, and affect travel.',
  domestic_control: 'Government enforcement and control measures are intensifying.',
  cult: 'Unusual social movements may affect community stability.',
  supply_chain: 'Getting goods to stores is getting harder. Expect delays, shortages, and higher prices.',
  energy: 'Energy supply is tightening. Fuel, heating, and electricity costs may rise.',
};

export function generateSituationNarrative(indicators: IndicatorData[]): SituationNarrative | null {
  const redIndicators = indicators.filter(i => i.status.level === 'red' && i.enabled !== false);
  const amberIndicators = indicators.filter(i => i.status.level === 'amber' && i.enabled !== false);

  if (redIndicators.length === 0 && amberIndicators.length === 0) return null;

  const riskLevel: SituationNarrative['riskLevel'] =
    redIndicators.length >= 3 ? 'critical' :
    redIndicators.length >= 1 ? 'serious' : 'elevated';

  const headlineIndicators = redIndicators.length > 0 ? redIndicators : amberIndicators.slice(0, 3);
  const headline = buildHeadline(headlineIndicators);
  const affectedDomains = getAffectedDomains(redIndicators.length > 0 ? redIndicators : amberIndicators);
  const explanation = buildExplanation(headlineIndicators, affectedDomains);
  const whatToDoAboutIt = buildActionGuidance(redIndicators, amberIndicators);

  const keyIndicators = [...redIndicators, ...amberIndicators.slice(0, 5)].map(ind => {
    const desc = getIndicatorDescription(ind.id);
    return {
      id: ind.id,
      name: ind.name,
      whyItMatters: desc?.whyItMatters || ind.description,
      currentLevel: ind.status.level,
      currentValue: ind.status.value,
    };
  });

  return { headline, explanation, whatToDoAboutIt, riskLevel, keyIndicators };
}

export function generateDomainNarrative(domain: Domain, indicators: IndicatorData[]): string | null {
  const domainIndicators = indicators.filter(i => i.domain === domain && i.enabled !== false);
  const red = domainIndicators.filter(i => i.status.level === 'red');
  const amber = domainIndicators.filter(i => i.status.level === 'amber');

  if (red.length === 0 && amber.length === 0) {
    return `All ${DOMAIN_META[domain]?.label || domain} indicators are within normal ranges.`;
  }

  const worst = red.length > 0 ? red : amber;
  const descriptions = worst.map(i => {
    const desc = getIndicatorDescription(i.id);
    if (desc?.thresholds) {
      const level = i.status.level as 'green' | 'amber' | 'red';
      return desc.thresholds[level];
    }
    return `${i.name} is at ${i.status.level} level`;
  });

  const label = DOMAIN_META[domain]?.label || domain;
  return `${label}: ${descriptions.slice(0, 2).join('. ')}.`;
}

export function generateDomainInsight(domain: Domain, indicators: IndicatorData[]) {
  const domainIndicators = indicators.filter(i => i.domain === domain && i.enabled !== false);
  const nonGreen = domainIndicators.filter(i => i.status.level !== 'green');

  if (nonGreen.length === 0) return null;

  const narrative = generateDomainNarrative(domain, indicators) || '';
  const insightIndicators = nonGreen.map(ind => {
    const desc = getIndicatorDescription(ind.id);
    const level = ind.status.level as 'green' | 'amber' | 'red';
    return {
      id: ind.id,
      name: ind.name,
      level: ind.status.level,
      value: ind.status.value,
      actionGuidance: desc?.actionGuidance?.[level] || desc?.thresholds?.[level] || '',
    };
  });

  return {
    domain,
    label: DOMAIN_META[domain]?.label || domain,
    narrative,
    indicators: insightIndicators,
  };
}

export function generateAllClearNarrative(indicators: IndicatorData[]): string {
  const enabledCount = indicators.filter(i => i.enabled !== false).length;
  return `All ${enabledCount} indicators are within normal ranges. No action needed right now.`;
}

function buildHeadline(indicators: IndicatorData[]): string {
  if (indicators.length === 0) return 'All indicators normal';

  const names = indicators.slice(0, 3).map(i => {
    const desc = getIndicatorDescription(i.id);
    if (desc?.whyItMatters) {
      const first = desc.whyItMatters.split('.')[0];
      if (first.length < 80) return first;
    }
    return `${i.name} is at ${i.status.level}`;
  });

  if (indicators.length <= 2) return names.join(' and ');
  return `${names.slice(0, 2).join(', ')}, and ${indicators.length - 2} more`;
}

function getAffectedDomains(indicators: IndicatorData[]): Domain[] {
  const domains = new Set<Domain>();
  indicators.forEach(i => domains.add(i.domain));
  return Array.from(domains);
}

function buildExplanation(indicators: IndicatorData[], domains: Domain[]): string {
  if (domains.length >= 2) {
    for (let i = 0; i < domains.length - 1; i++) {
      for (let j = i + 1; j < domains.length; j++) {
        const key1 = `${domains[i]}+${domains[j]}`;
        const key2 = `${domains[j]}+${domains[i]}`;
        if (DOMAIN_CONNECTORS[key1]) return DOMAIN_CONNECTORS[key1];
        if (DOMAIN_CONNECTORS[key2]) return DOMAIN_CONNECTORS[key2];
      }
    }
  }

  const descriptions = indicators.slice(0, 2).map(i => {
    const desc = getIndicatorDescription(i.id);
    return desc?.whyItMatters || i.description;
  });
  return descriptions.join(' ');
}

function buildActionGuidance(redIndicators: IndicatorData[], amberIndicators: IndicatorData[]): string {
  if (redIndicators.length >= 2) {
    const domains = getAffectedDomains(redIndicators);
    const impacts = domains.map(d => FAMILY_IMPACT[d]).filter(Boolean).slice(0, 2);
    return `Multiple areas need attention. ${impacts.join(' ')} Check the action checklist for specific steps.`;
  }

  if (redIndicators.length === 1) {
    const desc = getIndicatorDescription(redIndicators[0].id);
    if (desc?.actionGuidance?.red) return desc.actionGuidance.red;
    return FAMILY_IMPACT[redIndicators[0].domain] || 'Review the action checklist for recommended steps.';
  }

  const topAmber = amberIndicators.slice(0, 2);
  const guidance = topAmber.map(i => {
    const desc = getIndicatorDescription(i.id);
    return desc?.actionGuidance?.amber || desc?.thresholds?.amber || '';
  }).filter(Boolean);
  return guidance.length > 0 ? guidance.join(' ') : 'Some indicators are shifting. Stay aware and review the items below.';
}
