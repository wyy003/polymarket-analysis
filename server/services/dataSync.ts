import { polymarketClient, PolymarketMarket } from './polymarket';
import { marketRepository, outcomeRepository, priceHistoryRepository } from '../database/repositories';

export class DataSyncService {
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
