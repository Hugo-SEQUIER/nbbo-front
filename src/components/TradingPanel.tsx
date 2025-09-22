import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { OrderExecutionPlanComponent } from '@/components/OrderExecutionPlan';
import { useSmartOrderExecution, OrderParams } from '@/hooks/useSmartOrderExecution';
import { useOrderBook } from '@/hooks/useOrderBook';
import { useWallet } from '@/hooks/useWallet';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function TradingPanel() {
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'ioc'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [leverage, setLeverage] = useState('1');
  const [orderSize, setOrderSize] = useState('10');
  const [limitPrice, setLimitPrice] = useState('');
  const [slippage, setSlippage] = useState('8');
  
  // Hooks pour le smart order execution
  const { authenticated } = useWallet();
  const { data: orderBookData, connected: marketConnected } = useOrderBook();
  const { 
    executeOrder, 
    getExecutionPlan, 
    isExecuting, 
    isTransferring, 
    executionStep, 
    ready 
  } = useSmartOrderExecution();
  
  // Créer les paramètres d'ordre en temps réel
  const orderParams: OrderParams = {
    side,
    size: parseFloat(orderSize) || 0,
    type: orderType,
    limitPrice: limitPrice ? parseFloat(limitPrice) : undefined,
    slippage: parseFloat(slippage) || 8
  };
  
  // Obtenir le plan d'exécution en temps réel
  const executionPlan = getExecutionPlan(orderParams);
  
  // Validation des paramètres
  const isValidOrder = orderParams.size > 0 && 
                      (orderType !== 'limit' || (limitPrice && parseFloat(limitPrice) > 0)) &&
                      marketConnected && 
                      authenticated && 
                      ready;
  console.log('isValidOrder', isValidOrder, orderParams, marketConnected, authenticated, ready);
  // Gestion de la soumission d'ordre
  const handleSubmitOrder = async () => {
    if (!isValidOrder) {
      toast.error("Please check your order parameters and connection status");
      return;
    }
    
    const success = await executeOrder(orderParams);
    if (success) {
      // Reset form après succès
      setOrderSize('10');
      setLimitPrice('');
    }
  };

  return (
    <Card className="bg-trading-panel border-trading-border">
      <div className="p-4 space-y-4">
        {/* Status et alertes */}
        {!authenticated && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to place orders
            </AlertDescription>
          </Alert>
        )}
        
        {!marketConnected && authenticated && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Market data disconnected. Orders may not execute at expected prices.
            </AlertDescription>
          </Alert>
        )}

        {/* Order Size - First */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            ORDER SIZE ({orderBookData?.coin || 'BTC'})
          </Label>
          <Input
            value={orderSize}
            onChange={(e) => setOrderSize(e.target.value)}
            className="bg-input border-trading-border font-mono"
            placeholder="10"
            type="number"
            step="0.001"
            min="0"
          />
        </div>

        {/* Leverage Settings */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">LEVERAGE: {leverage}x (ISOLATED)</div>
          <Label className="text-xs text-muted-foreground">UPDATE LEVERAGE</Label>
          <div className="flex items-center gap-2">
            <Input
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
              className="flex-1 bg-input border-trading-border font-mono"
              placeholder="1x"
            />
            <Button size="sm" className="bg-trading-hover text-foreground border border-trading-border">
              UPDATE
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Enter new leverage (1-25x) and select mode
          </div>
        </div>

        {/* Limit Price */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            LIMIT PRICE {orderType !== 'limit' ? '(optional)' : '(required)'}
          </Label>
          <Input
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            className="bg-input border-trading-border font-mono"
            placeholder={orderType === 'limit' ? 'Enter price' : `Market price ± ${slippage}%`}
            type="number"
            step="0.01"
            min="0"
            required={orderType === 'limit'}
          />
        </div>

        {/* Trading Settings */}
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground font-medium">TRADING SETTINGS</div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">ORDER TYPE</Label>
              <Select value={orderType} onValueChange={(value) => setOrderType(value as 'market' | 'limit' | 'ioc')}>
                <SelectTrigger className="bg-input border-trading-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                  <SelectItem value="ioc">IOC - Immediate or Cancel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {orderType === 'market' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">SLIPPAGE (%)</Label>
                <Input
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="bg-input border-trading-border font-mono"
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                />
              </div>
            )}
          </div>
        </div>
        
        <Separator className="bg-trading-border" />
        
        {/* Execution Plan */}
        {authenticated && ready && orderParams.size > 0 && (
          <OrderExecutionPlanComponent 
            plan={executionPlan} 
            isLoading={false}
          />
        )}
        
        {/* Execution Status */}
        {(isExecuting || isTransferring) && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              {executionStep || (isTransferring ? 'Processing transfer...' : 'Executing order...')}
            </AlertDescription>
          </Alert>
        )}

        {/* Buy/Sell Buttons - At Bottom */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setSide('buy')}
              variant={side === 'buy' ? 'default' : 'outline'}
              className={`py-2 font-medium ${
                side === 'buy' 
                  ? 'bg-crypto-green text-black hover:bg-crypto-green/90' 
                  : 'bg-secondary text-foreground hover:bg-trading-hover'
              }`}
            >
              BUY
            </Button>
            <Button
              onClick={() => setSide('sell')}
              variant={side === 'sell' ? 'default' : 'outline'}
              className={`py-2 font-medium ${
                side === 'sell' 
                  ? 'bg-crypto-red text-white hover:bg-crypto-red/90' 
                  : 'bg-secondary text-foreground hover:bg-trading-hover'
              }`}
            >
              SELL
            </Button>
          </div>
          
          {/* Execute Order Button */}
          <Button
            onClick={handleSubmitOrder}
            disabled={!isValidOrder || isExecuting || isTransferring}
            className={`w-full py-3 font-medium ${
              side === 'buy'
                ? 'bg-crypto-green text-black hover:bg-crypto-green/90'
                : 'bg-crypto-red text-white hover:bg-crypto-red/90'
            }`}
          >
            {isExecuting || isTransferring ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isTransferring ? 'Transferring...' : 'Placing Order...'}
              </div>
            ) : (
              `${side.toUpperCase()} ${orderParams.size} ${orderBookData?.coin || 'BTC'}`
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}