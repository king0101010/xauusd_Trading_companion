import { useStore } from '../store/useStore';
import type { Timeframe, ChartType } from '../types';

const TIMEFRAMES: Timeframe[] = ['1H', '4H', '1D', '1W'];
const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'candlestick', label: '🕯️' },
  { value: 'line', label: '📈' },
];

export default function ChartControls() {
  const timeframe = useStore((s) => s.timeframe);
  const chartType = useStore((s) => s.chartType);
  const setTimeframe = useStore((s) => s.setTimeframe);
  const setChartType = useStore((s) => s.setChartType);

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              timeframe === tf
                ? 'bg-gold-500 text-surface-900'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {CHART_TYPES.map((ct) => (
          <button
            key={ct.value}
            onClick={() => setChartType(ct.value)}
            className={`px-2 py-1 rounded text-sm transition-all ${
              chartType === ct.value ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
            title={ct.value}
          >
            {ct.label}
          </button>
        ))}
      </div>
    </div>
  );
}
