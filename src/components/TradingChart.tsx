import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const mockCandleData: CandleData[] = [
  { time: '09:00', open: 113500, high: 114200, low: 113000, close: 113900, volume: 1.2 },
  { time: '09:05', open: 113900, high: 114500, low: 113800, close: 114100, volume: 0.8 },
  { time: '09:10', open: 114100, high: 114300, low: 113700, close: 113800, volume: 1.5 },
  { time: '09:15', open: 113800, high: 114000, low: 113500, close: 113750, volume: 0.9 },
  { time: '09:20', open: 113750, high: 114100, low: 113600, close: 114000, volume: 1.1 },
];

const timeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '8h', '12h', '1d', '3d', '1w', '1M'];

export default function TradingChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');

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
      <div className="h-96 p-4 relative bg-black">
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-2xl font-mono mb-2">₿ 113,900.00</div>
            <div className="text-sm">Chart visualization would be rendered here</div>
            <div className="text-xs mt-2 opacity-60">
              Mock candlestick data: {mockCandleData.length} candles loaded
            </div>
          </div>
        </div>
        
        {/* Mock grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-px bg-chart-grid"
              style={{ top: `${(i + 1) * 12.5}%` }}
            />
          ))}
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute h-full w-px bg-chart-grid"
              style={{ left: `${(i + 1) * 10}%` }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}