import { Card } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { useUserPosition, useUserBalance } from '@/hooks/useUserData';
import { useRedStonePrice } from '../hooks/useRedStonePrice';
import { usePythPrice } from '../hooks/usePythPrice';
import { useOrderBook } from '../hooks/useOrderBook';

const exchangeData = {
  markPrice: 112900.00,
  midPrice: 113900.00
};

export default function ExchangeBanner() {
  const { 
    authenticated, 
    connectWallet, 
    disconnectWallet, 
    getDisplayAddress, 
    getWalletAddress,
    setupHyperliquidApiWallet,
    isTradingEnabled,
    isSettingUpApiWallet
  } = useWallet();
  const address = getWalletAddress();
  const { data: positionData } = useUserPosition(address);
  const { data: balanceData } = useUserBalance(address);
  const { price: redstonePrice, loading: redstoneLoading, error: redstoneError, justUpdated: redstoneJustUpdated } = useRedStonePrice(10000);
  const { price: pythPrice, loading: pythLoading, error: pythError, justUpdated: pythJustUpdated } = usePythPrice(10000);
  const { data: orderBookData } = useOrderBook();

  return (
    <div className="px-4 pb-4">
      <Card className="bg-trading-header border-trading-border">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between w-full">
            {/* Account info */}
            <div>
              <div className="text-xs text-muted-foreground">TOTAL ACCOUNT VALUE</div>
              <div className="text-lg font-mono font-bold text-foreground">
                {authenticated && balanceData?.success && balanceData.data?.total_account_value
                  ? `$${balanceData.data.total_account_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : '$0.00'
                }
              </div>
              <div className="text-xs text-muted-foreground">
                {authenticated ? `Connected: ${getDisplayAddress()}` : 'Cross-Exchange Balance'}
              </div>
            </div>

            {/* Best Bid/Ask Block */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>BEST BID</span>
                <span>BEST ASK</span>
              </div>
              <div className="border-b border-border mb-1"></div>
              <div className="flex justify-between items-center font-mono text-foreground">
                <span className="text-crypto-green">
                  ${orderBookData?.best_bid ? orderBookData.best_bid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                </span>
                <span className="w-px h-4 bg-border mx-2"></span>
                <span className="text-crypto-red">
                  ${orderBookData?.best_ask ? orderBookData.best_ask.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                </span>
              </div>
            </div>

            {/* Mark Price */}
            <div>
              <div className="text-xs text-muted-foreground">MARK PRICE</div>
              <div className="font-mono text-foreground">
                ${exchangeData.markPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Oracle Price */}
            <div>
              <div className="text-xs text-muted-foreground">ORACLE PRICE</div>
              <div className="space-y-0.5">
                <div className="font-mono text-foreground text-sm">
                  Redstone: ${redstoneError ? 'Error' : redstonePrice ? (
                    <span className={`transition-colors duration-300 ${
                      redstoneJustUpdated ? 'text-green-400' : 'text-foreground'
                    }`}>
                      {redstonePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  ) : 'N/A'}
                </div>
                <div className="font-mono text-foreground text-sm">
                  Pyth: ${pythError ? 'Error' : pythPrice ? (
                    <span className={`transition-colors duration-300 ${
                      pythJustUpdated ? 'text-green-400' : 'text-foreground'
                    }`}>
                      {pythPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  ) : 'N/A'}
                </div>
              </div>
            </div>

            {/* Mid Price */}
            <div>
              <div className="text-xs text-muted-foreground">MID PRICE</div>
              <div className="font-mono text-foreground">
                ${orderBookData?.mid_price ? orderBookData.mid_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
              </div>
            </div>

            {/* Connect Wallet & Trading Buttons */}
            <div className="flex gap-2">
              {authenticated ? (
                <>
                  {/* Enable Trading Button - only show when wallet is connected */}
                  {!isTradingEnabled() ? (
                    <button 
                      onClick={setupHyperliquidApiWallet}
                      disabled={isSettingUpApiWallet}
                      className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSettingUpApiWallet ? 'SETTING UP...' : 'ENABLE TRADING'}
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-green-600 text-white font-medium text-sm rounded flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      TRADING ENABLED
                    </div>
                  )}
                  
                  {/* Disconnect Button */}
                  <button 
                    onClick={disconnectWallet}
                    className="px-4 py-2 bg-red-600 text-white font-medium text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    DISCONNECT
                  </button>
                </>
              ) : (
                <button 
                  onClick={connectWallet}
                  className="px-4 py-2 bg-crypto-green text-black font-medium text-sm rounded hover:bg-crypto-green/90 transition-colors"
                >
                  CONNECT WALLET
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}