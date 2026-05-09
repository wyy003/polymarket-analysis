import { marketRepository, hotMarketRepository } from '../database/repositories';

// Configuration for hot market identification
const HOT_MARKET_CONFIG = {
  volumeThreshold: 100000,      // Volume threshold in USD
  liquidityThreshold: 50000,    // Liquidity threshold in USD
  maxHotMarkets: 20,            // Maximum number of hot markets
  refreshInterval: 5 * 60 * 1000, // Refresh interval (5 minutes)
};

export class HotMarketManager {
  /**
   * Identify hot markets based on volume and liquidity
   */
  async identifyHotMarkets(): Promise<string[]> {
    const markets = marketRepository.findAll(1000, 0); // Get all active markets

    return markets
      .filter(m =>
        m.volume > HOT_MARKET_CONFIG.volumeThreshold ||
        m.liquidity > HOT_MARKET_CONFIG.liquidityThreshold
      )
      .sort((a, b) => b.volume - a.volume) // Sort by volume descending
      .slice(0, HOT_MARKET_CONFIG.maxHotMarkets) // Take top N
      .map(m => m.id);
  }

  /**
   * Update hot markets list in database
   */
  async updateHotMarkets(): Promise<{ added: number; removed: number }> {
    console.log('[HotMarketManager] Updating hot markets list...');

    const newHotMarketIds = await this.identifyHotMarkets();
    const existingHotMarkets = hotMarketRepository.findAll();
    const existingIds = new Set(existingHotMarkets.map(m => m.market_id));

    let added = 0;
    let removed = 0;

    // Add new hot markets
    for (const marketId of newHotMarketIds) {
      if (!existingIds.has(marketId)) {
        hotMarketRepository.upsert(marketId, 'websocket', 1);
        added++;
        console.log(`[HotMarketManager] Added hot market: ${marketId}`);
      }
    }

    // Remove markets that are no longer hot
    const newHotMarketSet = new Set(newHotMarketIds);
    for (const existingMarket of existingHotMarkets) {
      if (!newHotMarketSet.has(existingMarket.market_id)) {
        hotMarketRepository.delete(existingMarket.market_id);
        removed++;
        console.log(`[HotMarketManager] Removed hot market: ${existingMarket.market_id}`);
      }
    }

    console.log(`[HotMarketManager] Update complete: ${added} added, ${removed} removed`);
    return { added, removed };
  }

  /**
   * Get current hot markets
   */
  getHotMarkets() {
    return hotMarketRepository.findAll();
  }

  /**
   * Manually add a market to hot markets
   */
  addHotMarket(marketId: string, priority = 1) {
    hotMarketRepository.upsert(marketId, 'websocket', priority);
    console.log(`[HotMarketManager] Manually added hot market: ${marketId}`);
  }

  /**
   * Remove a market from hot markets
   */
  removeHotMarket(marketId: string) {
    hotMarketRepository.delete(marketId);
    console.log(`[HotMarketManager] Manually removed hot market: ${marketId}`);
  }

  /**
   * Get configuration
   */
  getConfig() {
    return HOT_MARKET_CONFIG;
  }
}

export const hotMarketManager = new HotMarketManager();
