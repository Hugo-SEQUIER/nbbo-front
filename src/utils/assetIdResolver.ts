// Asset ID resolver for Hyperliquid DEXs using real API metadata

interface AssetMeta {
    assetId: number;
    szDecimals: number;
    pxDecimals: number;
    tickSize: number;
}

const TESTNET = "https://api.hyperliquid-testnet.xyz";
const MAINNET = "https://api.hyperliquid.xyz";
const base = (t: boolean) => t ? TESTNET : MAINNET;

// Cache pour éviter les appels répétés
const assetMetaCache: Record<string, Record<string, AssetMeta>> = {};

/**
 * Post to Hyperliquid info endpoint
 */
async function postInfo(body: any, isTestnet = true): Promise<any> {
    const r = await fetch(`${base(isTestnet)}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const txt = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt || "no body"}`);
    if (!txt) throw new Error("Empty response body");
    return JSON.parse(txt);
}

/**
 * Resolve asset metadata for a given DEX and symbol using hardcoded values
 */
export async function resolveAssetMeta(dex: string, symbol: string, isTestnet = true): Promise<AssetMeta> {
    const dexKey = dex || "";
    
    // Vérifier le cache d'abord
    if (assetMetaCache[dexKey]?.[symbol]) {
        return assetMetaCache[dexKey][symbol];
    }

    // Hardcoded asset IDs as requested
    const hardcodedAssetIds: Record<string, number> = {
        'btcx': 480000,
        'merrli': 420000,
        'sekaw': 390000,
    };

    const assetId = hardcodedAssetIds[dex];
    if (!assetId) {
        throw new Error(`Unknown DEX: ${dex}. Supported DEXs: ${Object.keys(hardcodedAssetIds).join(', ')}`);
    }

    // Default metadata for all assets
    const assetMeta: AssetMeta = {
        assetId: assetId,
        szDecimals: 3,
        pxDecimals: 2,
        tickSize: 0.01,
    };

    // Mettre en cache
    assetMetaCache[dexKey] = assetMetaCache[dexKey] || {};
    assetMetaCache[dexKey][symbol] = assetMeta;
    
    console.log(`Resolved asset meta for ${dex}:${symbol}:`, assetMeta);
    
    return assetMeta;
}

/**
 * Fallback mapping for common DEXs and symbols
 * Use this when the API resolution fails
 */
export function getFallbackAssetId(dex: string, symbol: string): number {
    const fallbackMap: Record<string, Record<string, number>> = {
        'sekaw': {
            'BTC': 390000,
        },
        'merrli': {
            'BTC': 420000,
            'ETH': 420000,
            'SOL': 420000,
        },
        'btcx': {
            'BTC-FEUSD': 480000,
        }
    };
    
    return fallbackMap[dex]?.[symbol] ?? 390000; // Default to sekaw if not found
}
