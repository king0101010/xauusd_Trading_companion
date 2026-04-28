import { useStore } from '../store/useStore';

export default function TradeHistory() {
  const trades = useStore((s) => s.trades);
  const closed = trades.filter((t) => t.status === 'CLOSED');

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-3">Trade Journal</h3>
      {closed.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">No closed trades yet</p>
      ) : (
        <div className="overflow-x-auto max-h-52 overflow-y-auto">
          <table className="w-full text-[11px]">
            <thead className="text-gray-500 uppercase tracking-wider">
              <tr className="border-b border-white/5">
                <th className="text-left py-2 pr-2">Type</th>
                <th className="text-right py-2 pr-2">Entry</th>
                <th className="text-right py-2 pr-2">Exit</th>
                <th className="text-right py-2 pr-2">Qty</th>
                <th className="text-right py-2">P&L</th>
              </tr>
            </thead>
            <tbody>
              {closed.slice(0, 20).map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-1.5 pr-2">
                    <span className={`badge ${t.type === 'BUY' ? 'badge-green' : 'badge-red'}`}>{t.type}</span>
                  </td>
                  <td className="text-right pr-2 text-gray-300">${t.entryPrice?.toFixed(2)}</td>
                  <td className="text-right pr-2 text-gray-300">${t.exitPrice?.toFixed(2)}</td>
                  <td className="text-right pr-2 text-gray-400">{t.quantity}</td>
                  <td className={`text-right font-medium ${(t.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(t.pnl ?? 0) >= 0 ? '+' : ''}${t.pnl?.toFixed(2)}
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
