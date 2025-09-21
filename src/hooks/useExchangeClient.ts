import { useState, useEffect } from 'react';
import { createHttpTransport, createExchangeClient } from '@/lib/hyperliquid';

export interface ExchangeClient {
    // Define the interface based on Hyperliquid SDK
    // This will be populated with actual methods when the SDK is loaded
}

export function useExchangeClient(opts: {
    apiWalletPrivateKey?: string | null;
    isTestnet?: boolean;
}) {
    const { apiWalletPrivateKey, isTestnet = true } = opts;
    const [client, setClient] = useState<ExchangeClient | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        
        if (!apiWalletPrivateKey) {
            setClient(null);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        (async () => {
            try {
                const transport = await createHttpTransport({ isTestnet });
                const exchangeClient = await createExchangeClient({ 
                    wallet: apiWalletPrivateKey, 
                    transport, 
                    isTestnet 
                });
                
                if (!cancelled) {
                    setClient(exchangeClient as unknown as ExchangeClient);
                    setLoading(false);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : String(e));
                    setClient(null);
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [apiWalletPrivateKey, isTestnet]);

    return { client, error, loading } as const;
}
