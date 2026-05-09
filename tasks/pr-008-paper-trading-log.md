# PR#8: Paper Trading Log System

## Objective
Build a paper trading log system that records arbitrage opportunities without executing real trades. This allows users to track what opportunities were available, evaluate strategy performance retrospectively, and build confidence before live trading.

## Scope

### Backend Components

#### 1. Paper Trade Log Schema (`server/types/paperTrade.ts`)
```typescript
interface PaperTradeLog {
  id: string;                    // UUID
  timestamp: number;             // Unix timestamp
  pairId: string;                // Market pair ID
  direction: 'poly_yes_kalshi_no' | 'kalshi_yes_poly_no';
  
  // Prices at time of log
  polyPrice: number;
  kalshiPrice: number;
  
  // Cost breakdown
  totalCost: number;
  netProfit: number;
  profitPercent: number;
  fees: {
    polymarketFee: number;
    kalshiFee: number;
    totalFees: number;
  };
  
  // Execution details
  targetSize: number;            // Hypothetical trade size
  estimatedSlippage: number;
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high';
  riskFlags: string[];
  
  // Metadata
  source: 'manual' | 'auto_scan';
  notes?: string;
  
  // Outcome tracking (filled later)
  outcome?: {
    resolvedAt: number;
    actualProfit: number;
    actualProfitPercent: number;
  };
}
```

#### 2. Paper Trade Service (`server/services/paperTrade.ts`)
- `logOpportunity(opportunity: CrossVenueOpportunity, targetSize: number, source: string, notes?: string): PaperTradeLog`
- `getAllLogs(filters?: LogFilters): PaperTradeLog[]`
- `getLogById(id: string): PaperTradeLog | null`
- `updateOutcome(id: string, outcome: Outcome): void`
- `getStats(): PaperTradeStats`

**Storage**: JSON file at `server/data/paperTrades.json`

#### 3. Paper Trade Routes (`server/routes/paperTrade.ts`)
- `POST /api/paper-trade/log` - Log a new paper trade
- `GET /api/paper-trade/logs` - Get all logs (with filters)
- `GET /api/paper-trade/logs/:id` - Get specific log
- `PATCH /api/paper-trade/logs/:id/outcome` - Update outcome
- `GET /api/paper-trade/stats` - Get aggregate statistics

#### 4. Auto-logging Integration
Modify `server/services/arbitrage/crossVenue.ts`:
- Add optional auto-logging when opportunities are found
- Configurable threshold (e.g., only log if netProfit > $5)
- Rate limiting to avoid spam

### Frontend Components

#### 1. Paper Trade Types (`src/types/paperTrade.ts`)
Mirror backend types for frontend use.

#### 2. API Methods (`src/lib/api.ts`)
- `logPaperTrade(opportunity, targetSize, notes?)`
- `getPaperTradeLogs(filters?)`
- `getPaperTradeStats()`
- `updatePaperTradeOutcome(id, outcome)`

#### 3. Paper Trade Log Component (`src/components/PaperTradeLog.tsx`)
Display table of logged paper trades:
- Timestamp
- Pair ID
- Direction
- Net edge
- Target size
- Risk level
- Status (pending/resolved)
- Actions (view details, update outcome)

Features:
- Filtering (by date range, risk level, pair)
- Sorting (by timestamp, profit, risk)
- Pagination
- Export to CSV

#### 4. Paper Trade Stats Component (`src/components/PaperTradeStats.tsx`)
Show aggregate statistics:
- Total opportunities logged
- Average net edge
- Risk distribution
- Hypothetical P&L (if all executed)
- Success rate (for resolved trades)

#### 5. Log Button in OpportunityCard (`src/components/OpportunityCard.tsx`)
Add "Log Paper Trade" button to each opportunity card:
- Opens modal to specify target size and notes
- Calls API to log the trade
- Shows success confirmation

### Configuration

Add to `server/config/settings.json`:
```json
{
  "paperTrading": {
    "autoLog": false,
    "autoLogThreshold": 5.0,
    "maxLogsPerDay": 1000
  }
}
```

## Implementation Steps

1. **Backend Schema & Service**
   - Create `server/types/paperTrade.ts`
   - Create `server/services/paperTrade.ts`
   - Create `server/data/paperTrades.json` (empty array initially)
   - Add unit tests

2. **Backend Routes**
   - Create `server/routes/paperTrade.ts`
   - Register routes in `server/index.ts`
   - Test with curl/Postman

3. **Frontend Types & API**
   - Create `src/types/paperTrade.ts`
   - Add methods to `src/lib/api.ts`

4. **Frontend Components**
   - Create `src/components/PaperTradeLog.tsx`
   - Create `src/components/PaperTradeStats.tsx`
   - Add log button to `src/components/OpportunityCard.tsx`

5. **Integration**
   - Add paper trade section to `src/pages/HomePage.tsx`
   - Test end-to-end flow

6. **Auto-logging (Optional)**
   - Add configuration
   - Integrate with crossVenue scanner
   - Add rate limiting

## Testing Checklist

- [ ] Can log a paper trade manually
- [ ] Logs persist across server restarts
- [ ] Can retrieve all logs
- [ ] Can filter logs by date/risk/pair
- [ ] Can update outcome for a log
- [ ] Stats calculate correctly
- [ ] Frontend displays logs correctly
- [ ] Log button works in OpportunityCard
- [ ] Export to CSV works
- [ ] Auto-logging respects threshold (if enabled)

## Success Criteria

- Users can log arbitrage opportunities without executing trades
- Logs include all relevant pricing and risk data
- Users can review historical opportunities
- Stats provide insight into strategy performance
- System is ready for retrospective analysis

## Notes

- This is a **read-only** system for opportunities (no actual trading)
- Outcome tracking is manual (user updates when market resolves)
- Future enhancement: auto-resolve outcomes by checking market results
- CSV export useful for external analysis (Excel, Python, etc.)

## Dependencies

- PR#6 (Cross-venue arbitrage calculator)
- PR#7 (Dashboard display)

## Estimated Effort

- Backend: 2-3 hours
- Frontend: 2-3 hours
- Testing: 1 hour
- **Total: 5-7 hours**
