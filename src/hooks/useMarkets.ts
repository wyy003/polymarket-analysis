import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useMarkets(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['markets', limit, offset],
    queryFn: () => api.getMarkets(limit, offset),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMarketDetail(id: string) {
  return useQuery({
    queryKey: ['market', id],
    queryFn: () => api.getMarketDetail(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
