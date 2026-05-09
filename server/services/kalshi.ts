import axios from 'axios';

const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  market_type: string;
  title: string;
  subtitle: string;
  open_time: string;
  close_time: string;
  expiration_time: string;
  status: string;
  yes_bid?: number;
  yes_ask?: number;
  no_bid?: number;
  no_ask?: number;
  last_price?: number;
  volume?: number;
  open_interest?: number;
  liquidity?: number;
}

export interface KalshiOrderbookLevel {
  price: number;
  size: number;
}

export interface KalshiOrderbook {
  ticker: string;
  yesBids: KalshiOrderbookLevel[];
  noBids: KalshiOrderbookLevel[];
  impliedYesAsk?: number;
  impliedNoAsk?: number;
  bestYesBid?: number;
  bestNoBid?: number;
  raw?: any;
}

/**
 * Fetch all active markets from Kalshi
 */
export async function getMarkets(limit = 100, cursor?: string): Promise<{
  markets: KalshiMarket[];
  cursor?: string;
}> {
  try {
    const params: any = {
      limit,
      status: 'open',
    };

    if (cursor) {
      params.cursor = cursor;
    }

    const response = await axios.get(`${KALSHI_API_BASE}/markets`, {
      params,
      timeout: 10000,
    });

    return {
      markets: response.data.markets || [],
      cursor: response.data.cursor,
    };
  } catch (error) {
    console.error('Error fetching Kalshi markets:', error);
    throw error;
  }
}

/**
 * Fetch single market details by ticker
 */
export async function getMarket(ticker: string): Promise<KalshiMarket | null> {
  try {
    const response = await axios.get(`${KALSHI_API_BASE}/markets/${ticker}`, {
      timeout: 10000,
    });

    return response.data.market || null;
  } catch (error) {
    console.error(`Error fetching Kalshi market ${ticker}:`, error);
    throw error;
  }
}

/**
 * Fetch orderbook for a market and calculate implied asks
 *
 * Kalshi only returns YES/NO bids. We calculate implied asks using:
 * - impliedYesAsk = 1 - bestNoBid
 * - impliedNoAsk = 1 - bestYesBid
 */
export async function getOrderbook(ticker: string): Promise<KalshiOrderbook> {
  try {
    const response = await axios.get(
      `${KALSHI_API_BASE}/markets/${ticker}/orderbook`,
      {
        timeout: 10000,
      }
    );

    const rawOrderbook = response.data.orderbook;

    // Parse YES and NO bids
    const yesBids: KalshiOrderbookLevel[] = (rawOrderbook?.yes || []).map((level: any) => ({
      price: level[0] / 100, // Kalshi returns prices in cents
      size: level[1],
    }));

    const noBids: KalshiOrderbookLevel[] = (rawOrderbook?.no || []).map((level: any) => ({
      price: level[0] / 100,
      size: level[1],
    }));

    // Get best bids
    const bestYesBid = yesBids.length > 0 ? yesBids[0].price : undefined;
    const bestNoBid = noBids.length > 0 ? noBids[0].price : undefined;

    // Calculate implied asks using complementary relationship
    const impliedYesAsk = bestNoBid !== undefined ? 1 - bestNoBid : undefined;
    const impliedNoAsk = bestYesBid !== undefined ? 1 - bestYesBid : undefined;

    return {
      ticker,
      yesBids,
      noBids,
      bestYesBid,
      bestNoBid,
      impliedYesAsk,
      impliedNoAsk,
      raw: rawOrderbook,
    };
  } catch (error) {
    console.error(`Error fetching Kalshi orderbook for ${ticker}:`, error);
    throw error;
  }
}
