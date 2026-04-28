import { useStore } from '../store/useStore';
import { Trophy, TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';

export default function PerformanceSummary() {
  const trades = useStore((s) => s.trades);
  const balance = useStore((s) => s.balance);

  const closedTrades = trades.filter((t) => t.status === 'CLOSED');
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closedTrades.filter((t) => (t.pnl ?? 0) < 0);
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length : 0;
  const maxDrawdown = closedTrades.length > 0
    ? Math.min(...closedTrades.map((t) => t.pnl ?? 0))
    : 0;

  const stats = [
    { label: 'Total Trades', value: closedTrades.length.toString(), icon: BarChart3, color: 'text-blue-400' },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, icon: Target, color: winRate >= 50 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, icon: totalPnl >= 0 ? TrendingUp : TrendingDown, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Balance', value: `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: Trophy, color: 'text-gold-400' },
    { label: 'Avg Win', value: `+$${avgWin.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Max Loss', value: `$${maxDrawdown.toFixed(2)}`, icon: TrendingDown, color: 'text-red-400' },
  ];

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-3">Performance Summary</h3>
      {closedTrades.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">Start trading to see your performance metrics</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-2.5 bg-surface-700/30 rounded-lg">
              <s.icon size={16} className={`${s.color} mx-auto mb-1`} />
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
