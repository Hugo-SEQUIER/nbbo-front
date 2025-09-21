import { usePrivy } from '@privy-io/react-auth';

export const useWallet = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();

  const connectWallet = async () => {
    if (!ready) return;
    await login();
  };

  const disconnectWallet = async () => {
    if (!ready) return;
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

  return {
    ready,
    authenticated,
    user,
    connectWallet,
    disconnectWallet,
    getWalletAddress,
    getWalletBalance,
    getDisplayAddress,
  };
};
