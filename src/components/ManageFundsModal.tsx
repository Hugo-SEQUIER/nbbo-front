import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowRightLeft, Loader2 } from 'lucide-react';

interface ExchangeBalance {
  name: string;
  withdrawable: number;
  totalRawUsd: number;
}

interface ManageFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (fromDex: string, toDex: string, amount: number) => Promise<void>;
  exchanges: ExchangeBalance[];
  isTransferring?: boolean;
}

export function ManageFundsModal({
  isOpen,
  onClose,
  onTransfer,
  exchanges,
  isTransferring = false,
}: ManageFundsModalProps) {
  const [amount, setAmount] = useState<string>("100");
  const [fromDex, setFromDex] = useState<string>("");
  const [toDex, setToDex] = useState<string>("");

  const amountNum = parseFloat(amount || "0");
  const sourceExchange = exchanges.find(ex => ex.name === fromDex);
  const maxAmount = sourceExchange?.withdrawable || 0;
  const canSubmit = !isNaN(amountNum) && amountNum > 0 && amountNum <= maxAmount && fromDex && toDex && fromDex !== toDex;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onTransfer(fromDex, toDex, amountNum);
    onClose();
  };

  const handleMaxAmount = () => {
    if (sourceExchange) {
      setAmount(sourceExchange.withdrawable.toString());
    }
  };

  const handleReset = () => {
    setAmount("100");
    setFromDex("");
    setToDex("");
  };

  React.useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-crypto-green" />
            Manage Funds Between DEXs
          </DialogTitle>
          <DialogDescription>
            Transfer funds between different exchanges. Funds can only be transferred from withdrawable balances.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Current Balances */}
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
            <div className="text-sm font-medium text-foreground">Current Balances</div>
            <div className="space-y-2">
              {exchanges.map((exchange) => (
                <div key={exchange.name} className="flex justify-between items-center text-xs">
                  <div className="font-mono font-bold uppercase">{exchange.name}</div>
                  <div className="text-right">
                    <div className="font-medium text-foreground">
                      Total: ${exchange.totalRawUsd.toFixed(2)}
                    </div>
                    <div className="text-muted-foreground">
                      Withdrawable: ${exchange.withdrawable.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transfer Configuration */}
          <div className="space-y-4">
            {/* From DEX Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">From DEX</label>
              <Select value={fromDex} onValueChange={setFromDex}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select source exchange" />
                </SelectTrigger>
                <SelectContent>
                  {exchanges
                    .filter(ex => ex.withdrawable > 0)
                    .map((exchange) => (
                      <SelectItem key={exchange.name} value={exchange.name}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono font-bold uppercase">{exchange.name}</span>
                          <span className="text-muted-foreground ml-2">
                            ${exchange.withdrawable.toFixed(2)} available
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* To DEX Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">To DEX</label>
              <Select value={toDex} onValueChange={setToDex}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select destination exchange" />
                </SelectTrigger>
                <SelectContent>
                  {exchanges
                    .filter(ex => ex.name !== fromDex)
                    .map((exchange) => (
                      <SelectItem key={exchange.name} value={exchange.name}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono font-bold uppercase">{exchange.name}</span>
                          <span className="text-muted-foreground ml-2">
                            ${exchange.totalRawUsd.toFixed(2)} current
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Amount (USDC)</label>
                {sourceExchange && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleMaxAmount}
                    className="h-auto p-1 text-xs text-crypto-green hover:text-crypto-green/80"
                  >
                    Max: ${maxAmount.toFixed(2)}
                  </Button>
                )}
              </div>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-10"
                min="0"
                max={maxAmount}
                step="0.01"
              />
              {amountNum > maxAmount && sourceExchange && (
                <p className="text-xs text-red-500">
                  Amount exceeds available withdrawable balance (${maxAmount.toFixed(2)})
                </p>
              )}
            </div>
          </div>

          {/* Transfer Summary */}
          {fromDex && toDex && amountNum > 0 && (
            <div className="p-3 bg-secondary/30 rounded-lg border">
              <div className="text-sm font-medium text-foreground mb-2">Transfer Summary</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono font-bold uppercase text-crypto-green">{fromDex}</span>
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono font-bold uppercase text-crypto-green">{toDex}</span>
                <span className="ml-auto font-mono">${amountNum.toFixed(2)} USDC</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isTransferring}
              className="flex-1 bg-crypto-green text-black hover:bg-crypto-green/90"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                'Transfer Funds'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
