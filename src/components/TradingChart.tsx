import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';

interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

const mockCandleData: CandlestickData[] = [
  { time: 1704067200 as Time, open: 113500, high: 114200, low: 113000, close: 113900 },
  { time: 1704153600 as Time, open: 113900, high: 114500, low: 113800, close: 114100 },
  { time: 1704240000 as Time, open: 114100, high: 114300, low: 113700, close: 113800 },
  { time: 1704326400 as Time, open: 113800, high: 114000, low: 113500, close: 113750 },
  { time: 1704412800 as Time, open: 113750, high: 114100, low: 113600, close: 114000 },
  { time: 1704499200 as Time, open: 114000, high: 114800, low: 113900, close: 114600 },
  { time: 1704585600 as Time, open: 114600, high: 115200, low: 114400, close: 114900 },
  { time: 1704672000 as Time, open: 114900, high: 115500, low: 114700, close: 115200 },
  { time: 1704758400 as Time, open: 115200, high: 115800, low: 115000, close: 115600 },
  { time: 1704844800 as Time, open: 115600, high: 116000, low: 115400, close: 115800 },
];

const timeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '8h', '12h', '1d', '3d', '1w', '1M'];

export default function TradingChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const chartRef = useRef<HTMLDivElement>(null);
  const chartRef2 = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (chartRef.current && !chartRef2.current) {
      // Create the chart
      const chart = createChart(chartRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#000000' },
          textColor: '#ffffff',
        },
        width: chartRef.current.clientWidth,
        height: chartRef.current.clientHeight,
        grid: {
          vertLines: { color: '#374151' },
          horzLines: { color: '#374151' },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: '#374151',
          textColor: '#9ca3af',
        },
        timeScale: {
          borderColor: '#374151',
        },
      });

      // Add candlestick series
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981',
      });

      // Set the data
      candlestickSeries.setData(mockCandleData);

      // Store references
      chartRef2.current = chart;
      seriesRef.current = candlestickSeries;

      // Handle resize
      const handleResize = () => {
        if (chartRef.current && chartRef2.current) {
          chartRef2.current.applyOptions({
            width: chartRef.current.clientWidth,
            height: chartRef.current.clientHeight,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef2.current) {
          chartRef2.current.remove();
          chartRef2.current = null;
        }
      };
    }
  }, []);

  return (
    <Card className="bg-trading-panel border-trading-border p-0">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-trading-border">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-foreground">BTC/USDT</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Range:</span>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs">1h</Button>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs">2h</Button>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs">4h</Button>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">Interval:</span>
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant={selectedTimeframe === tf ? "default" : "ghost"}
              size="sm"
              className={`h-6 px-2 text-xs ${
                selectedTimeframe === tf 
                  ? 'bg-crypto-green text-black font-medium' 
                  : 'text-muted-foreground hover:bg-trading-hover'
              }`}
              onClick={() => setSelectedTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-96">
        <div ref={chartRef} className="w-full h-full" />
      </div>
    </Card>
  );
}