import { IndicatorData } from '../types';
import { getAdvice } from './advice';
import { Briefing } from './useBriefing';
import { Household } from './household';
import { HelpResource, helpFor, relevance } from './help';
import { SEVERITY, isAlerting, levelOf } from './format';

export interface Action {
  id: string;
  title: string;
  why: string;
  urgent: boolean;
  meta?: string;
  indicators: IndicatorData[];
  help: HelpResource[];
}

const AREA_PHRASE: Record<string, { amber: string; red: string }> = {
  costs: { amber: 'Some household costs are climbing', red: 'Household costs are rising fast' },
  jobs: { amber: 'The job market is softening', red: 'Jobs and income are under real pressure' },
  banks: { amber: 'Banks and markets are a little unsettled', red: 'Banks and markets are under stress' },
  energy: { amber: 'Energy prices are elevated', red: 'Energy prices are very high' },
  health: { amber: 'There’s more illness and shortage going around', red: 'Health risks are high right now' },
  safety: { amber: 'Safety alerts are up', red: 'Safety alerts are high' },
};

/** A one-line headline written from the data, used until a briefing exists. */
export function composeHeadline(indicators: IndicatorData[]): { headline: string; summary: string } {
  const alerting = indicators.filter(isAlerting).sort((a, b) => SEVERITY[levelOf(a)] - SEVERITY[levelOf(b)]);
  if (alerting.length === 0) {
    return {
      headline: 'All steady this week.',
      summary: 'None of the signals we track are elevated. A good week to work through your plan at your own pace.',
    };
  }
  const areas: { area: string; level: 'red' | 'amber' }[] = [];
  for (const ind of alerting) {
    const area = ind.area ?? 'safety';
    if (!areas.find((a) => a.area === area)) areas.push({ area, level: levelOf(ind) as 'red' | 'amber' });
  }
  const first = AREA_PHRASE[areas[0].area][areas[0].level];
  const rest = areas.length - 1;
  const headline = rest === 0 ? `${first}. Everything else is steady.` : `${first}, and ${rest} other area${rest > 1 ? 's' : ''} ${rest > 1 ? 'are' : 'is'} worth watching.`;
  const steady = indicators.filter((i) => i.status.dataSource === 'LIVE' && i.status.level === 'green').length;
  const reds = alerting.filter((i) => levelOf(i) === 'red').map((i) => i.name.toLowerCase());
  const ambers = alerting.filter((i) => levelOf(i) === 'amber').map((i) => i.name.toLowerCase());
  const sentences: string[] = [];
  if (reds.length) sentences.push(`${capitalize(listOf(reds, 3))} ${reds.length > 1 ? 'need' : 'needs'} action.`);
  if (ambers.length) sentences.push(`${capitalize(listOf(ambers, 3))} ${ambers.length > 1 ? 'are' : 'is'} worth watching.`);
  sentences.push(`The other ${steady} are steady.`);
  return { headline, summary: sentences.join(' ') };
}

function listOf(items: string[], max: number): string {
  if (items.length <= max) {
    return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0];
  }
  return `${items.slice(0, max).join(', ')} and ${items.length - max} more`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const EFFORT_COST = (a: Briefing['actions'][number]) =>
  `Takes ${a.effort}. ${a.cost === 'free' ? 'Free' : `Costs ${a.cost}`}. Do it ${a.urgency}.`;

/** Actions for this week: from the briefing when there is one, otherwise from each elevated signal's guidance. */
export function buildActions(indicators: IndicatorData[], household: Household, briefing: Briefing | null): Action[] {
  const byId = new Map(indicators.map((i) => [i.id, i]));

  if (briefing) {
    return briefing.actions.map((a, n) => {
      const inds = a.indicator_ids.map((id) => byId.get(id)).filter(Boolean) as IndicatorData[];
      const help = dedupe(inds.flatMap((i) => helpFor(i.id, household))).slice(0, 3);
      return {
        id: `b-${n}-${a.title.slice(0, 24)}`,
        title: a.title,
        why: a.why,
        urgent: a.urgency === 'today' || inds.some((i) => levelOf(i) === 'red'),
        meta: EFFORT_COST(a),
        indicators: inds,
        help,
      };
    });
  }

  const alerting = indicators
    .filter(isAlerting)
    .map((ind) => ({ ind, rel: relevance(ind.id, household) }))
    .filter(({ rel }) => rel > 0)
    .sort((a, b) => SEVERITY[levelOf(a.ind)] - SEVERITY[levelOf(b.ind)] || b.rel - a.rel);

  const actions: Action[] = [];
  for (const { ind } of alerting) {
    const ctx = getAdvice(ind.id);
    const level = levelOf(ind) as 'red' | 'amber';
    // Watch-only guidance ("No action needed…") belongs under Worth watching, not in the to-do list.
    if (!ctx || /^no (direct )?action/i.test(ctx.whatToDo[level])) continue;
    actions.push({
      id: `g-${ind.id}-${level}`,
      title: ctx.whatToDo[level],
      why: ctx.familyImpact[level],
      urgent: level === 'red',
      indicators: [ind],
      help: helpFor(ind.id, household).slice(0, 3),
    });
    if (actions.length === 3) break;
  }
  return actions;
}

function dedupe(list: HelpResource[]): HelpResource[] {
  const seen = new Set<string>();
  return list.filter((h) => (seen.has(h.id) ? false : (seen.add(h.id), true)));
}
