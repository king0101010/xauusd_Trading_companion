import { Router, Request, Response } from 'express';
import * as marketService from '../services/marketService.js';
import { fetchGoldNews, generateInsights } from '../services/insightsService.js';

const router = Router();

router.get('/live-price', async (_req: Request, res: Response) => {
  try {
    res.json(await marketService.getLivePrice());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/historical', (req: Request, res: Response) => {
  const tf = (req.query.timeframe as string) || '1D';
  const limit = parseInt(req.query.limit as string) || 500;
  const offset = parseInt(req.query.offset as string) || 0;
  res.json(marketService.getHistoricalData(tf, limit, offset));
});

router.get('/technical-analysis', async (_req: Request, res: Response) => {
  try {
    const price = (await marketService.getLivePrice()).price;
    res.json(marketService.getTechnicalAnalysis(price));
  } catch (err: any) {
    res.json(marketService.getTechnicalAnalysis(2180));
  }
});

router.get('/trading-signals', async (_req: Request, res: Response) => {
  try {
    const price = (await marketService.getLivePrice()).price;
    const analysis = marketService.getTechnicalAnalysis(price);
    res.json(marketService.getTradingSignals(analysis));
  } catch {
    res.json(marketService.getTradingSignals(marketService.getTechnicalAnalysis(2180)));
  }
});

router.get('/api-status', (_req: Request, res: Response) => {
  res.json(marketService.getApiStatus());
});

router.get('/insights', async (_req: Request, res: Response) => {
  try {
    const liveData = await marketService.getLivePrice();
    const ta = marketService.getTechnicalAnalysis(liveData.price);
    const news = await fetchGoldNews();

    const ctx = {
      price: liveData.price,
      change: liveData.change,
      changePercent: liveData.change_percent,
      rsi: ta.rsi,
      macd: ta.macd,
      momentum: ta.momentum,
      volatility: ta.volatility,
      sentiment: ta.sentiment,
      strength: ta.strength,
    };

    res.json(generateInsights(ctx, news));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
