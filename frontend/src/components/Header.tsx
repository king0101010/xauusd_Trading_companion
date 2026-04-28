import { Wifi, WifiOff, TrendingUp, TrendingDown, PanelRightOpen, PanelRightClose, BarChart3 } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Header() {
  const livePrice = useStore((s) => s.livePrice);
  const connected = useStore((s) => s.connected);
  const balance = useStore((s) => s.balance);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const setPage = useStore((s) => s.setPage);

  const priceUp = (livePrice?.change ?? 0) >= 0;

  return (
    <header className="h-14 bg-surface-800/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
          <span className="text-surface-900 font-extrabold text-sm">G</span>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-base font-bold text-white leading-tight">GoldSense AI</h1>
          <p className="text-[10px] text-gray-500 leading-tight">XAU/USD Trading Companion</p>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
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

        {/* Analytics button */}
        <button
          onClick={() => setPage('analytics')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/20 rounded-lg text-purple-300 hover:text-white hover:border-purple-500/40 transition-all text-xs font-medium"
        >
          <BarChart3 size={14} />
          <span className="hidden sm:inline">Analytics</span>
        </button>

        {/* Sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
        </button>
      </div>
    </header>
  );
}
