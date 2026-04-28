import { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function PositionManager() {
  const positions = useStore((s) => s.positions);
  const livePrice = useStore((s) => s.livePrice);
  const [closingId, setClosingId] = useState<number | null>(null);
  const [confirmCloseId, setConfirmCloseId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function handleClose(posId: number) {
    const exitPrice = livePrice?.price;
    if (!exitPrice) return;

    setClosingId(posId);
    try {
      await api.closePosition(posId, exitPrice);
      const [trades, poss, eq] = await Promise.all([
        api.getTradeHistory() as Promise<any[]>,
        api.getPositions() as Promise<any[]>,
        api.getEquity() as Promise<any[]>,
      ]);
      useStore.getState().setTrades(trades);
      useStore.getState().setPositions(poss);
      useStore.getState().setEquity(eq);
    } catch (err) {
      console.error('Close position failed:', err);
    }
    setClosingId(null);
    setConfirmCloseId(null);
  }

  if (positions.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-2">Open Positions</h3>
        <p className="text-xs text-gray-500 text-center py-4">No open positions. Place a trade above.</p>
      </div>
    );
  }

  const totalPnl = positions.reduce((sum: number, p: any) => sum + (p.unrealizedPnl ?? 0), 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Open Positions</h3>
        <span className={`text-xs font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {positions.map((pos: any) => {
          const isClosing = closingId === pos.id;
          const isConfirming = confirmCloseId === pos.id;
          const isExpanded = expandedId === pos.id;
          const pnl = pos.unrealizedPnl ?? 0;
          const pnlPercent = pos.entryPrice > 0
            ? ((pnl / (pos.entryPrice * pos.quantity)) * 100).toFixed(2)
            : '0.00';

          return (
            <div key={pos.id} className="bg-surface-700/50 rounded-lg overflow-hidden border border-white/5">
              {/* Main row */}
              <div className="flex items-center p-2.5">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : pos.id)}
                  className="p-0.5 text-gray-500 hover:text-white transition-colors mr-2"
                >
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${pos.type === 'LONG' ? 'badge-green' : 'badge-red'}`}>{pos.type}</span>
                    <span className="text-xs text-gray-300">{pos.quantity} oz</span>
                    <span className="text-[10px] text-gray-500">@ ${pos.entryPrice?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-right mr-2">
                  <p className={`text-sm font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                  </p>
                  <p className={`text-[10px] ${pnl >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                    {pnl >= 0 ? '+' : ''}{pnlPercent}%
                  </p>
                </div>

                {/* Close button */}
                {!isConfirming ? (
                  <button
                    onClick={() => setConfirmCloseId(pos.id)}
                    className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[10px] font-medium hover:bg-red-500/20 transition-colors"
                  >
                    CLOSE
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setConfirmCloseId(null)}
                      className="px-1.5 py-1 bg-surface-700 rounded text-gray-400 text-[10px] hover:bg-surface-700/80"
                    >
                      No
                    </button>
                    <button
                      onClick={() => handleClose(pos.id)}
                      disabled={isClosing}
                      className="px-2 py-1 bg-red-500 rounded text-white text-[10px] font-medium hover:bg-red-400 disabled:opacity-50"
                    >
                      {isClosing ? <Loader2 size={10} className="animate-spin" /> : 'Yes'}
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-3 pb-2.5 pt-1 border-t border-white/5 grid grid-cols-2 gap-1.5 text-[10px]">
                  <div>
                    <span className="text-gray-500">Entry Price</span>
                    <p className="text-white font-medium">${pos.entryPrice?.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Price</span>
                    <p className="text-white font-medium">${pos.currentPrice?.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Stop Loss</span>
                    <p className={pos.stopLoss ? 'text-red-400 font-medium' : 'text-gray-600'}>
                      {pos.stopLoss ? `$${pos.stopLoss.toFixed(2)}` : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Take Profit</span>
                    <p className={pos.takeProfit ? 'text-emerald-400 font-medium' : 'text-gray-600'}>
                      {pos.takeProfit ? `$${pos.takeProfit.toFixed(2)}` : 'Not set'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Opened</span>
                    <p className="text-gray-300">{new Date(pos.openedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
