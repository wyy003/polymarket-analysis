import axios from 'axios';

const POLYMARKET_CLOB_BASE = 'https://clob.polymarket.com';

export interface PolymarketOrderbookLevel {
  price: number;
  size: number;
}

export interface PolymarketOrderbook {
  tokenId: string;
  bids: PolymarketOrderbookLevel[];
  asks: PolymarketOrderbookLevel[];
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  timestamp?: number;
  raw?: any;
}

export interface PolymarketBestBidAsk {
  tokenId: string;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
}

/**
 * Parse orderbook level from CLOB API format
 * CLOB returns: { price: "0.52", size: "100.5" }
 */
function parseOrderbookLevel(level: any): PolymarketOrderbookLevel {
  return {
    price: parseFloat(level.price),
    size: parseFloat(level.size),
  };
}

/**
 * Fetch orderbook for a specific token from Polymarket CLOB
 */
export async function getOrderbook(tokenId: string): Promise<PolymarketOrderbook> {
  try {
    const response = await axios.get(`${POLYMARKET_CLOB_BASE}/book`, {
      params: { token_id: tokenId },
      timeout: 10000,
    });

    const rawOrderbook = response.data;

    // Parse bids and asks
    const bids: PolymarketOrderbookLevel[] = (rawOrderbook.bids || [])
      .map(parseOrderbookLevel)
      .sort((a: PolymarketOrderbookLevel, b: PolymarketOrderbookLevel) => b.price - a.price); // Descending

    const asks: PolymarketOrderbookLevel[] = (rawOrderbook.asks || [])
      .map(parseOrderbookLevel)
      .sort((a: PolymarketOrderbookLevel, b: PolymarketOrderbookLevel) => a.price - b.price); // Ascending

    // Calculate best bid/ask
    const bestBid = bids.length > 0 ? bids[0].price : undefined;
    const bestAsk = asks.length > 0 ? asks[0].price : undefined;

    // Calculate spread
    const spread =
      bestBid !== undefined && bestAsk !== undefined
        ? bestAsk - bestBid
        : undefined;

    return {
      tokenId,
      bids,
      asks,
      bestBid,
      bestAsk,
      spread,
      timestamp: rawOrderbook.timestamp || Date.now(),
      raw: rawOrderbook,
    };
  } catch (error) {
    console.error(`Error fetching Polymarket orderbook for ${tokenId}:`, error);
    throw error;
  }
}

/**
 * Get best bid/ask only (lighter response)
 */
export async function getBestBidAsk(tokenId: string): Promise<PolymarketBestBidAsk> {
  try {
    const orderbook = await getOrderbook(tokenId);

    return {
      tokenId,
      bestBid: orderbook.bestBid,
      bestAsk: orderbook.bestAsk,
      spread: orderbook.spread,
    };
  } catch (error) {
    console.error(`Error fetching best bid/ask for ${tokenId}:`, error);
    throw error;
  }
}

/**
 * Fetch multiple orderbooks in parallel
 */
export async function getBatchOrderbooks(
  tokenIds: string[]
): Promise<PolymarketOrderbook[]> {
  try {
    const promises = tokenIds.map((tokenId) => getOrderbook(tokenId));
    const results = await Promise.allSettled(promises);

    // Filter successful results
    return results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<PolymarketOrderbook>).value);
  } catch (error) {
    console.error('Error fetching batch orderbooks:', error);
    throw error;
  }
}
