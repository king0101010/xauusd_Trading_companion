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
import SimulationControls from './components/SimulationControls';

export default function App() {
  // Connect WebSocket
  useWebSocket();

  const setTechnicalAnalysis = useStore((s) => s.setTechnicalAnalysis);
  const setTradingSignal = useStore((s) => s.setTradingSignal);
  const setTrades = useStore((s) => s.setTrades);
  const setPositions = useStore((s) => s.setPositions);
  const setEquity = useStore((s) => s.setEquity);

  // Periodic data fetching
  useEffect(() => {
    async function fetchData() {
      try {
        const [ta, signals, trades, positions, equity] = await Promise.allSettled([
          api.getTechnicalAnalysis(),
          api.getTradingSignals(),
          api.getTradeHistory(),
          api.getPositions(),
          api.getEquity(),
        ]);
        if (ta.status === 'fulfilled') setTechnicalAnalysis(ta.value as any);
        if (signals.status === 'fulfilled') setTradingSignal(signals.value as any);
        if (trades.status === 'fulfilled') setTrades(trades.value as any);
        if (positions.status === 'fulfilled') setPositions(positions.value as any);
        if (equity.status === 'fulfilled') setEquity(equity.value as any);
      } catch {}
    }

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [setTechnicalAnalysis, setTradingSignal, setTrades, setPositions, setEquity]);

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      <Header />

      <main className="flex-1 p-3 gap-3 grid grid-cols-12 grid-rows-[1fr_auto] overflow-hidden">
        {/* ── LEFT: Chart (8 cols) ── */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-3 min-h-0">
          <div className="flex-1 min-h-[450px]">
            <TradingChart />
          </div>
          <SimulationControls />
        </div>

        {/* ── RIGHT: Panels (4 cols) ── */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-4rem)] pb-3">
          <MarketOverview />
          <TradingPanel />
          <PositionManager />
          <SignalsPanel />
          <TechnicalIndicators />
        </div>

        {/* ── BOTTOM: Full width ── */}
        <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <TradeHistory />
          <EquityCurve />
        </div>
      </main>
    </div>
  );
}
