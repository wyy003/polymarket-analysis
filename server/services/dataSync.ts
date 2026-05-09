import { polymarketClient, PolymarketMarket } from './polymarket';
import { marketRepository, outcomeRepository, priceHistoryRepository, hotMarketRepository } from '../database/repositories';

// Configuration for parallel sync
const POLLING_CONFIG = {
  concurrency: 5,               // Number of concurrent batches
  requestTimeout: 10000,        // Request timeout in milliseconds
  retryAttempts: 3,             // Number of retry attempts
};

export class DataSyncService {
  private concurrency = POLLING_CONFIG.concurrency;

  /**
   * Sync markets in parallel batches
   */
  async syncMarketsParallel(): Promise<{ synced: number; errors: number }> {
    console.log('[DataSync] Starting parallel market sync...');

    // Get all non-hot markets
    const allMarkets = await this.getNonHotMarkets();

    if (allMarkets.length === 0) {
      console.log('[DataSync] No markets to sync');
      return { synced: 0, errors: 0 };
    }

    const batches = this.splitIntoBatches(allMarkets, this.concurrency);

    let synced = 0;
    let errors = 0;

    // Execute all batches in parallel
    const results = await Promise.allSettled(
      batches.map((batch, index) => this.syncBatch(batch, index))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        synced += result.value.synced;
        errors += result.value.errors;
      } else {
        console.error('[DataSync] Batch failed:', result.reason);
        errors++;
      }
    }

    console.log(`[DataSync] Parallel sync complete: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  }

  /**
   * Legacy sync method (kept for backward compatibility)
   */
  async syncMarkets(): Promise<{ synced: number; errors: number }> {
    console.log('[DataSync] Starting market sync...');
    let synced = 0;
    let errors = 0;

    try {
      // Fetch active markets from Polymarket
      const markets = await polymarketClient.getMarkets({
        limit: 100,
        active: true,
        closed: false,
      });

      console.log(`[DataSync] Fetched ${markets.length} markets from Polymarket`);

      for (const market of markets) {
        try {
          await this.syncMarket(market);
          synced++;
        } catch (error) {
          console.error(`[DataSync] Failed to sync market ${market.conditionId}:`, error);
          errors++;
        }
      }

      console.log(`[DataSync] Sync complete: ${synced} synced, ${errors} errors`);
    } catch (error) {
      console.error('[DataSync] Failed to fetch markets:', error);
      errors++;
    }

    return { synced, errors };
  }

  /**
   * Get all non-hot markets (markets not in hot_markets table)
   */
  private async getNonHotMarkets(): Promise<string[]> {
    const allMarkets = marketRepository.findAll(1000, 0); // Get all active markets
    const hotMarkets = hotMarketRepository.findAll();
    const hotMarketIds = new Set(hotMarkets.map(m => m.market_id));

    return allMarkets
      .filter(m => !hotMarketIds.has(m.id))
      .map(m => m.id);
  }

  /**
   * Split items into N batches
   */
  private splitIntoBatches<T>(items: T[], batchCount: number): T[][] {
    const batchSize = Math.ceil(items.length / batchCount);
    const batches: T[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Sync a batch of markets
   */
  private async syncBatch(
    marketIds: string[],
    batchIndex: number
  ): Promise<{ synced: number; errors: number }> {
    console.log(`[DataSync] Batch ${batchIndex}: syncing ${marketIds.length} markets`);

    let synced = 0;
    let errors = 0;

    for (const marketId of marketIds) {
      try {
        const market = await polymarketClient.getMarketById(marketId);
        if (market) {
          await this.syncMarket(market);
          synced++;
        }
      } catch (error) {
        console.error(`[DataSync] Batch ${batchIndex}: Failed to sync ${marketId}:`, error);
        errors++;
      }
    }

    console.log(`[DataSync] Batch ${batchIndex} complete: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  }

  private async syncMarket(market: PolymarketMarket): Promise<void> {
    // Determine category from events
    const category = this.extractCategory(market.events);

    // Upsert market
    marketRepository.upsert({
      id: market.conditionId,
      question: market.question,
      description: market.description ?? null,
      category,
      end_date: market.endDateIso ?? market.startDateIso ?? null,
      volume: parseFloat(market.volume || '0'),
      liquidity: parseFloat(market.liquidity || '0'),
      active: market.active !== false && market.closed !== true ? 1 : 0,
    });

    // Parse outcomes and prices (they come as JSON strings)
    let outcomes: string[] = [];
    let outcomePrices: string[] = [];

    try {
      if (typeof market.outcomes === 'string') {
        outcomes = JSON.parse(market.outcomes);
      } else if (Array.isArray(market.outcomes)) {
        outcomes = market.outcomes;
      }

      if (typeof market.outcomePrices === 'string') {
        outcomePrices = JSON.parse(market.outcomePrices);
      } else if (Array.isArray(market.outcomePrices)) {
        outcomePrices = market.outcomePrices;
      }
    } catch (error) {
      console.error(`[DataSync] Failed to parse outcomes for market ${market.conditionId}:`, error);
      return;
    }

    // Sync outcomes and prices
    if (outcomes.length > 0 && outcomePrices.length > 0) {
      for (let i = 0; i < outcomes.length; i++) {
        const outcomeName = outcomes[i];
        const priceStr = outcomePrices[i];
        const outcomePrice = parseFloat(priceStr || '0');
        const outcomeId = `${market.conditionId}_${outcomeName}`;

        if (!outcomeName || isNaN(outcomePrice)) continue;

        // Upsert outcome
        outcomeRepository.upsert({
          id: outcomeId,
          market_id: market.conditionId,
          name: outcomeName,
          price: outcomePrice,
        });

        // Record price history
        priceHistoryRepository.insert(market.conditionId, outcomeId, outcomePrice);
      }
    }
  }

  private extractCategory(events?: Array<{ title?: string; tags?: string[] }>): string | null {
    if (!events || events.length === 0) return null;

    // Try to get category from first event's tags
    const firstEvent = events[0];
    if (firstEvent?.tags && firstEvent.tags.length > 0) {
      const categoryMap: Record<string, string> = {
        politics: 'Politics',
        sports: 'Sports',
        crypto: 'Crypto',
        entertainment: 'Entertainment',
        business: 'Business',
        science: 'Science',
      };

      for (const tag of firstEvent.tags) {
        const normalized = tag.toLowerCase();
        if (categoryMap[normalized]) {
          return categoryMap[normalized];
        }
      }

      return firstEvent.tags[0] ?? null;
    }

    // Fallback to event title
    return firstEvent?.title ?? null;
  }
}

export const dataSyncService = new DataSyncService();
