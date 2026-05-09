import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Hook to receive real-time price updates via Server-Sent Events
 */
export function useRealtimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('[SSE] Connecting to real-time updates...');
    const eventSource = new EventSource(`${API_BASE_URL}/api/realtime/stream`);

    eventSource.onopen = () => {
      console.log('[SSE] Connected to real-time updates');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          console.log('[SSE] Connection confirmed');
          return;
        }

        if (data.type === 'price_update') {
          const { marketId, prices } = data;
          console.log(`[SSE] Price update for market ${marketId}:`, prices);

          // Update market detail cache
          queryClient.setQueryData(['market', marketId], (old: any) => {
            if (!old) return old;

            return {
              ...old,
              outcomes: old.outcomes?.map((outcome: any) => {
                const newPrice = prices[outcome.name] || prices[outcome.id];
                return {
                  ...outcome,
                  price: newPrice !== undefined ? parseFloat(newPrice) : outcome.price,
                };
              }),
            };
          });

          // Update markets list cache
          queryClient.setQueryData(['markets'], (old: any) => {
            if (!old?.data) return old;

            return {
              ...old,
              data: old.data.map((market: any) => {
                if (market.id !== marketId) return market;

                return {
                  ...market,
                  outcomes: market.outcomes?.map((outcome: any) => {
                    const newPrice = prices[outcome.name] || prices[outcome.id];
                    return {
                      ...outcome,
                      price: newPrice !== undefined ? parseFloat(newPrice) : outcome.price,
                    };
                  }),
                };
              }),
            };
          });
        }
      } catch (error) {
        console.error('[SSE] Failed to parse message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      console.log('[SSE] Disconnecting from real-time updates');
      eventSource.close();
    };
  }, [queryClient]);
}
