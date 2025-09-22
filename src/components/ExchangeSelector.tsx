import { Card } from '@/components/ui/card';
import { useOrderBookContext } from '@/contexts/OrderBookContext';

interface ExchangeData {
  exchange: string;
  bestBid: number;
  bestAsk: number;
  spread: number;
  midPrice: number;
}

export default function ExchangeSelector() {
  const { data: orderBookData, metadata } = useOrderBookContext();

  // Transform individual exchange data from WebSocket
  const exchangeData: ExchangeData[] = metadata?.individual_exchanges 
    ? Object.entries(metadata.individual_exchanges).map(([key, data]) => {
        // Extract exchange name from key (e.g., "merrli:BTC" -> "merrli")
        const exchangeName = key.split(':')[0];
        return {
          exchange: exchangeName,
          bestBid: data.best_bid,
          bestAsk: data.best_ask,
          spread: data.spread,
          midPrice: data.mid_price
        };
      })
    : [];

  return (
    <div className="space-y-2 px-4 pt-4 pb-4">
      {/* Exchange Prices Banner */}
      {exchangeData.length > 0 && (
        <Card className="bg-trading-header border-trading-border">
          <div className="px-2 py-2">
            <div className="flex items-center gap-6 overflow-x-auto">
              {exchangeData.map((exchange, index) => (
                <div key={index} className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-xs text-muted-foreground font-medium uppercase">
                    {exchange.exchange}
                  </span>
                  <span className="font-mono text-foreground">
                    ${exchange.bestBid.toLocaleString('en-US', { minimumFractionDigits: 2 })} / 
                    ${exchange.bestAsk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ${exchange.spread.toLocaleString('en-US', { minimumFractionDigits: 2 })} spread
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}