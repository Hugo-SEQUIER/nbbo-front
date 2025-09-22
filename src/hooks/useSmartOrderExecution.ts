import { useState, useCallback, useMemo } from 'react';
import { useOrderBook } from './useOrderBook';
import { useUserBalance, useUserHistoricalData, useUserPosition } from './useUserData';
import { useFundTransfer } from './useFundTransfer';
import { useWallet } from './useWallet';
import { useExchangeClient } from './useExchangeClient';
import { useApiWalletStore } from '@/store/apiWalletStore';
import { toast } from 'sonner';
import { apiDexIdToUiId, uiIdToApiDexId, getExchangeDisplayName } from '@/utils/exchangeUtils';
import { buildOrderParams } from '@/utils/orderUtils';
import { resolveAssetMeta, getFallbackAssetId } from '@/utils/assetIdResolver';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'ioc';
const URL = "https://api.hyperliquid-testnet.xyz";
export interface OrderParams {
    side: OrderSide;
    size: number;
    type: OrderType;
    limitPrice?: number;
    slippage?: number; // Pour les ordres market-like
}

export interface BestDexSelection {
    dexId: string;
    displayName: string;
    bestPrice: number;
    estimatedCost: number;
    reason: string;
}

export interface OrderExecutionPlan {
    bestDex: BestDexSelection;
    requiredFunds: number;
    availableFunds: number;
    needsTransfer: boolean;
    transferAmount: number;
    fromDex?: string;
    finalPrice: number;
}

