// Hyperliquid-specific type definitions

export interface HyperliquidApiWallet {
    privateKey: string;
    address: string;
    approved: boolean;
    name?: string;
}

export interface ExistingApiWallet {
    address: string;
    name: string;
    validUntil: number;
}

export interface ClearinghouseState {
    marginSummary: {
        accountValue: string;
        totalMarginUsed: string;
        totalNtlPos: string;
        totalRawUsd: string;
        withdrawable: string;
    };
}

export interface PerpDex {
    name: string;
    full_name?: string;
    deployer?: string | null;
    oracle_updater?: string | null;
}

export interface MetaAndAssetCtxsResponse extends Array<{
    universe?: Array<{ name: string }>;
}> {}

export interface ExchangeApprovalResult {
    status: string;
    response?: any;
}
