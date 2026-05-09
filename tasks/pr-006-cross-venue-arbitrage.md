# PR-006: Cross-Venue Arbitrage Calculator

## Objective
Implement a real cross-venue arbitrage calculator that computes net arbitrage opportunities between Polymarket and Kalshi using orderbook prices, fees, and slippage estimates.

## Scope
- **IN SCOPE**: Arbitrage calculation, fee estimation, liquidity analysis, risk flagging
- **OUT OF SCOPE**: Trading execution, order placement, automatic trading

## Background
With orderbook data from both venues and confirmed market pairs, we can now calculate real arbitrage opportunities. The calculator must account for:
- Executable orderbook prices (not display prices)
- Platform fees on both sides
- Estimated slippage based on orderbook depth
- Risk factors (liquidity, resolution, execution)

## Technical Requirements

### 1. Type Definitions (`server/services/arbitrage/types.ts`)
```typescript
interface CrossVenueOpportunity {
  pair_id: string;
  direction: 'BUY_POLY_YES_BUY_KALSHI_NO' | 'BUY_KALSHI_YES_BUY_POLY_NO';
  poly_yes_ask?: number;
  poly_no_ask?: number;
  kalshi_yes_ask?: number;
  kalshi_no_ask?: number;
  gross_edge: number;
  estimated_fees: number;
  estimated_slippage: number;
  net_edge: number;
  max_size: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_flags: string[];
  tradeable: boolean;
  timestamp: number;
}
```

### 2. Fee Engine (`server/services/arbitrage/feeEngine.ts`)
Calculate platform fees:
- Polymarket: 2% on winning side (0.02)
- Kalshi: $1 per contract on winning side, but expressed as percentage
- Total fees = polymarket_fee + kalshi_fee

### 3. Liquidity Analyzer (`server/services/arbitrage/liquidity.ts`)
- Calculate max executable size based on orderbook depth
- Estimate slippage for different trade sizes
- Flag low liquidity situations

### 4. Cross-Venue Calculator (`server/services/arbitrage/crossVenue.ts`)
Main logic:
- For each confirmed market pair
- Fetch orderbooks from both venues
- Calculate both directions:
  1. Buy Poly YES + Buy Kalshi NO
  2. Buy Kalshi YES + Buy Poly NO
- Compute gross edge, fees, slippage, net edge
- Flag risks
- Return opportunities with net_edge > 0

### 5. API Routes (`server/routes/crossVenueArbitrage.ts`)
- `GET /api/arbitrage/cross-venue` - Get all current opportunities
- `GET /api/arbitrage/cross-venue/:pairId` - Get opportunity for specific pair

## Arbitrage Formulas

### Direction 1: Buy Poly YES + Buy Kalshi NO
```
total_cost = poly_yes_ask + kalshi_no_ask
gross_edge = 1.0 - total_cost
fees = poly_fee + kalshi_fee
net_edge = gross_edge - fees - slippage
tradeable = net_edge > 0
```

### Direction 2: Buy Kalshi YES + Buy Poly NO
```
total_cost = kalshi_yes_ask + poly_no_ask
gross_edge = 1.0 - total_cost
fees = poly_fee + kalshi_fee
net_edge = gross_edge - fees - slippage
tradeable = net_edge > 0
```

## Risk Flags
- `LOW_LIQUIDITY`: orderbook depth < $500
- `HIGH_SLIPPAGE`: estimated slippage > 1%
- `STALE_DATA`: orderbook data > 30 seconds old
- `RESOLUTION_RISK`: pair has medium/high resolution risk
- `NARROW_EDGE`: net edge < 0.5%

## Implementation Steps

1. Create `server/services/arbitrage/types.ts` with interfaces
2. Create `server/services/arbitrage/feeEngine.ts` with fee calculations
3. Create `server/services/arbitrage/liquidity.ts` with liquidity analysis
4. Create `server/services/arbitrage/crossVenue.ts` with main calculator
5. Create `server/routes/crossVenueArbitrage.ts` with API routes
6. Register routes in `server/index.ts`
7. Add error handling for missing orderbook data

## Testing Checklist
- [ ] Fee calculations are correct
- [ ] Both arbitrage directions calculated
- [ ] Net edge accounts for fees and slippage
- [ ] Risk flags are applied correctly
- [ ] Returns empty array when no pairs configured
- [ ] Handles missing orderbook data gracefully
- [ ] TypeScript compilation passes
- [ ] Build succeeds

## Success Criteria
- Calculator produces accurate net edge calculations
- All fees and slippage accounted for
- Risk flags surface potential issues
- No trading execution code included
- Code is read-only and safe

## Notes
- This is the core arbitrage logic
- Must be conservative: better to miss opportunities than show false positives
- Net edge must be positive after ALL costs
- Risk flags help users understand opportunity quality

## Future Work (Out of Scope)
- Real-time WebSocket updates (future PR)
- Historical opportunity tracking (future PR)
- Alert system (future PR)
