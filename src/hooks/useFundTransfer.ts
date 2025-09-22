import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useApiWalletStore } from '@/store/apiWalletStore';
import { exchangeSendAsset } from '@/lib/hyperliquid';
import { toast } from 'sonner';

export function useFundTransfer() {
    const [isTransferring, setIsTransferring] = useState(false);
    const { getWalletAddress, authenticated } = useWallet();
    const { currentApiWallet } = useApiWalletStore();

    const transferFunds = async (fromDex: string, toDex: string, amount: number) => {
        if (!authenticated || !getWalletAddress()) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!currentApiWallet?.privateKey || !currentApiWallet?.approved) {
            toast.error("Please enable trading first to use fund transfers");
            return;
        }

        setIsTransferring(true);
        try {
            toast.info("Initiating fund transfer...");

            // Determine the chain configuration
            const isTestnet = import.meta.env.VITE_HYPERLIQUID_TESTNET !== 'false';
            const hyperliquidChain = isTestnet ? "Testnet" : "Mainnet";
            const signatureChainId = isTestnet ? "0x66eee" : "0x1"; // Hyperliquid testnet vs Ethereum mainnet

            const result = await exchangeSendAsset({
                apiWalletPrivateKey: currentApiWallet.privateKey,
                destination: getWalletAddress()!,
                sourceDex: fromDex.toLowerCase(), // Convert to lowercase to match API expectations
                destinationDex: toDex.toLowerCase(), // Convert to lowercase to match API expectations
                token: "USDC", // Default to USDC for now
                amount: amount.toString(),
                signatureChainId,
                hyperliquidChain,
            });

            if (result.status === "ok") {
                toast.success(`Successfully transferred $${amount.toFixed(2)} from ${fromDex.toUpperCase()} to ${toDex.toUpperCase()}`);
                return true;
            } else {
                throw new Error(`Transfer failed: ${result.response || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Fund transfer failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            toast.error(`Transfer failed: ${errorMessage}`);
            return false;
        } finally {
            setIsTransferring(false);
        }
    };

    return {
        transferFunds,
        isTransferring,
        canTransfer: !!(authenticated && currentApiWallet?.approved),
    };
}
