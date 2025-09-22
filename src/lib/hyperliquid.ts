// Hyperliquid API integration for API wallet functionality

// Dynamic imports for Hyperliquid SDK
const HL_URL = "https://esm.sh/jsr/@nktkas/hyperliquid";
const SIGN_URL = "https://esm.sh/jsr/@nktkas/hyperliquid/signing";

let cachedHl: any = null;
let cachedSigning: any = null;

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

// Rate limiting to prevent API abuse
const MIN_API_INTERVAL = 1000; // Minimum 1 second between API calls
let lastApiCall = 0;

async function rateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < MIN_API_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_API_INTERVAL - timeSinceLastCall));
    }
    lastApiCall = Date.now();
}

/**
 * Posts an exchange request to Hyperliquid
 */
async function postExchange(payload: any): Promise<{ status: string; response?: any }> {
    await rateLimit();
    
    try {
        const response = await fetch("https://api.hyperliquid-testnet.xyz/exchange", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { status: "ok", response: data };
    } catch (error) {
        console.error("Exchange API error:", error);
        return { 
            status: "error", 
            response: error instanceof Error ? error.message : "Unknown error" 
        };
    }
}

/**
 * Approves an API wallet for trading on Hyperliquid
 */
export async function exchangeApproveApiWallet(params: {
    walletClient: any;
    apiWalletAddress: string;
    apiWalletName: string;
    signatureChainId: string;
    hyperliquidChain?: "Testnet" | "Mainnet" | string;
}): Promise<{ status: string; response?: any }> {
    const { walletClient, apiWalletAddress, apiWalletName, signatureChainId } = params;
    const hyperliquidChain = params.hyperliquidChain ?? "Testnet";
    
    try {
        const { signUserSignedAction, userSignedActionEip712Types } = await getSigning();

        const action = {
            type: "approveAgent",
            signatureChainId,
            hyperliquidChain,
            agentAddress: apiWalletAddress,
            agentName: apiWalletName,
            nonce: Date.now(),
        } as const;

        const signature = await signUserSignedAction({
            wallet: walletClient,
            action,
            types: userSignedActionEip712Types[action.type],
        });

        return await postExchange({ action, signature, nonce: action.nonce });
    } catch (error) {
        console.error("API wallet approval error:", error);
        return { 
            status: "error", 
            response: error instanceof Error ? error.message : "Unknown error" 
        };
    }
}

/**
 * Creates HTTP transport for Hyperliquid
 */
export async function createHttpTransport(opts: { isTestnet?: boolean } = {}) {
    const { isTestnet = true } = opts;
    const { HttpTransport } = await getHL();
    
    const baseUrl = isTestnet 
        ? "https://api.hyperliquid-testnet.xyz" 
        : "https://api.hyperliquid.xyz";
    
    return new HttpTransport({ url: baseUrl });
}

/**
 * Creates exchange client for trading
 */
export async function createExchangeClient(opts: {
    wallet?: string | null;
    transport: any;
    isTestnet?: boolean;
}) {
    const { wallet, transport, isTestnet = true } = opts;
    
    if (!wallet) {
        throw new Error("Wallet private key is required for exchange client");
    }
    
    const { ExchangeClient } = await getHL();
    return new ExchangeClient({ wallet, transport, isTestnet });
}

/**
 * Transfer assets between DEXs using API wallet
 */
export async function exchangeSendAsset(params: {
    apiWalletPrivateKey: string;
    destination: string;
    sourceDex: string;
    destinationDex: string;
    token: string;
    amount: string;
    signatureChainId: string;
    hyperliquidChain?: "Testnet" | "Mainnet" | string;
    fromSubAccount?: string;
}): Promise<{ status: string; response?: any }> {
    const { 
        apiWalletPrivateKey, 
        destination, 
        sourceDex, 
        destinationDex, 
        token, 
        amount, 
        signatureChainId 
    } = params;
    const hyperliquidChain = params.hyperliquidChain ?? "Testnet";
    const fromSubAccount = params.fromSubAccount ?? "";

    try {
        const { signUserSignedAction, userSignedActionEip712Types } = await getSigning();

        // Create a wallet client from the API wallet private key
        const { privateKeyToAccount } = await import('viem/accounts');
        const privateKey = apiWalletPrivateKey.startsWith('0x') 
            ? apiWalletPrivateKey as `0x${string}`
            : `0x${apiWalletPrivateKey}` as `0x${string}`;
        const account = privateKeyToAccount(privateKey);
        
        const walletClient = {
            account,
            signTypedData: async (args: any) => {
                return account.signTypedData(args);
            },
            getChainId: async () => {
                return parseInt(signatureChainId, 16);
            },
        };

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
            wallet: walletClient,
            action,
            types: userSignedActionEip712Types[action.type],
        });

        return await postExchange({ action, signature, nonce: action.nonce });
    } catch (error) {
        console.error("Asset transfer error:", error);
        return { 
            status: "error", 
            response: error instanceof Error ? error.message : "Unknown error" 
        };
    }
}