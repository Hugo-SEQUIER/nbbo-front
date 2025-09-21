import { UserHistoricalData, UserPosition } from '@/types/api';

// Replace with your actual backend URL
// Use localhost instead of 0.0.0.0 to avoid browser blocking
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8060';

class ApiService {
    private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
        const url = new URL(endpoint, API_BASE_URL);
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value) {
                    url.searchParams.append(key, value);
                }
            });
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async getUserHistoricalData(address: string, listCoins?: string): Promise<UserHistoricalData> {
        const params: Record<string, string> = { address };
        if (listCoins) {
            params.list_coins = listCoins;
        }
        
        return this.makeRequest<UserHistoricalData>('/user-historical-data', params);
    }

    async getUserPosition(address: string): Promise<UserPosition> {
        return this.makeRequest<UserPosition>('/user-position', { address });
    }
}

export const apiService = new ApiService();
