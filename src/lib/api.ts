import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface Market {
  id: string;
  question: string;
  description: string | null;
  category: string | null;
  end_date: string | null;
  volume: number;
  liquidity: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface Outcome {
  id: string;
  market_id: string;
  name: string;
  price: number;
}

export interface PriceHistory {
  id: number;
  market_id: string;
  outcome_id: string;
  price: number;
  timestamp: string;
}

export interface MarketDetail {
  market: Market;
  outcomes: Outcome[];
  priceHistory: PriceHistory[];
}

export interface MarketWithOutcomes extends Market {
  outcomes: Outcome[];
}

export const api = {
  async getMarkets(limit = 50, offset = 0): Promise<{ data: MarketWithOutcomes[]; count: number }> {
    const response = await axios.get(`${API_BASE_URL}/api/markets`, {
      params: { limit, offset },
    });
    return response.data;
  },

  async getMarketDetail(id: string): Promise<MarketDetail> {
    const response = await axios.get(`${API_BASE_URL}/api/markets/${id}`);
    return response.data;
  },

  async getPriceHistory(id: string, limit = 100): Promise<{ data: PriceHistory[] }> {
    const response = await axios.get(`${API_BASE_URL}/api/markets/${id}/price-history`, {
      params: { limit },
    });
    return response.data;
  },

  async triggerSync(): Promise<{ success: boolean; synced: number; errors: number }> {
    const response = await axios.post(`${API_BASE_URL}/api/sync`);
    return response.data;
  },
};
