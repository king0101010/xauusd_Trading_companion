import { useStore } from '../store/useStore';

export default function TechnicalIndicators() {
  const ta = useStore((s) => s.technicalAnalysis);
  if (!ta) return null;

  const indicators = [
    { label: 'RSI', value: ta.rsi, color: ta.rsi > 70 ? 'text-red-400' : ta.rsi < 30 ? 'text-emerald-400' : 'text-amber-400', bar: (ta.rsi / 100) * 100 },
    { label: 'MACD', value: ta.macd, color: ta.macd > 0 ? 'text-emerald-400' : 'text-red-400', bar: 50 + ta.macd * 25 },
    { label: 'Momentum', value: ta.momentum, color: ta.momentum > 0 ? 'text-emerald-400' : 'text-red-400', bar: 50 + ta.momentum * 25 },
    { label: 'Volatility', value: (ta.volatility * 100).toFixed(1) + '%', color: ta.volatility > 0.02 ? 'text-red-400' : 'text-emerald-400', bar: ta.volatility * 5000 },
  ];

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-3">Technical Indicators</h3>
      <div className="space-y-3">
        {indicators.map((ind) => (
          <div key={ind.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">{ind.label}</span>
              <span className={`text-xs font-semibold ${ind.color}`}>{typeof ind.value === 'number' ? ind.value.toFixed(2) : ind.value}</span>
            </div>
            <div className="h-1 bg-surface-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${ind.color.replace('text-', 'bg-')}`} style={{ width: `${Math.min(100, Math.max(0, ind.bar))}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <span className="text-gray-500">Bollinger Upper</span>
          <p className="text-white font-medium">${ta.bollinger_upper.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-gray-500">Bollinger Lower</span>
          <p className="text-white font-medium">${ta.bollinger_lower.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
