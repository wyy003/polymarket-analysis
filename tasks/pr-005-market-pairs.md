# PR-005: Confirmed Market Pairs

## Objective
Add a manually-confirmed market pairs system to ensure cross-venue arbitrage scanning only operates on verified same-event markets.

## Scope
- **IN SCOPE**: Market pair configuration, validation, and retrieval
- **OUT OF SCOPE**: Automatic market matching, AI-based similarity matching, trading execution

## Background
The biggest risk in prediction market arbitrage is not the math—it's ensuring both markets resolve on the same event with the same rules. This PR establishes a whitelist-based approach where market pairs must be manually confirmed before entering arbitrage calculations.

## Technical Requirements

### 1. Market Pairs Configuration (`server/config/marketPairs.json`)
JSON file storing manually confirmed market pairs:
```json
[
  {
    "pair_id": "btc_above_100k_dec31",
    "polymarket_market_id": "0x...",
    "polymarket_yes_token_id": "0x...",
    "polymarket_no_token_id": "0x...",
    "kalshi_ticker": "KXBTC-...",
    "mapping": "POLY_YES_EQUALS_KALSHI_YES",
    "resolution_risk": "low",
    "notes": "Manually confirmed: same event, same resolution logic",
    "created_at": "2026-05-09T00:00:00Z",
    "verified_by": "manual"
  }
]
```

### 2. Market Pairs Service (`server/services/marketPairs.ts`)
Implement methods:
- `getAllPairs()`: Get all confirmed pairs
- `getPairById(pairId)`: Get specific pair
- `getPairsByPolymarketId(marketId)`: Find pairs by Polymarket market
- `getPairsByKalshiTicker(ticker)`: Find pairs by Kalshi ticker
- `validatePair(pair)`: Validate pair structure

### 3. TypeScript Interfaces
```typescript
interface MarketPair {
  pair_id: string;
  polymarket_market_id: string;
  polymarket_yes_token_id: string;
  polymarket_no_token_id: string;
  kalshi_ticker: string;
  mapping: 'POLY_YES_EQUALS_KALSHI_YES' | 'POLY_YES_EQUALS_KALSHI_NO';
  resolution_risk: 'low' | 'medium' | 'high';
  notes: string;
  created_at: string;
  verified_by: string;
}
```

### 4. API Routes (`server/routes/marketPairs.ts`)
- `GET /api/market-pairs` - Get all confirmed pairs
- `GET /api/market-pairs/:pairId` - Get specific pair
- `GET /api/market-pairs/polymarket/:marketId` - Find by Polymarket ID
- `GET /api/market-pairs/kalshi/:ticker` - Find by Kalshi ticker

### 5. Initial Seed Data
Start with empty array `[]` in `marketPairs.json`. Pairs will be added manually as they are verified.

## Implementation Steps

1. Create `server/config/marketPairs.json` with empty array
2. Create `server/services/marketPairs.ts` with pair management logic
3. Create `server/routes/marketPairs.ts` with Express routes
4. Register routes in `server/index.ts`
5. Add TypeScript interfaces
6. Add validation logic for pair structure

## Testing Checklist
- [ ] `GET /api/market-pairs` returns empty array initially
- [ ] Service can read from JSON file
- [ ] Validation rejects malformed pairs
- [ ] TypeScript types are correct
- [ ] No TypeScript errors
- [ ] Server builds successfully

## Success Criteria
- Market pairs configuration system is in place
- Only manually confirmed pairs can be retrieved
- No automatic matching logic included
- Code passes TypeScript compilation
- Clear separation between confirmed and unconfirmed markets

## Safety Notes
- **Critical**: This system prevents false arbitrage opportunities
- No AI/ML-based automatic matching
- No title-similarity-only matching
- Every pair must be manually verified before adding to config
- Resolution risk must be explicitly assessed

## Future Work (Out of Scope)
- Admin UI for adding pairs (future PR)
- Automated suggestion system (future PR, requires manual approval)
- Historical pair performance tracking (future PR)
