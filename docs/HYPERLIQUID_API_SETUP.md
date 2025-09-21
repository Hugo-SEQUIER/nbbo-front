# Hyperliquid API Wallet Setup

This document explains how the Hyperliquid API wallet functionality works in the NBBO Front application.

## Overview

The API wallet feature allows users to enable automated trading on Hyperliquid without requiring manual signature approval for each transaction. This improves the user experience by eliminating the need to approve every trade manually.

## How it Works

1. **Connect Wallet**: User connects their main wallet using Privy
2. **Enable Trading**: User clicks "Enable Trading" button which:
   - Generates a new cryptographically secure private key
   - Creates a Hyperliquid API wallet from this private key
   - Requests user to sign an EIP-712 approval message
   - Approves the API wallet on Hyperliquid for trading
   - Stores the API wallet securely in local storage

3. **Trading**: Once enabled, the API wallet can be used for:
   - Placing orders without user signatures
   - Automated trading strategies
   - High-frequency trading operations

## Components

### Core Files

- `src/utils/crypto.ts` - Wallet generation utilities
- `src/lib/hyperliquid.ts` - Hyperliquid API integration
- `src/store/apiWalletStore.ts` - Zustand store for API wallet state
- `src/hooks/useExchangeClient.ts` - Exchange client hook
- `src/hooks/useHyperliquidTrading.ts` - Trading functionality hook
- `src/types/hyperliquid.ts` - TypeScript type definitions

### UI Integration

- `src/components/ExchangeBanner.tsx` - Contains the "Enable Trading" button
- `src/hooks/useWallet.tsx` - Extended wallet hook with API wallet functionality

## Usage

### For Users

1. Connect your wallet using the "CONNECT WALLET" button
2. Click "ENABLE TRADING" to set up API wallet
3. Sign the approval message in your wallet
4. Trading is now enabled - the button will show "TRADING ENABLED"

### For Developers

```typescript
import { useHyperliquidTrading } from '@/hooks/useHyperliquidTrading';

function TradingComponent() {
  const { exchangeClient, isReady, error } = useHyperliquidTrading();
  
  if (!isReady) {
    return <div>Trading not enabled</div>;
  }
  
  // Use exchangeClient for trading operations
  // ...
}
```

## Security

- Private keys are generated client-side using cryptographically secure randomness
- Keys are stored in browser localStorage (consider server-side storage for production)
- EIP-712 signatures prevent replay attacks
- API wallets have configurable expiration (default: 1 year)

## Network Support

- Currently configured for Hyperliquid Testnet
- Can be easily switched to Mainnet by changing configuration
- Supports both environments through `isTestnet` parameter

## State Management

API wallet state is managed using Zustand with persistence:

- `currentApiWallet` - Currently active API wallet
- `existingApiWallets` - List of previously created API wallets
- `isSettingUpApiWallet` - Loading state during setup

## Error Handling

The implementation includes comprehensive error handling for:

- Wallet connection issues
- User signature rejection
- Network connectivity problems
- API rate limiting
- Hyperliquid API errors

## Rate Limiting

Built-in rate limiting prevents API abuse:
- Minimum 1 second between API calls
- Automatic retry with exponential backoff
- Request queuing for high-frequency operations
