import { create } from 'zustand';
import type { LivePrice, TechnicalAnalysis, TradingSignal, TradeRecord, PositionRecord, PredictionPoint, EquityPoint, Timeframe, ChartType } from '../types';

interface AppState {
  // Market
  livePrice: LivePrice | null;
  connected: boolean;
  technicalAnalysis: TechnicalAnalysis | null;
  tradingSignal: TradingSignal | null;

  // Chart
  timeframe: Timeframe;
  chartType: ChartType;

  // UI
  sidebarOpen: boolean;

  // Trading
  trades: TradeRecord[];
  positions: PositionRecord[];
  equity: EquityPoint[];
  balance: number;

  // Predictions
  predictions: PredictionPoint[];

  // Price Alerts
  alerts: { id: number; price: number; direction: 'above' | 'below'; triggered: boolean }[];

  // Actions
  setLivePrice: (p: LivePrice) => void;
  setConnected: (c: boolean) => void;
  setTechnicalAnalysis: (t: TechnicalAnalysis) => void;
  setTradingSignal: (s: TradingSignal) => void;
  setTimeframe: (t: Timeframe) => void;
  setChartType: (c: ChartType) => void;
  toggleSidebar: () => void;
  setTrades: (t: TradeRecord[]) => void;
  setPositions: (p: PositionRecord[]) => void;
  setEquity: (e: EquityPoint[]) => void;
  setPredictions: (p: PredictionPoint[]) => void;
  addAlert: (price: number, direction: 'above' | 'below') => void;
  removeAlert: (id: number) => void;
  triggerAlert: (id: number) => void;
}

let alertIdCounter = 0;

export const useStore = create<AppState>((set) => ({
  livePrice: null,
  connected: false,
  technicalAnalysis: null,
  tradingSignal: null,

  timeframe: '1D',
  chartType: 'candlestick',

  sidebarOpen: true,

  trades: [],
  positions: [],
  equity: [],
  balance: 10000,

  predictions: [],

  alerts: [],

  setLivePrice: (p) => set({ livePrice: p }),
  setConnected: (c) => set({ connected: c }),
  setTechnicalAnalysis: (t) => set({ technicalAnalysis: t }),
  setTradingSignal: (s) => set({ tradingSignal: s }),
  setTimeframe: (t) => set({ timeframe: t }),
  setChartType: (c) => set({ chartType: c }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTrades: (t) => set({ trades: t }),
  setPositions: (p) => set({ positions: p }),
  setEquity: (e) => set({ equity: e, balance: e.length > 0 ? e[e.length - 1].balance : 10000 }),
  setPredictions: (p) => set({ predictions: p }),
  addAlert: (price, direction) =>
    set((s) => ({
      alerts: [...s.alerts, { id: ++alertIdCounter, price, direction, triggered: false }],
    })),
  removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  triggerAlert: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, triggered: true } : a)),
    })),
}));
