import { useState, useEffect, useRef } from 'react';

interface PriceData {
  price: number | null;
  timestamp: number;
  loading: boolean;
  error: string | null;
  justUpdated: boolean;
}

export function useRedStonePrice(intervalMs: number = 10000) {
  const [priceData, setPriceData] = useState<PriceData>({
    price: null,
    timestamp: 0,
    loading: true,
    error: null,
    justUpdated: false
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const fetchPrice = async () => {
    try {
      setPriceData(prev => ({ ...prev, loading: false, error: null, justUpdated: false }));
      
      const response = await fetch(
        'https://api.redstone.finance/prices?symbol=BTC&provider=redstone&limit=1',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && data.length > 0 && isActiveRef.current) {
        const priceData = data[0];
        const price = priceData.value;
        const timestamp = priceData.timestamp;
        
        setPriceData({
          price,
          timestamp,
          loading: false,
          error: null,
          justUpdated: true
        });
        
        // Reset the justUpdated flag after 1 second
        setTimeout(() => {
          if (isActiveRef.current) {
            setPriceData(prev => ({ ...prev, justUpdated: false }));
          }
        }, 1000);
      }
    } catch (error) {
      if (isActiveRef.current) {
        setPriceData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          justUpdated: false
        }));
      }
    }
  };

  useEffect(() => {
    isActiveRef.current = true;
    
    // Initial fetch
    fetchPrice();
    
    // Set up polling
    intervalRef.current = setInterval(fetchPrice, intervalMs);
    
    // Cleanup function
    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [intervalMs]);

  return {
    ...priceData,
    refresh: fetchPrice, // Manual refresh function
    isConnected: priceData.price !== null && !priceData.error
  };
}
