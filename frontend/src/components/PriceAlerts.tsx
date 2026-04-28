import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Volume2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function PriceAlerts() {
  const alerts = useStore((s) => s.alerts);
  const addAlert = useStore((s) => s.addAlert);
  const removeAlert = useStore((s) => s.removeAlert);
  const triggerAlert = useStore((s) => s.triggerAlert);
  const livePrice = useStore((s) => s.livePrice);
  const [priceInput, setPriceInput] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [flash, setFlash] = useState<number | null>(null);

  const currentPrice = livePrice?.price ?? 0;

  function handleAdd() {
    const p = parseFloat(priceInput);
    if (isNaN(p) || p <= 0) return;
    addAlert(p, direction);
    setPriceInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd();
  }

  // Check price against alerts
  useEffect(() => {
    if (!currentPrice) return;
    for (const alert of alerts) {
      if (alert.triggered) continue;
      const hit =
        (alert.direction === 'above' && currentPrice >= alert.price) ||
        (alert.direction === 'below' && currentPrice <= alert.price);
      if (hit) {
        triggerAlert(alert.id);
        setFlash(alert.id);
        // Clear flash after animation
        setTimeout(() => setFlash(null), 3000);
      }
    }
  }, [currentPrice, alerts, triggerAlert]);

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={14} className="text-gold-400" />
        <h3 className="text-sm font-semibold text-white">Price Alerts</h3>
        {alerts.some((a) => a.triggered) && (
          <Volume2 size={12} className="text-gold-400 animate-pulse" />
        )}
      </div>

      {/* Input Row */}
      <div className="flex gap-2 mb-3">
        <input
          type="number"
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentPrice ? `e.g. ${Math.round(currentPrice + 10)}` : 'Enter price'}
          className="input-field flex-1 min-w-0"
          step="1"
        />
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as 'above' | 'below')}
          className="bg-surface-700 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300 shrink-0"
        >
          <option value="above">↑ Above</option>
          <option value="below">↓ Below</option>
        </select>
        <button
          type="button"
          onClick={handleAdd}
          className="p-2 bg-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/30 transition-colors shrink-0"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Current price reference */}
      {currentPrice > 0 && (
        <p className="text-[10px] text-gray-500 mb-2 text-center">
          Current: <span className="text-gold-400">${currentPrice.toFixed(2)}</span>
        </p>
      )}

      {/* Alert List */}
      {alerts.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-3">
          Set an alert to get notified when price reaches your target
        </p>
      ) : (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all duration-300 ${
                a.triggered
                  ? 'bg-gold-500/15 border border-gold-500/30'
                  : 'bg-surface-700/30 border border-transparent'
              } ${flash === a.id ? 'ring-2 ring-gold-400/50 animate-pulse' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${a.triggered ? 'bg-gold-400' : 'bg-gray-500'}`} />
                <span className="text-gray-300 font-medium">
                  {a.direction === 'above' ? '↑' : '↓'} ${a.price.toFixed(2)}
                </span>
                {a.triggered && (
                  <span className="badge badge-yellow">HIT!</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAlert(a.id)}
                className="p-1 text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
