import { useState, useEffect, useCallback } from 'react';

interface ChartDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartApiResponse {
  success: boolean;
  data: ChartDataPoint[];
  coin: string;
  timeframe: string;
  count: number;
}

interface ChartDataState {
  data: ChartDataPoint[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  justUpdated: boolean;
}

export function useChartData(coin: string = 'BTC', timeframe: string = '15min') {
  const [chartState, setChartState] = useState<ChartDataState>({
    data: [],
    loading: true,
    error: null,
    lastUpdate: null,
    justUpdated: false,
  });

  const fetchChartData = useCallback(async () => {
    try {
      setChartState(prev => ({ ...prev, loading: true, error: null }));
      
      // Build URL with optional timeframe parameter
      const url = new URL(`http://0.0.0.0:8000/chart/${coin}`);
      if (timeframe && timeframe !== '15min') {
        url.searchParams.append('timeframe', timeframe);
      }
      
      console.log('Fetching chart data from:', url.toString()); // Debug log
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ChartApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error('API returned unsuccessful response');
      }

      console.log('Chart data received:', result.data.length, 'candles'); // Debug log

      setChartState(prev => ({
        ...prev,
        data: result.data,
        loading: false,
        lastUpdate: new Date(),
        justUpdated: true,
      }));

      // Reset the flash effect after 1 second
      setTimeout(() => {
        setChartState(prev => ({ ...prev, justUpdated: false }));
      }, 1000);

    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [coin, timeframe]);

  useEffect(() => {
    fetchChartData();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchChartData, 30000);
    
    return () => clearInterval(interval);
  }, [coin, timeframe]);

  return {
    data: chartState.data,
    loading: chartState.loading,
    error: chartState.error,
    lastUpdate: chartState.lastUpdate,
    justUpdated: chartState.justUpdated,
    refetch: fetchChartData,
  };
}
