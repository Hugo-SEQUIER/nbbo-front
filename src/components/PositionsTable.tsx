import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserHistoricalData, useUserPosition, useUserBalance } from '@/hooks/useUserData';
import { useWallet } from '@/hooks/useWallet';
import { useFundTransfer } from '@/hooks/useFundTransfer';
import { ManageFundsModal } from '@/components/ManageFundsModal';
import { UserHistoricalDataItem, SpotBalance, AssetPosition } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';
import { getExchangeDisplayName, apiDexIdToUiId, uiIdToApiDexId } from '@/utils/exchangeUtils';
import { useState, useMemo } from 'react';


const getStatusColor = (status: string) => {
  switch (status) {
    case 'filled':
      return 'bg-green-500';
    case 'open':
      return 'bg-blue-500';
    case 'canceled':
      return 'bg-gray-500';
    case 'triggered':
      return 'bg-yellow-500';
    case 'rejected':
      return 'bg-red-500';
    case 'marginCanceled':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const getSideColor = (side: string) => {
  return side === 'B' ? 'text-green-500' : 'text-red-500';
};

export default function PositionsTable() {
  const { getWalletAddress, authenticated, isTradingEnabled } = useWallet();
  const address = getWalletAddress();
  const [isManageFundsModalOpen, setIsManageFundsModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [selectedCoin, setSelectedCoin] = useState<string>('all');
  
  const { data: positionData, isLoading: positionsLoading, error: positionsError } = useUserPosition(address);
  const { data: balanceData, isLoading: balanceLoading, error: balanceError, refetch: refetchBalance } = useUserBalance(address);
  const { data: historyData, isLoading: historyLoading, error: historyError } = useUserHistoricalData(address);
  const { transferFunds, isTransferring, canTransfer } = useFundTransfer();


  // Prepare exchange data for the fund management modal
  const exchanges = balanceData?.success && balanceData.data 
    ? Object.entries(balanceData.data)
        .filter(([key, value]) => key !== 'total_account_value' && typeof value === 'object' && value && 'withdrawable' in value)
        .map(([apiDexId, data]) => ({
          name: apiDexIdToUiId(apiDexId), // Convert to UI-safe identifier
          apiDexId, // Keep original API dexId
          displayName: getExchangeDisplayName(apiDexId), // Add display name
          withdrawable: parseFloat((data as any).withdrawable || '0'),
          totalRawUsd: parseFloat((data as any).marginSummary?.totalRawUsd || '0'),
        }))
    : [];

  const handleFundTransfer = async (fromDex: string, toDex: string, amount: number) => {
    // Convert UI identifiers back to API DEX IDs
    const fromApiDexId = uiIdToApiDexId(fromDex);
    const toApiDexId = uiIdToApiDexId(toDex);
    
    const success = await transferFunds(fromApiDexId, toApiDexId, amount);
    if (success) {
      await refetchBalance();
    }
  };

  // Extract unique markets and coins from all data sources
  const { uniqueMarkets, uniqueCoins } = useMemo(() => {
    const markets = new Set<string>();
    const coins = new Set<string>();

    // Extract from balance data (positions)
    if (balanceData?.success && balanceData.data) {
      Object.entries(balanceData.data).forEach(([exchangeName, exchangeData]) => {
        if (typeof exchangeData === 'object' && exchangeData && 'assetPositions' in exchangeData) {
          exchangeData.assetPositions.forEach((position: AssetPosition) => {
            const coinField = position.position.coin || '';
            const coinParts = coinField.split(':');
            const market = coinParts.length > 1 ? coinParts[0] : exchangeName;
            const coin = coinParts.length > 1 ? coinParts[1] : coinField;
            
            markets.add(market);
            if (coin) coins.add(coin);
          });
        }
      });
    }

    // Extract from history data (orders)
    if (historyData?.success && historyData.data) {
      historyData.data.forEach((item: UserHistoricalDataItem) => {
        const coinField = item.order.coin || '';
        const coinParts = coinField.split(':');
        const market = coinParts.length > 1 ? coinParts[0] : 'UNKNOWN';
        const coin = coinParts.length > 1 ? coinParts[1] : coinField;
        
        markets.add(market);
        if (coin) coins.add(coin);
      });
    }

    return {
      uniqueMarkets: Array.from(markets).sort(),
      uniqueCoins: Array.from(coins).sort()
    };
  }, [balanceData, historyData]);

  return (
    <Card className="bg-trading-panel border-trading-border">
      <Tabs defaultValue="positions" className="w-full">
        <div className="flex items-center justify-between border-b border-trading-border">
          <TabsList className="bg-transparent border-none rounded-none p-0">
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
          
          {/* Filter Dropdowns */}
          <div className="flex items-center gap-3 px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Market:</span>
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueMarkets.map((market) => (
                    <SelectItem key={market} value={market}>
                      {market.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Coin:</span>
              <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueCoins.map((coin) => (
                    <SelectItem key={coin} value={coin}>
                      {coin}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value="positions" className="p-0 mt-0">
          <TooltipProvider>
            <div className="p-4">
              {!authenticated ? (
                <div className="text-center py-8 text-muted-foreground">
                  Please connect your wallet to view positions
                </div>
              ) : balanceLoading ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-4 text-xs text-muted-foreground mb-2 px-2">
                    <div>EXCHANGE</div>
                    <div>MARKET</div>
                    <div className="text-right">SIZE</div>
                    <div className="text-right">ENTRY PRICE</div>
                    <div className="text-right">POSITION VALUE</div>
                    <div className="text-right">UNREALIZED PNL</div>
                    <div className="text-right">TOTAL RAW USD</div>
                  </div>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="grid grid-cols-7 gap-4 text-sm py-2 px-2">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : balanceError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to load balance data: {balanceError?.message}
                  </AlertDescription>
                </Alert>
              ) : balanceData?.success && balanceData.data ? (
                <div className="space-y-6">
                  {/* Fund Management Actions */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Account Overview</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchBalance()}
                        disabled={balanceLoading}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${balanceLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      {canTransfer && exchanges.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsManageFundsModalOpen(true)}
                          disabled={isTransferring}
                          className="flex items-center gap-2 border-crypto-green text-crypto-green hover:bg-crypto-green hover:text-black"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Manage Funds
                        </Button>
                      )}
                      {!canTransfer && authenticated && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="flex items-center gap-2 opacity-50"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Connect Wallet Required
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Account Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">TOTAL ACCOUNT VALUE</div>
                      <div className="font-mono text-lg font-bold text-crypto-green">
                        ${balanceData.data.total_account_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">TOTAL WITHDRAWABLE</div>
                      <div className="font-mono text-lg">
                        ${Object.entries(balanceData.data)
                          .filter(([key, value]) => key !== 'total_account_value' && typeof value === 'object' && value && 'withdrawable' in value)
                          .reduce((sum, [, exchange]) => {
                            const exchangeData = exchange as any;
                            return sum + parseFloat(exchangeData.withdrawable || '0');
                          }, 0)
                          .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">TOTAL MARGIN USED</div>
                      <div className="font-mono text-lg">
                        ${Object.entries(balanceData.data)
                          .filter(([key, value]) => key !== 'total_account_value' && typeof value === 'object' && value && 'marginSummary' in value)
                          .reduce((sum, [, exchange]) => {
                            const exchangeData = exchange as any;
                            return sum + parseFloat(exchangeData.marginSummary?.totalMarginUsed || '0');
                          }, 0)
                          .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">TOTAL RAW USD</div>
                      <div className="font-mono text-lg">
                        ${Object.entries(balanceData.data)
                          .filter(([key, value]) => key !== 'total_account_value' && typeof value === 'object' && value && 'marginSummary' in value)
                          .reduce((sum, [, exchange]) => {
                            const exchangeData = exchange as any;
                            return sum + parseFloat(exchangeData.marginSummary?.totalRawUsd || '0');
                          }, 0)
                          .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Asset Positions Table */}
                  {(() => {
                    const allPositions: Array<{exchange: string, position: AssetPosition, exchangeData: any}> = [];
                    Object.entries(balanceData.data).forEach(([exchangeName, exchangeData]) => {
                      if (typeof exchangeData === 'object' && exchangeData && 'assetPositions' in exchangeData) {
                        exchangeData.assetPositions.forEach((position: AssetPosition) => {
                          allPositions.push({
                            exchange: exchangeName,
                            position,
                            exchangeData
                          });
                        });
                      }
                    });

                  
                    const filteredPositions = allPositions.filter(({exchange, position}) => {
                      const coinField = position.position.coin || '';
                      const coinParts = coinField.split(':');
                      const market = coinParts.length > 1 ? coinParts[0] : exchange;
                      const coin = coinParts.length > 1 ? coinParts[1] : coinField;
                      
                      const marketMatch = selectedMarket === 'all' || market === selectedMarket;
                      const coinMatch = selectedCoin === 'all' || coin === selectedCoin;
                      
                      return marketMatch && coinMatch;
                    });

                    return filteredPositions.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-7 gap-4 text-xs text-muted-foreground mb-2 px-2 border-b border-gray-700 pb-2">
                          <div>EXCHANGE</div>
                          <div>MARKET</div>
                          <div className="text-right">SIZE</div>
                          <div className="text-right">ENTRY PRICE</div>
                          <div className="text-right">POSITION VALUE</div>
                          <div className="text-right">UNREALIZED PNL</div>
                          <div className="text-right">TOTAL RAW USD</div>
                        </div>
                        <div className="space-y-1">
                          {filteredPositions.map(({exchange, position, exchangeData}, index: number) => {
                            const positionValue = parseFloat(position.position.positionValue);
                            const unrealizedPnl = parseFloat(position.position.unrealizedPnl);
                            const totalRawUsd = parseFloat(exchangeData.marginSummary?.totalRawUsd || '0');
                            const withdrawable = parseFloat(exchangeData.withdrawable || '0');
                            const size = parseFloat(position.position.szi);
                            const entryPrice = parseFloat(position.position.entryPx);
                            
                            // Split coin field into market and coin
                            const coinField = position.position.coin || '';
                            const coinParts = coinField.split(':');
                            const market = coinParts.length > 1 ? coinParts[0] : exchange; // Use exchange as fallback
                            const coin = coinParts.length > 1 ? coinParts[1] : coinField; // Use full field as fallback
                            
                            return (
                              <div key={`${exchange}-${position.position.coin}-${index}`} className="grid grid-cols-7 gap-4 text-sm py-2 px-2 hover:bg-trading-hover transition-colors">
                                <div className="font-mono font-bold">{getExchangeDisplayName(exchange)}</div>
                                <div className="font-mono">{position.position.coin}</div>
                                <div className={`font-mono text-right ${size >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {Math.abs(size).toFixed(4)}
                                </div>
                                <div className="font-mono text-right">
                                  ${entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="font-mono text-right">
                                  ${positionValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <div className={`font-mono text-right ${unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  ${unrealizedPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="font-mono text-right">
                                  <Tooltip>
                                    <TooltipTrigger className="cursor-help underline decoration-dotted">
                                      ${totalRawUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Withdrawable: ${withdrawable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No positions found
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No balance data available
                </div>
              )}
            </div>
          </TooltipProvider>
        </TabsContent>

        <TabsContent value="orders" className="p-0 mt-0">
          <div className="p-4">
            {!authenticated ? (
              <div className="text-center py-8 text-muted-foreground">
                Please connect your wallet to view open orders
              </div>
            ) : historyLoading ? (
              <div className="space-y-2">
                <div className="grid grid-cols-8 gap-2 text-xs text-muted-foreground mb-2 px-2">
                  <div className="w-20">TIME</div>
                  <div>MARKET</div>
                  <div>COIN</div>
                  <div className="w-12">SIDE</div>
                  <div className="text-right">PRICE</div>
                  <div className="text-right">SIZE</div>
                  <div>STATUS</div>
                  <div>ORDER ID</div>
                </div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="grid grid-cols-8 gap-2 text-sm py-2 px-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            ) : historyError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to load orders: {historyError?.message}
                </AlertDescription>
              </Alert>
            ) : historyData?.success && historyData.data ? (
              (() => {
                const openOrders = historyData.data.filter(item => item.status === 'open');
                
                
                const filteredOpenOrders = openOrders.filter((item) => {
                  const coinField = item.order.coin || '';
                  const coinParts = coinField.split(':');
                  const market = coinParts.length > 1 ? coinParts[0] : 'UNKNOWN';
                  const coin = coinParts.length > 1 ? coinParts[1] : coinField;
                  
                  const marketMatch = selectedMarket === 'all' || market === selectedMarket;
                  const coinMatch = selectedCoin === 'all' || coin === selectedCoin;
                  
                  return marketMatch && coinMatch;
                });
                
                return filteredOpenOrders.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {/* Headers */}
                    <div className="grid grid-cols-8 gap-2 text-xs text-muted-foreground mb-2 px-2 border-b border-gray-700 pb-2">
                      <div className="w-20">TIME</div>
                      <div>MARKET</div>
                      <div>COIN</div>
                      <div className="w-12">SIDE</div>
                      <div className="text-right">PRICE</div>
                      <div className="text-right">SIZE</div>
                      <div>STATUS</div>
                      <div>ORDER ID</div>
                    </div>

                    {/* Data Rows */}
                    <div className="space-y-1">
                      {filteredOpenOrders.map((item: UserHistoricalDataItem, index: number) => {
                        const { order, status, statusTimestamp } = item;
                        const time = new Date(statusTimestamp).toLocaleTimeString('en-US', { 
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        });
                        
                        // Split coin field into market and coin
                        const coinField = order.coin || '';
                        const coinParts = coinField.split(':');
                        const market = coinParts.length > 1 ? coinParts[0] : 'UNKNOWN'; // Use UNKNOWN as fallback
                        const coin = coinParts.length > 1 ? coinParts[1] : coinField; // Use full field as fallback
                        
                        return (
                          <div key={`${order.oid}-${index}`} className="grid grid-cols-8 gap-2 text-sm py-2 px-2 hover:bg-trading-hover transition-colors">
                            <div className="font-mono text-xs w-20">{time}</div>
                            <div className="font-mono">{market}</div>
                            <div className="font-mono">{coin}</div>
                            <div className={`font-mono text-xs w-12 ${getSideColor(order.side)}`}>
                              {order.side === 'B' ? 'BUY' : 'SELL'}
                            </div>
                            <div className="font-mono text-right">${parseFloat(order.limitPx).toLocaleString('en-US', { minimumFractionDigits: 1 })}</div>
                            <div className="font-mono text-right">{order.origSz || order.sz}</div>
                            <div className="font-mono">{status.toUpperCase()}</div>
                            <div className="font-mono">{order.oid}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No open orders
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No open orders
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="p-0 mt-0">
          <div className="p-4">
            {!authenticated ? (
              <div className="text-center py-8 text-muted-foreground">
                Please connect your wallet to view order history
              </div>
            ) : historyLoading ? (
              <div className="space-y-2">
                <div className="grid grid-cols-8 gap-2 text-xs text-muted-foreground mb-2 px-2">
                  <div className="w-20">TIME</div>
                  <div>MARKET</div>
                  <div>COIN</div>
                  <div className="w-12">SIDE</div>
                  <div className="text-right">PRICE</div>
                  <div className="text-right">SIZE</div>
                  <div>STATUS</div>
                  <div>ORDER ID</div>
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-8 gap-2 text-sm py-2 px-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            ) : historyError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to load order history: {historyError?.message}
                </AlertDescription>
              </Alert>
            ) : historyData?.success && historyData.data?.length ? (
              (() => {
                // Filter order history based on selected market and coin
                const filteredHistoryData = historyData.data.filter((item) => {
                  const coinField = item.order.coin || '';
                  const coinParts = coinField.split(':');
                  const market = coinParts.length > 1 ? coinParts[0] : 'UNKNOWN';
                  const coin = coinParts.length > 1 ? coinParts[1] : coinField;
                  
                  const marketMatch = selectedMarket === 'all' || market === selectedMarket;
                  const coinMatch = selectedCoin === 'all' || coin === selectedCoin;
                  
                  return marketMatch && coinMatch;
                });

                return filteredHistoryData.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {/* Headers */}
                    <div className="grid grid-cols-8 gap-2 text-xs text-muted-foreground mb-2 px-2 border-b border-gray-700 pb-2">
                      <div className="w-20">TIME</div>
                      <div>MARKET</div>
                      <div>COIN</div>
                      <div className="w-12">SIDE</div>
                      <div className="text-right">PRICE</div>
                      <div className="text-right">SIZE</div>
                      <div>STATUS</div>
                      <div>ORDER ID</div>
                    </div>

                    {/* Data Rows */}
                    <div className="space-y-1">
                      {filteredHistoryData.map((item: UserHistoricalDataItem, index: number) => {
                    const { order, status, statusTimestamp } = item;
                    const time = new Date(statusTimestamp).toLocaleTimeString('en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    });
                    
                    // Split coin field into market and coin
                    const coinField = order.coin || '';
                    const coinParts = coinField.split(':');
                    const market = coinParts.length > 1 ? coinParts[0] : 'UNKNOWN'; // Use UNKNOWN as fallback
                    const coin = coinParts.length > 1 ? coinParts[1] : coinField; // Use full field as fallback
                    
                    return (
                      <div key={`${order.oid}-${index}`} className="grid grid-cols-8 gap-2 text-sm py-2 px-2 hover:bg-trading-hover transition-colors">
                        <div className="font-mono text-xs w-20">{time}</div>
                        <div className="font-mono">{market}</div>
                        <div className="font-mono">{coin}</div>
                        <div className={`font-mono text-xs w-12 ${getSideColor(order.side)}`}>
                          {order.side === 'B' ? 'BUY' : 'SELL'}
                        </div>
                        <div className="font-mono text-right">${parseFloat(order.limitPx).toLocaleString('en-US', { minimumFractionDigits: 1 })}</div>
                        <div className="font-mono text-right">{order.origSz || order.sz}</div>
                        <div className="font-mono">{status.toUpperCase()}</div>
                        <div className="font-mono">{order.oid}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No matching order history found
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No order history found
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="debug" className="p-4">
          {!authenticated ? (
            <div className="text-center py-8 text-muted-foreground">
              Please connect your wallet to view debug information
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-secondary/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Wallet Information</h4>
                <div className="font-mono text-sm space-y-1">
                  <div>Address: {address}</div>
                  <div>Connected: {authenticated ? 'Yes' : 'No'}</div>
                </div>
              </div>
              
              <div className="bg-secondary/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">API Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Positions API:</span>
                    <span className={positionsLoading ? 'text-yellow-500' : positionsError ? 'text-red-500' : 'text-green-500'}>
                      {positionsLoading ? 'Loading...' : positionsError ? 'Error' : 'Success'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>History API:</span>
                    <span className={historyLoading ? 'text-yellow-500' : historyError ? 'text-red-500' : 'text-green-500'}>
                      {historyLoading ? 'Loading...' : historyError ? 'Error' : 'Success'}
                    </span>
                  </div>
                </div>
              </div>

              {positionData && (
                <div className="bg-secondary/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Raw Position Data</h4>
                  <pre className="text-xs overflow-x-auto bg-black/30 p-2 rounded">
                    {JSON.stringify(positionData, null, 2)}
                  </pre>
                </div>
              )}

              {historyData && (
                <div className="bg-secondary/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Raw History Data (First 3 orders)</h4>
                  <pre className="text-xs overflow-x-auto bg-black/30 p-2 rounded">
                    {JSON.stringify(historyData.data?.slice(0, 3) || [], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Manage Funds Modal */}
      <ManageFundsModal
        isOpen={isManageFundsModalOpen}
        onClose={() => setIsManageFundsModalOpen(false)}
        onTransfer={handleFundTransfer}
        exchanges={exchanges}
        isTransferring={isTransferring}
      />
    </Card>
  );
}