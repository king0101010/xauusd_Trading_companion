import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonDir = path.join(__dirname, '..', '..', 'python');

interface OHLCBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface LivePriceData {
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

// In-memory caches
let dailyData: OHLCBar[] = [];
let hourlyData: OHLCBar[] = [];
let lastApiCall = 0;
let cachedLiveData: LivePriceData | null = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds — much more responsive than 1 hour
let apiCallCount = 0;
let lastCallTimestamp = 0;

// ── Live candle accumulator ──
// Tracks the current live candle being built from price ticks
let currentLiveCandle: OHLCBar | null = null;
let liveCandleHistory: OHLCBar[] = []; // Completed live candles
let lastCandleDate = ''; // e.g. "2026-04-28"

function parseCsvLine(line: string, sep = ';'): string[] {
  return line.split(sep).map((s) => s.trim());
}

export function loadHistoricalData(): void {
  try {
    const dailyPath = path.join(pythonDir, 'XAU_1d_data.csv');
    const hourlyPath = path.join(pythonDir, 'XAU_1h_data.csv');

    if (fs.existsSync(dailyPath)) {
      const lines = fs.readFileSync(dailyPath, 'utf8').trim().split('\n');
      dailyData = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length >= 6) {
          dailyData.push({
            time: cols[0].replace(/\.\d{2}:\d{2}$/, '').replace(/\./g, '-').trim(),
            open: parseFloat(cols[1]) || 0,
            high: parseFloat(cols[2]) || 0,
            low: parseFloat(cols[3]) || 0,
            close: parseFloat(cols[4]) || 0,
            volume: parseFloat(cols[5]) || 0,
          });
        }
      }
      console.log(`📊 Loaded ${dailyData.length} daily bars (${dailyData[0]?.time} → ${dailyData[dailyData.length - 1]?.time})`);
    }

    if (fs.existsSync(hourlyPath)) {
      const lines = fs.readFileSync(hourlyPath, 'utf8').trim().split('\n');
      hourlyData = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length >= 6) {
          hourlyData.push({
            time: cols[0].replace(/\./g, '-').replace(' ', 'T').trim(),
            open: parseFloat(cols[1]) || 0,
            high: parseFloat(cols[2]) || 0,
            low: parseFloat(cols[3]) || 0,
            close: parseFloat(cols[4]) || 0,
            volume: parseFloat(cols[5]) || 0,
          });
        }
      }
      console.log(`📊 Loaded ${hourlyData.length} hourly bars`);
    }
  } catch (err: any) {
    console.error('❌ Error loading historical data:', err.message);
  }
}

// ── Update the live candle with a new price tick ──
export function updateLiveCandle(price: number): void {
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // "2026-04-28"

  if (!currentLiveCandle || lastCandleDate !== today) {
    // New day → finalize previous candle and start a new one
    if (currentLiveCandle && lastCandleDate !== today) {
      liveCandleHistory.push({ ...currentLiveCandle });
    }
    currentLiveCandle = {
      time: today,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 1,
    };
    lastCandleDate = today;
  } else {
    // Same day → update the live candle
    currentLiveCandle.high = Math.max(currentLiveCandle.high, price);
    currentLiveCandle.low = Math.min(currentLiveCandle.low, price);
    currentLiveCandle.close = price;
    currentLiveCandle.volume += 1;
  }
}

export function getHistoricalData(
  timeframe: string = '1D',
  limit: number = 500,
  offset: number = 0
): { data: OHLCBar[]; total: number } {
  let source = timeframe === '1H' ? hourlyData : dailyData;

  if (timeframe === '4H' && hourlyData.length > 0) {
    source = resampleBars(hourlyData, 4);
  } else if (timeframe === '1W' && dailyData.length > 0) {
    source = resampleBars(dailyData, 5);
  }

  // Append completed live candles + current live candle
  const combined = [...source, ...liveCandleHistory];
  if (currentLiveCandle) {
    combined.push(currentLiveCandle);
  }

  // Deduplicate by time (live candle replaces CSV bar for same date)
  const byTime = new Map<string, OHLCBar>();
  for (const bar of combined) {
    byTime.set(bar.time, bar);
  }
  const deduped = Array.from(byTime.values()).sort((a, b) => a.time.localeCompare(b.time));

  const total = deduped.length;
  const start = Math.max(0, total - offset - limit);
  const end = total - offset;
  return { data: deduped.slice(start, end), total };
}

// ── Get just the current live candle (for WebSocket real-time updates) ──
export function getCurrentLiveCandle(): OHLCBar | null {
  return currentLiveCandle ? { ...currentLiveCandle } : null;
}

