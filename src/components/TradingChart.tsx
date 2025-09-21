import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';
import { useChartData } from '@/hooks/useChartData';

interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Helper function to convert API data to chart format
const convertToChartData = (apiData: any[]): CandlestickData[] => {
  return apiData.map(item => ({
    time: (item.timestamp / 1000) as Time, // Convert milliseconds to seconds
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
  }));
};

const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

export default function TradingChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const chartRef = useRef<HTMLDivElement>(null);
  const chartRef2 = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  
  // Fetch real-time chart data
  const { data: chartData, loading, error, lastUpdate, justUpdated, refetch } = useChartData('BTC', selectedTimeframe);

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

      // Set the initial data (will be updated when API data comes in)
      candlestickSeries.setData([]);

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

  // Update chart data when new data comes from API
  useEffect(() => {
    if (seriesRef.current && chartData.length > 0) {
      console.log('Updating chart with', chartData.length, 'data points'); // Debug log
      const convertedData = convertToChartData(chartData);
      seriesRef.current.setData(convertedData);
    }
  }, [chartData]);

  // Handle timeframe changes - trigger new API call
  const handleTimeframeChange = (timeframe: string) => {
    console.log('Timeframe changed to:', timeframe); // Debug log
    setSelectedTimeframe(timeframe);
  };

  return (
    <Card className="bg-trading-panel border-trading-border p-0">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-trading-border">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-foreground">BTC/USD</h3>
          
          {/* Status indicators */}
          <div className="flex items-center gap-2 text-sm">
            {/* Connection status */}
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className="text-muted-foreground">
                {loading ? 'Loading...' : error ? 'Error' : 'Live'}
              </span>
            </div>
            
            {/* Last update */}
            {lastUpdate && (
              <span className={`text-xs ${justUpdated ? 'text-green-400' : 'text-muted-foreground'}`}>
                Last: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
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
              onClick={() => handleTimeframeChange(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-96 relative">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-trading-panel">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️ Chart Error</div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </div>
          </div>
        ) : (
          <div ref={chartRef} className="w-full h-full" />
        )}
      </div>
    </Card>
  );
}