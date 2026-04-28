import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonDir = path.join(__dirname, '..', '..', 'python');
const outputDir = path.join(pythonDir, 'outputs');

export function getPredictionData() {
  const csvPath = path.join(outputDir, 'predicted_test_set.csv');
  if (!fs.existsSync(csvPath)) return null;

  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const v = lines[i].split(',');
    if (v.length < 3) continue;

    const item: any = {
      date: v[0] || 'Unknown',
      actual_price: parseFloat(v[1]) || 0,
      predicted_price: parseFloat(v[2]) || 0,
      confidence_score: v.length > 3 ? parseFloat(v[3]) || 0.5 : 0.5,
      actual_trend: 0,
      predicted_trend: 0,
      trade_suggestion: v.length > 6 ? v[6] || 'HOLD' : 'HOLD',
    };

    if (v.length >= 6) {
      item.actual_trend = parseInt(v[4]) || 0;
      item.predicted_trend = parseInt(v[5]) || 0;
    }
    data.push(item);
  }

  // Compute trends if missing
  if (data.length > 1 && data[0].actual_trend === 0) {
    for (let i = 1; i < data.length; i++) {
      data[i].actual_trend = Math.sign(data[i].actual_price - data[i - 1].actual_price) || 0;
      data[i].predicted_trend = Math.sign(data[i].predicted_price - data[i - 1].predicted_price) || 0;
    }
  }
  return data;
}

export function getLatestPrediction() {
  const jsonPath = path.join(outputDir, 'latest_prediction.json');
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }

  const data = getPredictionData();
  if (!data || data.length === 0) return null;
  const last = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : null;
  let trend = 'STABLE';
  if (prev) {
    if (last.predicted_price > prev.predicted_price) trend = 'UP';
    else if (last.predicted_price < prev.predicted_price) trend = 'DOWN';
  }
  return { ...last, trend, confidence_percentage: Math.round((last.confidence_score || 0.5) * 100) };
}

export function getResults() {
  const p = path.join(outputDir, 'results.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function getSupportResistance() {
  const srPath = path.join(outputDir, 'support_resistance.json');
  if (fs.existsSync(srPath)) return JSON.parse(fs.readFileSync(srPath, 'utf8'));

  const data = getPredictionData();
  if (!data || data.length === 0) return null;

  const prices = data.map((d: any) => d.actual_price);
  const recent = prices.slice(-20);
  const support = Math.min(...recent);
  const resistance = Math.max(...recent);
  const current = recent[recent.length - 1];

  return {
    support, resistance, current_price: current,
    distance_to_support: current - support,
    distance_to_resistance: resistance - current,
  };
}

export function getTradingInsights() {
  const data = getPredictionData();
  if (!data || data.length === 0) return null;

  const latest = data[data.length - 1];
  let trend = 'NEUTRAL';
  if (data.length > 1) {
    const prev = data[data.length - 2].predicted_price;
    if (latest.predicted_price > prev) trend = 'BULLISH';
    else if (latest.predicted_price < prev) trend = 'BEARISH';
  }

  let risk_level = 'HIGH';
  if (latest.confidence_score > 0.7) risk_level = 'LOW';
  else if (latest.confidence_score > 0.5) risk_level = 'MEDIUM';

  return {
    insight: {
      current_prediction: latest.predicted_price,
      current_actual: latest.actual_price,
      confidence: latest.confidence_score,
      suggestion: latest.trade_suggestion,
      trend, risk_level,
      prediction_date: latest.date,
    },
    recent_predictions: data.slice(-10),
  };
}
