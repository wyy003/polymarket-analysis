import { CrossVenueOpportunity, OrderbookPrices, RiskLevel } from './types.js';
import { calculateFees } from './feeEngine.js';
import { analyzeLiquidity, isOrderbookStale } from './liquidity.js';
import * as marketPairs from '../marketPairs.js';
import * as polymarketOrderbook from '../polymarketOrderbook.js';

/**
 * Calculate cross-venue arbitrage opportunities for all confirmed market pairs
 */
export async function calculateCrossVenueOpportunities(): Promise<
  CrossVenueOpportunity[]
> {
  const pairs = marketPairs.getAllPairs();
  const opportunities: CrossVenueOpportunity[] = [];

  if (pairs.length === 0) {
    console.log('[CrossVenue] No confirmed market pairs configured');
    return [];
  }

  console.log(`[CrossVenue] Analyzing ${pairs.length} confirmed pairs...`);

  for (const pair of pairs) {
    try {
      const pairOpportunities = await calculatePairOpportunities(pair);
      opportunities.push(...pairOpportunities);
    } catch (error) {
      console.error(
        `[CrossVenue] Error calculating opportunities for pair ${pair.pair_id}:`,
        error
      );
    }
  }

  console.log(`[CrossVenue] Found ${opportunities.length} opportunities`);
  return opportunities;
}

/**
 * Calculate opportunities for a specific market pair
 */
async function calculatePairOpportunities(
  pair: marketPairs.MarketPair
): Promise<CrossVenueOpportunity[]> {
  const opportunities: CrossVenueOpportunity[] = [];

  // Fetch orderbooks from both venues
  const polyYesOrderbook = await fetchPolymarketOrderbook(
    pair.polymarket_yes_token_id
  );
  const polyNoOrderbook = await fetchPolymarketOrderbook(
    pair.polymarket_no_token_id
  );
  const kalshiOrderbook = await fetchKalshiOrderbook(pair.kalshi_ticker);

  // Extract prices
  const prices: OrderbookPrices = {
    poly_yes_ask: polyYesOrderbook?.bestAsk,
    poly_no_ask: polyNoOrderbook?.bestAsk,
    kalshi_yes_ask: kalshiOrderbook?.impliedYesAsk,
    kalshi_no_ask: kalshiOrderbook?.impliedNoAsk,
  };

  // Calculate Direction 1: Buy Poly YES + Buy Kalshi NO
  if (prices.poly_yes_ask && prices.kalshi_no_ask) {
    const opp1 = calculateOpportunity(
      pair,
      'BUY_POLY_YES_BUY_KALSHI_NO',
      prices,
      polyYesOrderbook,
      kalshiOrderbook
    );
    if (opp1) opportunities.push(opp1);
  }

  // Calculate Direction 2: Buy Kalshi YES + Buy Poly NO
  if (prices.kalshi_yes_ask && prices.poly_no_ask) {
    const opp2 = calculateOpportunity(
      pair,
      'BUY_KALSHI_YES_BUY_POLY_NO',
      prices,
      polyNoOrderbook,
      kalshiOrderbook
    );
    if (opp2) opportunities.push(opp2);
  }

  return opportunities;
}

/**
 * Calculate a single arbitrage opportunity
 */
function calculateOpportunity(
  pair: marketPairs.MarketPair,
  direction: 'BUY_POLY_YES_BUY_KALSHI_NO' | 'BUY_KALSHI_YES_BUY_POLY_NO',
  prices: OrderbookPrices,
  polyOrderbook: any,
  kalshiOrderbook: any
): CrossVenueOpportunity | null {
  // Calculate total cost
  let total_cost: number;
  if (direction === 'BUY_POLY_YES_BUY_KALSHI_NO') {
    if (!prices.poly_yes_ask || !prices.kalshi_no_ask) return null;
    total_cost = prices.poly_yes_ask + prices.kalshi_no_ask;
  } else {
    if (!prices.kalshi_yes_ask || !prices.poly_no_ask) return null;
    total_cost = prices.kalshi_yes_ask + prices.poly_no_ask;
  }

  // Calculate gross edge (profit before fees/slippage)
  const gross_edge = 1.0 - total_cost;

  // Calculate fees
  const fees = calculateFees(1.0);
  const estimated_fees = fees.total_fee;

  // Analyze liquidity
  const liquidity = analyzeLiquidity(polyOrderbook, kalshiOrderbook);
  const estimated_slippage = liquidity.estimated_slippage;

  // Calculate net edge
  const net_edge = gross_edge - estimated_fees - estimated_slippage;

  // Determine if tradeable
  const tradeable = net_edge > 0;

  // Collect risk flags
  const risk_flags: string[] = [...liquidity.risk_flags];

  // Add resolution risk flag
  if (pair.resolution_risk === 'medium' || pair.resolution_risk === 'high') {
    risk_flags.push(`RESOLUTION_RISK_${pair.resolution_risk.toUpperCase()}`);
  }

  // Add narrow edge flag
  if (net_edge > 0 && net_edge < 0.005) {
    risk_flags.push('NARROW_EDGE');
  }

  // Check for stale data
  if (
    isOrderbookStale(polyOrderbook?.timestamp) ||
    isOrderbookStale(kalshiOrderbook?.timestamp)
  ) {
    risk_flags.push('STALE_DATA');
  }

  // Determine risk level
  const risk_level = determineRiskLevel(risk_flags, pair.resolution_risk);

  return {
    pair_id: pair.pair_id,
    direction,
    poly_yes_ask: prices.poly_yes_ask,
    poly_no_ask: prices.poly_no_ask,
    kalshi_yes_ask: prices.kalshi_yes_ask,
    kalshi_no_ask: prices.kalshi_no_ask,
    gross_edge,
    estimated_fees,
    estimated_slippage,
    net_edge,
    max_size: liquidity.max_size,
    risk_level,
    risk_flags,
    tradeable,
    timestamp: Date.now(),
  };
}

/**
 * Determine overall risk level
 */
function determineRiskLevel(
  risk_flags: string[],
  resolution_risk: marketPairs.ResolutionRisk
): RiskLevel {
  // High risk if resolution risk is high
  if (resolution_risk === 'high') return 'high';

  // High risk if multiple critical flags
  const criticalFlags = risk_flags.filter((flag) =>
    ['LOW_LIQUIDITY', 'HIGH_SLIPPAGE', 'STALE_DATA'].includes(flag)
  );
  if (criticalFlags.length >= 2) return 'high';

  // Medium risk if any critical flag or medium resolution risk
  if (criticalFlags.length > 0 || resolution_risk === 'medium') return 'medium';

  return 'low';
}

/**
 * Fetch Polymarket orderbook (wrapper with error handling)
 */
async function fetchPolymarketOrderbook(
  tokenId: string
): Promise<polymarketOrderbook.PolymarketOrderbook | null> {
  try {
    return await polymarketOrderbook.getOrderbook(tokenId);
  } catch (error) {
    console.error(`Error fetching Polymarket orderbook for ${tokenId}:`, error);
    return null;
  }
}

/**
 * Fetch Kalshi orderbook (placeholder - will integrate with Kalshi service)
 */
async function fetchKalshiOrderbook(ticker: string): Promise<any | null> {
  // TODO: Integrate with Kalshi orderbook service from PR#3
  // For now, return null to avoid errors
  console.warn(`[CrossVenue] Kalshi orderbook integration pending for ${ticker}`);
  return null;
}
