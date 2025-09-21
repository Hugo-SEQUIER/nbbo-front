import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HyperliquidApiWallet, ExistingApiWallet } from '@/types/hyperliquid';

interface ApiWalletState {
    // Existing API wallets from Hyperliquid
    existingApiWallets: ExistingApiWallet[];
    setExistingApiWallets: (wallets: ExistingApiWallet[]) => void;
    addExistingApiWallet: (wallet: ExistingApiWallet) => void;
    removeExistingApiWallet: (address: string) => void;
    getApiWalletByName: (name: string) => ExistingApiWallet | undefined;

    // Current active API wallet
    currentApiWallet: HyperliquidApiWallet | null;
    setCurrentApiWallet: (wallet: HyperliquidApiWallet | null) => void;

    // UI state
    isSettingUpApiWallet: boolean;
    setIsSettingUpApiWallet: (loading: boolean) => void;

    // Clear all API wallet data (for logout)
    clearApiWalletData: () => void;
}

export const useApiWalletStore = create<ApiWalletState>()(
    persist(
        (set, get) => ({
            existingApiWallets: [],
            setExistingApiWallets: (wallets) => set({ existingApiWallets: wallets }),
            addExistingApiWallet: (wallet) => 
                set((state) => ({
                    existingApiWallets: [...state.existingApiWallets.filter(w => w.address !== wallet.address), wallet]
                })),
            removeExistingApiWallet: (address) =>
                set((state) => ({
                    existingApiWallets: state.existingApiWallets.filter(w => w.address !== address)
                })),
            getApiWalletByName: (name) => 
                get().existingApiWallets.find(w => w.name === name),

            currentApiWallet: null,
            setCurrentApiWallet: (wallet) => set({ currentApiWallet: wallet }),

            isSettingUpApiWallet: false,
            setIsSettingUpApiWallet: (loading) => set({ isSettingUpApiWallet: loading }),

            clearApiWalletData: () => set({ 
                currentApiWallet: null, 
                existingApiWallets: [],
                isSettingUpApiWallet: false 
            }),
        }),
        {
            name: 'api-wallet-storage',
            // Only persist certain parts of the state
            partialize: (state) => ({
                existingApiWallets: state.existingApiWallets,
                currentApiWallet: state.currentApiWallet,
            }),
        }
    )
);
