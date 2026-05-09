# PR-003: Kalshi Read-Only Client

## Objective
Add read-only Kalshi API client to fetch market data and orderbook information for cross-platform arbitrage scanning.

## Scope
- **IN SCOPE**: Read-only market data and orderbook fetching
- **OUT OF SCOPE**: Trading, authentication with trading keys, order placement

## Technical Requirements

### 1. Kalshi API Client (`server/services/kalshi.ts`)
- Base URL: `https://api.elections.kalshi.com/trade-api/v2`
- No authentication required for read-only endpoints
- Implement methods:
  - `getMarkets()`: Fetch all active markets
  - `getMarket(ticker)`: Fetch single market details
  - `getOrderbook(ticker)`: Fetch orderbook for a market

### 2. Orderbook Processing
Kalshi only returns YES/NO bids. Calculate implied asks using complementary relationship:
- `impliedYesAsk = 1 - bestNoBid`
- `impliedNoAsk = 1 - bestYesBid`

### 3. API Routes (`server/routes/kalshi.ts`)
- `GET /api/kalshi/markets` - List all markets
- `GET /api/kalshi/markets/:ticker` - Get market details
- `GET /api/kalshi/markets/:ticker/orderbook` - Get orderbook with implied asks

### 4. TypeScript Interfaces
Define types for:
- `KalshiMarket`
- `KalshiOrderbook`
- `KalshiOrderbookLevel`

## Implementation Steps

1. Create `server/services/kalshi.ts` with API client
2. Create `server/routes/kalshi.ts` with Express routes
3. Register routes in `server/index.ts`
4. Add TypeScript interfaces
5. Test endpoints manually

## Testing Checklist
- [ ] `GET /api/kalshi/markets` returns market list
- [ ] `GET /api/kalshi/markets/:ticker` returns market details
- [ ] `GET /api/kalshi/markets/:ticker/orderbook` returns orderbook with implied asks
- [ ] Orderbook calculations are correct (impliedYesAsk + bestYesBid ≈ 1)
- [ ] No TypeScript errors
- [ ] Server builds successfully

## Success Criteria
- All endpoints return valid data
- Orderbook implied asks calculated correctly
- No authentication/trading functionality included
- Code passes TypeScript compilation
