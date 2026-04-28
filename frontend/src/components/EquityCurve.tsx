import { useEffect, useRef } from 'react';
import { createChart, IChartApi, Time } from 'lightweight-charts';
import { useStore } from '../store/useStore';

export default function EquityCurve() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const equity = useStore((s) => s.equity);
  const balance = useStore((s) => s.balance);

  useEffect(() => {
    if (!containerRef.current) return;
    if (chartRef.current) chartRef.current.remove();

    const chart = createChart(containerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: '#6b7280', fontSize: 10 },
      grid: { vertLines: { color: 'rgba(255,255,255,0.02)' }, horzLines: { color: 'rgba(255,255,255,0.02)' } },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.05)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.05)', visible: equity.length > 1 },
      height: 180,
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addAreaSeries({
      lineColor: '#eab308',
      topColor: 'rgba(234,179,8,0.15)',
      bottomColor: 'rgba(234,179,8,0.0)',
      lineWidth: 2,
    });

    // Build data — always show at least a starting point
    const dataPoints = equity.length > 0 ? equity : [{ date: new Date().toISOString(), balance: 10000 }];

    // Use incrementing timestamps to avoid duplicates
    const baseTime = Math.floor(Date.now() / 1000) - dataPoints.length * 86400;
    const data = dataPoints.map((e, i) => ({
      time: (baseTime + i * 86400) as Time,
      value: e.balance,
    }));

    series.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, [equity]);

  const startBal = 10000;
  const totalPnl = balance - startBal;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">Equity Curve</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Balance: <span className="text-white font-semibold">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
          <span className={`text-sm font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </span>
        </div>
      </div>
      <div ref={containerRef} className="w-full" />
      {equity.length <= 1 && (
        <p className="text-[10px] text-gray-500 text-center mt-2">Complete trades to build your equity curve</p>
      )}
    </div>
  );
}
