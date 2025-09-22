import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRightLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { OrderExecutionPlan } from '@/hooks/useSmartOrderExecution';
import { getExchangeDisplayName } from '@/utils/exchangeUtils';

interface OrderExecutionPlanProps {
    plan: OrderExecutionPlan | null;
    isLoading?: boolean;
}

export function OrderExecutionPlanComponent({ plan, isLoading }: OrderExecutionPlanProps) {
    if (isLoading) {
        return (
            <Card className="bg-trading-panel border-trading-border p-4">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-secondary rounded w-3/4"></div>
                    <div className="h-3 bg-secondary rounded w-1/2"></div>
                    <div className="h-3 bg-secondary rounded w-2/3"></div>
                </div>
            </Card>
        );
    }

    if (!plan) {
        return (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Unable to create execution plan. Please check market connectivity and try again.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card className="bg-trading-panel border-trading-border ">
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">EXECUTION PLAN</h3>
                    <Badge variant={plan.needsTransfer ? "secondary" : "outline"} className="text-xs">
                        {plan.needsTransfer ? "TRANSFER REQUIRED" : "DIRECT EXECUTION"}
                    </Badge>
                </div>

                {/* Best DEX Selection */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            {plan.bestDex.bestPrice > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-xs text-muted-foreground">SELECTED DEX:</span>
                        </div>
                        <span className="font-medium text-crypto-green">{plan.bestDex.displayName}</span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-5">
                        {plan.bestDex.reason}
                    </div>
                </div>

                {/* Price Information */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="text-xs text-muted-foreground">EXECUTION PRICE</div>
                        <div className="font-mono font-bold text-crypto-amber">
                            ${plan.finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">ESTIMATED COST</div>
                        <div className="font-mono font-bold">
                            ${plan.requiredFunds.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                {/* Fund Status */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Available on {plan.bestDex.displayName}:</span>
                        <span className={`font-mono ${plan.availableFunds >= plan.requiredFunds ? 'text-green-500' : 'text-red-500'}`}>
                            ${plan.availableFunds.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    {plan.needsTransfer && plan.fromDex && (
                        <>
                            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                                <ArrowRightLeft className="h-4 w-4 text-crypto-amber" />
                                <div className="flex-1 text-sm">
                                    <div className="font-medium">Transfer Required</div>
                                    <div className="text-xs text-muted-foreground">
                                        ${plan.transferAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} from {plan.fromDex ? getExchangeDisplayName(plan.fromDex) : 'Unknown DEX'} → {plan.bestDex.displayName}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {!plan.needsTransfer && (
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div className="text-sm text-green-500">
                                Sufficient funds available for direct execution
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="pt-3 border-t border-trading-border">
                    <div className="text-xs text-muted-foreground space-y-1">
                        <div>• DEX selection based on best market price</div>
                        <div>• 5% safety margin included in fund calculation</div>
                        {plan.needsTransfer && <div>• User-signed transfer, agent-signed order execution</div>}
                    </div>
                </div>
            </div>
        </Card>
    );
}
