import { Card } from '@/components/ui/card';
import { useRedStonePrice } from '../hooks/useRedStonePrice';
import { usePythPrice } from '../hooks/usePythPrice';

const exchangeData = {
  markPrice: 112900.00,
  midPrice: 113900.00,
  change24h: '+0.00000 / +0.00%'
};

export default function ExchangeBanner() {
  const { price: redstonePrice, loading: redstoneLoading, error: redstoneError, justUpdated: redstoneJustUpdated } = useRedStonePrice(10000);
  const { price: pythPrice, loading: pythLoading, error: pythError, justUpdated: pythJustUpdated } = usePythPrice(10000);
  return (
    <div className="px-4 pb-4">
      <Card className="bg-trading-header border-trading-border">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between w-full">
          {/* Account info */}
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">ACCOUNT VALUE</div>
            <div className="text-lg font-mono font-bold text-foreground">$0.00</div>
            <div className="text-xs text-muted-foreground">Clearinghouse State</div>
          </div>

          {/* Mark Price */}
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">MARK PRICE</div>
            <div className="font-mono text-foreground">
              ${exchangeData.markPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Oracle Price */}
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">ORACLE PRICE</div>
            <div className="space-y-0.5">
              <div className="font-mono text-foreground text-sm">
                Redstone: ${redstoneError ? 'Error' : redstonePrice ? (
                  <span className={`transition-colors duration-300 ${
                    redstoneJustUpdated ? 'text-green-400' : 'text-foreground'
                  }`}>
                    {redstonePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                ) : 'N/A'}
              </div>
              <div className="font-mono text-foreground text-sm">
                Pyth: ${pythError ? 'Error' : pythPrice ? (
                  <span className={`transition-colors duration-300 ${
                    pythJustUpdated ? 'text-green-400' : 'text-foreground'
                  }`}>
                    {pythPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                ) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Mid Price */}
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">MID PRICE</div>
            <div className="font-mono text-foreground">
              ${exchangeData.midPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* 24H Change */}
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">24H CHANGE</div>
            <div className="font-mono text-crypto-green">{exchangeData.change24h}</div>
          </div>

          {/* Connect Wallet Button */}
          <div className="flex-1 flex justify-end">
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