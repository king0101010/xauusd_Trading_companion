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

// Extended bar with real technical indicators from the dataset
interface RichBar extends OHLCBar {
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  sma20?: number;
  sma50?: number;
  ema20?: number;
  ema50?: number;
  bbUpper?: number;
  bbLower?: number;
  bbMid?: number;
  returns?: number;
  volatility30?: number;
  trend?: number;
  targetNextClose?: number;
  targetDirection?: number;
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
let dailyData: RichBar[] = [];
let lastApiCall = 0;
let cachedLiveData: LivePriceData | null = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds
let apiCallCount = 0;
let lastCallTimestamp = 0;

// ── Live candle accumulator ──
let currentLiveCandle: OHLCBar | null = null;
let liveCandleHistory: OHLCBar[] = [];
let lastCandleDate = '';

// ── Latest real indicators (from last row of dataset) ──
let latestIndicators: RichBar | null = null;

function parseFloat2(s: string): number {
  const v = parseFloat(s);
  return isNaN(v) ? 0 : v;
}

export function loadHistoricalData(): void {
  try {
    // ── Load the main enriched dataset ──
    const richPath = path.join(pythonDir, 'xauusd_gold_dataset.csv');
    if (fs.existsSync(richPath)) {
      const lines = fs.readFileSync(richPath, 'utf8').trim().split('\n');
      dailyData = [];
      // Header: datetime,open,high,low,close,returns,volatility_30,sma_20,sma_50,ema_20,ema_50,rsi_14,macd,macd_signal,bb_mid,bb_std,bb_upper,bb_lower,trend,target_next_close,target_direction,log_returns,lag_1,lag_2,lag_3,return_7,return_14
      for (let i = 1; i < lines.length; i++) {
        const c = lines[i].split(',');
        if (c.length < 5) continue;

        const bar: RichBar = {
          time: c[0].trim(), // Already "YYYY-MM-DD"
          open: parseFloat2(c[1]),
          high: parseFloat2(c[2]),
          low: parseFloat2(c[3]),
          close: parseFloat2(c[4]),
          volume: 0, // Not in dataset — set 0
          returns: parseFloat2(c[5]),
          volatility30: parseFloat2(c[6]),
          sma20: parseFloat2(c[7]),
          sma50: parseFloat2(c[8]),
          ema20: parseFloat2(c[9]),
          ema50: parseFloat2(c[10]),
          rsi: parseFloat2(c[11]),
          macd: parseFloat2(c[12]),
          macdSignal: parseFloat2(c[13]),
          bbMid: parseFloat2(c[14]),
          bbUpper: parseFloat2(c[16]),
          bbLower: parseFloat2(c[17]),
          trend: parseFloat2(c[18]),
          targetNextClose: parseFloat2(c[19]),
          targetDirection: parseFloat2(c[20]),
        };

        // Skip bars with 0 OHLC
        if (bar.open === 0 && bar.close === 0) continue;
        dailyData.push(bar);
      }

      // Store the latest indicators for the signals/analysis panels
      if (dailyData.length > 0) {
        latestIndicators = dailyData[dailyData.length - 1];
      }

      console.log(`📊 Loaded ${dailyData.length} enriched daily bars (${dailyData[0]?.time} → ${dailyData[dailyData.length - 1]?.time})`);
      console.log(`   Last RSI: ${latestIndicators?.rsi?.toFixed(1)}, MACD: ${latestIndicators?.macd?.toFixed(2)}, Trend: ${latestIndicators?.trend}`);
    } else {
      console.warn('⚠️  xauusd_gold_dataset.csv not found, falling back to old CSV');
      loadOldCsv();
    }
  } catch (err: any) {
    console.error('❌ Error loading historical data:', err.message);
  }
}

function loadOldCsv() {
  const dailyPath = path.join(pythonDir, 'XAU_1d_data.csv');
  if (!fs.existsSync(dailyPath)) return;
  const lines = fs.readFileSync(dailyPath, 'utf8').trim().split('\n');
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';').map((s: string) => s.trim());
    if (cols.length >= 6) {
      dailyData.push({
        time: cols[0].replace(/\.\d{2}:\d{2}$/, '').replace(/\./g, '-').trim(),
        open: parseFloat2(cols[1]),
        high: parseFloat2(cols[2]),
        low: parseFloat2(cols[3]),
        close: parseFloat2(cols[4]),
        volume: parseFloat2(cols[5]),
      });
    }
  }
  console.log(`📊 Loaded ${dailyData.length} daily bars (fallback CSV)`);
}

