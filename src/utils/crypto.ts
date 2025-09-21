import { Wallet as EthersWallet } from "ethers";

/**
 * Generates a cryptographically secure private key for API wallet
 * @returns Hex string private key with 0x prefix
 */
export function generateApiWalletPrivateKey(): string {
    const privateKeyBytes = new Uint8Array(32);
    crypto.getRandomValues(privateKeyBytes);
    return (
        "0x" +
        Array.from(privateKeyBytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
    );
}

/**
 * Derives Ethereum address from private key
 * @param privateKey Hex string private key
 * @returns Ethereum address
 */
export function getAddressFromPrivateKey(privateKey: string): string {
    const wallet = new EthersWallet(privateKey);
    return wallet.address;
}
