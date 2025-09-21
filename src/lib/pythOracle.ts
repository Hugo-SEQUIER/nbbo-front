class PythHermesPoller {
    private intervalId: number | null = null;
    private baseUrl = 'https://hermes.pyth.network';
    private btcPriceId = 'e62df6c8b4c85fe1bb3b2fd907d12aab96b3ea8e7b5ef7d1b1e7ed2e6e95e9d8';
    private lastPrice: number | null = null;
  
    constructor(private onPriceUpdate: (price: number, timestamp: number) => void) {}
  
    async testConnection(): Promise<boolean> {
      try {
        console.log('Testing Hermes connection...');
        const response = await fetch(`${this.baseUrl}/api/latest_price_feeds?ids[]=${this.btcPriceId}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
  
        const data = await response.json();
        console.log('Test response:', data);
        return true;
      } catch (error) {
        console.error('Connection test failed:', error);
        return false;
      }
    }
  
    async getCurrentPrice(): Promise<number | null> {
      try {
        const response = await fetch(
          `${this.baseUrl}/api/latest_price_feeds?ids[]=${this.btcPriceId}`,
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
        
        if (data && data.length > 0) {
          const priceData = data[0];
          const price = parseInt(priceData.price.price);
          const expo = priceData.price.expo;
          const publishTime = priceData.price.publish_time;
  
          // Calculate actual price
          const actualPrice = price * Math.pow(10, expo);
          
          console.log(`BTC Price: $${actualPrice.toFixed(2)}`);
          console.log(`Published: ${new Date(publishTime * 1000).toLocaleString()}`);
          
          return actualPrice;
        }
  
        return null;
      } catch (error) {
        console.error('Error fetching price:', error);
        return null;
      }
    }
  
    startPolling(intervalMs: number = 1000) {
      if (this.intervalId) {
        this.stopPolling();
      }
  
      const poll = async () => {
        const price = await this.getCurrentPrice();
        if (price !== null && price !== this.lastPrice) {
          this.lastPrice = price;
          this.onPriceUpdate(price, Date.now());
        }
      };
  
      // Initial call
      poll();
      
      // Start polling using window.setInterval
      this.intervalId = window.setInterval(poll, intervalMs);
      console.log(`Started polling every ${intervalMs}ms`);
    }
  
    stopPolling() {
      if (this.intervalId) {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
        console.log('Stopped polling');
      }
    }
  }
  
  // Usage in your Vite project
  const pythPoller = new PythHermesPoller((price, timestamp) => {
    console.log(`BTC/USD Updated: $${price.toFixed(2)}`);
    
    // Update your UI here
    document.getElementById('btc-price')!.textContent = `$${price.toFixed(2)}`;
  });
  
  // Test connection first
  pythPoller.testConnection().then(connected => {
    if (connected) {
      pythPoller.startPolling(1000); // Poll every second
    } else {
      console.error('Failed to connect to Hermes');
    }
  });