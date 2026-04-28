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

// Close position directly by position ID
router.post('/close-position/:id', async (req: Request, res: Response) => {
  try {
    const { exitPrice } = req.body;
    if (!exitPrice) return res.status(400).json({ error: 'exitPrice required' });
    const result = await tradeService.closePosition(parseInt(req.params.id as string), exitPrice);
    res.json(result);
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

// Full trade analytics with AI per-trade analysis
router.get('/analytics', async (_req: Request, res: Response) => {
  try {
    res.json(await tradeService.getTradeAnalytics());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Price Alerts CRUD ──
router.get('/alerts', async (_req: Request, res: Response) => {
  try {
    const { PriceAlert } = await import('../models/index.js');
    const alerts = await PriceAlert.findAll({ order: [['createdAt', 'DESC']] });
    res.json(alerts);
  } catch { res.json([]); }
});

router.post('/alerts', async (req: Request, res: Response) => {
  try {
    const { PriceAlert } = await import('../models/index.js');
    const { targetPrice, direction } = req.body;
    if (!targetPrice || !direction) return res.status(400).json({ error: 'targetPrice and direction required' });
    const alert = await PriceAlert.create({ targetPrice, direction, triggered: false, triggeredAt: null });
    res.json(alert);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/alerts/:id', async (req: Request, res: Response) => {
  try {
    const { PriceAlert } = await import('../models/index.js');
    await PriceAlert.destroy({ where: { id: parseInt(req.params.id as string) } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/alerts/:id/trigger', async (req: Request, res: Response) => {
  try {
    const { PriceAlert } = await import('../models/index.js');
    await PriceAlert.update({ triggered: true, triggeredAt: new Date() }, { where: { id: parseInt(req.params.id as string) } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
