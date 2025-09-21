import { useExchangeClient } from './useExchangeClient';
import { useApiWalletStore } from '@/store/apiWalletStore';

/**
 * Hook for Hyperliquid trading functionality
 * This provides a ready-to-use exchange client when trading is enabled
 */
export function useHyperliquidTrading(isTestnet: boolean = true) {
    const { currentApiWallet } = useApiWalletStore();
    
    const { client, error, loading } = useExchangeClient({
        apiWalletPrivateKey: currentApiWallet?.privateKey,
        isTestnet,
    });

    const isTradingReady = !!(currentApiWallet?.approved && client && !error);

    return {
        exchangeClient: client,
        isReady: isTradingReady,
        isLoading: loading,
        error,
        apiWallet: currentApiWallet,
    };
}
