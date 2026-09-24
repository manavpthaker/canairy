import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { IndicatorData } from '../types';
import { apiService } from '../services/api';

// Devtools only in development: zustand's devtools reads the whole
// import.meta.env object, which makes Vite embed every VITE_ variable in the bundle.
const withDevtools = (import.meta.env.DEV ? devtools : (fn: unknown) => fn) as typeof devtools;

interface AppState {
  indicators: IndicatorData[];
  loading: boolean;
  error: string | null;
  usingFallbackData: boolean; // API unreachable; showing this device's last real readings
  lastSuccessfulFetch: Date | null;
  refreshAll: () => Promise<void>;
}

export const useStore = create<AppState>()(
  withDevtools((set) => ({
    indicators: [],
    loading: false,
    error: null,
    usingFallbackData: false,
    lastSuccessfulFetch: null,

    refreshAll: async () => {
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
  })),
);
