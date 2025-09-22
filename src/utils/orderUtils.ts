// Order utilities for Hyperliquid trading

export type PxMeta = { pxDecimals: number; tickSize: number };
export type SzMeta = { szDecimals: number };

/**
 * Round price to tick size
 */
export function roundToTick(px: number, tick: number): number {
    return Math.round(px / tick) * tick;
}

/**
 * Clamp number to specified decimal places
 */
export function clampDecimals(n: number, maxDp: number): number {
    const f = 10 ** maxDp;
    return Math.round(n * f) / f;
}

/**
 * Create aggressive limit price for market-like orders
 */
export function makeAggressiveLimit(mid: number, side: "buy" | "sell", slippagePct: number): number {
    const mult = side === "buy" ? 1 + slippagePct / 100 : 1 - slippagePct / 100;
    return mid * mult; // raw, no formatting
}

/**
 * Get asset metadata for price/size formatting
 * Fallback values for common assets
 */
export function getAssetMeta(dexId: string, symbol: string): PxMeta & SzMeta {
    // Mapping basique pour les assets communs
    const assetMetaMap: Record<string, Record<string, PxMeta & SzMeta>> = {
        'sekaw': {
            'BTC': { pxDecimals: 1, tickSize: 0.1, szDecimals: 4 },
        },
        'merrli': {
            'BTC': { pxDecimals: 1, tickSize: 0.1, szDecimals: 4 },
        },
        'btcx': {
            'BTC-FEUSD': { pxDecimals: 1, tickSize: 0.1, szDecimals: 4 },
        }
    };
    
    // Fallback par défaut
    const defaultMeta: PxMeta & SzMeta = { 
        pxDecimals: 2, 
        tickSize: 0.01, 
        szDecimals: 3 
    };
    
    return assetMetaMap[dexId]?.[symbol] ?? defaultMeta;
}

/**
 * Get raw mid price for a specific DEX and symbol
 * This should return the actual trading price (e.g., 113000 for BTC)
 */
export function getAssetMidPrice(dexId: string, symbol: string, orderBookMetadata: any): number | null {
    if (!orderBookMetadata?.individual_exchanges) {
        return null;
    }
    
    const dexKey = `${dexId}:${symbol}`;
    const dexData = orderBookMetadata.individual_exchanges[dexKey];
    
    if (!dexData) {
        return null;
    }
    
    // Retourner le prix mid brut (non formaté)
    return dexData.mid_price;
}

/**
 * Format order price correctly
 */
export function formatOrderPrice(
    rawPrice: number, 
    side: "buy" | "sell", 
    orderType: "market" | "limit" | "ioc",
    limitPrice: number | undefined,
    slippagePercent: number,
    meta: PxMeta
): number {
    let pxRaw: number;
    
    if (orderType === "limit" && limitPrice && limitPrice > 0) {
        // Utiliser le prix limite fourni par l'utilisateur
        pxRaw = limitPrice;
    } else if (orderType === "market" || orderType === "ioc") {
        // Créer un prix agressif pour les ordres market-like
        pxRaw = makeAggressiveLimit(rawPrice, side, slippagePercent);
    } else {
        // Ordre limit au prix mid
        pxRaw = rawPrice;
    }
    
    // Arrondir au tick size et aux décimales
    pxRaw = roundToTick(pxRaw, meta.tickSize);
    pxRaw = clampDecimals(pxRaw, meta.pxDecimals);
    
    return pxRaw;
}

/**
 * Format order size correctly
 */
export function formatOrderSize(rawSize: number, meta: SzMeta): number {
    return clampDecimals(rawSize, meta.szDecimals);
}

/**
 * Build complete order parameters using real API metadata
 */
export async function buildOrderParams({
    dex, symbol, side, size, tif, limitPrice, slippagePct, isTestnet, orderBookMetadata
}: {
    dex: string;
    symbol: string;
    side: "buy" | "sell";
    size: number;
    tif: "Ioc" | "Gtc";
    limitPrice?: number | string;
    slippagePct: number;
    isTestnet: boolean;
    orderBookMetadata: any;
}) {
    // Import here to avoid circular dependency
    const { resolveAssetMeta } = await import('@/utils/assetIdResolver');
    
    const { assetId, pxDecimals = 2, tickSize = 0.01, szDecimals = 3 } =
        await resolveAssetMeta(dex, symbol, isTestnet);

    // Get RAW mid for this DEX/symbol from orderbook metadata
    const rawMid = getAssetMidPrice(dex, symbol, orderBookMetadata);
    if (!rawMid || rawMid < 1000) {
        throw new Error(`Suspicious mid ${rawMid} for ${dex}:${symbol}`);
    }

    let px = (limitPrice && +limitPrice > 0)
        ? +limitPrice
        : (tif === "Ioc" ? makeAggressiveLimit(rawMid, side, slippagePct) : rawMid);

    px = clampDecimals(roundToTick(px, tickSize), pxDecimals);
    let sz = clampDecimals(+size, szDecimals);

    return {
        params: {
            orders: [{
                a: assetId,
                b: side === "buy",
                p: px.toString(),
                s: sz.toString(),
                r: false,
                t: { limit: { tif } }
            }],
            grouping: "na" as const
        },
        debug: { assetId, rawMid, px, sz, pxDecimals, tickSize, szDecimals }
    };
}
