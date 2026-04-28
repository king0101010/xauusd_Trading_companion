import { Router, Request, Response } from 'express';
import * as tradeService from '../services/tradeService.js';

const router = Router();

router.post('/open', async (req: Request, res: Response) => {
  try {
    const { type, entryPrice, quantity, stopLoss, takeProfit, notes } = req.body;
    if (!type || !entryPrice) return res.status(400).json({ error: 'type and entryPrice required' });
    const trade = await tradeService.openTrade({
      type, entryPrice, quantity: quantity || 1, stopLoss, takeProfit, notes,
    });
    res.json(trade);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/close/:id', async (req: Request, res: Response) => {
  try {
    const { exitPrice } = req.body;
    if (!exitPrice) return res.status(400).json({ error: 'exitPrice required' });
    const trade = await tradeService.closeTrade(parseInt(req.params.id as string), exitPrice);
    res.json(trade);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/open', async (_req: Request, res: Response) => {
  res.json(await tradeService.getOpenTrades());
});

router.get('/history', async (_req: Request, res: Response) => {
  res.json(await tradeService.getTradeHistory());
});

router.get('/positions', async (_req: Request, res: Response) => {
  res.json(await tradeService.getOpenPositions());
});

router.get('/equity', async (_req: Request, res: Response) => {
  res.json(await tradeService.getEquityHistory());
});

export default router;
