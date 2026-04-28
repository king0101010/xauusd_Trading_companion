import { useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useStore } from './store/useStore';
import { api } from './services/api';
import Header from './components/Header';
import TradingChart from './components/TradingChart';
import TradingPanel from './components/TradingPanel';
import PositionManager from './components/PositionManager';
import TradeHistory from './components/TradeHistory';
import MarketOverview from './components/MarketOverview';
import TechnicalIndicators from './components/TechnicalIndicators';
import SignalsPanel from './components/SignalsPanel';
import EquityCurve from './components/EquityCurve';
import PriceAlerts from './components/PriceAlerts';
import PerformanceSummary from './components/PerformanceSummary';

export default function App() {
  useWebSocket();

  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setTechnicalAnalysis = useStore((s) => s.setTechnicalAnalysis);
  const setTradingSignal = useStore((s) => s.setTradingSignal);
  const setTrades = useStore((s) => s.setTrades);
  const setPositions = useStore((s) => s.setPositions);
  const setEquity = useStore((s) => s.setEquity);

  // Periodic data refresh
  useEffect(() => {
    async function fetchData() {
      try {
        const results = await Promise.allSettled([
          api.getTechnicalAnalysis(),
          api.getTradingSignals(),
          api.getTradeHistory(),
          api.getPositions(),
          api.getEquity(),
        ]);
        if (results[0].status === 'fulfilled') setTechnicalAnalysis(results[0].value as any);
        if (results[1].status === 'fulfilled') setTradingSignal(results[1].value as any);
        if (results[2].status === 'fulfilled') setTrades(results[2].value as any);
        if (results[3].status === 'fulfilled') setPositions(results[3].value as any);
        if (results[4].status === 'fulfilled') setEquity(results[4].value as any);
      } catch {}
    }

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [setTechnicalAnalysis, setTradingSignal, setTrades, setPositions, setEquity]);

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      <Header />

      {/* ═══════════════ CHART + SIDEBAR AREA ═══════════════ */}
      <div className="flex flex-1 min-h-0">
        {/* Chart — expands to fill available space */}
        <div className={`flex-1 transition-all duration-300 ease-in-out min-w-0`}>
          <div className="h-[calc(100vh-3.5rem)]">
            <TradingChart />
          </div>
        </div>

        {/* Sidebar — slides in/out */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden border-l border-white/5 bg-surface-800/50 ${
            sidebarOpen ? 'w-80' : 'w-0'
          }`}
        >
          <div className="w-80 h-[calc(100vh-3.5rem)] overflow-y-auto p-3 space-y-3">
            <TradingPanel />
            <PositionManager />
            <SignalsPanel />
            <TechnicalIndicators />
            <PriceAlerts />
          </div>
        </div>
      </div>

      {/* ═══════════════ BELOW FOLD (scroll down) ═══════════════ */}
      <div className="p-3 space-y-3">
        {/* Row 1: Overview cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <MarketOverview />
          <PerformanceSummary />
        </div>

        {/* Row 2: Trade journal + Equity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <TradeHistory />
          <EquityCurve />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 px-6 text-center">
        <p className="text-[10px] text-gray-600">
          GoldSense AI — AI-Powered XAU/USD Trading Companion • Paper Trading Only • Not Financial Advice
        </p>
      </footer>
    </div>
  );
}
