import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useWallets } from '@privy-io/react-auth';
import { useApiWalletStore } from '@/store/apiWalletStore';
import { exchangeSendAsset } from '@/lib/hyperliquid';
import { toast } from 'sonner';
import { getExchangeDisplayName } from '@/utils/exchangeUtils';

export function useFundTransfer() {
    const [isTransferring, setIsTransferring] = useState(false);
    const { getWalletAddress, authenticated } = useWallet();
    const { wallets } = useWallets();
    const { currentApiWallet } = useApiWalletStore();

    const transferFunds = async (fromDex: string, toDex: string, amount: number) => {
        if (!authenticated || !getWalletAddress()) {
            toast.error("Please connect your wallet first");
            return;
        }

        // Note: No need for API wallet approval for user-signed sendAsset
        // API wallet is only needed for agent-signed trading actions

        setIsTransferring(true);
        try {
            toast.info("Please sign the fund transfer in your wallet...");

            // Check wallets first
            if (!wallets || wallets.length === 0) {
                throw new Error("No wallet connected");
            }

            // Get wallet's current chainId first
            const wallet = wallets[0];
            const provider = await wallet.getEthereumProvider();
            const currentChainId = await provider.request({ method: 'eth_chainId' });
            
            // Determine the chain configuration based on wallet's chainId
            const isTestnet = import.meta.env.VITE_HYPERLIQUID_TESTNET !== 'false';
            const hyperliquidChain = isTestnet ? "Testnet" : "Mainnet";
            const signatureChainId = currentChainId; // Use wallet's current chainId

            // Debug DEX name mapping
            const dexMapping = {
                '': 'Main DEX (perps/spot)',
                'main': 'Main DEX (perps/spot)', 
                'btcx': 'BTCX DEX',
                'merrli': 'Merrli DEX',
                'sekaw': 'Sekaw DEX'
            };

            console.log('Fund transfer params (USER-SIGNED MODE):', {
                fromDex,
                toDex,
                fromDexName: dexMapping[fromDex as keyof typeof dexMapping] || `Unknown DEX: ${fromDex}`,
                toDexName: dexMapping[toDex as keyof typeof dexMapping] || `Unknown DEX: ${toDex}`,
                amount,
                isTestnet,
                hyperliquidChain,
                signatureChainId,
                currentChainIdDecimal: parseInt(currentChainId, 16),
                accountWithFunds: getWalletAddress()!, // This is YOUR main wallet that has the funds
                signerMode: 'User wallet signs (not API wallet)',
                transferType: 'User-signed sendAsset action',
                note: 'signatureChainId matches wallet chainId to avoid signature errors'
            });

            // Create user wallet client (the one that actually has funds and signs)
            // wallet and provider already retrieved above
            const accounts = await provider.request({ method: 'eth_accounts' });
            
            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found in wallet");
            }

            // Create user wallet client compatible with Hyperliquid
            const userWalletClient = {
                account: { address: accounts[0] },
                signTypedData: async (args: any) => {
                    // Ensure chainId consistency
                    const currentWalletChainId = await provider.request({ method: 'eth_chainId' });
                    if (currentWalletChainId !== signatureChainId) {
                        throw new Error(`ChainId mismatch: wallet has ${currentWalletChainId}, expected ${signatureChainId}`);
                    }
                    
                    return await provider.request({
                        method: 'eth_signTypedData_v4',
                        params: [accounts[0], JSON.stringify(args)],
                    });
                },
                getChainId: async () => {
                    return parseInt(signatureChainId, 16);
                },
            };

            const result = await exchangeSendAsset({
                userWalletClient, // USER wallet signs (not API wallet!)
                accountAddress: getWalletAddress()!, // The account that HAS the funds (your main wallet)
                sourceDex: fromDex, // Don't convert to lowercase - keep original format
                destinationDex: toDex, // Don't convert to lowercase - keep original format
                token: "USDC", // Standard USDC format
                amount: amount.toString(), // Regular decimal amount
                signatureChainId,
                hyperliquidChain,
            });

            console.log('Transfer result:', result);

            if (result.status === "ok") {
                toast.success(`Successfully transferred $${amount.toFixed(2)} from ${getExchangeDisplayName(fromDex)} to ${getExchangeDisplayName(toDex)}`);
                return true;
            } else {
                console.error('Transfer failed with response:', result.response);
                throw new Error(`Transfer failed: ${JSON.stringify(result.response) || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Fund transfer failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            
            if (errorMessage.includes("chainId")) {
                toast.error("Chain ID mismatch. Please make sure your wallet is connected to the correct network.");
            } else if (errorMessage.includes("User rejected") || errorMessage.includes("denied")) {
                toast.error("Transfer was cancelled by user");
            } else {
                toast.error(`Transfer failed: ${errorMessage}`);
            }
            return false;
        } finally {
            setIsTransferring(false);
        }
    };

    return {
        transferFunds,
        isTransferring,
        canTransfer: !!(authenticated && wallets && wallets.length > 0), // Only need connected wallet
    };
}
