import ExchangeBanner from '@/components/ExchangeBanner';
import ExchangeSelector from '@/components/ExchangeSelector';
import TradingChart from '@/components/TradingChart';
import OrderBook from '@/components/OrderBook';
import TradingPanel from '@/components/TradingPanel';
import PositionsTable from '@/components/PositionsTable';
import TopBanner from '@/components/TopBanner';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBanner />
      <ExchangeSelector />
      <ExchangeBanner />

      {/* Main Trading Interface */}
      <div className="flex gap-4 p-4">
        {/* Left Side - Trading Panel */}
        <div className="w-80 space-y-4">
          <TradingPanel />
        </div>

        {/* Center - Chart */}
        <div className="flex-1">
          <TradingChart />
        </div>

        {/* Right Side - Order Book */}
        <div className="w-80">
          <OrderBook />
        </div>
      </div>

      {/* Bottom - Positions Table */}
      <div className="px-4 pb-4">
        <PositionsTable />
      </div>
    </div>
  );
};

export default Index;