import { useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function PriceAlerts() {
  const alerts = useStore((s) => s.alerts);
  const addAlert = useStore((s) => s.addAlert);
  const removeAlert = useStore((s) => s.removeAlert);
  const livePrice = useStore((s) => s.livePrice);
  const [price, setPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');

  function handleAdd() {
    const p = parseFloat(price);
    if (!p || p <= 0) return;
    addAlert(p, direction);
    setPrice('');
  }

  // Check alerts against live price
  const currentPrice = livePrice?.price ?? 0;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={14} className="text-gold-400" />
        <h3 className="text-sm font-semibold text-white">Price Alerts</h3>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={`e.g. ${currentPrice ? (currentPrice + 10).toFixed(0) : '2200'}`}
          className="input-field flex-1"
        />
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as 'above' | 'below')}
          className="bg-surface-700 border border-white/10 rounded-lg px-2 text-xs text-gray-300"
        >
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>
        <button onClick={handleAdd} className="p-2 bg-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/30 transition-colors">
          <Plus size={14} />
        </button>
      </div>

      {alerts.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-2">No alerts set</p>
      ) : (
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {alerts.map((a) => {
            const isTriggered =
              (a.direction === 'above' && currentPrice >= a.price) ||
              (a.direction === 'below' && currentPrice <= a.price);

            return (
              <div
                key={a.id}
                className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                  isTriggered
                    ? 'bg-gold-500/20 border border-gold-500/30 animate-pulse'
                    : 'bg-surface-700/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isTriggered ? 'bg-gold-400' : 'bg-gray-500'}`} />
                  <span className="text-gray-300">
                    {a.direction === 'above' ? '↑' : '↓'} ${a.price.toFixed(2)}
                  </span>
                  {isTriggered && <span className="badge badge-yellow">TRIGGERED</span>}
                </div>
                <button
                  onClick={() => removeAlert(a.id)}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
