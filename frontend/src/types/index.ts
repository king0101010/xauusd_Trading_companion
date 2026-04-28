export interface OHLCBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface LivePrice {
  symbol: string;
  price: number;
  timestamp: string;
  source: string;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  volume: number;
  success: boolean;
  note?: string;
}

export interface TechnicalAnalysis {
  rsi: number;
  macd: number;
  bollinger_upper: number;
  bollinger_lower: number;
  momentum: number;
  volatility: number;
  sentiment: string;
  strength: number;
  timestamp: string;
}

export interface TradingSignal {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  trend: string;
  strength: number;
  timeframe: string;
  recommendation: string;
  risk_level: string;
  rsi: number;
  macd: number;
  timestamp: string;
}

export interface TradeRecord {
  id: number;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  pnl: number | null;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
}

export interface PositionRecord {
  id: number;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  unrealizedPnl: number;
  status: 'ACTIVE' | 'CLOSED';
  openedAt: string;
}

export interface PredictionPoint {
  date: string;
  actual_price: number;
  predicted_price: number;
  confidence_score: number;
  actual_trend: number;
  predicted_trend: number;
  trade_suggestion: string;
}

export interface EquityPoint {
  date: string;
  balance: number;
}

export type Timeframe = '1H' | '4H' | '1D' | '1W';
export type ChartType = 'candlestick' | 'line';
