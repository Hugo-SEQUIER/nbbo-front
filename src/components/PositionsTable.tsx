import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserHistoricalData, useUserPosition, useUserBalance } from '@/hooks/useUserData';
import { useWallet } from '@/hooks/useWallet';
import { UserHistoricalDataItem, SpotBalance, AssetPosition } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';


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
  const { getWalletAddress, authenticated } = useWallet();
  const address = getWalletAddress();
  
  const { data: positionData, isLoading: positionsLoading, error: positionsError } = useUserPosition(address);
  const { data: balanceData, isLoading: balanceLoading, error: balanceError } = useUserBalance(address);
  const { data: historyData, isLoading: historyLoading, error: historyError } = useUserHistoricalData(address);

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

                    return allPositions.length > 0 ? (
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
                          {allPositions.map(({exchange, position, exchangeData}, index: number) => {
                            const positionValue = parseFloat(position.position.positionValue);
                            const unrealizedPnl = parseFloat(position.position.unrealizedPnl);
                            const totalRawUsd = parseFloat(exchangeData.marginSummary?.totalRawUsd || '0');
                            const withdrawable = parseFloat(exchangeData.withdrawable || '0');
                            const size = parseFloat(position.position.szi);
                            const entryPrice = parseFloat(position.position.entryPx);
                            
                            return (
                              <div key={`${exchange}-${position.position.coin}-${index}`} className="grid grid-cols-7 gap-4 text-sm py-2 px-2 hover:bg-trading-hover transition-colors">
                                <div className="font-mono font-bold uppercase">{exchange}</div>
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
                return openOrders.length > 0 ? (
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
                      {openOrders.map((item: UserHistoricalDataItem, index: number) => {
                        const { order, status, statusTimestamp } = item;
                        const time = new Date(statusTimestamp).toLocaleTimeString('en-US', { 
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        });
                        
                        return (
                          <div key={`${order.oid}-${index}`} className="grid grid-cols-8 gap-2 text-sm py-2 px-2 hover:bg-trading-hover transition-colors">
                            <div className="font-mono text-xs w-20">{time}</div>
                            <div className="font-mono">{order.coin}</div>
                            <div className="font-mono">{order.coin}</div>
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
                  {historyData.data.map((item: UserHistoricalDataItem, index: number) => {
                    const { order, status, statusTimestamp } = item;
                    const time = new Date(statusTimestamp).toLocaleTimeString('en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    });
                    
                    return (
                      <div key={`${order.oid}-${index}`} className="grid grid-cols-8 gap-2 text-sm py-2 px-2 hover:bg-trading-hover transition-colors">
                        <div className="font-mono text-xs w-20">{time}</div>
                        <div className="font-mono">{order.coin}</div>
                        <div className="font-mono">{order.coin}</div>
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
    </Card>
  );
}