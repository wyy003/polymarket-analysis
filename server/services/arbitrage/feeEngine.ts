import { FeeEstimate } from './types.js';

/**
 * Polymarket fee structure:
 * - 2% fee on winning side (0.02)
 * - Applied to the payout, not the cost
 */
const POLYMARKET_FEE_RATE = 0.02;

/**
 * Kalshi fee structure:
 * - Approximately $0.01 per contract (1 cent per $1 payout)
 * - For binary markets, this is roughly 1% on winning side
 */
const KALSHI_FEE_RATE = 0.01;

/**
 * Calculate total fees for a cross-venue arbitrage trade
 *
 * In arbitrage, we buy both sides (YES on one venue, NO on the other).
 * Only one side wins, so we only pay fees on the winning side.
 *
 * Conservative approach: assume we pay fees on both venues
 * (one will win on Polymarket, one will win on Kalshi)
 */
export function calculateFees(tradeSize: number = 1.0): FeeEstimate {
  // Fees are applied to the payout ($1 per contract)
  const polymarket_fee = tradeSize * POLYMARKET_FEE_RATE;
  const kalshi_fee = tradeSize * KALSHI_FEE_RATE;
  const total_fee = polymarket_fee + kalshi_fee;

  return {
    polymarket_fee,
    kalshi_fee,
    total_fee,
  };
}

/**
 * Get fee rate as a decimal (for display purposes)
 */
export function getTotalFeeRate(): number {
  return POLYMARKET_FEE_RATE + KALSHI_FEE_RATE;
}

/**
 * Calculate net profit after fees
 */
export function calculateNetProfit(
  grossProfit: number,
  tradeSize: number = 1.0
): number {
  const fees = calculateFees(tradeSize);
  return grossProfit - fees.total_fee;
}
