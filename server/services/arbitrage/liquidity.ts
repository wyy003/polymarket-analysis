import { LiquidityAnalysis } from './types.js';
import { PolymarketOrderbook } from '../polymarketOrderbook.js';

/**
 * Analyze orderbook liquidity and estimate slippage
 */
export function analyzeLiquidity(
  polyOrderbook: PolymarketOrderbook | null,
  kalshiOrderbook: any | null
): LiquidityAnalysis {
  const risk_flags: string[] = [];
  let max_size = 0;
  let estimated_slippage = 0;
  let depth_usd = 0;

  // Check if orderbooks are available
  if (!polyOrderbook || !kalshiOrderbook) {
    risk_flags.push('MISSING_ORDERBOOK_DATA');
    return {
      max_size: 0,
      estimated_slippage: 0,
      depth_usd: 0,
      risk_flags,
    };
  }

  // Calculate Polymarket depth
  const polyDepth = calculateOrderbookDepth(polyOrderbook.asks);
  const kalshiDepth = calculateOrderbookDepth(kalshiOrderbook.asks || []);

  // Max size is limited by the smaller orderbook
  max_size = Math.min(polyDepth.total_size, kalshiDepth.total_size);
  depth_usd = Math.min(polyDepth.total_value, kalshiDepth.total_value);

  // Estimate slippage based on orderbook depth
  estimated_slippage = estimateSlippage(max_size, depth_usd);

  // Add risk flags
  if (depth_usd < 500) {
    risk_flags.push('LOW_LIQUIDITY');
  }

  if (estimated_slippage > 0.01) {
    risk_flags.push('HIGH_SLIPPAGE');
  }

  if (max_size < 100) {
    risk_flags.push('LOW_MAX_SIZE');
  }

  return {
    max_size,
    estimated_slippage,
    depth_usd,
    risk_flags,
  };
}

/**
 * Calculate orderbook depth (total size and value)
 */
function calculateOrderbookDepth(
  levels: Array<{ price: number; size: number }>
): { total_size: number; total_value: number } {
  if (!levels || levels.length === 0) {
    return { total_size: 0, total_value: 0 };
  }

  let total_size = 0;
  let total_value = 0;

  for (const level of levels) {
    total_size += level.size;
    total_value += level.price * level.size;
  }

  return { total_size, total_value };
}

/**
 * Estimate slippage based on trade size and orderbook depth
 *
 * Simple model:
 * - If trade size < 10% of depth: minimal slippage (0.1%)
 * - If trade size 10-50% of depth: moderate slippage (0.5%)
 * - If trade size > 50% of depth: high slippage (1-2%)
 */
function estimateSlippage(tradeSize: number, depth: number): number {
  if (depth === 0) return 0.02; // 2% if no depth data

  const ratio = tradeSize / depth;

  if (ratio < 0.1) {
    return 0.001; // 0.1%
  } else if (ratio < 0.5) {
    return 0.005; // 0.5%
  } else {
    return 0.01 + ratio * 0.01; // 1-2%
  }
}

/**
 * Check if orderbook data is stale
 */
export function isOrderbookStale(timestamp: number | undefined): boolean {
  if (!timestamp) return true;

  const now = Date.now();
  const age = now - timestamp;
  const STALE_THRESHOLD = 30000; // 30 seconds

  return age > STALE_THRESHOLD;
}
