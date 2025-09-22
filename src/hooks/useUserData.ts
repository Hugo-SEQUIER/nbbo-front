import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { UserHistoricalData, UserPosition, UserBalance } from '@/types/api';

export const useUserHistoricalData = (
    address: string | null,
    listCoins?: string
): UseQueryResult<UserHistoricalData, Error> => {
    return useQuery({
        queryKey: ['userHistoricalData', address, listCoins],
        queryFn: () => {
            if (!address) {
                throw new Error('Address is required');
            }
            return apiService.getUserHistoricalData(address, listCoins);
        },
        enabled: !!address,
        refetchInterval: 30000, // Refetch every 30 seconds
        staleTime: 10000, // Consider data stale after 10 seconds
    });
};

export const useUserPosition = (
    address: string | null
): UseQueryResult<UserPosition, Error> => {
    return useQuery({
        queryKey: ['userPosition', address],
        queryFn: () => {
            if (!address) {
                throw new Error('Address is required');
            }
            return apiService.getUserPosition(address);
        },
        enabled: !!address,
        refetchInterval: 5000, // Refetch every 5 seconds for positions
        staleTime: 2000, // Consider data stale after 2 seconds
    });
};

export const useUserBalance = (
    address: string | null,
    dexs: string = 'btcx,merrli,sekaw'
): UseQueryResult<UserBalance, Error> => {
    return useQuery({
        queryKey: ['userBalance', address, dexs],
        queryFn: () => {
            if (!address) {
                throw new Error('Address is required');
            }
            return apiService.getUserBalance(address, dexs);
        },
        enabled: !!address,
        refetchInterval: 60000, // Refetch every 60 seconds for balance
        staleTime: 60000, // Consider data stale after 60 seconds
    });
};
