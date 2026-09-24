import { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5555/api/v1';

export interface LocalSignal {
  metric: 'fema' | 'wastewater' | 'drought' | 'unemployment' | 'gas' | 'electricity' | 'grocery';
  name: string;
  where: string;
  value: number;
  level: 'red' | 'amber' | 'green' | 'none';
  as_of: string;
  national?: { value: number; change_pct?: number } | null;
  // metric-specific details
  disasters?: { number: number; type: string; date: string; title: string; individual_assistance: boolean }[];
  individual_assistance?: boolean;
  category?: string;
  pathogen?: string;
  extreme_pct?: number;
  any_drought_pct?: number;
  change_pct?: number;
  rise_from_12mo_low?: number;
}

export interface LocalData {
  fips: string;
  county: string;
  state: string;
  place: string;
  signals: LocalSignal[];
}

export type Place = { lat: number; lon: number; county: string | null };

/** ZIP -> coordinates and county from a static file on this site. The ZIP never leaves the browser. */
export async function lookupZip(zip: string): Promise<Place | null> {
  const table: Record<string, [number, number, string | null]> = await fetch(`/zip/${zip.slice(0, 3)}.json`).then((r) =>
    r.ok ? r.json() : {},
  );
  const row = table[zip];
  return row ? { lat: row[0], lon: row[1], county: row[2] } : null;
}

type State = { status: 'idle' | 'loading' | 'ready' | 'unknown-zip' | 'error'; place: Place | null; data: LocalData | null };

/** County, state and regional signals for the household's ZIP. Only the county code is sent to Canairy. */
export function useLocal(zip: string | undefined): State {
  const [state, setState] = useState<State>({ status: 'idle', place: null, data: null });
  useEffect(() => {
    if (!zip) {
      setState({ status: 'idle', place: null, data: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading' }));
    (async () => {
      try {
        const place = await lookupZip(zip);
        if (!place) {
          if (!cancelled) setState({ status: 'unknown-zip', place: null, data: null });
          return;
        }
        const data = place.county ? (await axios.get(`${API}/local/${place.county}`, { timeout: 15000 })).data : null;
        if (!cancelled) setState({ status: 'ready', place, data });
      } catch {
        if (!cancelled) setState((s) => ({ ...s, status: 'error' }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [zip]);
  return state;
}

export interface RuleChange {
  id: string;
  title: string;
  type: 'final' | 'proposed';
  summary: string | null;
  affects_families: boolean | null;
  url: string;
  published: string;
  effective: string | null;
  comments_close: string | null;
  open_for_comment: boolean;
  agency: string;
  programs: string[];
}

/** Federal rules that name a family benefit program, newest first. */
export function useRules(days = 120) {
  const [rules, setRules] = useState<RuleChange[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API}/rules`, { params: { days }, timeout: 15000 })
      .then(({ data }) => !cancelled && setRules(data.rules))
      .catch(() => !cancelled && setRules([]));
    return () => {
      cancelled = true;
    };
  }, [days]);
  return rules;
}
