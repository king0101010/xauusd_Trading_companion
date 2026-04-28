import { useStore } from '../store/useStore';

export default function TradeHistory() {
  const trades = useStore((s) => s.trades);

  // Show all trades (both open and closed) sorted newest first
  const allTrades = [...trades].sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Trade Journal</h3>
        {allTrades.length > 0 && (
          <span className="text-[10px] text-gray-500">{allTrades.length} trades</span>
        )}
      </div>
      {allTrades.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-6">Place your first trade to start building your journal</p>
      ) : (
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-[11px]">
            <thead className="text-gray-500 uppercase tracking-wider sticky top-0 bg-surface-800">
              <tr className="border-b border-white/5">
                <th className="text-left py-2 pr-2">Type</th>
                <th className="text-left py-2 pr-2">Status</th>
                <th className="text-right py-2 pr-2">Entry</th>
                <th className="text-right py-2 pr-2">Exit</th>
                <th className="text-right py-2 pr-2">Qty</th>
                <th className="text-right py-2 pr-2">SL</th>
                <th className="text-right py-2 pr-2">TP</th>
                <th className="text-right py-2">P&L</th>
              </tr>
            </thead>
            <tbody>
              {allTrades.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-1.5 pr-2">
                    <span className={`badge ${t.type === 'BUY' ? 'badge-green' : 'badge-red'}`}>{t.type}</span>
                  </td>
                  <td className="py-1.5 pr-2">
                    <span className={`badge ${t.status === 'OPEN' ? 'badge-blue' : t.status === 'CLOSED' ? 'badge-yellow' : 'badge-red'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="text-right pr-2 text-gray-300">${t.entryPrice?.toFixed(2)}</td>
                  <td className="text-right pr-2 text-gray-300">
                    {t.exitPrice ? `$${t.exitPrice.toFixed(2)}` : '—'}
                  </td>
                  <td className="text-right pr-2 text-gray-400">{t.quantity}</td>
                  <td className="text-right pr-2 text-gray-500">
                    {t.stopLoss ? `$${t.stopLoss.toFixed(0)}` : '—'}
                  </td>
                  <td className="text-right pr-2 text-gray-500">
                    {t.takeProfit ? `$${t.takeProfit.toFixed(0)}` : '—'}
                  </td>
                  <td className={`text-right font-medium ${
                    t.pnl === null ? 'text-gray-500' : (t.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {t.pnl !== null ? `${(t.pnl ?? 0) >= 0 ? '+' : ''}$${t.pnl?.toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
