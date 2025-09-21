"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Position {
  market: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercent: number;
  status: string;
}

const mockPositions: Position[] = [
  {
    market: 'BTC-PERP',
    side: 'LONG',
    size: 0.5,
    entryPrice: 112000,
    markPrice: 113900,
    pnl: 950,
    pnlPercent: 1.7,
    status: 'OPEN'
  },
  {
    market: 'ETH-PERP',
    side: 'SHORT',
    size: 2.1,
    entryPrice: 3200,
    markPrice: 3150,
    pnl: 105,
    pnlPercent: 1.56,
    status: 'OPEN'
  }
];

export default function PositionsTable() {
  return (
    <Card className="bg-trading-panel border-trading-border">
      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-trading-border rounded-none p-0">
          <TabsTrigger 
            value="positions" 
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-crypto-green rounded-none px-6 py-3"
          >
            POSITIONS
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-crypto-green rounded-none px-6 py-3"
          >
            OPEN ORDERS
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-crypto-green rounded-none px-6 py-3"
          >
            ORDER HISTORY
          </TabsTrigger>
          <TabsTrigger 
            value="debug" 
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-crypto-green rounded-none px-6 py-3"
          >
            DEBUG
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="p-0 mt-0">
          <div className="p-4">
            {/* Headers */}
            <div className="grid grid-cols-7 gap-4 text-xs text-muted-foreground mb-4 px-2">
              <div>MARKET</div>
              <div>SIDE</div>
              <div>SIZE</div>
              <div>ENTRY PRICE</div>
              <div>MARK PRICE</div>
              <div>PnL</div>
              <div>ACTION</div>
            </div>

            {/* Positions */}
            <div className="space-y-2">
              {mockPositions.map((position, index) => (
                <div
                  key={index}
                  className="grid grid-cols-7 gap-4 text-sm py-3 px-2 bg-secondary/50 rounded-lg hover:bg-trading-hover transition-colors"
                >
                  <div className="font-mono text-foreground">{position.market}</div>
                  <div className={`font-medium ${
                    position.side === 'LONG' ? 'text-crypto-green' : 'text-crypto-red'
                  }`}>
                    {position.side}
                  </div>
                  <div className="font-mono text-foreground">{position.size}</div>
                  <div className="font-mono text-foreground">
                    ${position.entryPrice.toLocaleString()}
                  </div>
                  <div className="font-mono text-foreground">
                    ${position.markPrice.toLocaleString()}
                  </div>
                  <div className={`font-mono ${
                    position.pnl > 0 ? 'text-crypto-green' : 'text-crypto-red'
                  }`}>
                    ${position.pnl.toFixed(2)} ({position.pnlPercent > 0 ? '+' : ''}{position.pnlPercent}%)
                  </div>
                  <div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-crypto-red/20 border-crypto-red text-crypto-red hover:bg-crypto-red hover:text-white text-xs"
                    >
                      CLOSE
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {mockPositions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No open positions
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="p-4">
          <div className="text-center py-8 text-muted-foreground">
            No open orders
          </div>
        </TabsContent>

        <TabsContent value="history" className="p-4">
          <div className="text-center py-8 text-muted-foreground">
            No order history
          </div>
        </TabsContent>

        <TabsContent value="debug" className="p-4">
          <div className="text-center py-8 text-muted-foreground">
            Debug information
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}