import { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

export default function TradingPanel() {
  const livePrice = useStore((s) => s.livePrice);
  const [quantity, setQuantity] = useState('1');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [loading, setLoading] = useState(false);

  const price = livePrice?.price ?? 0;

  async function handleTrade(type: 'BUY' | 'SELL') {
    if (!price) return;
    setLoading(true);
    try {
      await api.openTrade({
        type,
        entryPrice: price,
        quantity: parseFloat(quantity) || 1,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      });
      // Refresh data
      const [trades, positions, equity] = await Promise.all([
        api.getTradeHistory() as Promise<any[]>,
        api.getPositions() as Promise<any[]>,
        api.getEquity() as Promise<any[]>,
      ]);
      useStore.getState().setTrades(trades);
      useStore.getState().setPositions(positions);
      useStore.getState().setEquity(equity);
    } catch (err) {
      console.error('Trade failed:', err);
    }
    setLoading(false);
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-3">Paper Trading</h3>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">Quantity (oz)</label>
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input-field mt-1" min="0.01" step="0.1" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Stop Loss</label>
            <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="input-field mt-1" placeholder="Optional" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Take Profit</label>
            <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="input-field mt-1" placeholder="Optional" />
          </div>
        </div>

        <div className="pt-1 text-center">
          <p className="text-xs text-gray-500 mb-2">Entry Price: <span className="text-gold-400 font-semibold">${price.toFixed(2)}</span></p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => handleTrade('BUY')} disabled={loading || !price} className="btn-buy w-full disabled:opacity-40">
            BUY Long
          </button>
          <button onClick={() => handleTrade('SELL')} disabled={loading || !price} className="btn-sell w-full disabled:opacity-40">
            SELL Short
          </button>
        </div>
      </div>
    </div>
  );
}
