import { Card } from '@/components/ui/card';

interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

const mockBids: OrderBookEntry[] = [
  { price: 113900.0, size: 0.02494, total: 2.84 },
  { price: 111850.0, size: 0.0013, total: 1.45 },
  { price: 111000.0, size: 0.00005, total: 0.06 },
  { price: 110900.0, size: 0.00027, total: 0.30 },
  { price: 109900.0, size: 0.00073, total: 0.80 },
  { price: 108500.0, size: 0.00036, total: 0.39 },
];

const mockAsks: OrderBookEntry[] = [
  { price: 119900.0, size: 0.00073, total: 0.87 },
  { price: 115900.0, size: 0.00023, total: 0.27 },
  { price: 114000.0, size: 0.00035, total: 0.40 },
  { price: 113950.0, size: 0.02494, total: 2.84 },
];

const midPrice = 113900.0;

export default function OrderBook() {
  return (
    <Card className="bg-trading-panel border-trading-border">
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-foreground">ORDERBOOK</h3>
          <div className="text-xs text-muted-foreground">LAST UPDATED: 4:05:02 PM</div>
        </div>

        {/* Headers */}
        <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground mb-2 px-1">
          <div>PRICE</div>
          <div className="text-right">SIZE</div>
          <div className="text-right">TOTAL</div>
        </div>

        {/* Asks (Sell Orders) */}
        <div className="space-y-1 mb-3">
          {mockAsks.reverse().map((ask, index) => (
            <div
              key={index}
              className="grid grid-cols-3 gap-4 text-xs py-1 px-1 relative overflow-hidden rounded"
            >
              <div 
                className="absolute right-0 top-0 h-full bg-ask-bg transition-all duration-300"
                style={{ width: `${(ask.size / 0.03) * 100}%` }}
              />
              <div className="relative text-crypto-red font-mono">
                {ask.price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </div>
              <div className="relative text-right font-mono text-foreground">
                {ask.size.toFixed(5)}
              </div>
              <div className="relative text-right font-mono text-muted-foreground">
                {ask.total.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Mid Price */}
        <div className="flex items-center justify-center py-2 mb-3 bg-secondary rounded">
          <span className="text-crypto-amber font-mono font-medium">
            {midPrice.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
          </span>
          <span className="text-xs text-muted-foreground ml-2">MID PRICE</span>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="space-y-1">
          {mockBids.map((bid, index) => (
            <div
              key={index}
              className="grid grid-cols-3 gap-4 text-xs py-1 px-1 relative overflow-hidden rounded"
            >
              <div 
                className="absolute right-0 top-0 h-full bg-bid-bg transition-all duration-300"
                style={{ width: `${(bid.size / 0.03) * 100}%` }}
              />
              <div className="relative text-crypto-green font-mono">
                {bid.price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </div>
              <div className="relative text-right font-mono text-foreground">
                {bid.size.toFixed(5)}
              </div>
              <div className="relative text-right font-mono text-muted-foreground">
                {bid.total.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}