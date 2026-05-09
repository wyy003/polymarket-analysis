import * as crossVenue from './arbitrage/crossVenue.js';
import { arbitrageCache } from './arbitrage/cache.js';

/**
 * Cross-venue arbitrage real-time update service
 */
class CrossVenueRealtimeService {
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  /**
   * Start the real-time update service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[CrossVenueRealtime] Service already running');
      return;
    }

    console.log('[CrossVenueRealtime] Starting real-time update service...');
    this.isRunning = true;

    // Initial update
    await this.updateOpportunities();

    // Schedule updates every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.updateOpportunities();
    }, 30000);

    console.log('[CrossVenueRealtime] Service started (updates every 30s)');
  }

  /**
   * Stop the real-time update service
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('[CrossVenueRealtime] Service stopped');
  }

  /**
   * Update opportunities and cache
   */
  private async updateOpportunities(): Promise<void> {
    if (arbitrageCache.isCurrentlyUpdating()) {
      console.log('[CrossVenueRealtime] Update already in progress, skipping...');
      return;
    }

    try {
      arbitrageCache.setUpdating(true);
      console.log('[CrossVenueRealtime] Updating cross-venue opportunities...');

      const opportunities = await crossVenue.calculateCrossVenueOpportunities();
      arbitrageCache.setOpportunities(opportunities);

      const tradeable = opportunities.filter(opp => opp.tradeable);
      console.log(
        `[CrossVenueRealtime] Updated: ${tradeable.length} tradeable / ${opportunities.length} total opportunities`
      );
    } catch (error) {
      console.error('[CrossVenueRealtime] Update failed:', error);
    } finally {
      arbitrageCache.setUpdating(false);
    }
  }

  /**
   * Force an immediate update
   */
  async forceUpdate(): Promise<void> {
    console.log('[CrossVenueRealtime] Force update requested');
    await this.updateOpportunities();
  }

  /**
   * Check if service is running
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }
}

export const crossVenueRealtimeService = new CrossVenueRealtimeService();
