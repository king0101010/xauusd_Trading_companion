import { useStore } from '../store/useStore';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

export default function MarketOverview() {
  const livePrice = useStore((s) => s.livePrice);
  const ta = useStore((s) => s.technicalAnalysis);

  const items = [
    { label: 'Price', value: `$${livePrice?.price?.toFixed(2) ?? '---'}`, icon: Activity, color: 'text-gold-400' },
    { label: 'High', value: `$${livePrice?.high?.toFixed(2) ?? '---'}`, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Low', value: `$${livePrice?.low?.toFixed(2) ?? '---'}`, icon: TrendingDown, color: 'text-red-400' },
    { label: 'Volume', value: livePrice?.volume?.toLocaleString() ?? '---', icon: BarChart3, color: 'text-blue-400' },
  ];

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-3">Market Overview</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 p-2 bg-surface-700/30 rounded-lg">
            <item.icon size={16} className={item.color} />
            <div>
              <p className="stat-label">{item.label}</p>
              <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      {ta && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-gray-500">Sentiment</span>
          <span className={`badge ${ta.sentiment === 'BULLISH' ? 'badge-green' : ta.sentiment === 'BEARISH' ? 'badge-red' : 'badge-yellow'}`}>
            {ta.sentiment}
          </span>
        </div>
      )}
    </div>
  );
}
