import { useEffect, useState } from 'react';
import axios from 'axios';

export interface BriefingAction {
  title: string;
  why: string;
  urgency: 'today' | 'this week' | 'this month';
  effort: '5 minutes' | 'under an hour' | 'a weekend';
  cost: 'free' | 'under $50' | '$50-$200' | 'over $200';
  indicator_ids: string[];
}

export interface Briefing {
  headline: string;
  summary: string;
  actions: BriefingAction[];
  watch: { indicator_id: string; note: string }[];
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:5555/api/v1';

/** The server's latest published briefing, or null when none exists yet. */
export function useBriefing() {
  const [state, setState] = useState<{ briefing: Briefing | null; createdAt: string | null; loaded: boolean }>({
    briefing: null,
    createdAt: null,
    loaded: false,
  });
  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API}/briefing`, { timeout: 15000 })
      .then(({ data }) => {
        if (!cancelled) setState({ briefing: data.briefing, createdAt: data.createdAt ?? null, loaded: true });
      })
      .catch(() => {
        if (!cancelled) setState({ briefing: null, createdAt: null, loaded: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}
