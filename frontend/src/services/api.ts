const BASE = '';

async function get<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function post<T>(url: string, body: any): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function del<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getLivePrice: () => get('/api/market/live-price'),
  getHistorical: (tf: string, limit = 500) => get(`/api/market/historical?timeframe=${tf}&limit=${limit}`),
  getTechnicalAnalysis: () => get('/api/market/technical-analysis'),
  getTradingSignals: () => get('/api/market/trading-signals'),
  getApiStatus: () => get('/api/market/api-status'),
  getMarketInsights: () => get('/api/market/insights'),

  runPredict: () => get('/api/predictions/predict'),
  getPredictionData: () => get('/api/predictions/prediction-data'),
  getLatestPrediction: () => get('/api/predictions/latest-prediction'),
  getTradingInsights: () => get('/api/predictions/trading-insights'),
  getSupportResistance: () => get('/api/predictions/support-resistance'),

  openTrade: (data: any) => post('/api/trades/open', data),
  closeTrade: (id: number, exitPrice: number) => post(`/api/trades/close/${id}`, { exitPrice }),
  closePosition: (posId: number, exitPrice: number) => post(`/api/trades/close-position/${posId}`, { exitPrice }),
  getOpenTrades: () => get('/api/trades/open'),
  getTradeHistory: () => get('/api/trades/history'),
  getPositions: () => get('/api/trades/positions'),
  getEquity: () => get('/api/trades/equity'),
  getTradeAnalytics: () => get('/api/trades/analytics'),

  // Price Alerts (persisted in MySQL)
  getAlerts: () => get('/api/trades/alerts'),
  createAlert: (targetPrice: number, direction: 'above' | 'below') =>
    post('/api/trades/alerts', { targetPrice, direction }),
  deleteAlert: (id: number) => del(`/api/trades/alerts/${id}`),
  triggerAlert: (id: number) => post(`/api/trades/alerts/${id}/trigger`, {}),
};
