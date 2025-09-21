import ExchangeBanner from '@/components/ExchangeBanner';
import ExchangeSelector from '@/components/ExchangeSelector';
import TradingChart from '@/components/TradingChart';
import OrderBook from '@/components/OrderBook';
import TradingPanel from '@/components/TradingPanel';
import PositionsTable from '@/components/PositionsTable';

export default function TradingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Exchange Banner */}
      <ExchangeBanner />
      
      {/* Exchange Selector */}
      <ExchangeSelector />
      
      {/* Main Trading Layout - 3 Column Layout */}
      <div className="flex h-[calc(100vh-160px)]">
        {/* Left Column - Trading Panel */}
        <div className="w-80 border-r border-trading-border">
          <TradingPanel />
        </div>
        
        {/* Middle Column - Chart */}
        <div className="flex-1 flex flex-col">
          <TradingChart />
          <div className="flex-1 p-4">
            <PositionsTable />
          </div>
        </div>
        
        {/* Right Column - Order Book */}
        <div className="w-80 border-l border-trading-border">
          <OrderBook />
        </div>
      </div>
    </div>
  );
}
