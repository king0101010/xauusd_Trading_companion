import { create } from 'zustand';
import type { LivePrice, TechnicalAnalysis, TradingSignal, TradeRecord, PositionRecord, PredictionPoint, EquityPoint, Timeframe, ChartType } from '../types';

interface AppState {
  // Market
  livePrice: LivePrice | null;
  liveCandle: { time: string; open: number; high: number; low: number; close: number; volume: number } | null;
  connected: boolean;
  technicalAnalysis: TechnicalAnalysis | null;
  tradingSignal: TradingSignal | null;

  // Chart
  timeframe: Timeframe;
  chartType: ChartType;

  // UI
  sidebarOpen: boolean;
  currentPage: 'dashboard' | 'analytics';

  // Trading
  trades: TradeRecord[];
  positions: PositionRecord[];
  equity: EquityPoint[];
  balance: number;

  // Predictions
  predictions: PredictionPoint[];

  // Actions
  setLivePrice: (p: LivePrice) => void;
  setLiveCandle: (c: any) => void;
  setConnected: (c: boolean) => void;
  setTechnicalAnalysis: (t: TechnicalAnalysis) => void;
  setTradingSignal: (s: TradingSignal) => void;
  setTimeframe: (t: Timeframe) => void;
  setChartType: (c: ChartType) => void;
  toggleSidebar: () => void;
  setPage: (p: 'dashboard' | 'analytics') => void;
  setTrades: (t: TradeRecord[]) => void;
  setPositions: (p: PositionRecord[]) => void;
  setEquity: (e: EquityPoint[]) => void;
  setPredictions: (p: PredictionPoint[]) => void;
}

export const useStore = create<AppState>((set) => ({
  livePrice: null,
  liveCandle: null,
  connected: false,
  technicalAnalysis: null,
  tradingSignal: null,

  timeframe: '1D',
  chartType: 'candlestick',

  sidebarOpen: true,
  currentPage: 'dashboard',

  trades: [],
  positions: [],
  equity: [],
  balance: 10000,

  predictions: [],

  setLivePrice: (p) => set({ livePrice: p }),
  setLiveCandle: (c) => set({ liveCandle: c }),
  setConnected: (c) => set({ connected: c }),
  setTechnicalAnalysis: (t) => set({ technicalAnalysis: t }),
  setTradingSignal: (s) => set({ tradingSignal: s }),
  setTimeframe: (t) => set({ timeframe: t }),
  setChartType: (c) => set({ chartType: c }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setPage: (p) => set({ currentPage: p }),
  setTrades: (t) => set({ trades: t }),
  setPositions: (p) => set({ positions: p }),
  setEquity: (e) => set({ equity: e, balance: e.length > 0 ? e[e.length - 1].balance : 10000 }),
  setPredictions: (p) => set({ predictions: p }),
}));
