import axios from 'axios';
import { IndicatorData, HOPIScore, SystemStatus, Phase } from '../types';
import { mockIndicators, mockHOPIScore, mockSystemStatus } from '../mock/mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555/api';
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
    console.error('API Error:', error);
    // If API fails, use mock data
    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      console.log('API unavailable, using mock data');
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Indicators
  async getIndicators(): Promise<IndicatorData[]> {
    if (USE_MOCK_DATA) {
      return mockIndicators;
    }
    
    try {
      const { data } = await api.get('/indicators');
      return data.indicators;
    } catch (error) {
      console.log('Using mock indicators due to API error');
      return mockIndicators;
    }
  },

  async getIndicator(id: string): Promise<IndicatorData> {
    const { data } = await api.get(`/indicators/${id}`);
    return data;
  },

  async getIndicatorHistory(id: string, range: string = '7d'): Promise<any> {
    const { data } = await api.get(`/indicators/${id}/history`, {
      params: { range }
    });
    return data;
  },

  // HOPI Score and Phases
  async getHOPIScore(): Promise<HOPIScore> {
    if (USE_MOCK_DATA) {
      return mockHOPIScore;
    }
    
    try {
      const { data } = await api.get('/hopi');
      return data;
    } catch (error) {
      console.log('Using mock HOPI score due to API error');
      return mockHOPIScore;
    }
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
    
    try {
      const { data } = await api.get('/status');
      return data;
    } catch (error) {
      console.log('Using mock system status due to API error');
      return mockSystemStatus;
    }
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

  // Manual Refresh
  async refreshIndicator(id: string): Promise<IndicatorData> {
    const { data } = await api.post(`/indicators/${id}/refresh`);
    return data;
  },

  async refreshAll(): Promise<void> {
    await api.post('/indicators/refresh-all');
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

// WebSocket connection for real-time updates
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval = 5000;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // Reduced from 10
  private listeners: Map<string, Set<Function>> = new Map();
  private enabled = !USE_MOCK_DATA; // Disable WebSocket when using mock data

  connect(url: string = 'ws://localhost:5555/ws') {
    if (!this.enabled) {
      console.log('WebSocket disabled in mock mode');
      return;
    }
    
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected', null);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data.payload);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.warn('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('disconnected', null);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect();
        }
      };
    } catch (error) {
      console.warn('Failed to create WebSocket connection:', error);
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect();
    }, this.reconnectInterval);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
}

export const wsService = new WebSocketService();