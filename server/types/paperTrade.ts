export type PaperTradeDirection = 'poly_yes_kalshi_no' | 'kalshi_yes_poly_no';
export type PaperTradeSource = 'manual' | 'auto_scan';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface PaperTradeFees {
  polymarketFee: number;
  kalshiFee: number;
  totalFees: number;
}

export interface PaperTradeOutcome {
  resolvedAt: number;
  actualProfit: number;
  actualProfitPercent: number;
}

export interface PaperTradeLog {
  id: string;
  timestamp: number;
  pairId: string;
  direction: PaperTradeDirection;

  // Prices at time of log
  polyPrice: number;
  kalshiPrice: number;

  // Cost breakdown
  totalCost: number;
  netProfit: number;
  profitPercent: number;
  fees: PaperTradeFees;

  // Execution details
  targetSize: number;
  estimatedSlippage: number;

  // Risk assessment
  riskLevel: RiskLevel;
  riskFlags: string[];

  // Metadata
  source: PaperTradeSource;
  notes?: string;

  // Outcome tracking (filled later)
  outcome?: PaperTradeOutcome;
}

export interface PaperTradeStats {
  totalLogs: number;
  byRisk: {
    low: number;
    medium: number;
    high: number;
  };
  bySource: {
    manual: number;
    auto_scan: number;
  };
  avgNetProfit: number;
  totalHypotheticalProfit: number;
  resolvedCount: number;
  successRate: number;
}

export interface LogFilters {
  startDate?: number;
  endDate?: number;
  riskLevel?: RiskLevel;
  pairId?: string;
  source?: PaperTradeSource;
}
