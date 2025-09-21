"use client";

import { Card } from '@/components/ui/card';

const exchangeData = {
  markPrice: 112900.00,
  midPrice: 113900.00,
  change24h: '+0.00000 / +0.00%',
  redstonePrice: 109642.00,
  pythPrice: 109680.00
};

export default function ExchangeBanner() {
  return (
    <div className="px-4 pb-4">
      <Card className="bg-trading-header border-trading-border">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Account info */}
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-muted-foreground">ACCOUNT VALUE</div>
              <div className="text-lg font-mono font-bold text-foreground">$0.00</div>
              <div className="text-xs text-muted-foreground">Clearinghouse State</div>
            </div>
          </div>

          {/* Center - Price data */}
          <div className="flex items-center gap-8">
            <div>
              <div className="text-xs text-muted-foreground">MARK PRICE</div>
              <div className="font-mono text-foreground">
                ${exchangeData.markPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">ORACLE PRICE</div>
              <div className="space-y-0.5">
                <div className="font-mono text-foreground text-sm">
                  Redstone: ${exchangeData.redstonePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="font-mono text-foreground text-sm">
                  Pyth: ${exchangeData.pythPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">MID PRICE</div>
              <div className="font-mono text-foreground">
                ${exchangeData.midPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">24H CHANGE</div>
              <div className="font-mono text-crypto-green">{exchangeData.change24h}</div>
            </div>
          </div>

          {/* Right side - Connection status */}
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-crypto-green text-black font-medium text-sm rounded hover:bg-crypto-green/90 transition-colors">
              CONNECT WALLET
            </button>
          </div>
          </div>
        </div>
      </Card>
    </div>
  );
}