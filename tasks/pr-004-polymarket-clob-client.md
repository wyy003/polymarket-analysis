# PR-004: Polymarket CLOB Orderbook Client

## Objective
Add Polymarket CLOB (Central Limit Order Book) API client to fetch orderbook data for cross-platform arbitrage scanning.

## Scope
- **IN SCOPE**: Read-only orderbook data fetching
- **OUT OF SCOPE**: Trading, authentication with trading keys, order placement

## Background
Current implementation uses Polymarket Gamma API for display prices. For arbitrage scanning, we need actual executable orderbook prices from the CLOB API.

## Technical Requirements

### 1. Polymarket CLOB Client (`server/services/polymarketOrderbook.ts`)
- Base URL: `https://clob.polymarket.com`
- No authentication required for read-only endpoints
- Implement methods:
  - `getOrderbook(tokenId)`: Fetch orderbook for a specific token
  - `getBestBidAsk(tokenId)`: Get best bid/ask prices
  - `getBatchOrderbooks(tokenIds)`: Fetch multiple orderbooks at once

### 2. Orderbook Structure
Return standardized format:
```typescript
{
  tokenId: string;
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  raw?: any;
}
```

### 3. API Routes (`server/routes/polymarketOrderbook.ts`)
- `GET /api/polymarket/orderbook/:tokenId` - Get orderbook for a token
- `GET /api/polymarket/orderbook/:tokenId/best` - Get best bid/ask only
- `POST /api/polymarket/orderbooks/batch` - Get multiple orderbooks (body: { tokenIds: string[] })

### 4. TypeScript Interfaces
Define types for:
- `PolymarketOrderbook`
- `PolymarketOrderbookLevel`
- `PolymarketBestBidAsk`

## Implementation Steps

1. Create `server/services/polymarketOrderbook.ts` with CLOB API client
2. Create `server/routes/polymarketOrderbook.ts` with Express routes
3. Register routes in `server/index.ts`
4. Add TypeScript interfaces
5. Test endpoints with real token IDs from existing markets

## Testing Checklist
- [ ] `GET /api/polymarket/orderbook/:tokenId` returns orderbook
- [ ] Bids sorted descending (highest first)
- [ ] Asks sorted ascending (lowest first)
- [ ] Best bid/ask calculated correctly
- [ ] Spread = bestAsk - bestBid
- [ ] Batch endpoint works with multiple tokens
- [ ] No TypeScript errors
- [ ] Server builds successfully

## Success Criteria
- All endpoints return valid orderbook data
- Orderbook prices are executable (not display prices)
- No authentication/trading functionality included
- Code passes TypeScript compilation

## Notes
- Polymarket CLOB API documentation: https://docs.polymarket.com/#clob-api
- Token IDs can be obtained from existing market data in the database
