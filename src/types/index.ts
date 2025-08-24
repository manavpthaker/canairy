// Core types for Brown Man Bunker monitoring system

export type AlertLevel = 'green' | 'amber' | 'red' | 'unknown';

export type IndicatorStatus = {
  level: AlertLevel;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  lastUpdate: string;
  dataSource: 'LIVE' | 'MANUAL' | 'MOCK';
};

export type Domain = 
  | 'economy'
  | 'global_conflict'
  | 'energy'
  | 'ai_tech'
  | 'domestic_control';

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
  };
  critical?: boolean;
  greenFlag?: boolean;
  dataSource: string;
  updateFrequency: string;
  metadata?: Record<string, any>;
}

export interface IndicatorData extends Indicator {
  status: IndicatorStatus;
  history?: DataPoint[];
}

export interface DataPoint {
  timestamp: string;
  value: number;
  level: AlertLevel;
}

export interface HOPIScore {
  score: number;
  confidence: number;
  phase: number;
  targetPhase: number;
  domains: Record<Domain, DomainScore>;
  timestamp: string;
}

export interface DomainScore {
  score: number;
  weight: number;
  indicators: string[];
  criticalAlerts: string[];
}

export interface Phase {
  number: number;
  name: string;
  description: string;
  triggers: string[];
  actions: string[];
  color: string;
}

export interface SystemStatus {
  operational: boolean;
  lastUpdate: string;
  activeAlerts: number;
  dataQuality: number;
  message?: string;
}

export interface EmergencyProcedure {
  id: string;
  title: string;
  phase: number;
  steps: string[];
  priority: 'immediate' | 'urgent' | 'standard';
  completed?: boolean;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'doughnut';
  timeRange: '24h' | '7d' | '30d' | '90d';
  showThresholds: boolean;
  animated: boolean;
}