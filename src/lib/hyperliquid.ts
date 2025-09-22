const HL_URL = "https://esm.sh/jsr/@nktkas/hyperliquid";
const SIGN_URL = "https://esm.sh/jsr/@nktkas/hyperliquid/signing";

let cachedHl: unknown | null = null;
let cachedSigning: unknown | null = null;

export async function getHL() {
  if (cachedHl) return cachedHl;
  cachedHl = await import(/* @vite-ignore */ HL_URL);
  return cachedHl;
}

export async function getSigning() {
  if (cachedSigning) return cachedSigning;
  cachedSigning = await import(/* @vite-ignore */ SIGN_URL);
  return cachedSigning;
}

// Convenience helpers (optional)
export async function createHttpTransport(options?: Record<string, unknown>): Promise<unknown> {
  const hl: any = await getHL();
  return new hl.HttpTransport(options);
}

export async function createExchangeClient(params: Record<string, unknown>): Promise<unknown> {
  const hl: any = await getHL();
  return new hl.ExchangeClient(params);
}

// Info API helpers for dynamic metadata
import type { MetaAndAssetCtxsResponse, PerpDex } from "../types/hyperliquid";

// Hyperliquid API base URLs
const TESTNET_BASE_URL = "https://api.hyperliquid-testnet.xyz";
const MAINNET_BASE_URL = "https://api.hyperliquid.xyz";

const getApiBaseUrl = (isTestnet: boolean = true) => isTestnet ? TESTNET_BASE_URL : MAINNET_BASE_URL;

const INFO_URL = (isTestnet: boolean = true) => `${getApiBaseUrl(isTestnet)}/info`;
const EXCHANGE_URL = (isTestnet: boolean = true) => `${getApiBaseUrl(isTestnet)}/exchange`;

export async function fetchPerpDexs(): Promise<PerpDex[]> {
  return await fetchPerpDexsCached();
}

export async function fetchMetaAndAssetCtxs(dex: string, isTestnet: boolean = true): Promise<MetaAndAssetCtxsResponse> {
  const res = await fetch(INFO_URL(isTestnet), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs", dex }),
  });
  return (await res.json()) as MetaAndAssetCtxsResponse;
}

