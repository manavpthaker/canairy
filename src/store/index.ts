import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { IndicatorData, HOPIScore, SystemStatus, Phase, AlertLevel } from '../types';
import { apiService } from '../services/api';

interface AppState {
  // Data
  indicators: IndicatorData[];
  hopiScore: HOPIScore | null;
  currentPhase: Phase | null;
  systemStatus: SystemStatus | null;
  alerts: any[];
  
  // UI State
  loading: boolean;
  error: string | null;
  selectedIndicator: string | null;
  sidebarOpen: boolean;
  timeRange: '24h' | '7d' | '30d' | '90d';
  
  // Actions
  fetchIndicators: () => Promise<void>;
  fetchHOPIScore: () => Promise<void>;
  fetchSystemStatus: () => Promise<void>;
  refreshAll: () => Promise<void>;
  setSelectedIndicator: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setTimeRange: (range: '24h' | '7d' | '30d' | '90d') => void;
  updateIndicator: (id: string, data: Partial<IndicatorData>) => void;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      indicators: [],
      hopiScore: null,
      currentPhase: null,
      systemStatus: null,
      alerts: [],
      loading: false,
      error: null,
      selectedIndicator: null,
      sidebarOpen: true,
      timeRange: '7d',

      // Actions
      fetchIndicators: async () => {
        set({ loading: true, error: null });
        try {
          const indicators = await apiService.getIndicators();
          set({ indicators, loading: false });
        } catch (error) {
          set({ 
            error: 'Failed to fetch indicators', 
            loading: false 
          });
        }
      },

      fetchHOPIScore: async () => {
        try {
          const hopiScore = await apiService.getHOPIScore();
          const currentPhase = await apiService.getCurrentPhase();
          set({ hopiScore, currentPhase });
        } catch (error) {
          console.error('Failed to fetch HOPI score:', error);
        }
      },

      fetchSystemStatus: async () => {
        try {
          const systemStatus = await apiService.getSystemStatus();
          set({ systemStatus });
        } catch (error) {
          console.error('Failed to fetch system status:', error);
        }
      },

      refreshAll: async () => {
        const { fetchIndicators, fetchHOPIScore, fetchSystemStatus } = get();
        await Promise.all([
          fetchIndicators(),
          fetchHOPIScore(),
          fetchSystemStatus(),
        ]);
      },

      setSelectedIndicator: (id) => set({ selectedIndicator: id }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTimeRange: (range) => set({ timeRange: range }),
      
      updateIndicator: (id, data) => {
        set((state) => ({
          indicators: state.indicators.map((ind) =>
            ind.id === id ? { ...ind, ...data } : ind
          ),
        }));
      },

      setError: (error) => set({ error }),
    }))
  )
);

// Selectors
export const selectIndicatorsByDomain = (domain: string) => (state: AppState) =>
  state.indicators.filter((ind) => ind.domain === domain);

export const selectCriticalIndicators = (state: AppState) =>
  state.indicators.filter((ind) => ind.critical && ind.status.level === 'red');

export const selectIndicatorCounts = (state: AppState) => {
  const counts = { green: 0, amber: 0, red: 0, unknown: 0 };
  state.indicators.forEach((ind) => {
    counts[ind.status.level]++;
  });
  return counts;
};

export const selectTightenUpActive = (state: AppState) => {
  const redCount = state.indicators.filter(
    (ind) => ind.status.level === 'red'
  ).length;
  return redCount >= 2;
};