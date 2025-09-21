import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserHistoricalData, useUserPosition } from '@/hooks/useUserData';
import { useWallet } from '@/hooks/useWallet';
import { UserHistoricalDataItem, SpotBalance } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';

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
          <div className="p-4">
            {!authenticated ? (
              <div className="text-center py-8 text-muted-foreground">
                Please connect your wallet to view positions
              </div>
            ) : positionsLoading ? (
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-4 text-xs text-muted-foreground mb-2 px-2">
                  <div>ASSET</div>
                  <div className="text-right">TOTAL</div>
                  <div className="text-right">AVAILABLE</div>
                  <div className="text-right">ON HOLD</div>
                  <div className="text-right">TOKEN</div>
                </div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="grid grid-cols-5 gap-4 text-sm py-2 px-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            ) : positionsError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to load positions: {positionsError?.message}
                </AlertDescription>
              </Alert>
            ) : positionData?.success && positionData.data?.[0] ? (
              <div className="space-y-6">
                {/* Account Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">ACCOUNT VALUE</div>
                    <div className="font-mono text-lg font-bold text-crypto-green">
                      ${parseFloat(positionData.data[0].clearinghouseState.marginSummary.accountValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">WITHDRAWABLE</div>
                    <div className="font-mono text-lg">
                      ${parseFloat(positionData.data[0].clearinghouseState.withdrawable).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">MARGIN USED</div>
                    <div className="font-mono text-lg">
                      ${parseFloat(positionData.data[0].clearinghouseState.marginSummary.totalMarginUsed).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">TOTAL POSITIONS</div>
                    <div className="font-mono text-lg">
                      ${parseFloat(positionData.data[0].clearinghouseState.marginSummary.totalNtlPos).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Spot Balances Table */}
                {positionData.data[0].spotState.balances.length > 0 && (
                  <div>
                    <div className="grid grid-cols-5 gap-4 text-xs text-muted-foreground mb-2 px-2 border-b border-gray-700 pb-2">
                      <div>ASSET</div>
                      <div className="text-right">TOTAL</div>
                      <div className="text-right">AVAILABLE</div>
                      <div className="text-right">ON HOLD</div>
                      <div className="text-right">TOKEN</div>
                    </div>
                    <div className="space-y-1">
                      {positionData.data[0].spotState.balances.map((balance: SpotBalance, index: number) => {
                        const totalValue = parseFloat(balance.total);
                        const holdValue = parseFloat(balance.hold);
                        const availableValue = totalValue - holdValue;
                        
                        return (
                          <div key={`${balance.coin}-${index}`} className="grid grid-cols-5 gap-4 text-sm py-2 px-2 hover:bg-trading-hover transition-colors">
                            <div className="font-mono font-bold">{balance.coin}</div>
                            <div className="font-mono text-right">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            <div className="font-mono text-right">${availableValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            <div className="font-mono text-right text-orange-400">
                              ${holdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="font-mono text-right">#{balance.token}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No positions found
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="p-0 mt-0">
          <div className="p-4">
            {!authenticated ? (
              <div className="text-center py-8 text-muted-foreground">
                Please connect your wallet to view open orders
              </div>
            ) : historyLoading ? (
              <div className="space-y-2">
                <div className="grid grid-cols-8 gap-4 text-xs text-muted-foreground mb-2 px-2">
                  <div>TIME</div>
                  <div>MARKET</div>
                  <div>SIDE</div>
                  <div className="text-right">PRICE</div>
                  <div className="text-right">SIZE</div>
                  <div>STATUS</div>
                  <div>ORDER ID</div>
                  <div className="text-right">PnL</div>
                </div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="grid grid-cols-8 gap-4 text-sm py-2 px-2">
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
                    <div className="grid grid-cols-8 gap-4 text-xs text-muted-foreground mb-2 px-2 border-b border-gray-700 pb-2">
                      <div>TIME</div>
                      <div>MARKET</div>
                      <div>SIDE</div>
                      <div className="text-right">PRICE</div>
                      <div className="text-right">SIZE</div>
                      <div>STATUS</div>
                      <div>ORDER ID</div>
                      <div className="text-right">PnL</div>
                    </div>

                    {/* Data Rows */}
                    <div className="space-y-1">
                      {openOrders.map((item: UserHistoricalDataItem, index: number) => {
                        const { order, status, statusTimestamp } = item;
                        const time = new Date(statusTimestamp).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        });
                        
                        return (
                          <div key={`${order.oid}-${index}`} className="grid grid-cols-8 gap-4 text-sm py-2 px-2 hover:bg-trading-hover transition-colors">
                            <div className="font-mono">{time}</div>
                            <div className="font-mono">{order.coin}</div>
                            <div className={`font-mono ${getSideColor(order.side)}`}>
                              {order.side === 'B' ? 'BUY' : 'SELL'}
                            </div>
                            <div className="font-mono text-right">${parseFloat(order.limitPx).toLocaleString('en-US', { minimumFractionDigits: 1 })}</div>
                            <div className="font-mono text-right">{order.origSz || order.sz}</div>
                            <div className="font-mono">{status.toUpperCase()}</div>
                            <div className="font-mono">{order.oid}</div>
                            <div className="font-mono text-right">-</div>
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
                <div className="grid grid-cols-8 gap-4 text-xs text-muted-foreground mb-2 px-2">
                  <div>TIME</div>
                  <div>MARKET</div>
                  <div>SIDE</div>
                  <div className="text-right">PRICE</div>
                  <div className="text-right">SIZE</div>
                  <div>STATUS</div>
                  <div>ORDER ID</div>
                  <div className="text-right">PnL</div>
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-8 gap-4 text-sm py-2 px-2">
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
                <div className="grid grid-cols-8 gap-4 text-xs text-muted-foreground mb-2 px-2 border-b border-gray-700 pb-2">
                  <div>TIME</div>
                  <div>MARKET</div>
                  <div>SIDE</div>
                  <div className="text-right">PRICE</div>
                  <div className="text-right">SIZE</div>
                  <div>STATUS</div>
                  <div>ORDER ID</div>
                  <div className="text-right">PnL</div>
                </div>

                {/* Data Rows */}
                <div className="space-y-1">
                  {historyData.data.map((item: UserHistoricalDataItem, index: number) => {
                    const { order, status, statusTimestamp } = item;
                    const time = new Date(statusTimestamp).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    });
                    
                    return (
                      <div key={`${order.oid}-${index}`} className="grid grid-cols-8 gap-4 text-sm py-2 px-2 hover:bg-trading-hover transition-colors">
                        <div className="font-mono">{time}</div>
                        <div className="font-mono">{order.coin}</div>
                        <div className={`font-mono ${getSideColor(order.side)}`}>
                          {order.side === 'B' ? 'BUY' : 'SELL'}
                        </div>
                        <div className="font-mono text-right">${parseFloat(order.limitPx).toLocaleString('en-US', { minimumFractionDigits: 1 })}</div>
                        <div className="font-mono text-right">{order.origSz || order.sz}</div>
                        <div className="font-mono">{status.toUpperCase()}</div>
                        <div className="font-mono">{order.oid}</div>
                        <div className="font-mono text-right">-</div>
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