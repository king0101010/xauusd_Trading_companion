import Trade from '../models/Trade.js';
import Position from '../models/Position.js';

export async function openTrade(data: {
  type: 'BUY' | 'SELL';
  entryPrice: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
}) {
  try {
    const trade = await Trade.create({
      type: data.type,
      entryPrice: data.entryPrice,
      exitPrice: null,
      quantity: data.quantity,
      stopLoss: data.stopLoss || null,
      takeProfit: data.takeProfit || null,
      pnl: null,
      status: 'OPEN',
      openedAt: new Date(),
      closedAt: null,
      notes: data.notes || null,
    });

    const posType = data.type === 'BUY' ? 'LONG' : 'SHORT';
    await Position.create({
      type: posType,
      entryPrice: data.entryPrice,
      currentPrice: data.entryPrice,
      quantity: data.quantity,
      stopLoss: data.stopLoss || null,
      takeProfit: data.takeProfit || null,
      unrealizedPnl: 0,
      status: 'ACTIVE',
      openedAt: new Date(),
      closedAt: null,
    });

    return trade;
  } catch (err: any) {
    console.error('Trade open error:', err.message);
    throw err;
  }
}

export async function closeTrade(tradeId: number, exitPrice: number) {
  try {
    const trade = await Trade.findByPk(tradeId);
    if (!trade || trade.status !== 'OPEN') throw new Error('Trade not found or already closed');

    const pnl = trade.type === 'BUY'
      ? (exitPrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - exitPrice) * trade.quantity;

    trade.exitPrice = exitPrice;
    trade.pnl = parseFloat(pnl.toFixed(2));
    trade.status = 'CLOSED';
    trade.closedAt = new Date();
    await trade.save();

    // Close matching position
    const posType = trade.type === 'BUY' ? 'LONG' : 'SHORT';
    const position = await Position.findOne({
      where: { type: posType, entryPrice: trade.entryPrice, status: 'ACTIVE' },
    });
    if (position) {
      position.status = 'CLOSED';
      position.currentPrice = exitPrice;
      position.unrealizedPnl = parseFloat(pnl.toFixed(2));
      position.closedAt = new Date();
      await position.save();
    }

    return trade;
  } catch (err: any) {
    console.error('Trade close error:', err.message);
    throw err;
  }
}

export async function getOpenTrades() {
  try {
    return await Trade.findAll({ where: { status: 'OPEN' }, order: [['openedAt', 'DESC']] });
  } catch { return []; }
}

export async function getTradeHistory() {
  try {
    return await Trade.findAll({ order: [['openedAt', 'DESC']], limit: 100 });
  } catch { return []; }
}

export async function getOpenPositions() {
  try {
    return await Position.findAll({ where: { status: 'ACTIVE' }, order: [['openedAt', 'DESC']] });
  } catch { return []; }
}

export async function updatePositionPrices(currentPrice: number) {
  try {
    const positions = await Position.findAll({ where: { status: 'ACTIVE' } });
    for (const pos of positions) {
      pos.currentPrice = currentPrice;
      pos.unrealizedPnl = pos.type === 'LONG'
        ? parseFloat(((currentPrice - pos.entryPrice) * pos.quantity).toFixed(2))
        : parseFloat(((pos.entryPrice - currentPrice) * pos.quantity).toFixed(2));
      await pos.save();

      // Auto-close on SL/TP hit
      if (pos.stopLoss && currentPrice <= pos.stopLoss && pos.type === 'LONG') {
        const trade = await Trade.findOne({ where: { entryPrice: pos.entryPrice, status: 'OPEN' } });
        if (trade) await closeTrade(trade.id, currentPrice);
      }
      if (pos.takeProfit && currentPrice >= pos.takeProfit && pos.type === 'LONG') {
        const trade = await Trade.findOne({ where: { entryPrice: pos.entryPrice, status: 'OPEN' } });
        if (trade) await closeTrade(trade.id, currentPrice);
      }
      if (pos.stopLoss && currentPrice >= pos.stopLoss && pos.type === 'SHORT') {
        const trade = await Trade.findOne({ where: { entryPrice: pos.entryPrice, status: 'OPEN' } });
        if (trade) await closeTrade(trade.id, currentPrice);
      }
      if (pos.takeProfit && currentPrice <= pos.takeProfit && pos.type === 'SHORT') {
        const trade = await Trade.findOne({ where: { entryPrice: pos.entryPrice, status: 'OPEN' } });
        if (trade) await closeTrade(trade.id, currentPrice);
      }
    }
  } catch (err: any) {
    console.error('Position update error:', err.message);
  }
}

export async function getEquityHistory() {
  try {
    const trades = await Trade.findAll({
      where: { status: 'CLOSED' },
      order: [['closedAt', 'ASC']],
    });
    let balance = 10000; // Starting paper balance
    const equity: { date: string; balance: number }[] = [
      { date: new Date().toISOString(), balance },
    ];
    for (const t of trades) {
      balance += t.pnl || 0;
      equity.push({
        date: t.closedAt?.toISOString() || new Date().toISOString(),
        balance: parseFloat(balance.toFixed(2)),
      });
    }
    return equity;
  } catch { return [{ date: new Date().toISOString(), balance: 10000 }]; }
}
