import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { X } from 'lucide-react';

export default function PositionManager() {
  const positions = useStore((s) => s.positions);
  const livePrice = useStore((s) => s.livePrice);

  async function handleClose(pos: any) {
    try {
      // Find matching open trade
      const openTrades: any[] = await api.getOpenTrades() as any[];
      const trade = openTrades.find((t: any) => t.entryPrice === pos.entryPrice && t.status === 'OPEN');
      if (trade) {
        await api.closeTrade(trade.id, livePrice?.price ?? pos.currentPrice);
        const [trades, poss, eq] = await Promise.all([
          api.getTradeHistory() as Promise<any[]>,
          api.getPositions() as Promise<any[]>,
          api.getEquity() as Promise<any[]>,
        ]);
        useStore.getState().setTrades(trades);
        useStore.getState().setPositions(poss);
        useStore.getState().setEquity(eq);
      }
    } catch (err) {
      console.error('Close position failed:', err);
    }
  }

  if (positions.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-2">Open Positions</h3>
        <p className="text-xs text-gray-500 text-center py-4">No open positions</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-3">Open Positions</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {positions.map((pos: any) => (
          <div key={pos.id} className="flex items-center justify-between p-2 bg-surface-700/50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`badge ${pos.type === 'LONG' ? 'badge-green' : 'badge-red'}`}>{pos.type}</span>
                <span className="text-xs text-gray-400">{pos.quantity} oz</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px]">
                <span className="text-gray-500">Entry: <span className="text-white">${pos.entryPrice?.toFixed(2)}</span></span>
                <span className={`font-medium ${pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl?.toFixed(2)}
                </span>
              </div>
            </div>
            <button onClick={() => handleClose(pos)} className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
