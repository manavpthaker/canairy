import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { IndicatorData, HOPIScore, SystemStatus, Phase } from '../types';
import { apiService } from '../services/api';

// Devtools only in development: zustand's devtools reads the whole
// import.meta.env object, which makes Vite embed every VITE_ variable in the bundle.
const withDevtools = (import.meta.env.DEV ? devtools : (fn: unknown) => fn) as typeof devtools;

interface AppState {
  indicators: IndicatorData[];
  hopiScore: HOPIScore | null;
  currentPhase: Phase | null;
  systemStatus: SystemStatus | null;

  loading: boolean;
  error: string | null;
  usingFallbackData: boolean; // API unreachable; showing this device's last real readings
  lastSuccessfulFetch: Date | null;

  fetchIndicators: () => Promise<void>;
  fetchHOPIScore: () => Promise<void>;
  fetchSystemStatus: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useStore = create<AppState>()(
  withDevtools((set, get) => ({
    indicators: [],
    hopiScore: null,
    currentPhase: null,
    systemStatus: null,
    loading: false,
    error: null,
    usingFallbackData: false,
    lastSuccessfulFetch: null,

    fetchIndicators: async () => {
      set({ loading: true, error: null });
      try {
        const response = await apiService.getIndicators();
        set({
          indicators: response.data,
          loading: false,
          usingFallbackData: response.isUsingFallback,
          lastSuccessfulFetch: response.lastSuccessfulFetch || null,
        });
      } catch {
        set({ error: 'Failed to fetch indicators', loading: false, usingFallbackData: true });
      }
    },

    fetchHOPIScore: async () => {
      try {
        const [hopi, currentPhase] = await Promise.all([apiService.getHOPIScore(), apiService.getCurrentPhase()]);
        set({ hopiScore: hopi.data, currentPhase });
      } catch {
        // Optional: the pages work from indicators alone.
      }
    },

    fetchSystemStatus: async () => {
      try {
        set({ systemStatus: await apiService.getSystemStatus() });
      } catch {
        // Optional.
      }
    },

    refreshAll: async () => {
      const { fetchIndicators, fetchHOPIScore, fetchSystemStatus } = get();
      await fetchIndicators();
      await Promise.all([fetchHOPIScore(), fetchSystemStatus()]);
    },
  })),
);
