import { Router, Request, Response } from 'express';
import * as marketService from '../services/marketService.js';

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

export default router;
