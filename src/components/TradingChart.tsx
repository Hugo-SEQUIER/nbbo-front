"use client";

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
        <svg className="w-full h-full" viewBox="0 0 800 350">
          {/* Define gradients */}
          <defs>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
          </defs>
          
          {/* Grid lines - properly aligned */}
          {[...Array(7)].map((_, i) => {
            const y = 50 + (i * 50);
            return (
              <line
                key={`h-${i}`}
                x1="60"
                y1={y}
                x2="750"
                y2={y}
                stroke="#333333"
                strokeWidth="1"
                opacity="0.5"
              />
            );
          })}
          {[...Array(8)].map((_, i) => {
            const x = 100 + (i * 100);
            return (
              <line
                key={`v-${i}`}
                x1={x}
                y1="50"
                x2={x}
                y2="350"
                stroke="#333333"
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}
          
          {/* Candlestick chart */}
          {mockCandleData.map((candle, index) => {
            const x = 120 + (index * 140);
            const priceRange = 1200; // 114200 - 113000
            const chartHeight = 300;
            const basePrice = 113000;
            
            const openY = 350 - (((candle.open - basePrice) / priceRange) * chartHeight);
            const closeY = 350 - (((candle.close - basePrice) / priceRange) * chartHeight);
            const highY = 350 - (((candle.high - basePrice) / priceRange) * chartHeight);
            const lowY = 350 - (((candle.low - basePrice) / priceRange) * chartHeight);
            
            const isGreen = candle.close > candle.open;
            const bodyHeight = Math.abs(closeY - openY);
            const bodyY = Math.min(openY, closeY);
            
            return (
              <g key={index}>
                {/* High-Low line */}
                <line
                  x1={x + 15}
                  y1={highY}
                  x2={x + 15}
                  y2={lowY}
                  stroke={isGreen ? '#10b981' : '#ef4444'}
                  strokeWidth="2"
                />
                {/* Open tick */}
                <line
                  x1={x + 5}
                  y1={openY}
                  x2={x + 15}
                  y2={openY}
                  stroke={isGreen ? '#10b981' : '#ef4444'}
                  strokeWidth="2"
                />
                {/* Close tick */}
                <line
                  x1={x + 15}
                  y1={closeY}
                  x2={x + 25}
                  y2={closeY}
                  stroke={isGreen ? '#10b981' : '#ef4444'}
                  strokeWidth="2"
                />
                {/* Body */}
                <rect
                  x={x + 5}
                  y={bodyY}
                  width="20"
                  height={Math.max(bodyHeight, 2)}
                  fill={isGreen ? '#10b981' : '#ef4444'}
                  opacity="0.8"
                />
              </g>
            );
          })}
          
          {/* Price labels */}
          <text x="10" y="60" fill="#ffffff" fontSize="12" fontFamily="monospace">
            $114,200
          </text>
          <text x="10" y="160" fill="#ffffff" fontSize="12" fontFamily="monospace">
            $113,600
          </text>
          <text x="10" y="260" fill="#ffffff" fontSize="12" fontFamily="monospace">
            $113,000
          </text>
          <text x="10" y="360" fill="#ffffff" fontSize="12" fontFamily="monospace">
            $112,400
          </text>
        </svg>
      </div>
    </Card>
  );
}