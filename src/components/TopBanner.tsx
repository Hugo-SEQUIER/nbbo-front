import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TopBanner = () => {
  return (
    <Card className="bg-trading-panel border-trading-border rounded-none shadow-lg">
      <div className="flex items-center justify-between px-6 py-2">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <img className="h-12 w-auto ml-4" src="/logo_white.png" alt="logo" />
        </div>

        {/* Right side - Status and Info */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-crypto-green rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground font-medium">Live Data</span>
          </div>
          
          <Badge variant="outline" className="border-crypto-green text-crypto-green">
            Multi-DEX
          </Badge>
          
          <div className="text-sm text-muted-foreground">
            Real-time Cross-Exchange Data
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TopBanner;
