# NBBO Frontend - Cross-Exchange Trading Platform

A modern, real-time trading interface for cross-exchange cryptocurrency trading, built with React, TypeScript, and WebSocket integration.

## 🚀 Features

### Core Trading Features
- **Real-time Order Book**: Live order book data from multiple exchanges
- **Trading Chart**: Interactive candlestick charts with multiple timeframes (1m, 5m, 15m, 1h, 4h, 1d)
- **Order Management**: Place market and limit orders with leverage support
- **Position Tracking**: View open positions, order history, and account balances
- **Cross-Exchange Data**: Aggregated data from multiple DEXs (Hyperliquid, etc.)

### User Interface
- **Dark Theme**: Professional trading interface with crypto-green accents
- **Responsive Design**: Optimized for desktop trading workflows
- **Real-time Updates**: Live data with WebSocket connections
- **Wallet Integration**: Privy wallet authentication and management
- **Fund Management**: Transfer funds between exchanges

### Data Sources
- **Oracle Prices**: Redstone and Pyth price feeds
- **Exchange APIs**: Hyperliquid integration for trading and data
- **WebSocket Streams**: Real-time order book and price updates

## 🛠️ Tech Stack

### Frontend Framework
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components

### Trading & Blockchain
- **Hyperliquid SDK** - Trading and data integration
- **Ethers.js** - Ethereum blockchain interaction
- **Viem** - Type-safe Ethereum library
- **Privy** - Wallet authentication and management

### Charts & Visualization
- **Lightweight Charts** - High-performance trading charts

### Real-time Communication
- **WebSocket** - Real-time data streaming
- **Custom Hooks** - Reusable WebSocket logic

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── TopBanner.tsx    # Main navigation banner
│   ├── ExchangeBanner.tsx # Trading data display
│   ├── ExchangeSelector.tsx # Exchange price comparison
│   ├── TradingChart.tsx # Candlestick chart
│   ├── OrderBook.tsx    # Order book display
│   ├── TradingPanel.tsx # Order placement form
│   └── PositionsTable.tsx # Positions and order history
├── hooks/               # Custom React hooks
│   ├── useOrderBook.ts  # WebSocket order book data
│   ├── useChartData.ts  # Chart data fetching
│   ├── useUserData.ts   # User positions and history
│   ├── useWallet.tsx    # Wallet management
│   └── usePythPrice.ts  # Oracle price feeds
├── contexts/            # React contexts
│   └── OrderBookContext.tsx # Shared order book state
├── lib/                 # Utility libraries
│   ├── hyperliquid.ts   # Hyperliquid API client
│   ├── pythOracle.ts    # Pyth oracle integration
│   └── utils.ts         # General utilities
├── types/               # TypeScript type definitions
│   ├── api.ts          # API response types
│   └── hyperliquid.ts  # Hyperliquid-specific types
├── pages/               # Page components
│   ├── Index.tsx        # Main trading interface
│   └── NotFound.tsx     # 404 page
└── services/            # API services
    └── api.ts           # API client configuration
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd nbbo-front
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_PRIVY_APP_ID=your_privy_app_id
   VITE_API_BASE_URL=your_backend_api_url
   VITE_WS_URL=your_websocket_url
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📜 Available Scripts

- **`npm run dev`** - Start development server with hot reload
- **`npm run build`** - Build for production
- **`npm run build:dev`** - Build for development
- **`npm run preview`** - Preview production build locally
- **`npm run lint`** - Run ESLint for code quality

## 🔧 Configuration

### Environment Variables
- `VITE_PRIVY_APP_ID` - Privy authentication app ID
- `VITE_API_BASE_URL` - Backend API base URL
- `VITE_WS_URL` - WebSocket server URL

### Tailwind Configuration
The project uses a custom color scheme optimized for trading interfaces:
- `crypto-green` - Primary accent color
- `trading-panel` - Panel backgrounds
- `trading-border` - Border colors
- `trading-hover` - Hover states

## 🔌 API Integration

### WebSocket Connections
- **Order Book Data**: Real-time order book updates
- **Price Feeds**: Live price updates from multiple sources
- **Connection Management**: Automatic reconnection and error handling

### REST API Endpoints
- **User Data**: Positions, balances, order history
- **Chart Data**: Historical price data for candlesticks
- **Trading**: Order placement and management

### Oracle Integration
- **Redstone**: Decentralized price feeds
- **Pyth**: High-frequency price data
- **Real-time Updates**: Live price synchronization

## 🎨 UI Components

### Trading Interface
- **TopBanner**: Logo and navigation
- **ExchangeBanner**: Account value, best bid/ask, oracle prices
- **ExchangeSelector**: Multi-exchange price comparison
- **TradingChart**: Interactive candlestick charts
- **OrderBook**: Real-time order book display
- **TradingPanel**: Order placement form
- **PositionsTable**: Positions, orders, and history

### Design System
- **Dark Theme**: Professional trading interface
- **Responsive Layout**: Optimized for desktop trading
- **Real-time Indicators**: Live data status indicators
- **Consistent Spacing**: Tailwind-based spacing system

## 🔐 Authentication

### Wallet Integration
- **Privy**: Multi-wallet authentication
- **Wallet Connection**: Connect various wallet types
- **Trading Authorization**: Enable trading permissions
- **Account Management**: View connected accounts

## 📊 Data Flow

1. **WebSocket Connection**: Establishes real-time data stream
2. **Order Book Updates**: Live order book data from exchanges
3. **Price Feeds**: Oracle price updates (Redstone, Pyth)
4. **User Data**: Positions and balances via REST API
5. **Chart Data**: Historical data for candlestick charts
6. **Trading Actions**: Order placement and management

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deployment Options
- **Vercel**: Recommended for React applications
- **Netlify**: Static site hosting
- **AWS S3**: Static website hosting
- **Custom Server**: Node.js server deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔄 Version History

- **v0.0.0** - Initial release with core trading features
- Cross-exchange order book integration
- Real-time chart implementation
- Wallet authentication system
- Position and order management

---

**Built with ❤️ for the crypto trading community**