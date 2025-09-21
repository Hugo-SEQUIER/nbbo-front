import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useApiWalletStore } from '@/store/apiWalletStore';
import { generateApiWalletPrivateKey, getAddressFromPrivateKey } from '@/utils/crypto';
import { exchangeApproveApiWallet } from '@/lib/hyperliquid';
import { HyperliquidApiWallet } from '@/types/hyperliquid';
import { toast } from 'sonner';

export const useWallet = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  
  const {
    currentApiWallet,
    setCurrentApiWallet,
    addExistingApiWallet,
    isSettingUpApiWallet,
    setIsSettingUpApiWallet,
    clearApiWalletData,
  } = useApiWalletStore();

  const connectWallet = async () => {
    if (!ready) return;
    await login();
  };

  const disconnectWallet = async () => {
    if (!ready) return;
    clearApiWalletData(); // Clear API wallet data on disconnect
    await logout();
  };

  const getWalletAddress = () => {
    if (!user?.wallet) return null;
    return user.wallet.address;
  };

  const getWalletBalance = () => {
    // You can implement balance fetching here
    return '0.00';
  };

  const getDisplayAddress = () => {
    const address = getWalletAddress();
    if (!address) return 'Not Connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };


  // Get current chain ID in hex format
  const getActiveChainIdHex = async () => {
    if (!authenticated || !wallets.length) {
      throw new Error("No wallet connected");
    }

    const wallet = wallets[0];
    const provider = await wallet.getEthereumProvider();
    const chainId = await provider.request({ method: 'eth_chainId' });
    return chainId;
  };

  // Setup Hyperliquid API wallet for trading
  const setupHyperliquidApiWallet = async () => {
    if (!authenticated || !wallets.length || !getWalletAddress()) {
      toast.error("Please connect your wallet first");
      return false;
    }

    setIsSettingUpApiWallet(true);
    
    try {
      // Check if API wallet already exists
      if (currentApiWallet && currentApiWallet.name === "NBBO-Trading") {
        toast.success("Using existing NBBO Trading API wallet!");
        return true;
      }
      
      // Generate new API wallet
      const apiWalletPrivateKey = generateApiWalletPrivateKey();
      const apiWalletAddress = getAddressFromPrivateKey(apiWalletPrivateKey);
      
      toast.info("Please sign the API wallet approval message in your wallet...");
      
      // Get the raw provider and account for signing
      const wallet = wallets[0];
      const provider = await wallet.getEthereumProvider();
      const accounts = await provider.request({ method: 'eth_accounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found in wallet");
      }
      
      // Create a wallet client compatible with Hyperliquid's expectations
      const viemWalletClient = {
        account: { address: accounts[0] },
        signTypedData: async (args: any) => {
          return await provider.request({
            method: 'eth_signTypedData_v4',
            params: [accounts[0], JSON.stringify(args)],
          });
        },
        getChainId: async () => {
          const chainId = await provider.request({ method: 'eth_chainId' });
          return parseInt(chainId, 16);
        },
      };
      
      // Approve API wallet on Hyperliquid
      const result = await exchangeApproveApiWallet({
        walletClient: viemWalletClient,
        apiWalletAddress: apiWalletAddress,
        apiWalletName: "NBBO-Trading",
        signatureChainId: await getActiveChainIdHex(),
      });
      
      if (result.status === "ok") {
        // Store API wallet in state
        const apiWallet: HyperliquidApiWallet = {
          privateKey: apiWalletPrivateKey,
          address: apiWalletAddress,
          approved: true,
          name: "NBBO-Trading",
        };
        
        setCurrentApiWallet(apiWallet);
        addExistingApiWallet({
          address: apiWalletAddress,
          name: "NBBO-Trading",
          validUntil: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        });
        
        toast.success("NBBO Trading API wallet setup successfully!");
        return true;
      } else {
        throw new Error(`API wallet approval failed: ${result.response || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to setup API wallet:", error);
      const raw = error instanceof Error ? error.message : String(error);
      const pretty =
        raw.includes("User rejected") || raw.includes("denied")
          ? "API wallet approval was cancelled by user"
          : raw.includes("No wallet connected")
            ? "Please connect your wallet and try again"
            : raw.replace(/Error:\s*/i, "");
      toast.error(pretty || "Failed to setup trading API wallet");
      return false;
    } finally {
      setIsSettingUpApiWallet(false);
    }
  };

  // Check if trading is enabled (API wallet is set up)
  const isTradingEnabled = () => {
    return currentApiWallet && currentApiWallet.approved;
  };

  return {
    ready,
    authenticated,
    user,
    connectWallet,
    disconnectWallet,
    getWalletAddress,
    getWalletBalance,
    getDisplayAddress,
    setupHyperliquidApiWallet,
    isTradingEnabled,
    isSettingUpApiWallet,
    currentApiWallet,
  };
};