// Generic helpers to centralize API calls
export async function postExchange(body: {
  action: unknown;
  signature: string;
  nonce: number;
}, isTestnet: boolean = true): Promise<{ status: string; response?: unknown }> {
  const exchangeUrl = EXCHANGE_URL(isTestnet);
  const now = Date.now();
  const lastCall = apiCallTimes[exchangeUrl] || 0;
  const timeSinceLastCall = now - lastCall;

  if (timeSinceLastCall < MIN_API_INTERVAL) {
    await new Promise((resolve) => setTimeout(resolve, MIN_API_INTERVAL - timeSinceLastCall));
  }

  apiCallTimes[exchangeUrl] = Date.now();

  const res = await fetch(exchangeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as { status: string; response?: unknown };
}

export async function postInfo<T = unknown>(payload: unknown, isTestnet: boolean = true): Promise<T> {
  const infoUrl = INFO_URL(isTestnet);
  const now = Date.now();
  const lastCall = apiCallTimes[infoUrl] || 0;
  const timeSinceLastCall = now - lastCall;

  if (timeSinceLastCall < MIN_API_INTERVAL) {
    await new Promise((resolve) => setTimeout(resolve, MIN_API_INTERVAL - timeSinceLastCall));
  }

  apiCallTimes[infoUrl] = Date.now();

  const res = await fetch(infoUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (await res.json()) as T;
}

export async function infoClearinghouseState(user: string, dex: string, isTestnet: boolean = true) {
  const result = await postInfo({ type: "clearinghouseState", user, dex }, isTestnet);
  return result;
}

export async function infoMainDexClearinghouseState(user: string, isTestnet: boolean = true) {
  const result = await postInfo({ type: "clearinghouseState", user }, isTestnet);
  return result;
}

export async function infoOpenOrders(user: string, dex: string, isTestnet: boolean = true) {
  return await postInfo({ type: "openOrders", user, dex }, isTestnet);
}

export async function infoHistoricalOrders(user: string, dex: string, nMax: number, isTestnet: boolean = true) {
  return await postInfo({ type: "historicalOrders", user, dex, nMax }, isTestnet);
}

export async function fetchPerpDeployAuctionStatus(isTestnet: boolean = true) {
  return await postInfo({ type: "perpDeployAuctionStatus" }, isTestnet);
}

// High-level exchange helpers
export async function exchangeApproveApiWallet(params: {
  walletClient: unknown;
  apiWalletAddress: string;
  apiWalletName: string;
  signatureChainId: string;
  hyperliquidChain?: "Testnet" | "Mainnet" | string;
}): Promise<{ status: string; response?: unknown }> {
  const { walletClient, apiWalletAddress, apiWalletName, signatureChainId } = params;
  const hyperliquidChain = params.hyperliquidChain ?? "Testnet";
  const { signUserSignedAction, userSignedActionEip712Types }: any = await getSigning();

  const action = {
    type: "approveAgent",
    signatureChainId,
    hyperliquidChain,
    agentAddress: apiWalletAddress,
    agentName: apiWalletName,
    nonce: Date.now(),
  } as const;

  const signature = await signUserSignedAction({
    wallet: walletClient as any,
    action,
    types: userSignedActionEip712Types[action.type],
  });

  const isTestnet = hyperliquidChain === "Testnet";
  return await postExchange({ action, signature, nonce: action.nonce }, isTestnet);
}

export async function exchangeSendAsset(params: {
  walletClient: unknown;
  destination: string;
  sourceDex: string;
  destinationDex: string;
  token: string;
  amount: string;
  signatureChainId: string;
  hyperliquidChain?: "Testnet" | "Mainnet" | string;
  fromSubAccount?: string;
}): Promise<{ status: string; response?: unknown }> {
  const { walletClient, destination, sourceDex, destinationDex, token, amount, signatureChainId } =
    params;
  const hyperliquidChain = params.hyperliquidChain ?? "Testnet";
  const fromSubAccount = params.fromSubAccount ?? "";

  const { signUserSignedAction, userSignedActionEip712Types }: any = await getSigning();

  const action = {
    type: "sendAsset",
    hyperliquidChain,
    signatureChainId,
    destination,
    sourceDex,
    destinationDex,
    token,
    amount,
    fromSubAccount,
    nonce: Date.now(),
  } as const;

  const signature = await signUserSignedAction({
    wallet: walletClient as any,
    action,
    types: userSignedActionEip712Types[action.type],
  });

  const isTestnet = hyperliquidChain === "Testnet";
  return await postExchange({ action, signature, nonce: action.nonce }, isTestnet);
}

const assetIdCache: Record<string, Record<string, number>> = {};

export async function getAssetMarkPrice(dex: string, symbol: string): Promise<number | null> {
  try {
    const data = await fetchMetaAndAssetCtxs(dex);

    const universe = data?.[0]?.universe;
    if (!Array.isArray(universe)) {
      console.warn(`[Mark Price] No universe found for ${dex}`);
      return null;
    }

    // Find the index of our symbol in the universe
    const symbolIndex = universe.findIndex((asset: any) => asset?.name === symbol);
    if (symbolIndex === -1) {
      console.warn(`[Mark Price] Symbol ${symbol} not found in universe for ${dex}`);
      return null;
    }

    // Get asset contexts array
    const assetContexts = data?.[1];
    if (!Array.isArray(assetContexts) || assetContexts.length === 0) {
      console.warn(`[Mark Price] No asset contexts found for ${dex}`);
      return null;
    }

    // Get the asset context at the same index as our symbol
    const assetContext = assetContexts[symbolIndex];
    if (!assetContext?.markPx) {
      console.warn(`[Mark Price] No mark price found for ${symbol} at index ${symbolIndex}`);
      return null;
    }

    const markPrice = parseFloat(assetContext.markPx);
    console.log(
      `[Mark Price] Found mark price for ${symbol} (index ${symbolIndex}): $${markPrice.toFixed(6)}`,
    );
    return markPrice;
  } catch (error) {
    console.error(`[Mark Price] Error fetching mark price for ${symbol}:`, error);
    return null;
  }
}

export async function getAssetMidPrice(dex: string, symbol: string): Promise<number | null> {
  try {
    const data = await fetchMetaAndAssetCtxs(dex);

    console.log(`[Asset Price] API response structure:`, data);

    const universe = data?.[0]?.universe;
    if (!Array.isArray(universe)) {
      console.warn(`[Asset Price] No universe found for ${dex}`);
      return null;
    }

    // Find the index of our symbol in the universe
    const symbolIndex = universe.findIndex((asset: any) => asset?.name === symbol);
    if (symbolIndex === -1) {
      console.warn(`[Asset Price] Symbol ${symbol} not found in universe for ${dex}`);
      console.log(
        `[Asset Price] Available symbols:`,
        universe.map((a: any) => a.name),
      );
      return null;
    }

    // Get asset contexts array
    const assetContexts = data?.[1];
    if (!Array.isArray(assetContexts) || assetContexts.length === 0) {
      console.warn(`[Asset Price] No asset contexts found for ${dex}`);
      return null;
    }

    // Get the asset context at the same index as our symbol
    const assetContext = assetContexts[symbolIndex];
    if (!assetContext?.midPx) {
      console.warn(`[Asset Price] No mid price found for ${symbol} at index ${symbolIndex}`);
      return null;
    }

    const midPrice = parseFloat(assetContext.midPx);
    console.log(
      `[Asset Price] Found mid price for ${symbol} (index ${symbolIndex}): $${midPrice.toFixed(4)}`,
    );
    console.log(`[Asset Price] Asset context:`, assetContext);
    return midPrice;
  } catch (error) {
    console.error(`[Asset Price] Error fetching mid price for ${symbol}:`, error);
    return null;
  }
}

export async function resolveAssetIdForSymbol(dex: string, symbol: string): Promise<number | null> {
  const dexKey = dex || "";
  if (assetIdCache[dexKey]?.[symbol] !== undefined) {
    return assetIdCache[dexKey][symbol];
  }

  // Find the perp DEX index
  const dexs = await fetchPerpDexs();
  const perpDexIndex = Array.isArray(dexs) ? dexs.findIndex((d) => d?.name === dex) : -1;
  if (perpDexIndex < 0) return null;

  // Find the index of the symbol within the DEX universe
  const data = await fetchMetaAndAssetCtxs(dex);
  const universe: Array<{ name: string }> | undefined = data?.[0]?.universe;
  if (!Array.isArray(universe)) return null;
  const indexInMeta = universe.findIndex((a) => a?.name === symbol);
  if (indexInMeta < 0) return null;

  const computedAssetId = 100000 + perpDexIndex * 10000 + indexInMeta;
  assetIdCache[dexKey] = assetIdCache[dexKey] || {};
  assetIdCache[dexKey][symbol] = computedAssetId;
  return computedAssetId;
}

// Simple cache for perp DEX list to avoid rate limits
let perpDexsCache: PerpDex[] | null = null;
let perpDexsInflight: Promise<PerpDex[]> | null = null;

// Rate limiting for API calls
const apiCallTimes: Record<string, number> = {};
const MIN_API_INTERVAL = 1000; // Minimum 1 second between API calls

export async function fetchPerpDexsCached(forceRefresh: boolean = false): Promise<PerpDex[]> {
  try {
    if (!forceRefresh) {
      if (perpDexsCache) return perpDexsCache;
      // Attempt to hydrate from localStorage once
      const ls =
        typeof window !== "undefined" ? window.localStorage.getItem("perpDexsCacheV1") : null;
      if (ls) {
        try {
          const parsed = JSON.parse(ls);
          if (Array.isArray(parsed)) {
            perpDexsCache = parsed;
            return perpDexsCache;
          }
        } catch (_) {
          // ignore JSON parse error and fall back to network
        }
      }
      if (perpDexsInflight) return await perpDexsInflight;
    }

    perpDexsInflight = (async () => {
      const res = await fetch(INFO_URL(true), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "perpDexs" }),
      });
      const data = await res.json();
      perpDexsCache = Array.isArray(data) ? data : [];
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("perpDexsCacheV1", JSON.stringify(perpDexsCache));
        }
      } catch (_) {
        // ignore localStorage write errors (e.g., quota)
      }
      return perpDexsCache;
    })();

    const result = await perpDexsInflight;
    perpDexsInflight = null;
    return result;
  } catch (e) {
    perpDexsInflight = null;
    return perpDexsCache || [];
  }
}