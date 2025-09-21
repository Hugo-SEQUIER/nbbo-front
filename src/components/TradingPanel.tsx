import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TradingPanel() {
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [leverage, setLeverage] = useState('1');
  const [orderSize, setOrderSize] = useState('10');
  const [limitPrice, setLimitPrice] = useState('');
  const [slippage, setSlippage] = useState('8');

  return (
    <Card className="bg-trading-panel border-trading-border">
      <div className="p-4 space-y-4">
        {/* Order Size - First */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">ORDER SIZE ()</Label>
          <Input
            value={orderSize}
            onChange={(e) => setOrderSize(e.target.value)}
            className="bg-input border-trading-border font-mono"
            placeholder="10"
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
          <Label className="text-xs text-muted-foreground">LIMIT PRICE (optional)</Label>
          <Input
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            className="bg-input border-trading-border font-mono"
            placeholder="if empty p = (113900.0000 ± 8%)"
          />
        </div>

        {/* Trading Settings */}
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground font-medium">TRADING SETTINGS</div>
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">ORDER TYPE</Label>
            <Select value={orderType} onValueChange={setOrderType}>
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
        </div>

        {/* Buy/Sell Buttons - At Bottom */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => setSide('buy')}
            className={`py-3 font-medium ${
              side === 'buy' 
                ? 'bg-crypto-green text-black hover:bg-crypto-green/90' 
                : 'bg-secondary text-foreground hover:bg-trading-hover'
            }`}
          >
            BUY
          </Button>
          <Button
            onClick={() => setSide('sell')}
            className={`py-3 font-medium ${
              side === 'sell' 
                ? 'bg-crypto-red text-white hover:bg-crypto-red/90' 
                : 'bg-secondary text-foreground hover:bg-trading-hover'
            }`}
          >
            SELL
          </Button>
        </div>
      </div>
    </Card>
  );
}