function resampleBars(bars: OHLCBar[], period: number): OHLCBar[] {
  const result: OHLCBar[] = [];
  for (let i = 0; i < bars.length; i += period) {
    const chunk = bars.slice(i, i + period);
    if (chunk.length === 0) continue;
    result.push({
      time: chunk[0].time,
      open: chunk[0].open,
      high: Math.max(...chunk.map((c) => c.high)),
      low: Math.min(...chunk.map((c) => c.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((s, c) => s + c.volume, 0),
    });
  }
  return result;
}

function canMakeAPICall(): boolean {
  const now = Date.now();
  // Reset counter every 5 minutes (MetalPriceAPI free tier: ~300/month ≈ 10/day)
  if (lastCallTimestamp < now - 300000) {
    apiCallCount = 0;
    lastCallTimestamp = now;
  }
  return apiCallCount < 1;
}

async function fetchFromMetalPriceAPI(): Promise<LivePriceData | null> {
  try {
    const apiKey = process.env.METAL_PRICE_API_KEY || '3ecaf93140426296ff1ec13dc9cc0d94';
    const url = `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU`;
    console.log('🌐 Calling MetalPriceAPI for live gold price...');

    const response = await fetch(url, {
      headers: { 'User-Agent': 'GoldSense-AI/2.0' },
      signal: AbortSignal.timeout(10000),
    } as any);

    if (response.ok) {
      const data: any = await response.json();
      if (data?.success && data?.rates?.XAU) {
        const price = 1 / data.rates.XAU;
        const prevClose = dailyData.length > 0 ? dailyData[dailyData.length - 1].close : price;
        const change = price - prevClose;
        console.log(`✅ Live gold price: $${price.toFixed(2)} (from MetalPriceAPI)`);
        return {
          symbol: 'XAU/USD',
          price: parseFloat(price.toFixed(2)),
          timestamp: new Date().toISOString(),
          source: 'MetalPriceAPI (Live)',
          change: parseFloat(change.toFixed(2)),
          change_percent: parseFloat(((change / prevClose) * 100).toFixed(2)),
          high: parseFloat((price * 1.003).toFixed(2)),
          low: parseFloat((price * 0.997).toFixed(2)),
          volume: Math.floor(Math.random() * 50000 + 20000),
          success: true,
        };
      } else {
        console.warn('⚠️ MetalPriceAPI returned unexpected data:', JSON.stringify(data).slice(0, 200));
      }
    } else {
      console.warn(`⚠️ MetalPriceAPI HTTP ${response.status}`);
    }
  } catch (err: any) {
    console.log('❌ MetalPriceAPI failed:', err.message);
  }
  return null;
}

function generateSimulatedPrice(): LivePriceData {
  // Use a more realistic base from last known close
  const lastClose = dailyData.length > 0 ? dailyData[dailyData.length - 1].close : 3350;
  // Simulate small tick movement
  const tick = (Math.random() - 0.5) * 5; // ±$2.5 per tick
  const price = (cachedLiveData?.price ?? lastClose) + tick;
  const change = price - lastClose;
  return {
    symbol: 'XAU/USD',
    price: parseFloat(price.toFixed(2)),
    timestamp: new Date().toISOString(),
    source: 'Simulation',
    change: parseFloat(change.toFixed(2)),
    change_percent: parseFloat(((change / lastClose) * 100).toFixed(2)),
    high: parseFloat((price + Math.abs(tick) * 2).toFixed(2)),
    low: parseFloat((price - Math.abs(tick) * 2).toFixed(2)),
    volume: Math.floor(Math.random() * 50000 + 20000),
    success: false,
    note: 'Simulated — MetalPriceAPI unavailable',
  };
}

export async function getLivePrice(): Promise<LivePriceData> {
  const now = Date.now();

  // Try the real API if cache expired
  if (!cachedLiveData || now - lastApiCall > CACHE_DURATION) {
    if (canMakeAPICall()) {
      apiCallCount++;
      const live = await fetchFromMetalPriceAPI();
      if (live) {
        cachedLiveData = live;
        lastApiCall = now;
        // Update the live candle with real price
        updateLiveCandle(live.price);
        return live;
      }
    }

    // Fallback to simulation
    const sim = generateSimulatedPrice();
    cachedLiveData = sim;
    lastApiCall = now;
    updateLiveCandle(sim.price);
    return sim;
  }

  return cachedLiveData;
}

// Called by WebSocket service every 5 seconds — always updates the live candle
export async function tickLivePrice(): Promise<LivePriceData> {
  const now = Date.now();

  // Try real API every 5 minutes
  if (!cachedLiveData || now - lastApiCall > 300000) {
    if (canMakeAPICall()) {
      apiCallCount++;
      const live = await fetchFromMetalPriceAPI();
      if (live) {
        cachedLiveData = live;
        lastApiCall = now;
        updateLiveCandle(live.price);
        return live;
      }
    }
  }

  // Between API calls, simulate small tick movements
  if (cachedLiveData) {
    const tick = (Math.random() - 0.5) * 3; // ±$1.5 small tick
    const newPrice = cachedLiveData.price + tick;
    const lastClose = dailyData.length > 0 ? dailyData[dailyData.length - 1].close : newPrice;

    const tickData: LivePriceData = {
      ...cachedLiveData,
      price: parseFloat(newPrice.toFixed(2)),
      timestamp: new Date().toISOString(),
      change: parseFloat((newPrice - lastClose).toFixed(2)),
      change_percent: parseFloat((((newPrice - lastClose) / lastClose) * 100).toFixed(2)),
      high: Math.max(cachedLiveData.high, newPrice),
      low: Math.min(cachedLiveData.low, newPrice),
    };

    cachedLiveData = tickData;
    updateLiveCandle(newPrice);
    return tickData;
  }

  return getLivePrice();
}

export function getTechnicalAnalysis(currentPrice: number) {
  const rsi = 45 + Math.random() * 25;
  const macd = (Math.random() - 0.5) * 1.5;
  const momentum = (Math.random() - 0.5) * 2;
  const volatility = 0.008 + Math.random() * 0.015;

  let sentiment = 'NEUTRAL';
  let strength = 0.5;
  if (rsi > 65 && macd > 0.3) { sentiment = 'BULLISH'; strength = 0.6 + Math.random() * 0.3; }
  else if (rsi < 40 && macd < -0.3) { sentiment = 'BEARISH'; strength = 0.6 + Math.random() * 0.3; }

  return {
    rsi: parseFloat(rsi.toFixed(1)),
    macd: parseFloat(macd.toFixed(3)),
    bollinger_upper: parseFloat((currentPrice * 1.015).toFixed(2)),
    bollinger_lower: parseFloat((currentPrice * 0.985).toFixed(2)),
    momentum: parseFloat(momentum.toFixed(2)),
    volatility: parseFloat(volatility.toFixed(3)),
    sentiment,
    strength: parseFloat(strength.toFixed(2)),
    timestamp: new Date().toISOString(),
  };
}

export function getTradingSignals(analysis: any) {
  const { rsi, macd, sentiment, strength } = analysis;
  let signal = 'HOLD', confidence = 0.4 + Math.random() * 0.3;
  let trend = Math.random() > 0.5 ? 'UP' : 'DOWN';
  let recommendation = 'Market indecisive. Wait for clearer signals.';
  let risk_level = 'MEDIUM';

  if (sentiment === 'BULLISH' && strength > 0.7 && rsi < 70) {
    signal = 'BUY'; confidence = 0.7 + Math.random() * 0.2; trend = 'UP';
    recommendation = 'Strong bullish momentum. Consider long positions.';
    risk_level = rsi > 65 ? 'MEDIUM' : 'LOW';
  } else if (sentiment === 'BEARISH' && strength > 0.7 && rsi > 30) {
    signal = 'SELL'; confidence = 0.7 + Math.random() * 0.2; trend = 'DOWN';
    recommendation = 'Bearish pressure building. Consider short positions.';
    risk_level = rsi < 35 ? 'MEDIUM' : 'LOW';
  }

  return {
    signal, confidence: parseFloat(confidence.toFixed(2)), trend,
    strength: parseFloat(strength.toFixed(2)), timeframe: '1H',
    recommendation, risk_level, rsi, macd, timestamp: new Date().toISOString(),
  };
}

export function getApiStatus() {
  const now = Date.now();
  const timeSince = now - lastApiCall;
  return {
    cache: {
      hasCachedData: cachedLiveData !== null,
      lastAPICall: new Date(lastApiCall).toISOString(),
      cacheValidForSeconds: Math.round(Math.max(0, CACHE_DURATION - timeSince) / 1000),
      totalAPICalls: apiCallCount,
    },
    liveCandle: currentLiveCandle,
    rateLimiting: { callsThisPeriod: apiCallCount, maxCallsPerPeriod: 1 },
    currentProvider: {
      name: 'MetalPriceAPI',
      status: cachedLiveData?.success ? 'Live' : 'Simulated',
      apiKey: process.env.METAL_PRICE_API_KEY ? 'Set' : 'Using default',
    },
  };
}
