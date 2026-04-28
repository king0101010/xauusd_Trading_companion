// server.ts — GoldSense AI Backend v2.0
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeDatabase } from './src/config/database.js';
import { loadHistoricalData } from './src/services/marketService.js';
import { ensurePredictionData } from './src/services/pythonRunner.js';
import { initializeWebSocket } from './src/services/websocketService.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import marketRoutes from './src/routes/marketRoutes.js';
import predictionRoutes from './src/routes/predictionRoutes.js';
import tradeRoutes from './src/routes/tradeRoutes.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000');
const httpServer = createServer(app);

// ── Middleware ──
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ── API Routes ──
app.use('/api/market', marketRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/trades', tradeRoutes);

// ── Legacy routes (backward compat) ──
app.get('/live-price', async (_req, res) => {
  const { getLivePrice } = await import('./src/services/marketService.js');
  res.json(await getLivePrice());
});
app.get('/prediction-data', (_req, res) => {
  import('./src/services/predictionService.js').then((s) => {
    const d = s.getPredictionData();
    d ? res.json(d) : res.status(404).json({ error: 'Not found' });
  });
});
app.get('/technical-analysis', async (_req, res) => {
  const m = await import('./src/services/marketService.js');
  const p = (await m.getLivePrice()).price;
  res.json(m.getTechnicalAnalysis(p));
});
app.get('/trading-signals', async (_req, res) => {
  const m = await import('./src/services/marketService.js');
  const p = (await m.getLivePrice()).price;
  res.json(m.getTradingSignals(m.getTechnicalAnalysis(p)));
});
app.get('/support-resistance', (_req, res) => {
  import('./src/services/predictionService.js').then((s) => {
    const d = s.getSupportResistance();
    d ? res.json(d) : res.status(404).json({ error: 'Not found' });
  });
});
app.get('/latest-prediction', (_req, res) => {
  import('./src/services/predictionService.js').then((s) => {
    const d = s.getLatestPrediction();
    d ? res.json(d) : res.status(404).json({ error: 'Not found' });
  });
});

// ── Error handler ──
app.use(errorHandler);

// ── Startup ──
async function startServer() {
  console.log('🚀 Starting GoldSense AI Backend v2.0...');

  // 1. Initialize MySQL database (auto-create DB + tables)
  await initializeDatabase();

  // 2. Load historical CSV data into memory
  loadHistoricalData();

  // 3. Ensure Python model predictions exist (run if needed)
  ensurePredictionData().catch((e) => console.warn('⚠️ Python model:', e.message));

  // 4. Initialize WebSocket
  initializeWebSocket(httpServer);

  // 5. Start HTTP server
  httpServer.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`🔌 WebSocket active on same port`);
    console.log(`📊 API: /api/market, /api/predictions, /api/trades`);
  });
}

startServer().catch(console.error);
