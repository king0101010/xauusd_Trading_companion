import { useEffect, useRef } from 'react';
import { createChart, IChartApi, Time } from 'lightweight-charts';
import { useStore } from '../store/useStore';

export default function EquityCurve() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const equity = useStore((s) => s.equity);

  useEffect(() => {
    if (!containerRef.current || equity.length < 2) return;

    if (chartRef.current) chartRef.current.remove();

    const chart = createChart(containerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: '#6b7280', fontSize: 10 },
      grid: { vertLines: { color: 'rgba(255,255,255,0.02)' }, horzLines: { color: 'rgba(255,255,255,0.02)' } },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.05)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.05)' },
      height: 150,
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addAreaSeries({
      lineColor: '#eab308',
      topColor: 'rgba(234,179,8,0.15)',
      bottomColor: 'rgba(234,179,8,0.0)',
      lineWidth: 2,
    });

    const data = equity.map((e, i) => ({
      time: (Math.floor(new Date(e.date).getTime() / 1000) + i) as Time,
      value: e.balance,
    }));

    series.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [equity]);

  const startBal = equity[0]?.balance ?? 10000;
  const endBal = equity[equity.length - 1]?.balance ?? 10000;
  const totalPnl = endBal - startBal;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">Equity Curve</h3>
        <span className={`text-sm font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
        </span>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
