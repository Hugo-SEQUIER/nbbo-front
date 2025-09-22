import React, { createContext, useContext, ReactNode } from 'react';
import { useOrderBook } from '@/hooks/useOrderBook';

interface OrderBookEntry {
  price: number;
  size: number;
  orders: number;
}

interface OrderBookData {
  coin: string;
  timestamp: number;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  best_bid: number;
  best_ask: number;
  spread: number;
  mid_price: number;
}

interface IndividualExchange {
  best_bid: number;
  best_ask: number;
  spread: number;
  mid_price: number;
}

interface OrderBookMetadata {
  coins_processed: number;
  total_coins: number;
  individual_exchanges: Record<string, IndividualExchange>;
}

interface OrderBookContextType {
  data: OrderBookData | null;
  metadata: OrderBookMetadata | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  lastUpdate: number;
  justUpdated: boolean;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

const OrderBookContext = createContext<OrderBookContextType | undefined>(undefined);

interface OrderBookProviderProps {
  children: ReactNode;
  wsUrl?: string;
}

export const OrderBookProvider: React.FC<OrderBookProviderProps> = ({ 
  children, 
  wsUrl = 'ws://localhost:8000/ws/prices' 
}) => {
  const orderBookData = useOrderBook(wsUrl);

  return (
    <OrderBookContext.Provider value={orderBookData}>
      {children}
    </OrderBookContext.Provider>
  );
};

export const useOrderBookContext = (): OrderBookContextType => {
  const context = useContext(OrderBookContext);
  
  if (context === undefined) {
    throw new Error('useOrderBookContext must be used within an OrderBookProvider');
  }
  
  return context;
};

// Export types for use in components
export type { OrderBookData, OrderBookMetadata, IndividualExchange, OrderBookEntry };