export function useSmartOrderExecution() {
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionStep, setExecutionStep] = useState<string>('');
    
    const { getWalletAddress, authenticated } = useWallet();
    const { metadata: orderBookMetadata, data: orderBookData } = useOrderBook();
    const address = getWalletAddress();
    const { data: balanceData, refetch: refetchBalance } = useUserBalance(address);
    const { refetch: refetchHistory } = useUserHistoricalData(address);
    const { refetch: refetchPosition } = useUserPosition(address);
    const { transferFunds, isTransferring } = useFundTransfer();
    const { currentApiWallet } = useApiWalletStore();
    const { client: exchangeClient } = useExchangeClient({
        apiWalletPrivateKey: currentApiWallet?.privateKey,
     
        isTestnet: true
    });

    // Sélectionner le meilleur DEX basé sur le side et les prix
    const selectBestDex = useCallback((orderParams: OrderParams): BestDexSelection | null => {
        if (!orderBookMetadata?.individual_exchanges) {
            return null;
        }

        const exchanges = Object.entries(orderBookMetadata.individual_exchanges);
        
        if (exchanges.length === 0) {
            return null;
        }

        // Pour un ordre d'achat, on veut le meilleur ask (prix le plus bas)
        // Pour un ordre de vente, on veut le meilleur bid (prix le plus haut)
        let bestExchange = exchanges[0];
        let bestPrice = orderParams.side === 'buy' 
            ? bestExchange[1].best_ask 
            : bestExchange[1].best_bid;

        for (const [dexKey, data] of exchanges) {
            const currentPrice = orderParams.side === 'buy' ? data.best_ask : data.best_bid;
            
            if (orderParams.side === 'buy' && currentPrice < bestPrice) {
                bestExchange = [dexKey, data];
                bestPrice = currentPrice;
            } else if (orderParams.side === 'sell' && currentPrice > bestPrice) {
                bestExchange = [dexKey, data];
                bestPrice = currentPrice;
            }
        }

        const [dexKey, dexData] = bestExchange;
        const dexId = dexKey.split(':')[0]; // Extract exchange name from "exchange:symbol"
        
        return {
            dexId,
            displayName: getExchangeDisplayName(dexId),
            bestPrice,
            estimatedCost: orderParams.size * bestPrice,
            reason: `Best ${orderParams.side === 'buy' ? 'ask' : 'bid'} price: $${bestPrice.toLocaleString()}`
        };
    }, [orderBookMetadata]);

    // Analyser les fonds disponibles et planifier l'exécution
    const createExecutionPlan = useCallback((orderParams: OrderParams): OrderExecutionPlan | null => {
        const bestDex = selectBestDex(orderParams);
        if (!bestDex || !balanceData?.success || !balanceData.data) {
            return null;
        }

        // Calculer le prix final en fonction du type d'ordre
        let finalPrice = bestDex.bestPrice;
        if (orderParams.type === 'limit' && orderParams.limitPrice) {
            finalPrice = orderParams.limitPrice;
        } else if (orderParams.type === 'market' && orderParams.slippage) {
            // Ajouter du slippage pour les ordres market
            const slippageMultiplier = orderParams.side === 'buy' 
                ? (1 + orderParams.slippage / 100) 
                : (1 - orderParams.slippage / 100);
            finalPrice = bestDex.bestPrice * slippageMultiplier;
        }

        // Calculer les fonds requis (avec une marge de sécurité de 5%)
        const requiredFunds = orderParams.size * finalPrice * 1.05;

        // Vérifier les fonds disponibles sur le DEX sélectionné
        const dexBalanceData = balanceData.data[bestDex.dexId];
        const availableFunds = dexBalanceData && typeof dexBalanceData === 'object' && 'withdrawable' in dexBalanceData
            ? parseFloat((dexBalanceData as any).withdrawable || '0')
            : 0;

        let needsTransfer = false;
        let transferAmount = 0;
        let fromDex: string | undefined;

        if (availableFunds < requiredFunds) {
            // Trouver le DEX avec le plus de fonds disponibles
            const exchangesWithFunds = Object.entries(balanceData.data)
                .filter(([key, value]) => 
                    key !== 'total_account_value' && 
                    key !== bestDex.dexId && 
                    typeof value === 'object' && 
                    value && 
                    'withdrawable' in value
                )
                .map(([dexId, data]) => ({
                    dexId,
                    funds: parseFloat((data as any).withdrawable || '0')
                }))
                .sort((a, b) => b.funds - a.funds);

            if (exchangesWithFunds.length > 0 && exchangesWithFunds[0].funds > 0) {
                fromDex = exchangesWithFunds[0].dexId;
                transferAmount = Math.min(
                    requiredFunds - availableFunds,
                    exchangesWithFunds[0].funds
                );
                needsTransfer = transferAmount > 0;
            }
        }

        return {
            bestDex,
            requiredFunds,
            availableFunds,
            needsTransfer,
            transferAmount,
            fromDex,
            finalPrice
        };
    }, [selectBestDex, balanceData]);


     // Exécuter l'ordre complet
     const executeOrder = useCallback(async (orderParams: OrderParams): Promise<boolean> => {
         if (!authenticated || !exchangeClient || !address) {
             toast.error("Please connect your wallet and approve API wallet first");
             return false;
         }

         // Vérification supplémentaire de l'API wallet
         if (!currentApiWallet?.address || !currentApiWallet?.privateKey) {
             toast.error("API wallet not properly configured. Please create and approve an API wallet.");
             return false;
         }

         console.log('API wallet info:', {
             address: currentApiWallet.address,
             hasPrivateKey: !!currentApiWallet.privateKey,
             approved: currentApiWallet.approved
         });

         // Vérifier que l'API wallet est approuvé
         if (!currentApiWallet.approved) {
             toast.error("API wallet is not approved yet. Please approve it first before trading.");
             return false;
         }

         // Vérifier le réseau
         const isTestnet = true;
         console.log('Network configuration:', {
             isTestnet,
             envVar: import.meta.env.VITE_HYPERLIQUID_TESTNET,
             expectedNetwork: isTestnet ? 'Testnet' : 'Mainnet'
         });
         console.log('exchangeClient', exchangeClient);
         // Debug ExchangeClient configuration
         console.log('ExchangeClient configuration:', {
             agentAddress: currentApiWallet?.address,
             userAddress: address,
             isTestnet,
             transportUrl: (exchangeClient as any)?.transport?.url,
             signatureChainId: (exchangeClient as any)?.signatureChainId?.() || 'unknown'
         });

        setIsExecuting(true);
        setExecutionStep('Analyzing order...');

        try {
            // 1. Créer le plan d'exécution
            const plan = createExecutionPlan(orderParams);
            if (!plan) {
                throw new Error("Could not create execution plan. Check market data and balance.");
            }

            toast.info(`Selected ${plan.bestDex.displayName} - ${plan.bestDex.reason}`);

            // 2. Transférer les fonds si nécessaire
            if (plan.needsTransfer && plan.fromDex) {
                setExecutionStep(`Transferring $${plan.transferAmount.toFixed(2)} to ${plan.bestDex.displayName}...`);
                
                const fromUiId = apiDexIdToUiId(plan.fromDex);
                const toUiId = apiDexIdToUiId(plan.bestDex.dexId);
                
                const transferSuccess = await transferFunds(fromUiId, toUiId, plan.transferAmount);
                if (!transferSuccess) {
                    throw new Error("Fund transfer failed");
                }

                // Attendre un peu et rafraîchir les balances
                await new Promise(resolve => setTimeout(resolve, 2000));
                await refetchBalance();
                
                // Re-vérifier que le meilleur DEX n'a pas changé
                const newPlan = createExecutionPlan(orderParams);
                if (newPlan && newPlan.bestDex.dexId !== plan.bestDex.dexId) {
                    toast.warning(`Best DEX changed to ${newPlan.bestDex.displayName}. Re-evaluating...`);
                    // Récursion pour re-exécuter avec le nouveau plan
                    return await executeOrder(orderParams);
                }
            }

             // 3. Placer l'ordre via l'API wallet (agent-signed)
             setExecutionStep('Building order parameters...');
             
             const coin = orderBookData?.coin || 'BTC';
             
             // Simple order construction like the working example
             const isBuy = orderParams.side === 'buy';
             let orderPrice: string;
             
             if (orderParams.limitPrice) {
                 orderPrice = orderParams.limitPrice.toFixed(2);
             } else {
                 // Use plan's final price (already calculated with best price + slippage)
                 orderPrice = plan.finalPrice.toFixed(2);
             }
             
             // Get correct asset ID for the selected DEX
             let assetId: number;
             try {
                 const assetMeta = await resolveAssetMeta(plan.bestDex.dexId, coin, isTestnet);
                 assetId = assetMeta.assetId;
             } catch (error) {
                 console.warn(`Failed to resolve asset ID for ${plan.bestDex.dexId}:${coin}, using fallback`);
                 assetId = getFallbackAssetId(plan.bestDex.dexId, coin);
             }
             
             // Simple order parameters like the working example
             const params = {
                 orders: [{
                     a: assetId,                     // Correct Asset ID for the DEX
                     b: isBuy,                       // Buy/Sell direction
                     p: orderPrice,                  // Price
                     s: orderParams.size.toString(), // Size
                     r: false,                       // Reduce only
                     t: {
                         limit: {
                             tif: orderParams.type === 'ioc' ? 'Ioc' : 'Gtc'
                         }
                     }
                 }],
                 grouping: "na" as const
             };

            console.log('Placing order with simplified params:', {
                params,
                targetDex: plan.bestDex.dexId,
                estimatedCost: plan.requiredFunds,
                orderPrice,
                side: orderParams.side,
                size: orderParams.size
            });

            // Placer l'ordre via l'API Hyperliquid
            try {
                // Debug final avant l'appel order
                console.log('Pre-order sanity check:', {
                    envIsTestnet: isTestnet,
                    transportUrl: (exchangeClient as any)?.transport?.url,
                    agentAddress: currentApiWallet?.address,
                    userAddress: address,
                    orderParams: params
                });
                
                // // Vérifier que le transport est configuré
                // if (!(exchangeClient as any)?.transport?.url) {
                //     throw new Error('No transport bound to ExchangeClient');
                // }
                
                let orderResult;
                
                // Essayer la méthode order avec les paramètres construits
                if (typeof (exchangeClient as any).order === 'function') {
                    console.log('Using exchangeClient.order() method');
                    orderResult = await (exchangeClient as any).order(params);
                } else {
                    throw new Error('No order method found on exchangeClient');
                }
                
                console.log('Order placement result:', orderResult);
                
                // Vérifier le statut de la réponse
                if (orderResult && orderResult.status && orderResult.status !== 'ok') {
                    throw new Error(`Order placement failed: ${JSON.stringify(orderResult.response || orderResult)}`);
                }
                
                // Si pas de statut mais une réponse, considérer comme succès
                if (orderResult) {
                    console.log('Order placed successfully:', orderResult);
                } else {
                    throw new Error('Order placement returned no result');
                }
             } catch (orderError) {
                 console.error('Order placement error:', orderError);
                 
                 // Améliorer les messages d'erreur avec gestion spécifique
                 let errorMessage = 'Unknown error';
                 if (orderError instanceof Error) {
                     errorMessage = orderError.message;
                 } else if (typeof orderError === 'string') {
                     errorMessage = orderError;
                 } else if (orderError && typeof orderError === 'object') {
                     errorMessage = JSON.stringify(orderError);
                 }
                 
                 // Gestion spécifique des erreurs d'API wallet
                 if (errorMessage.includes('does not exist') || errorMessage.includes('User or API Wallet')) {
                     console.error('❌ API WALLET ISSUE DETECTED:', {
                         error: errorMessage,
                         apiWalletAddress: currentApiWallet?.address,
                         userAddress: address,
                         isTestnet,
                         approved: currentApiWallet?.approved,
                         suggestion: 'The API wallet needs to be re-approved on Hyperliquid'
                     });
                     
                     toast.error(`❌ API wallet ${currentApiWallet?.address} is not approved on Hyperliquid. Click "Enable Trading" again to re-approve it.`);
                     
                     throw new Error(`API wallet not recognized by Hyperliquid. 
                     
🔧 SOLUTION: Click "Enable Trading" button again to re-approve your API wallet.

📋 Details:
- API Wallet: ${currentApiWallet?.address || 'Unknown'}
- User Address: ${address}
- Network: ${isTestnet ? 'Testnet' : 'Mainnet'}
- Status: ${currentApiWallet?.approved ? 'Locally approved' : 'Not approved'}

Original error: ${errorMessage}`);
                 }
                 
                 throw new Error(`Failed to place order: ${errorMessage}`);
             }
            
            toast.success(`Order placed successfully on ${plan.bestDex.displayName}!`);
            
            // 4. Rafraîchir l'état
            setExecutionStep('Refreshing data...');
            await Promise.all([
                refetchBalance(),
                refetchHistory(),
                refetchPosition()
            ]);
            
            return true;

        } catch (error) {
            console.error('Order execution failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Order execution failed: ${errorMessage}`);
            return false;
        } finally {
            setIsExecuting(false);
            setExecutionStep('');
        }
    }, [authenticated, exchangeClient, address, createExecutionPlan, transferFunds, refetchBalance, orderBookData]);

    // Hook pour obtenir le plan d'exécution en temps réel
    const getExecutionPlan = useCallback((orderParams: OrderParams) => {
        return createExecutionPlan(orderParams);
    }, [createExecutionPlan]);

    console.log('ready', !!(authenticated && exchangeClient && address));
    return {
        executeOrder,
        getExecutionPlan,
        selectBestDex,
        isExecuting,
        isTransferring,
        executionStep,
        ready: !!(authenticated && exchangeClient && address)
    };
}
