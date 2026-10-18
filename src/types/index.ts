// Core types for Canairy resilience monitoring system

export type AlertLevel = 'green' | 'amber' | 'red' | 'unknown';

export type IndicatorStatus = {
  level: AlertLevel;
  value: number | string | null;
  trend?: 'up' | 'down' | 'stable' | 'unknown';
  lastUpdate: string;
  // LIVE: fresh real reading. STALE: real but older than the source's normal
  // update cycle (shown, never alerts). UNAVAILABLE: no real reading.
  dataSource: 'LIVE' | 'STALE' | 'MANUAL' | 'MOCK' | 'UNAVAILABLE';
  daysSustained?: number;  // How many days at current level
  note?: string;  // Why a reading is stale/unavailable, or how an experimental one is derived
  lastAttempt?: string;  // When collection was last tried
  signalLevel?: AlertLevel;  // Experimental indicators: level before being excluded from alerts
};

export type Domain =
  | 'economy'
  | 'jobs_labor'
  | 'rights_governance'
  | 'security_infrastructure'
  | 'oil_axis'
  | 'ai_window'
  | 'global_conflict'
  | 'domestic_control'
  | 'supply_chain'
  | 'energy'
  | 'social_cohesion'
  | 'water_infrastructure'
  | 'telecommunications'
  | 'housing_mortgage'
  | 'travel_mobility'
  | 'aviation'
  | 'cult_meta';

export const DOMAIN_META: Record<Domain, { label: string; weight: number; icon: string }> = {
  economy:                 { label: 'Economy',          weight: 1.0,  icon: 'DollarSign' },
  jobs_labor:              { label: 'Jobs & Labor',     weight: 1.0,  icon: 'Briefcase' },
  rights_governance:       { label: 'Rights & Gov',     weight: 1.1,  icon: 'Scale' },
  security_infrastructure: { label: 'Security & Infra', weight: 1.25, icon: 'ShieldAlert' },
  oil_axis:                { label: 'Oil Axis',         weight: 1.0,  icon: 'Fuel' },
  ai_window:               { label: 'AI Window',        weight: 1.0,  icon: 'Brain' },
  global_conflict:         { label: 'Global Conflict',  weight: 1.25, icon: 'Globe' },
  domestic_control:        { label: 'Domestic Control', weight: 1.2,  icon: 'Landmark' },
  supply_chain:            { label: 'Supply Chain',     weight: 1.0,  icon: 'Truck' },
  energy:                  { label: 'Energy',           weight: 1.1,  icon: 'Zap' },
  social_cohesion:         { label: 'Social Cohesion',  weight: 0.75, icon: 'Users' },
  water_infrastructure:    { label: 'Water',            weight: 0.9,  icon: 'Droplets' },
  telecommunications:      { label: 'Telecom',          weight: 0.9,  icon: 'Radio' },
  housing_mortgage:        { label: 'Housing',          weight: 0.9,  icon: 'Home' },
  travel_mobility:         { label: 'Travel',           weight: 0.8,  icon: 'Plane' },
  aviation:                { label: 'Aviation',         weight: 0.8,  icon: 'PlaneTakeoff' },
  cult_meta:               { label: 'Social Signals',   weight: 0.7,  icon: 'TrendingUp' },
};

export interface Indicator {
  id: string;
  name: string;
  domain: Domain;
  description: string;
  unit: string;
  thresholds: {
    green: { min?: number; max?: number };
    amber: { min?: number; max?: number };
    red: { min?: number; max?: number };
    threshold_amber?: number;
    threshold_red?: number;
  };
  critical?: boolean;
  greenFlag?: boolean;
  enabled?: boolean;
  unavailable?: boolean; // Data source temporarily unavailable - gray out in UI
  // core: structured data from an official source, drives alerts.
  // experimental: derived from news headlines, shown for context only.
  tier?: 'core' | 'experimental';
  area?: string;  // reader-facing group: costs, jobs, banks, energy, health, safety
  dataSource: string;
  sourceUrl?: string; // Link to the official data source for transparency
  updateFrequency: string;
  metadata?: Record<string, unknown>;
}

export interface Baseline {
  since: string;
  p25: number;
  p50: number;
  p75: number;
  min: number;
  minDate: string;
  max: number;
  maxDate: string;
  percentile?: number; // share of past readings below today's (0–100)
}

export interface IndicatorData extends Indicator {
  status: IndicatorStatus;
  baseline?: Baseline | null;
  history?: DataPoint[];
}

export interface DataPoint {
  timestamp: string;
  value: number;
  level: AlertLevel;
}
