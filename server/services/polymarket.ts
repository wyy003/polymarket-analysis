import axios from 'axios';

const POLYMARKET_API_BASE = process.env.POLYMARKET_API_BASE || 'https://gamma-api.polymarket.com';

export interface PolymarketMarket {
  conditionId: string;
  id: string;
  question: string;
  description?: string;
  endDateIso?: string;
  startDateIso?: string;
  questionID?: string;
  slug?: string;
  outcomes?: string[] | string;
  outcomePrices?: string[] | string;
  volume?: string;
  liquidity?: string;
  active?: boolean;
  closed?: boolean;
  events?: Array<{ title?: string; tags?: string[] }>;
}

export interface PolymarketResponse {
  data: PolymarketMarket[];
  count?: number;
  next_cursor?: string;
}

export class PolymarketClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || POLYMARKET_API_BASE;
  }

  async getMarkets(params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
    closed?: boolean;
  }): Promise<PolymarketMarket[]> {
    try {
      const response = await axios.get<PolymarketMarket[]>(`${this.baseURL}/markets`, {
        params: {
          limit: params?.limit || 100,
          offset: params?.offset || 0,
          active: params?.active !== undefined ? params.active : true,
          closed: params?.closed !== undefined ? params.closed : false,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Polymarket API error:', error.response?.status, error.message);
        throw new Error(`Failed to fetch markets: ${error.message}`);
      }
      throw error;
    }
  }

  async getMarketById(conditionId: string): Promise<PolymarketMarket | null> {
    try {
      const response = await axios.get<PolymarketMarket>(
        `${this.baseURL}/markets/${conditionId}`,
        { timeout: 10000 }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return null;
        }
        console.error('Polymarket API error:', error.response?.status, error.message);
        throw new Error(`Failed to fetch market: ${error.message}`);
      }
      throw error;
    }
  }

  async getMarketPrices(conditionId: string): Promise<{ outcome: string; price: number }[]> {
    try {
      const market = await this.getMarketById(conditionId);
      if (!market) {
        return [];
      }

      // Parse outcomes and prices
      let outcomes: string[] = [];
      let outcomePrices: string[] = [];

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

      if (outcomes.length === 0 || outcomePrices.length === 0) {
        return [];
      }

      return outcomes.map((outcome, index) => ({
        outcome,
        price: parseFloat(outcomePrices[index] || '0'),
      }));
    } catch (error) {
      console.error('Failed to fetch market prices:', error);
      return [];
    }
  }
}

export const polymarketClient = new PolymarketClient();
