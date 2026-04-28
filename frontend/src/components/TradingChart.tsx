import { useEffect, useRef, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, HistogramData, Time } from 'lightweight-charts';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import ChartControls from './ChartControls';

export default function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const timeframe = useStore((s) => s.timeframe);
  const chartType = useStore((s) => s.chartType);
  const livePrice = useStore((s) => s.livePrice);

  const buildChart = useCallback(() => {
    if (!containerRef.current) return;

    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleRef.current = null;
      lineRef.current = null;
      volumeRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(234,179,8,0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(234,179,8,0.3)', width: 1, style: 2 },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.05)' },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    // Volume histogram (bottom)
    volumeRef.current = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    if (chartType === 'candlestick') {
      candleRef.current = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });
    } else {
      lineRef.current = chart.addLineSeries({
        color: '#eab308',
        lineWidth: 2,
        crosshairMarkerRadius: 4,
      });
    }

    // Responsive
    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, [chartType]);

  // Build chart on mount / chartType change
  useEffect(() => {
    const cleanup = buildChart();
    return () => cleanup?.();
  }, [buildChart]);

  // Load data on timeframe change
  useEffect(() => {
    async function loadData() {
      try {
        const res: any = await api.getHistorical(timeframe, 1000);
        const bars = res.data || res;
        if (!Array.isArray(bars) || bars.length === 0) return;

        // Format time for lightweight-charts
        const formatted = bars.map((b: any) => {
          let t = b.time;
          if (typeof t === 'string') {
            // Convert to YYYY-MM-DD format for daily or timestamp for intraday
            const d = new Date(t.replace(/-/g, '/').replace('T', ' '));
            if (timeframe === '1D' || timeframe === '1W') {
              t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            } else {
              t = Math.floor(d.getTime() / 1000);
            }
          }
          return { ...b, time: t as Time };
        });

        if (candleRef.current) {
          candleRef.current.setData(formatted as CandlestickData<Time>[]);
        }
        if (lineRef.current) {
          const lineData: LineData<Time>[] = formatted.map((b: any) => ({
            time: b.time,
            value: b.close,
          }));
          lineRef.current.setData(lineData);
        }
        if (volumeRef.current) {
          const volData: HistogramData<Time>[] = formatted.map((b: any) => ({
            time: b.time,
            value: b.volume || 0,
            color: b.close >= b.open ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
          }));
          volumeRef.current.setData(volData);
        }

        chartRef.current?.timeScale().fitContent();
      } catch (err) {
        console.warn('Failed to load chart data:', err);
      }
    }

    loadData();
  }, [timeframe, chartType]);

  // Append live price tick
  useEffect(() => {
    if (!livePrice) return;

    const now = new Date();
    let time: Time;
    if (timeframe === '1D' || timeframe === '1W') {
      time = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` as Time;
    } else {
      time = Math.floor(now.getTime() / 1000) as Time;
    }

    const p = livePrice.price;
    if (candleRef.current) {
      candleRef.current.update({
        time,
        open: p - 0.5,
        high: livePrice.high || p + 1,
        low: livePrice.low || p - 1,
        close: p,
      });
    }
    if (lineRef.current) {
      lineRef.current.update({ time, value: p });
    }
  }, [livePrice, timeframe]);

  return (
    <div className="card flex flex-col h-full">
      <ChartControls />
      <div ref={containerRef} className="flex-1 min-h-[400px]" />
    </div>
  );
}
