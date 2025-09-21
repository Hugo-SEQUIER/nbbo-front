import { Card } from '@/components/ui/card';
import { useOrderBook } from '../hooks/useOrderBook';

interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export default function OrderBook() {
  const { data: orderBookData, loading, error, connected, justUpdated } = useOrderBook();

  // Transform the WebSocket data to match our component's expected format
  const bids: OrderBookEntry[] = orderBookData?.bids?.slice(0, 6).map((bid, index, array) => {
    const total = array.slice(0, index + 1).reduce((sum, b) => sum + b.size, 0);
    return {
      price: bid.price,
      size: bid.size,
      total: total
    };
  }) || [];

  const asks: OrderBookEntry[] = orderBookData?.asks?.slice(0, 6).map((ask, index, array) => {
    const total = array.slice(0, index + 1).reduce((sum, a) => sum + a.size, 0);
    return {
      price: ask.price,
      size: ask.size,
      total: total
    };
  }) || [];

  const midPrice = orderBookData?.mid_price || 0;
  return (
    <Card className="bg-trading-panel border-trading-border">
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-foreground">ORDERBOOK</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="text-xs text-muted-foreground">
                {loading ? 'CONNECTING...' : error ? 'ERROR' : connected ? 'CONNECTED' : 'DISCONNECTED'}
              </div>
            </div>
            {orderBookData && (
              <div className={`text-xs transition-colors duration-300 ${
                justUpdated ? 'text-green-400' : 'text-muted-foreground'
              }`}>
                LAST UPDATED: {new Date(orderBookData.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Headers */}
        <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground mb-2 px-1">
          <div>PRICE</div>
          <div className="text-right">SIZE</div>
          <div className="text-right">TOTAL</div>
        </div>

        {/* Asks (Sell Orders) */}
        <div className="space-y-1 mb-3">
          {asks.slice().reverse().map((ask, index) => (
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
                {ask.total.toFixed(4)}
              </div>
            </div>
          ))}
        </div>

        {/* Mid Price */}
        <div className="flex items-center justify-center py-2 mb-3 bg-secondary rounded">
          <span className="text-crypto-amber font-mono font-medium">
            {midPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-muted-foreground ml-2">MID PRICE</span>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="space-y-1">
          {bids.map((bid, index) => (
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