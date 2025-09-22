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
async function postExchange(payload: any, isTestnet: boolean = true): Promise<{ status: string; response?: any }> {
    await rateLimit();
    
    try {
        const baseUrl = isTestnet 
            ? "https://api.hyperliquid-testnet.xyz" 
            : "https://api.hyperliquid.xyz";
        
        console.log('Posting to exchange API:', baseUrl + '/exchange', payload);
        
        const response = await fetch(baseUrl + "/exchange", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log('Exchange API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Exchange API error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
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

        const isTestnet = hyperliquidChain === "Testnet";
        return await postExchange({ action, signature, nonce: action.nonce }, isTestnet);
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
 * Transfer assets between DEXs using USER wallet (user-signed action)
 * sendAsset is a USER-SIGNED action that must be signed by the account owner
 */
export async function exchangeSendAsset(params: {
    userWalletClient: any; // The user's main wallet client (from Privy)
    accountAddress: string; // The main account that HAS the funds (user's main wallet)
    sourceDex: string;
    destinationDex: string;
    token: string;
    amount: string;
    signatureChainId: string;
    hyperliquidChain?: "Testnet" | "Mainnet" | string;
    fromSubAccount?: string;
}): Promise<{ status: string; response?: any }> {
    const { 
        userWalletClient, // USER's wallet signs (not API wallet!)
        accountAddress, // This is the account that has the funds
        sourceDex, 
        destinationDex, 
        token, 
        amount, 
        signatureChainId 
    } = params;
    const hyperliquidChain = params.hyperliquidChain ?? "Testnet";
    const fromSubAccount = params.fromSubAccount ?? "";

    try {
        // Use USER signing (sendAsset is user-signed action)
        const { signUserSignedAction, userSignedActionEip712Types } = await getSigning();

        // sendAsset action (user-signed)
        const action = {
            type: "sendAsset",
            hyperliquidChain,
            signatureChainId,
            destination: accountAddress, // Internal transfer - same account
            sourceDex,
            destinationDex,
            token,
            amount,
            fromSubAccount,
            nonce: Date.now(),
        } as const;

        console.log('SendAsset action (USER-SIGNED CORRECTED):', {
            ...action,
            userWithFunds: accountAddress,
            userSigner: userWalletClient.account?.address || 'Unknown',
            actionType: 'User-signed action',
            transferType: 'Internal transfer between DEXs',
            note: 'sendAsset must be signed by account owner, not API wallet'
        });

        const signature = await signUserSignedAction({
            wallet: userWalletClient, // USER wallet signs
            action,
            types: userSignedActionEip712Types[action.type],
        });

        console.log('User signature generated:', signature);

        const isTestnet = hyperliquidChain === "Testnet";
        const result = await postExchange({ action, signature, nonce: action.nonce }, isTestnet);
        console.log('Exchange API response:', result);
        
        return result;
    } catch (error) {
        console.error("Asset transfer error:", error);
        return { 
            status: "error", 
            response: error instanceof Error ? error.message : "Unknown error" 
        };
    }
}