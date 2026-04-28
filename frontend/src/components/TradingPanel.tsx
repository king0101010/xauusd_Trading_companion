import { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function TradingPanel() {
  const livePrice = useStore((s) => s.livePrice);
  const [lotSize, setLotSize] = useState('1');
  const [slEnabled, setSlEnabled] = useState(false);
  const [tpEnabled, setTpEnabled] = useState(false);
  const [slPips, setSlPips] = useState('50');
  const [tpPips, setTpPips] = useState('100');
  const [loading, setLoading] = useState<'BUY' | 'SELL' | null>(null);
  const [confirm, setConfirm] = useState<{ type: 'BUY' | 'SELL'; price: number } | null>(null);
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const price = livePrice?.price ?? 0;
  const spread = 0.50; // Simulated bid/ask spread
  const bidPrice = price - spread / 2;
  const askPrice = price + spread / 2;

  function getSLPrice(type: 'BUY' | 'SELL'): number | null {
    if (!slEnabled || !slPips) return null;
    const pips = parseFloat(slPips);
    if (isNaN(pips) || pips <= 0) return null;
    return type === 'BUY' ? price - pips : price + pips;
  }

  function getTPPrice(type: 'BUY' | 'SELL'): number | null {
    if (!tpEnabled || !tpPips) return null;
    const pips = parseFloat(tpPips);
    if (isNaN(pips) || pips <= 0) return null;
    return type === 'BUY' ? price + pips : price - pips;
  }

  function handleClick(type: 'BUY' | 'SELL') {
    if (!price) return;
    const entry = type === 'BUY' ? askPrice : bidPrice;
    setConfirm({ type, price: entry });
    setResult(null);
  }

  async function executeOrder() {
    if (!confirm) return;
    setLoading(confirm.type);
    setResult(null);

    try {
      const sl = getSLPrice(confirm.type);
      const tp = getTPPrice(confirm.type);

      await api.openTrade({
        type: confirm.type,
        entryPrice: parseFloat(confirm.price.toFixed(2)),
        quantity: parseFloat(lotSize) || 1,
        stopLoss: sl ? parseFloat(sl.toFixed(2)) : undefined,
        takeProfit: tp ? parseFloat(tp.toFixed(2)) : undefined,
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

      setResult({ type: 'success', msg: `${confirm.type} order executed at $${confirm.price.toFixed(2)}` });
    } catch (err: any) {
      setResult({ type: 'error', msg: err.message || 'Order failed' });
    }

    setLoading(null);
    setConfirm(null);
  }

  const riskAmount = slEnabled && slPips
    ? (parseFloat(slPips) * (parseFloat(lotSize) || 1)).toFixed(2)
    : '—';
  const rewardAmount = tpEnabled && tpPips
    ? (parseFloat(tpPips) * (parseFloat(lotSize) || 1)).toFixed(2)
    : '—';

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={14} className="text-gold-400" />
        <h3 className="text-sm font-semibold text-white">New Order</h3>
        <span className="text-[10px] text-gray-500 ml-auto">Paper Trading</span>
      </div>

      {/* Bid / Ask prices */}
      <div className="grid grid-cols-2 gap-1 mb-3">
        <div className="text-center p-1.5 bg-red-500/5 rounded-lg border border-red-500/10">
          <p className="text-[9px] text-gray-500 uppercase">Bid (Sell)</p>
          <p className="text-sm font-bold text-red-400">{bidPrice.toFixed(2)}</p>
        </div>
        <div className="text-center p-1.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
          <p className="text-[9px] text-gray-500 uppercase">Ask (Buy)</p>
          <p className="text-sm font-bold text-emerald-400">{askPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Lot Size */}
      <div className="mb-3">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider">Volume (oz)</label>
        <div className="flex gap-1 mt-1">
          {['0.1', '0.5', '1', '2', '5'].map((v) => (
            <button
              key={v}
              onClick={() => setLotSize(v)}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                lotSize === v
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                  : 'bg-surface-700/50 text-gray-400 border border-transparent hover:border-white/10'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={lotSize}
          onChange={(e) => setLotSize(e.target.value)}
          className="input-field mt-1.5 text-center"
          min="0.01"
          step="0.1"
          placeholder="Custom amount"
        />
      </div>

      {/* SL / TP toggles */}
      <div className="space-y-2 mb-3">
        {/* Stop Loss */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSlEnabled(!slEnabled)}
            className={`w-8 h-4 rounded-full transition-all relative ${slEnabled ? 'bg-red-500' : 'bg-surface-700'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${slEnabled ? 'left-4.5 ml-0.5' : 'left-0.5'}`} />
          </button>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider flex-1">Stop Loss</span>
          {slEnabled && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500">$</span>
              <input
                type="number"
                value={slPips}
                onChange={(e) => setSlPips(e.target.value)}
                className="w-16 bg-surface-700 border border-red-500/20 rounded px-2 py-1 text-xs text-red-400 text-center focus:outline-none focus:ring-1 focus:ring-red-500/30"
                placeholder="distance"
              />
              <span className="text-[10px] text-gray-500">away</span>
            </div>
          )}
        </div>

        {/* Take Profit */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTpEnabled(!tpEnabled)}
            className={`w-8 h-4 rounded-full transition-all relative ${tpEnabled ? 'bg-emerald-500' : 'bg-surface-700'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${tpEnabled ? 'left-4.5 ml-0.5' : 'left-0.5'}`} />
          </button>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider flex-1">Take Profit</span>
          {tpEnabled && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500">$</span>
              <input
                type="number"
                value={tpPips}
                onChange={(e) => setTpPips(e.target.value)}
                className="w-16 bg-surface-700 border border-emerald-500/20 rounded px-2 py-1 text-xs text-emerald-400 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                placeholder="distance"
              />
              <span className="text-[10px] text-gray-500">away</span>
            </div>
          )}
        </div>
      </div>

      {/* Risk / Reward preview */}
      {(slEnabled || tpEnabled) && (
        <div className="flex items-center justify-between text-[10px] mb-3 p-2 bg-surface-700/30 rounded-lg">
          <span className="text-gray-500">Risk: <span className="text-red-400 font-medium">${riskAmount}</span></span>
          <span className="text-gray-500">Reward: <span className="text-emerald-400 font-medium">${rewardAmount}</span></span>
          {riskAmount !== '—' && rewardAmount !== '—' && (
            <span className="text-gray-500">R:R <span className="text-white font-medium">1:{(parseFloat(rewardAmount) / parseFloat(riskAmount)).toFixed(1)}</span></span>
          )}
        </div>
      )}

      {/* BUY / SELL buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleClick('SELL')}
          disabled={loading !== null || !price}
          className="py-3 bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold rounded-lg transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading === 'SELL' ? <Loader2 size={16} className="animate-spin mx-auto" /> : (
            <div>
              <p className="text-xs opacity-70">SELL</p>
              <p className="text-sm">{bidPrice.toFixed(2)}</p>
            </div>
          )}
        </button>
        <button
          onClick={() => handleClick('BUY')}
          disabled={loading !== null || !price}
          className="py-3 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-lg transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading === 'BUY' ? <Loader2 size={16} className="animate-spin mx-auto" /> : (
            <div>
              <p className="text-xs opacity-70">BUY</p>
              <p className="text-sm">{askPrice.toFixed(2)}</p>
            </div>
          )}
        </button>
      </div>

      {/* Confirmation Dialog */}
      {confirm && (
        <div className="mt-3 p-3 bg-surface-700/60 rounded-lg border border-gold-500/20 space-y-2">
          <p className="text-xs text-white font-medium text-center">Confirm {confirm.type} Order</p>
          <div className="grid grid-cols-2 gap-x-4 text-[10px]">
            <span className="text-gray-500">Type:</span>
            <span className={`text-right font-medium ${confirm.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{confirm.type}</span>
            <span className="text-gray-500">Entry:</span>
            <span className="text-right text-white">${confirm.price.toFixed(2)}</span>
            <span className="text-gray-500">Volume:</span>
            <span className="text-right text-white">{lotSize} oz</span>
            {slEnabled && <><span className="text-gray-500">Stop Loss:</span><span className="text-right text-red-400">${getSLPrice(confirm.type)?.toFixed(2)}</span></>}
            {tpEnabled && <><span className="text-gray-500">Take Profit:</span><span className="text-right text-emerald-400">${getTPPrice(confirm.type)?.toFixed(2)}</span></>}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={() => setConfirm(null)} className="py-1.5 bg-surface-700 text-gray-400 rounded-lg text-xs hover:bg-surface-700/80 transition-colors">
              Cancel
            </button>
            <button onClick={executeOrder} className="py-1.5 bg-gold-500 text-surface-900 rounded-lg text-xs font-semibold hover:bg-gold-400 transition-colors">
              Execute
            </button>
          </div>
        </div>
      )}

      {/* Result feedback */}
      {result && (
        <div className={`mt-2 p-2 rounded-lg text-xs text-center ${result.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {result.msg}
        </div>
      )}
    </div>
  );
}
