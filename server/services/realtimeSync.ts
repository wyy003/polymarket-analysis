import { wsClient } from './websocketClient';
import { hotMarketRepository } from '../database/repositories';

export class RealtimeSyncService {
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Start real-time sync service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[RealtimeSync] Service already running');
      return;
    }

    console.log('[RealtimeSync] Starting real-time sync service...');

    try {
      // Connect to WebSocket
      await wsClient.connect();

      // Subscribe to hot markets
      await this.syncHotMarkets();

      // Refresh hot markets subscriptions every 5 minutes
      this.syncInterval = setInterval(() => {
        this.syncHotMarkets();
      }, 5 * 60 * 1000);

      this.isRunning = true;
      console.log('[RealtimeSync] Service started successfully');
    } catch (error) {
      console.error('[RealtimeSync] Failed to start service:', error);
      throw error;
    }
  }

  /**
   * Sync hot markets subscriptions
   */
  private async syncHotMarkets(): Promise<void> {
    try {
      console.log('[RealtimeSync] Syncing hot markets subscriptions...');

      const hotMarkets = hotMarketRepository.findAll();
      const currentSubscriptions = new Set(wsClient.getSubscribedMarkets());

      // Subscribe to new hot markets
      for (const market of hotMarkets) {
        if (market.update_method === 'websocket' && !currentSubscriptions.has(market.market_id)) {
          wsClient.subscribe(market.market_id);
        }
      }

      // Unsubscribe from markets that are no longer hot
      const hotMarketIds = new Set(hotMarkets.map(m => m.market_id));
      for (const marketId of currentSubscriptions) {
        if (!hotMarketIds.has(marketId)) {
          wsClient.unsubscribe(marketId);
        }
      }

      console.log(`[RealtimeSync] Subscribed to ${hotMarkets.length} hot markets`);
    } catch (error) {
      console.error('[RealtimeSync] Failed to sync hot markets:', error);
    }
  }

  /**
   * Stop real-time sync service
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('[RealtimeSync] Stopping real-time sync service...');

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    wsClient.disconnect();
    this.isRunning = false;

    console.log('[RealtimeSync] Service stopped');
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      running: this.isRunning,
      websocket: wsClient.getConnectionStatus(),
    };
  }
}

export const realtimeSyncService = new RealtimeSyncService();
