import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExchangePrice {
  exchange: string;
  symbol: string;
  price: number;
  change24h: number;
  isPositive: boolean;
}

const exchangePrices: ExchangePrice[] = [
  { exchange: 'Binance', symbol: 'BTC/USDC', price: 112900.00, change24h: -0.03, isPositive: false },
  { exchange: 'Coinbase', symbol: 'BTC/USDC', price: 112850.00, change24h: -0.08, isPositive: false },
  { exchange: 'Kraken', symbol: 'BTC/USDC', price: 112920.00, change24h: +0.02, isPositive: true },
  { exchange: 'Uniswap', symbol: 'BTC/USDC', price: 112880.00, change24h: -0.05, isPositive: false },
  { exchange: 'dYdX', symbol: 'BTC/USDC', price: 112910.00, change24h: +0.01, isPositive: true },
];

export default function ExchangeSelector() {
  const [selectedExchange, setSelectedExchange] = useState('all');

  const displayPrices = selectedExchange === 'all' 
    ? exchangePrices 
    : exchangePrices.filter(price => price.exchange.toLowerCase() === selectedExchange);

  return (
    <div className="space-y-2 px-4 pt-4 pb-4">
      {/* Exchange Prices Banner */}
      {displayPrices.length > 0 && (
        <Card className="bg-trading-header border-trading-border">
          <div className="px-2 py-2">
            <div className="flex items-center gap-6 overflow-x-auto">
              {displayPrices.map((price, index) => (
                <div key={index} className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-xs text-muted-foreground font-medium">{price.exchange}</span>
                  <span className="font-mono text-foreground">
                    ${price.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`text-xs font-mono ${
                    price.isPositive ? 'text-crypto-green' : 'text-crypto-red'
                  }`}>
                    {price.isPositive ? '+' : ''}{price.change24h.toFixed(2)}%
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