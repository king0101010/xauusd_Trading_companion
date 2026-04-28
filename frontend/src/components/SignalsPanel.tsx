import { useStore } from '../store/useStore';
import { Shield, Target, TrendingUp } from 'lucide-react';

export default function SignalsPanel() {
  const signal = useStore((s) => s.tradingSignal);
  if (!signal) return null;

  const signalColor = signal.signal === 'BUY' ? 'emerald' : signal.signal === 'SELL' ? 'red' : 'amber';

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-3">AI Signal</h3>
      <div className={`p-3 rounded-lg bg-${signalColor}-500/10 border border-${signalColor}-500/20 text-center mb-3`}>
        <p className={`text-2xl font-extrabold text-${signalColor}-400`}>{signal.signal}</p>
        <p className="text-xs text-gray-400 mt-1">{signal.recommendation}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><Target size={12} /> Confidence</span>
          <span className="text-xs font-semibold text-white">{(signal.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><TrendingUp size={12} /> Trend</span>
          <span className={`text-xs font-semibold ${signal.trend === 'UP' ? 'text-emerald-400' : 'text-red-400'}`}>{signal.trend}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><Shield size={12} /> Risk</span>
          <span className={`badge ${signal.risk_level === 'LOW' ? 'badge-green' : signal.risk_level === 'HIGH' ? 'badge-red' : 'badge-yellow'}`}>{signal.risk_level}</span>
        </div>
      </div>
    </div>
  );
}
