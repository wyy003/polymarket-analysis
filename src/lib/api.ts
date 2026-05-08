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

export interface MAResult {
  timestamp: number;
  ma: number;
}

export interface RSIResult {
  timestamp: number;
  rsi: number;
}

export interface BollingerBandsResult {
  timestamp: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface TechnicalIndicators {
  ma7: MAResult[];
  ma20: MAResult[];
  ma50: MAResult[];
  rsi: RSIResult[];
  bollingerBands: BollingerBandsResult[];
}

export interface MarketStatistics {
  currentPrice: number;
  change24h: {
    change: number;
    changePercent: number;
    currentPrice: number;
    price24hAgo: number;
  } | null;
  totalVolume: number;
  volume24h: number;
  volatility: {
    volatility: number;
    period: string;
  } | null;
  spread: {
    spread: number;
    spreadPercent: number;
  } | null;
  technicalSummary: {
    rsi: {
      value: number;
      status: 'overbought' | 'oversold' | 'neutral';
    } | null;
    maTrend: {
      trend: 'bullish' | 'bearish' | 'neutral';
      description: string;
    } | null;
  };
  similarEvents: Array<{
    id: string;
    question: string;
    similarity: number;
  }>;
}

export interface BacktestConfig {
  marketId: string;
  outcomeId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  strategy: {
    type: 'ma_crossover' | 'rsi_threshold' | 'bollinger_bands';
    params: {
      fastPeriod?: number;
      slowPeriod?: number;
      oversoldThreshold?: number;
      overboughtThreshold?: number;
      period?: number;
      stdDev?: number;
    };
  };
}

export interface BacktestTrade {
  timestamp: number;
  type: 'buy' | 'sell';
  price: number;
  shares: number;
  capital: number;
}

export interface BacktestResult {
  trades: BacktestTrade[];
  equityCurve: Array<{ timestamp: number; equity: number }>;
  performance: {
    totalReturn: number;
    totalReturnPercentage: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    maxDrawdown: number;
    sharpeRatio: number;
    finalCapital: number;
  };
}

export interface ArbitrageOpportunity {
  id: string;
  market_id: string;
  detected_at: string;
  type: 'price_sum';
  description: string;
  potential_profit: number;
  risk_level: 'low' | 'medium' | 'high';
  market_question?: string;
  outcomes?: Array<{ name: string; price: number }>;
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

  async getIndicators(marketId: string, outcomeId: string): Promise<TechnicalIndicators> {
    const response = await axios.get(`${API_BASE_URL}/api/markets/${marketId}/indicators`, {
      params: { outcomeId },
    });
    return response.data;
  },

  async getStatistics(marketId: string, outcomeId: string): Promise<MarketStatistics> {
    const response = await axios.get(`${API_BASE_URL}/api/markets/${marketId}/statistics`, {
      params: { outcomeId },
    });
    return response.data;
  },

  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    const response = await axios.post(`${API_BASE_URL}/api/backtest`, config);
    return response.data;
  },

  async getArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
    const response = await axios.get(`${API_BASE_URL}/api/arbitrage`);
    return response.data;
  },
};
