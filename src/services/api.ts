import axios from 'axios';
import { IndicatorData, HOPIScore, SystemStatus, Phase } from '../types';
import { mockIndicators, mockHOPIScore, mockSystemStatus } from '../mock/mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555/api/v1';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || false;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('API error:', error.message);
    return Promise.reject(error);
  }
);

// Response type that indicates if fallback data is being used
export interface ApiResponse<T> {
  data: T;
  isUsingFallback: boolean;
  lastSuccessfulFetch?: Date;
}

export interface HistoryPoint {
  timestamp: string;
  value: number;
  level: IndicatorData['status']['level'];
}

// Last real API response, kept so a brief outage shows real (clearly dated)
// data instead of nothing. Never filled with made-up values.
const LAST_KNOWN_KEY = 'canairy:last-indicators';

function saveLastKnown(indicators: IndicatorData[]) {
  try {
    localStorage.setItem(LAST_KNOWN_KEY, JSON.stringify({ savedAt: Date.now(), indicators }));
  } catch {
    // Storage full or blocked; the cache is a convenience only.
  }
}

function loadLastKnown(): { savedAt: Date; indicators: IndicatorData[] } | null {
  try {
    const raw = localStorage.getItem(LAST_KNOWN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.indicators) || parsed.indicators.length === 0) return null;
    return { savedAt: new Date(parsed.savedAt), indicators: parsed.indicators };
  } catch {
    return null;
  }
}

export const apiService = {
  // Indicators
  async getIndicators(): Promise<ApiResponse<IndicatorData[]>> {
    if (USE_MOCK_DATA) {
      return { data: mockIndicators, isUsingFallback: true };
    }

    try {
      const { data } = await api.get('/indicators/');
      const indicators: IndicatorData[] = Array.isArray(data) ? data : data.indicators;
      if (!indicators || indicators.length === 0) throw new Error('Empty indicator list');
      saveLastKnown(indicators);
      return { data: indicators, isUsingFallback: false, lastSuccessfulFetch: new Date() };
    } catch (error) {
      const lastKnown = loadLastKnown();
      if (lastKnown) {
        return { data: lastKnown.indicators, isUsingFallback: true, lastSuccessfulFetch: lastKnown.savedAt };
      }
      throw error;
    }
  },

  async getIndicator(id: string): Promise<IndicatorData> {
    const { data } = await api.get(`/indicators/${id}`);
    return data;
  },

  async getIndicatorHistory(id: string, range: string = '30d'): Promise<HistoryPoint[]> {
    if (USE_MOCK_DATA) return [];
    const { data } = await api.get(`/indicators/${id}/history`, {
      params: { range }
    });
    return data.points ?? [];
  },

  // HOPI Score and Phases
  async getHOPIScore(): Promise<ApiResponse<HOPIScore>> {
    if (USE_MOCK_DATA) {
      return { data: mockHOPIScore, isUsingFallback: true };
    }

    const { data } = await api.get('/hopi');
    return { data, isUsingFallback: false, lastSuccessfulFetch: new Date() };
  },

  async getCurrentPhase(): Promise<Phase> {
    const { data } = await api.get('/phase');
    return data;
  },

  async getPhases(): Promise<Phase[]> {
    const { data } = await api.get('/phases');
    return data.phases;
  },

  // System Status
  async getSystemStatus(): Promise<SystemStatus> {
    if (USE_MOCK_DATA) {
      return mockSystemStatus;
    }
    
    const { data } = await api.get('/status');
    return data;
  },

  // Alerts
  async getAlerts(): Promise<any[]> {
    const { data } = await api.get('/alerts');
    return data.alerts;
  },

  async acknowledgeAlert(id: string): Promise<void> {
    await api.post(`/alerts/${id}/acknowledge`);
  },

  // Emergency Procedures
  async getEmergencyProcedures(phase?: number): Promise<any[]> {
    const { data } = await api.get('/emergency/procedures', {
      params: phase ? { phase } : undefined
    });
    return data.procedures;
  },

  // Export
  async exportReport(format: 'pdf' | 'csv' = 'pdf'): Promise<Blob> {
    const { data } = await api.get('/export/report', {
      params: { format },
      responseType: 'blob'
    });
    return data;
  },
};
