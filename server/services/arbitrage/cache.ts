import { CrossVenueOpportunity } from './types.js';

/**
 * In-memory cache for cross-venue arbitrage opportunities
 */
class ArbitrageCache {
  private opportunities: CrossVenueOpportunity[] = [];
  private lastUpdate: number = 0;
  private isUpdating: boolean = false;

  /**
   * Get cached opportunities
   */
  getOpportunities(): CrossVenueOpportunity[] {
    return this.opportunities;
  }

  /**
   * Update cached opportunities
   */
  setOpportunities(opportunities: CrossVenueOpportunity[]): void {
    this.opportunities = opportunities;
    this.lastUpdate = Date.now();
  }

  /**
   * Get last update timestamp
   */
  getLastUpdate(): number {
    return this.lastUpdate;
  }

  /**
   * Check if cache is stale (older than 60 seconds)
   */
  isStale(): boolean {
    return Date.now() - this.lastUpdate > 60000;
  }

  /**
   * Set updating flag
   */
  setUpdating(updating: boolean): void {
    this.isUpdating = updating;
  }

  /**
   * Check if currently updating
   */
  isCurrentlyUpdating(): boolean {
    return this.isUpdating;
  }
}

export const arbitrageCache = new ArbitrageCache();
