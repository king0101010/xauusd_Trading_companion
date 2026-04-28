import { Wifi, WifiOff, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Header() {
  const livePrice = useStore((s) => s.livePrice);
  const connected = useStore((s) => s.connected);
  const balance = useStore((s) => s.balance);

  const priceUp = (livePrice?.change ?? 0) >= 0;

  return (
    <header className="h-14 bg-surface-800/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
          <span className="text-surface-900 font-extrabold text-sm">G</span>
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">GoldSense AI</h1>
          <p className="text-[10px] text-gray-500 leading-tight">XAU/USD Trading Companion</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Balance */}
        <div className="hidden md:block text-right">
          <p className="text-[10px] text-gray-500">Paper Balance</p>
          <p className="text-sm font-semibold text-white">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Live Price */}
        <div className="text-right">
          <p className="text-[10px] text-gray-500">XAU/USD</p>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-gold-400">
              ${livePrice?.price?.toFixed(2) ?? '---'}
            </span>
            {livePrice && (
              <span className={`flex items-center text-xs font-medium ${priceUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {priceUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span className="ml-0.5">{priceUp ? '+' : ''}{livePrice.change?.toFixed(2)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Connection */}
        <div className="flex items-center gap-1.5">
          {connected ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Wifi size={14} className="text-emerald-400" />
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <WifiOff size={14} className="text-red-400" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
