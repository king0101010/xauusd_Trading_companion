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

  // Trading
  trades: TradeRecord[];
  positions: PositionRecord[];
  equity: EquityPoint[];
  balance: number;

  // Predictions
  predictions: PredictionPoint[];

  // Simulation
  simIndex: number;
  simPlaying: boolean;
  simSpeed: number;

  // Actions
  setLivePrice: (p: LivePrice) => void;
  setConnected: (c: boolean) => void;
  setTechnicalAnalysis: (t: TechnicalAnalysis) => void;
  setTradingSignal: (s: TradingSignal) => void;
  setTimeframe: (t: Timeframe) => void;
  setChartType: (c: ChartType) => void;
  setTrades: (t: TradeRecord[]) => void;
  setPositions: (p: PositionRecord[]) => void;
  setEquity: (e: EquityPoint[]) => void;
  setPredictions: (p: PredictionPoint[]) => void;
  setSimIndex: (i: number) => void;
  setSimPlaying: (p: boolean) => void;
  setSimSpeed: (s: number) => void;
}

export const useStore = create<AppState>((set) => ({
  livePrice: null,
  connected: false,
  technicalAnalysis: null,
  tradingSignal: null,

  timeframe: '1D',
  chartType: 'candlestick',

  trades: [],
  positions: [],
  equity: [{ date: new Date().toISOString(), balance: 10000 }],
  balance: 10000,

  predictions: [],

  simIndex: 0,
  simPlaying: false,
  simSpeed: 1000,

  setLivePrice: (p) => set({ livePrice: p }),
  setConnected: (c) => set({ connected: c }),
  setTechnicalAnalysis: (t) => set({ technicalAnalysis: t }),
  setTradingSignal: (s) => set({ tradingSignal: s }),
  setTimeframe: (t) => set({ timeframe: t }),
  setChartType: (c) => set({ chartType: c }),
  setTrades: (t) => set({ trades: t }),
  setPositions: (p) => set({ positions: p }),
  setEquity: (e) => set({ equity: e, balance: e.length > 0 ? e[e.length - 1].balance : 10000 }),
  setPredictions: (p) => set({ predictions: p }),
  setSimIndex: (i) => set({ simIndex: i }),
  setSimPlaying: (p) => set({ simPlaying: p }),
  setSimSpeed: (s) => set({ simSpeed: s }),
}));
