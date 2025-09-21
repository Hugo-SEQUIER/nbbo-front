import { useState, useEffect, useRef } from 'react';

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

interface OrderBookMessage {
  type: 'aggregated_order_book';
  data: OrderBookData;
  metadata: {
    coins_processed: number;
    total_coins: number;
    individual_exchanges: Record<string, IndividualExchange>;
  };
}

interface OrderBookState {
  data: OrderBookData | null;
  metadata: {
    coins_processed: number;
    total_coins: number;
    individual_exchanges: Record<string, IndividualExchange>;
  } | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  lastUpdate: number;
  justUpdated: boolean;
}

export function useOrderBook(wsUrl: string = 'ws://localhost:8000/ws/prices') {
  const [orderBook, setOrderBook] = useState<OrderBookState>({
    data: null,
    metadata: null,
    loading: true,
    error: null,
    connected: false,
    lastUpdate: 0,
    justUpdated: false
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isActiveRef = useRef(true);

  const connect = () => {
    try {
      console.log('🔌 Attempting to connect to WebSocket:', wsUrl);
      setOrderBook(prev => ({ ...prev, loading: true, error: null }));
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('📡 OrderBook WebSocket connected');
        setOrderBook(prev => ({ 
          ...prev, 
          connected: true, 
          loading: false, 
          error: null 
        }));
        reconnectAttempts.current = 0;
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: OrderBookMessage = JSON.parse(event.data);
          
          if (message.type === 'aggregated_order_book') {
            setOrderBook(prev => ({
              ...prev,
              data: message.data,
              metadata: message.metadata,
              lastUpdate: Date.now(),
              loading: false,
              error: null,
              justUpdated: true
            }));
            
            // Reset the justUpdated flag after 1 second
            setTimeout(() => {
              if (isActiveRef.current) {
                setOrderBook(prev => ({ ...prev, justUpdated: false }));
              }
            }, 1000);
            
            console.log('📊 OrderBook updated:', {
              bestBid: message.data.best_bid,
              bestAsk: message.data.best_ask,
              spread: message.data.spread,
              bidsCount: message.data.bids.length,
              asksCount: message.data.asks.length
            });
          }
        } catch (error) {
          console.error('❌ Error parsing OrderBook message:', error);
          setOrderBook(prev => ({
            ...prev,
            error: 'Failed to parse order book data',
            loading: false
          }));
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('📡 OrderBook WebSocket disconnected:', event.code, event.reason);
        console.log('📡 Close event details:', { code: event.code, reason: event.reason, wasClean: event.wasClean });
        setOrderBook(prev => ({ ...prev, connected: false }));
        
        // Attempt to reconnect if it wasn't a manual close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Attempting to reconnect in ${delay}ms... (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setOrderBook(prev => ({
            ...prev,
            error: 'Failed to reconnect after multiple attempts',
            loading: false
          }));
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ OrderBook WebSocket error:', error);
        console.error('❌ WebSocket error details:', {
          type: error.type,
          target: error.target,
          readyState: wsRef.current?.readyState
        });
        setOrderBook(prev => ({
          ...prev,
          error: 'WebSocket connection error',
          loading: false
        }));
      };
      
    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
      setOrderBook(prev => ({
        ...prev,
        error: 'Failed to create WebSocket connection',
        loading: false
      }));
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setOrderBook(prev => ({
      ...prev,
      connected: false,
      data: null
    }));
  };

  useEffect(() => {
    isActiveRef.current = true;
    connect();
    
    return () => {
      isActiveRef.current = false;
      disconnect();
    };
  }, [wsUrl]);

  return {
    ...orderBook,
    connect,
    disconnect,
    reconnect: () => {
      disconnect();
      reconnectAttempts.current = 0;
      setTimeout(connect, 1000);
    }
  };
}
