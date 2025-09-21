// Types for user historical data endpoint
export interface UserOrder {
    coin: string;
    side: string;
    limitPx: string;
    sz: string;
    oid: number;
    timestamp: number;
    triggerCondition: string;
    isTrigger: boolean;
    triggerPx: string;
    children: any[];
    isPositionTpsl: boolean;
    reduceOnly: boolean;
    orderType: string;
    origSz: string;
    tif: string;
    cloid: string | null;
}

export interface UserHistoricalDataItem {
    order: UserOrder;
    status: "filled" | "open" | "canceled" | "triggered" | "rejected" | "marginCanceled";
    statusTimestamp: number;
}

export interface UserHistoricalData {
    success: boolean;
    data: UserHistoricalDataItem[];
}

// Types for user position endpoint
export interface MarginSummary {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
}

export interface ClearinghouseState {
    marginSummary: MarginSummary;
    crossMarginSummary: MarginSummary;
    crossMaintenanceMarginUsed: string;
    withdrawable: string;
    assetPositions: any[];
    time: number;
}

export interface SpotBalance {
    coin: string;
    token: number;
    total: string;
    hold: string;
    entryNtl: string;
}

export interface SpotState {
    balances: SpotBalance[];
}

export interface UserPositionItem {
    name: string;
    subAccountUser: string;
    master: string;
    clearinghouseState: ClearinghouseState;
    spotState: SpotState;
}

export interface UserPosition {
    success: boolean;
    data: UserPositionItem[] | null;
}
