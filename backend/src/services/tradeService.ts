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
      tradeId: trade.id,
      type: posType as 'LONG' | 'SHORT',
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

    // Close linked position by tradeId
    const position = await Position.findOne({ where: { tradeId: trade.id, status: 'ACTIVE' } });
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

// Close position directly by position ID
export async function closePosition(positionId: number, exitPrice: number) {
  try {
    const position = await Position.findByPk(positionId);
    if (!position || position.status !== 'ACTIVE') throw new Error('Position not found or already closed');

    // Close the linked trade
    const trade = await Trade.findByPk(position.tradeId);
    if (trade && trade.status === 'OPEN') {
      return await closeTrade(trade.id, exitPrice);
    }

    // Fallback: close just the position if trade not found
    const pnl = position.type === 'LONG'
      ? (exitPrice - position.entryPrice) * position.quantity
      : (position.entryPrice - exitPrice) * position.quantity;

    position.status = 'CLOSED';
    position.currentPrice = exitPrice;
    position.unrealizedPnl = parseFloat(pnl.toFixed(2));
    position.closedAt = new Date();
    await position.save();

    return position;
  } catch (err: any) {
    console.error('Position close error:', err.message);
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

      // Only check SL/TP if position is at least 30 seconds old (prevent instant close)
      const ageMs = Date.now() - new Date(pos.openedAt).getTime();
      if (ageMs < 30000) continue;

      // Auto-close on SL hit (only if SL is explicitly set and > 0)
      if (pos.stopLoss !== null && pos.stopLoss > 0) {
        if (pos.type === 'LONG' && currentPrice <= pos.stopLoss) {
          console.log(`🔴 SL hit for position ${pos.id}: price ${currentPrice} <= SL ${pos.stopLoss}`);
          await closePosition(pos.id, currentPrice);
          continue;
        }
        if (pos.type === 'SHORT' && currentPrice >= pos.stopLoss) {
          console.log(`🔴 SL hit for position ${pos.id}: price ${currentPrice} >= SL ${pos.stopLoss}`);
          await closePosition(pos.id, currentPrice);
          continue;
        }
      }

      // Auto-close on TP hit (only if TP is explicitly set and > 0)
      if (pos.takeProfit !== null && pos.takeProfit > 0) {
        if (pos.type === 'LONG' && currentPrice >= pos.takeProfit) {
          console.log(`🟢 TP hit for position ${pos.id}: price ${currentPrice} >= TP ${pos.takeProfit}`);
          await closePosition(pos.id, currentPrice);
          continue;
        }
        if (pos.type === 'SHORT' && currentPrice <= pos.takeProfit) {
          console.log(`🟢 TP hit for position ${pos.id}: price ${currentPrice} <= TP ${pos.takeProfit}`);
          await closePosition(pos.id, currentPrice);
          continue;
        }
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
    let balance = 10000;
    const equity: { date: string; balance: number }[] = [
      { date: new Date(Date.now() - 86400000).toISOString(), balance },
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

// ── Trade Analytics Engine ──
export async function getTradeAnalytics() {
  try {
    const allTrades = await Trade.findAll({ order: [['openedAt', 'ASC']] });
    const closed = allTrades.filter((t) => t.status === 'CLOSED');
    const open = allTrades.filter((t) => t.status === 'OPEN');

    if (closed.length === 0 && open.length === 0) {
      return { trades: [], summary: null, perTradeAnalysis: [] };
    }

    // Overall summary
    const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
    const losses = closed.filter((t) => (t.pnl ?? 0) < 0);
    const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const avgPnl = closed.length > 0 ? totalPnl / closed.length : 0;
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
    const bestTrade = closed.length > 0 ? Math.max(...closed.map((t) => t.pnl ?? 0)) : 0;
    const worstTrade = closed.length > 0 ? Math.min(...closed.map((t) => t.pnl ?? 0)) : 0;

    // Longest / shortest holding time
    const durations = closed
      .filter((t) => t.closedAt && t.openedAt)
      .map((t) => new Date(t.closedAt!).getTime() - new Date(t.openedAt).getTime());
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    const summary = {
      totalTrades: allTrades.length,
      closedTrades: closed.length,
      openTrades: open.length,
      wins: wins.length,
      losses: losses.length,
      winRate: parseFloat(winRate.toFixed(1)),
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      avgPnl: parseFloat(avgPnl.toFixed(2)),
      avgWin: parseFloat(avgWin.toFixed(2)),
      avgLoss: parseFloat(avgLoss.toFixed(2)),
      profitFactor: profitFactor === Infinity ? 999 : parseFloat(profitFactor.toFixed(2)),
      bestTrade: parseFloat(bestTrade.toFixed(2)),
      worstTrade: parseFloat(worstTrade.toFixed(2)),
      avgHoldingTimeMs: Math.round(avgDuration),
      startingBalance: 10000,
      currentBalance: parseFloat((10000 + totalPnl).toFixed(2)),
      returnPercent: parseFloat(((totalPnl / 10000) * 100).toFixed(2)),
    };

    // Per-trade AI analysis
    const perTradeAnalysis = closed.map((trade, i) => {
      const prev = i > 0 ? closed[i - 1] : null;
      return {
        trade: trade.toJSON(),
        analysis: generateTradeAnalysis(trade, prev, summary),
      };
    });

    return {
      trades: allTrades.map((t) => t.toJSON()),
      summary,
      perTradeAnalysis,
    };
  } catch (err: any) {
    console.error('Analytics error:', err.message);
    return { trades: [], summary: null, perTradeAnalysis: [] };
  }
}

function generateTradeAnalysis(
  trade: Trade,
  prevTrade: Trade | null,
  summary: any
): { verdict: string; highlights: string[]; improvements: string[]; score: number } {
  const pnl = trade.pnl ?? 0;
  const isWin = pnl > 0;
  const durationMs = trade.closedAt && trade.openedAt
    ? new Date(trade.closedAt).getTime() - new Date(trade.openedAt).getTime()
    : 0;
  const durationMins = Math.round(durationMs / 60000);
  const hadSL = trade.stopLoss !== null;
  const hadTP = trade.takeProfit !== null;

  const highlights: string[] = [];
  const improvements: string[] = [];
  let score = 50; // base score

  // ── Evaluate the trade ──

  if (isWin) {
    const pnlRatio = pnl / (trade.entryPrice * trade.quantity);
    highlights.push(
      `Great trade! You ${trade.type === 'BUY' ? 'bought' : 'sold'} at $${trade.entryPrice.toFixed(2)} and closed at $${trade.exitPrice?.toFixed(2)} for a profit of $${pnl.toFixed(2)}.`
    );
    score += 20;

    if (pnlRatio > 0.005) {
      highlights.push('You captured a solid price move — your timing was on point.');
      score += 10;
    }

    if (hadSL && hadTP) {
      highlights.push('Excellent risk management! You set both a Stop-Loss and Take-Profit, which shows disciplined trading.');
      score += 15;
    } else if (hadSL) {
      highlights.push('Good that you set a Stop-Loss to protect your downside.');
      score += 5;
      improvements.push('Consider also setting a Take-Profit next time to lock in gains automatically.');
    } else if (hadTP) {
      highlights.push('Smart to set a Take-Profit target.');
      score += 5;
      improvements.push('Always set a Stop-Loss too — even winning trades can reverse quickly without protection.');
    } else {
      improvements.push('You didn\'t set a Stop-Loss or Take-Profit. While this trade worked out, unprotected trades can lead to big losses. Always define your risk before entering.');
      score -= 10;
    }
  } else {
    improvements.push(
      `This trade resulted in a loss of $${Math.abs(pnl).toFixed(2)}. You ${trade.type === 'BUY' ? 'bought' : 'sold'} at $${trade.entryPrice.toFixed(2)} and closed at $${trade.exitPrice?.toFixed(2)}.`
    );
    score -= 10;

    if (!hadSL) {
      improvements.push('Critical lesson: No Stop-Loss was set. A Stop-Loss would have limited your downside. Always protect your capital — professional traders risk no more than 1-2% per trade.');
      score -= 15;
    } else {
      highlights.push('You had a Stop-Loss in place. Losses are part of trading — what matters is that you managed the risk.');
      score += 10;
    }

    if (Math.abs(pnl) > summary.avgLoss * 2) {
      improvements.push(`This loss ($${Math.abs(pnl).toFixed(2)}) was significantly larger than your average loss ($${summary.avgLoss.toFixed(2)}). Consider using tighter stops or reducing position size on uncertain setups.`);
      score -= 10;
    }
  }

  // Duration analysis
  if (durationMins < 1) {
    improvements.push('This trade was closed very quickly (under 1 minute). Scalping requires extreme precision — make sure you\'re not panic-closing positions.');
  } else if (durationMins > 120) {
    if (isWin) {
      highlights.push(`Patience paid off — you held this position for ${durationMins} minutes and let the trade develop.`);
    } else {
      improvements.push(`You held a losing position for ${durationMins} minutes. Consider setting time-based exits — if a trade isn't working within your expected timeframe, it's often better to cut it.`);
    }
  }

  // Consecutive behavior
  if (prevTrade) {
    const prevWin = (prevTrade.pnl ?? 0) > 0;
    if (!prevWin && !isWin) {
      improvements.push('This is a consecutive loss. After losing trades, many professional traders reduce their position size or take a short break to avoid revenge trading.');
    }
    if (prevWin && isWin) {
      highlights.push('Consecutive wins! You\'re in a good rhythm. Just be careful of overconfidence — stick to your strategy.');
    }
  }

  // Position sizing
  if (trade.quantity > 2) {
    improvements.push(`Position size of ${trade.quantity} oz is quite large. Consider whether this aligns with your risk management rules. Most professionals risk only 1-2% of their account per trade.`);
  }

  // Generate verdict
  score = Math.max(0, Math.min(100, score));
  let verdict: string;
  if (score >= 80) verdict = '🌟 Excellent Trade';
  else if (score >= 60) verdict = '✅ Good Trade';
  else if (score >= 40) verdict = '⚠️ Average Trade';
  else if (score >= 20) verdict = '📉 Below Average';
  else verdict = '❌ Needs Improvement';

  return { verdict, highlights, improvements, score };
}
