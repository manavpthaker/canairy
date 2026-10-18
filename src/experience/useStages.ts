import { useEffect, useState } from 'react';
import axios from 'axios';

/** One area of household life (energy, money, jobs…) and the stage it's at. */
export interface StageArea {
  id: string;
  name: string;
  about: string;
  stage: number;
  stageName: string;
  why: string[];
  alsoWatching: string[];
  next: string[];
  down: string | null;
  manualTriggers: { stage: number; trigger: string }[];
}

export interface Stages {
  asOf: string;
  overall: { stage: number; name: string; why: string };
  areas: StageArea[];
  rules: Record<string, string>;
}

export interface LadderStep {
  stage: number;
  name: string;
  meaning: string;
  up: string | null;
  down: string | null;
  today: string;
  week: string;
  month: string;
  cost: string;
}

export interface HouseholdPlan {
  principles: string[];
  ladder: LadderStep[];
  noRegret: { id: string; title: string; why: string; cost: string }[];
  skip: string;
  areas: Record<string, Record<string, string[]>>;
  maintenance: { when: string; what: string }[];
  source: string;
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:5555/api/v1';

/** The household's stages (from the readings) and the plan that goes with them. */
export function useStages() {
  const [state, setState] = useState<{ stages: Stages | null; plan: HouseholdPlan | null; loaded: boolean }>({
    stages: null,
    plan: null,
    loaded: false,
  });
  useEffect(() => {
    let cancelled = false;
    const get = <T,>(path: string) => axios.get<T>(`${API}${path}`, { timeout: 15000 }).then((r) => r.data).catch(() => null);
    Promise.all([get<Stages>('/stages'), get<HouseholdPlan>('/plan')]).then(([stages, plan]) => {
      if (!cancelled) setState({ stages, plan, loaded: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

/** Steps for each area at or above Watch, at that area's stage. */
export function stepsFor(stages: Stages, plan: HouseholdPlan): { area: StageArea; steps: string[] }[] {
  return stages.areas
    .filter((a) => a.stage >= 1)
    .sort((a, b) => b.stage - a.stage)
    .map((area) => ({ area, steps: plan.areas[area.id]?.[String(Math.min(area.stage, 3))] ?? [] }))
    .filter((x) => x.steps.length > 0);
}
