/**
 * Household guidance for every core indicator the API serves (see api/catalog.py).
 *
 * The text lives in server/api/advice.json so the API can serve the same
 * "what to do" lines with each reading (Milo texts them; other readers of the
 * open feed get them too). Edit it there.
 *
 * Written to match exactly what each number measures. No invented statistics:
 * anything quantitative is either the reading itself or a well-known,
 * checkable fact. Advice is proportionate; amber means "worth a small step",
 * red means "act this week".
 */
import advice from '../../server/api/advice.json';

export interface IndicatorContextEntry {
  whatItMeans: { amber: string; red: string };
  familyImpact: { amber: string; red: string };
  whatToDo: { amber: string; red: string };
  dataPointLabel: string;
  source: string;
  peripheralImpacts: string[];
}

export const ADVICE: Record<string, IndicatorContextEntry> = advice;

export function getAdvice(indicatorId: string): IndicatorContextEntry | null {
  return ADVICE[indicatorId] ?? null;
}
