import { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

export default function SimulationControls() {
  const predictions = useStore((s) => s.predictions);
  const simIndex = useStore((s) => s.simIndex);
  const simPlaying = useStore((s) => s.simPlaying);
  const simSpeed = useStore((s) => s.simSpeed);
  const setPredictions = useStore((s) => s.setPredictions);
  const setSimIndex = useStore((s) => s.setSimIndex);
  const setSimPlaying = useStore((s) => s.setSimPlaying);
  const setSimSpeed = useStore((s) => s.setSimSpeed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load prediction data
  useEffect(() => {
    api.getPredictionData().then((data: any) => {
      if (Array.isArray(data) && data.length > 0) setPredictions(data);
    }).catch(() => {});
  }, [setPredictions]);

  // Play/pause
  useEffect(() => {
    if (simPlaying && predictions.length > 0) {
      intervalRef.current = setInterval(() => {
        const idx = useStore.getState().simIndex;
        if (idx < predictions.length - 1) {
          setSimIndex(idx + 1);
        } else {
          setSimPlaying(false);
        }
      }, simSpeed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [simPlaying, simSpeed, predictions.length, setSimIndex, setSimPlaying]);

  const current = predictions[simIndex];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Strategy Simulation</h3>
        <span className="text-[10px] text-gray-500">{predictions.length} data points</span>
      </div>

      {predictions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-gray-500 mb-2">No prediction data loaded</p>
          <button onClick={() => api.runPredict().then(() => api.getPredictionData().then((d: any) => setPredictions(d)))} className="btn-primary text-xs">
            Run AI Analysis
          </button>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setSimPlaying(!simPlaying)} className={`p-2 rounded-lg transition-colors ${simPlaying ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {simPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button onClick={() => { setSimPlaying(false); setSimIndex(0); }} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors">
              <RotateCcw size={14} />
            </button>
            <input type="range" min={0} max={predictions.length - 1} value={simIndex} onChange={(e) => setSimIndex(parseInt(e.target.value))}
              className="flex-1 accent-gold-500 h-1" />
            <select value={simSpeed} onChange={(e) => setSimSpeed(parseInt(e.target.value))}
              className="bg-surface-700 border border-white/10 rounded px-2 py-1 text-xs text-gray-300">
              <option value={2000}>Slow</option>
              <option value={1000}>Normal</option>
              <option value={500}>Fast</option>
              <option value={200}>Turbo</option>
            </select>
          </div>

          {/* Current step info */}
          {current && (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-surface-700/30 rounded-lg">
                <p className="text-[10px] text-gray-500">Step</p>
                <p className="text-xs font-semibold text-white">{simIndex + 1}/{predictions.length}</p>
              </div>
              <div className="p-2 bg-surface-700/30 rounded-lg">
                <p className="text-[10px] text-gray-500">Actual</p>
                <p className="text-xs font-semibold text-blue-400">${current.actual_price?.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-surface-700/30 rounded-lg">
                <p className="text-[10px] text-gray-500">Predicted</p>
                <p className="text-xs font-semibold text-gold-400">${current.predicted_price?.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-surface-700/30 rounded-lg">
                <p className="text-[10px] text-gray-500">Signal</p>
                <p className={`text-xs font-semibold ${current.trade_suggestion === 'BUY' ? 'text-emerald-400' : current.trade_suggestion === 'SELL' ? 'text-red-400' : 'text-gray-400'}`}>
                  {current.trade_suggestion}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
