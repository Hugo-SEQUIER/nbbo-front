// Correct Hyperliquid ExchangeClient creation
import { getHL } from "@/lib/hyperliquid";

export async function createHLExchangeClient({
  apiWalletPrivateKey,
  userAddress,
  isTestnet = true,
}: {
  apiWalletPrivateKey: string;
  userAddress: string;
  isTestnet?: boolean;
}) {
  const { ExchangeClient, HttpTransport } = await getHL();
  const url = isTestnet
    ? "https://api.hyperliquid-testnet.xyz"
    : "https://api.hyperliquid.xyz";

  const transport = new HttpTransport({ url });

  return new ExchangeClient({
    wallet: apiWalletPrivateKey, // agent signer
    user: userAddress,           // funded address the agent represents
    transport,
    isTestnet,
  });
}