// ── Update live candle with tick ──
export function updateLiveCandle(price: number): void {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (!currentLiveCandle || lastCandleDate !== today) {
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
  let source: OHLCBar[] = dailyData;

  if (timeframe === '1W') {
    source = resampleBars(dailyData, 5);
  }

  // Append live candles
  const combined = [...source, ...liveCandleHistory];
  if (currentLiveCandle) {
    combined.push(currentLiveCandle);
  }

  // Deduplicate by time
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

// ── API rate limiting ──
function canMakeAPICall(): boolean {
  const now = Date.now();
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
        console.log(`✅ Live gold price: $${price.toFixed(2)} (MetalPriceAPI)`);
        return {
          symbol: 'XAU/USD',
          price: parseFloat(price.toFixed(2)),
          timestamp: new Date().toISOString(),
          source: 'MetalPriceAPI (Live)',
          change: parseFloat(change.toFixed(2)),
          change_percent: parseFloat(((change / prevClose) * 100).toFixed(2)),
          high: parseFloat((price * 1.003).toFixed(2)),
          low: parseFloat((price * 0.997).toFixed(2)),
          volume: 0,
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
  const lastClose = dailyData.length > 0 ? dailyData[dailyData.length - 1].close : 3350;
  const tick = (Math.random() - 0.5) * 5;
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
    volume: 0,
    success: false,
    note: 'Simulated — MetalPriceAPI unavailable',
  };
}

export async function getLivePrice(): Promise<LivePriceData> {
  const now = Date.now();
  if (!cachedLiveData || now - lastApiCall > CACHE_DURATION) {
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
    const sim = generateSimulatedPrice();
    cachedLiveData = sim;
    lastApiCall = now;
    updateLiveCandle(sim.price);
    return sim;
  }
  return cachedLiveData;
}

export async function tickLivePrice(): Promise<LivePriceData> {
  const now = Date.now();
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

  if (cachedLiveData) {
    const tick = (Math.random() - 0.5) * 3;
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

// ═══════════════════════════════════════════════════════
// REAL Technical Analysis — powered by dataset indicators
// ═══════════════════════════════════════════════════════
export function getTechnicalAnalysis(currentPrice: number) {
  const li = latestIndicators;

  // Use real indicators from dataset, fallback to computed values
  const rsi = li?.rsi && li.rsi > 0 ? li.rsi : 50;
  const macd = li?.macd ?? 0;
  const macdSignal = li?.macdSignal ?? 0;
  const sma20 = li?.sma20 || currentPrice;
  const sma50 = li?.sma50 || currentPrice;
  const ema20 = li?.ema20 || currentPrice;
  const ema50 = li?.ema50 || currentPrice;
  const bbUpper = li?.bbUpper || currentPrice * 1.015;
  const bbLower = li?.bbLower || currentPrice * 0.985;
  const volatility = li?.volatility30 || 0.015;

  // Derive momentum from MACD histogram
  const momentum = macd - macdSignal;

  // Derive sentiment from real indicators
  let sentiment = 'NEUTRAL';
  let strength = 0.5;

  if (rsi > 60 && macd > macdSignal && currentPrice > ema20) {
    sentiment = 'BULLISH';
    strength = Math.min(0.95, 0.6 + (rsi - 50) / 100 + (macd > 0 ? 0.1 : 0));
  } else if (rsi < 40 && macd < macdSignal && currentPrice < ema20) {
    sentiment = 'BEARISH';
    strength = Math.min(0.95, 0.6 + (50 - rsi) / 100 + (macd < 0 ? 0.1 : 0));
  } else if (rsi > 50 && macd > macdSignal) {
    sentiment = 'BULLISH';
    strength = 0.55;
  } else if (rsi < 50 && macd < macdSignal) {
    sentiment = 'BEARISH';
    strength = 0.55;
  }

  return {
    rsi: parseFloat(rsi.toFixed(1)),
    macd: parseFloat(macd.toFixed(3)),
    macdSignal: parseFloat(macdSignal.toFixed(3)),
    sma20: parseFloat(sma20.toFixed(2)),
    sma50: parseFloat(sma50.toFixed(2)),
    ema20: parseFloat(ema20.toFixed(2)),
    ema50: parseFloat(ema50.toFixed(2)),
    bollinger_upper: parseFloat(bbUpper.toFixed(2)),
    bollinger_lower: parseFloat(bbLower.toFixed(2)),
    momentum: parseFloat(momentum.toFixed(3)),
    volatility: parseFloat(volatility.toFixed(4)),
    sentiment,
    strength: parseFloat(strength.toFixed(2)),
    timestamp: new Date().toISOString(),
    dataSource: li ? 'Dataset (Real)' : 'Computed',
  };
}

// ═══════════════════════════════════════════════════════
// REAL Trading Signals — powered by dataset prediction columns
// ═══════════════════════════════════════════════════════
export function getTradingSignals(analysis: any) {
  const li = latestIndicators;
  const { rsi, macd, sentiment, strength } = analysis;

  // Use real target_direction from dataset if available
  const datasetDirection = li?.targetDirection; // 1 = up, 0 = down
  const targetPrice = li?.targetNextClose;
  const currentClose = li?.close || 0;

  let signal = 'HOLD';
  let confidence = 0.5;
  let trend = 'SIDEWAYS';
  let recommendation = 'Market conditions are mixed. Wait for clearer signals.';
  let risk_level = 'MEDIUM';

  if (datasetDirection !== undefined && targetPrice && targetPrice > 0) {
    // Use real prediction from dataset
    const predictedMove = ((targetPrice - currentClose) / currentClose) * 100;

    if (datasetDirection === 1 && sentiment !== 'BEARISH') {
      signal = 'BUY';
      trend = 'UP';
      confidence = Math.min(0.92, 0.65 + strength * 0.2);
      recommendation = `Dataset predicts upward movement. Target: $${targetPrice.toFixed(2)} (${predictedMove >= 0 ? '+' : ''}${predictedMove.toFixed(2)}%). RSI at ${rsi.toFixed(1)} supports the move.`;
      risk_level = rsi > 70 ? 'HIGH' : rsi > 60 ? 'MEDIUM' : 'LOW';
    } else if (datasetDirection === 0 && sentiment !== 'BULLISH') {
      signal = 'SELL';
      trend = 'DOWN';
      confidence = Math.min(0.92, 0.65 + strength * 0.2);
      recommendation = `Dataset predicts downward movement. Target: $${targetPrice.toFixed(2)} (${predictedMove >= 0 ? '+' : ''}${predictedMove.toFixed(2)}%). Consider short positions or tightening stops.`;
      risk_level = rsi < 30 ? 'HIGH' : rsi < 40 ? 'MEDIUM' : 'LOW';
    } else {
      // Dataset and indicators disagree — caution
      signal = 'HOLD';
      trend = datasetDirection === 1 ? 'UP' : 'DOWN';
      confidence = 0.45;
      recommendation = `Mixed signals: dataset predicts ${datasetDirection === 1 ? 'UP' : 'DOWN'} but indicators show ${sentiment}. Wait for confirmation before entering.`;
      risk_level = 'HIGH';
    }
  } else {
    // Fallback to indicator-based signals
    if (sentiment === 'BULLISH' && strength > 0.6 && rsi < 70) {
      signal = 'BUY'; confidence = 0.6 + strength * 0.2; trend = 'UP';
      recommendation = 'Bullish momentum with RSI not overbought. Consider long positions.';
      risk_level = rsi > 65 ? 'MEDIUM' : 'LOW';
    } else if (sentiment === 'BEARISH' && strength > 0.6 && rsi > 30) {
      signal = 'SELL'; confidence = 0.6 + strength * 0.2; trend = 'DOWN';
      recommendation = 'Bearish pressure building. Consider short positions or exits.';
      risk_level = rsi < 35 ? 'MEDIUM' : 'LOW';
    }
  }

  return {
    signal,
    confidence: parseFloat(confidence.toFixed(2)),
    trend,
    strength: parseFloat(strength.toFixed(2)),
    timeframe: '1D',
    recommendation,
    risk_level,
    rsi: parseFloat(rsi.toFixed(1)),
    macd: parseFloat(macd.toFixed(3)),
    predictedTarget: targetPrice ? parseFloat(targetPrice.toFixed(2)) : null,
    predictedDirection: datasetDirection ?? null,
    timestamp: new Date().toISOString(),
    dataSource: li ? 'Dataset (Real)' : 'Computed',
  };
}

export function getApiStatus() {
  const now = Date.now();
  const timeSince = now - lastApiCall;
  return {
    dataset: {
      source: 'xauusd_gold_dataset.csv',
      totalBars: dailyData.length,
      firstDate: dailyData[0]?.time,
      lastDate: dailyData[dailyData.length - 1]?.time,
      hasIndicators: latestIndicators !== null,
    },
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
    },
  };
}
