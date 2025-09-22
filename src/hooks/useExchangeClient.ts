import { useEffect, useState } from "react";

import { createExchangeClient, createHttpTransport } from "../lib/hyperliquid";

export type ExchangeClient = {
  order: (params: unknown) => Promise<{ status: string; response?: unknown }>;
  updateLeverage: (req: unknown) => Promise<{ status: string; response?: unknown }>;
};

export function useExchangeClient(opts: {
  apiWalletPrivateKey?: string | null;
  isTestnet?: boolean;
}) {
  const { apiWalletPrivateKey, isTestnet = true } = opts;
  const [client, setClient] = useState<ExchangeClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const transport = await createHttpTransport({ isTestnet });
        const c = await createExchangeClient({ wallet: apiWalletPrivateKey, transport, isTestnet });
        if (!cancelled) setClient(c as unknown as ExchangeClient);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiWalletPrivateKey, isTestnet]);

  return { client, error } as const;
}
