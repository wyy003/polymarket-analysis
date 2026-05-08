export interface Market {
  id: string;
  question: string;
  description: string;
  endDate: string;
  volume: number;
  liquidity: number;
  outcomes: Outcome[];
  category?: string;
  tags?: string[];
}

export interface Outcome {
  id: string;
  name: string;
  price: number;
  priceChange24h: number;
}

export interface PriceHistory {
  timestamp: string;
  price: number;
  volume: number;
}

