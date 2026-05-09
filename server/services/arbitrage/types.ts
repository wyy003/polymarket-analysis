export type ArbitrageDirection =
  | 'BUY_POLY_YES_BUY_KALSHI_NO'
  | 'BUY_KALSHI_YES_BUY_POLY_NO';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface CrossVenueOpportunity {
  pair_id: string;
  direction: ArbitrageDirection;
  poly_yes_ask?: number;
  poly_no_ask?: number;
  kalshi_yes_ask?: number;
  kalshi_no_ask?: number;
  gross_edge: number;
  estimated_fees: number;
  estimated_slippage: number;
  net_edge: number;
  max_size: number;
  risk_level: RiskLevel;
  risk_flags: string[];
  tradeable: boolean;
  timestamp: number;
}

export interface FeeEstimate {
  polymarket_fee: number;
  kalshi_fee: number;
  total_fee: number;
}

export interface LiquidityAnalysis {
  max_size: number;
  estimated_slippage: number;
  depth_usd: number;
  risk_flags: string[];
}

export interface OrderbookPrices {
  poly_yes_ask?: number;
  poly_no_ask?: number;
  kalshi_yes_ask?: number;
  kalshi_no_ask?: number;
}
