# PR-007: Dashboard Cross-Venue Opportunities Display

## Objective
Add a dashboard section to display cross-venue arbitrage opportunities with clear risk indicators and actionable information.

## Scope
- **IN SCOPE**: UI components for displaying opportunities, risk badges, filtering, sorting
- **OUT OF SCOPE**: Trading execution, automatic refresh (WebSocket), historical tracking

## Background
With the arbitrage calculator ready (PR#6), we need a user-friendly dashboard to display opportunities. The display must emphasize:
- Net edge (not gross edge)
- Risk level and flags
- Max executable size
- Clear direction (which side to buy on each platform)

## Technical Requirements

### 1. New Dashboard Section Component (`src/components/CrossVenueOpportunities.tsx`)
Display cross-venue arbitrage opportunities in a card-based layout:
- Opportunity cards with key metrics
- Risk level badges (low/medium/high)
- Direction indicator
- Net edge prominently displayed
- Risk flags list
- Max size indicator

### 2. Opportunity Card Design
Each card should show:
```
┌─────────────────────────────────────┐
│ [Risk Badge] Event Name             │
│                                     │
│ Direction: Buy Poly YES + Kalshi NO │
│                                     │
│ Net Edge: 1.7¢ per $1 payout       │
│ Max Size: $420                      │
│                                     │
│ Prices:                             │
│ • Poly YES Ask: $0.52               │
│ • Kalshi NO Ask: $0.45              │
│                                     │
│ Risk Flags:                         │
│ • LOW_LIQUIDITY                     │
│ • NARROW_EDGE                       │
└─────────────────────────────────────┘
```

### 3. API Integration
- Fetch from `GET /api/arbitrage/cross-venue`
- Display tradeable opportunities by default
- Option to show all opportunities (including non-tradeable)
- Manual refresh button

### 4. Filtering and Sorting
- Filter by risk level (low/medium/high)
- Sort by net edge (highest first)
- Toggle tradeable only / show all

### 5. Empty State
When no opportunities:
```
No arbitrage opportunities found.

Possible reasons:
• No market pairs configured yet
• No positive net edge after fees/slippage
• Orderbook data unavailable

Add confirmed market pairs to start scanning.
```

### 6. Risk Badge Colors
- Low: Green
- Medium: Yellow/Orange
- High: Red

### 7. Data Display Format
- Net edge: Display as cents per dollar (e.g., "1.7¢ per $1")
- Prices: Display as dollars (e.g., "$0.52")
- Max size: Display as dollars (e.g., "$420")
- Percentages: Display with 2 decimal places (e.g., "1.70%")

## Implementation Steps

1. Create `src/components/CrossVenueOpportunities.tsx` - main component
2. Create `src/components/OpportunityCard.tsx` - individual opportunity card
3. Create `src/types/arbitrage.ts` - TypeScript types for frontend
4. Add API service method in `src/services/api.ts`
5. Add route/navigation to dashboard
6. Style with Tailwind CSS
7. Add loading and error states

## UI/UX Requirements

### Must Have:
- Clear visual hierarchy (net edge most prominent)
- Risk level immediately visible
- Direction clearly stated
- All risk flags displayed
- Responsive design (mobile-friendly)

### Must NOT Have:
- "Execute Trade" button
- "Auto-trade" toggle
- Profit projections in dollars (only show edge per $1)
- Misleading "60% profit" style messaging

### Good Example:
```
Net Edge: 1.7¢ per $1 payout
Max executable size: $420
Risk: medium
```

### Bad Example:
```
Potential Profit: 60%
Click to trade automatically!
```

## Testing Checklist
- [ ] Component renders without errors
- [ ] Displays empty state when no opportunities
- [ ] Risk badges show correct colors
- [ ] Net edge displayed in cents per dollar
- [ ] Risk flags all visible
- [ ] Responsive on mobile
- [ ] Manual refresh works
- [ ] TypeScript types correct
- [ ] Build succeeds

## Success Criteria
- Dashboard clearly shows opportunities
- Risk information prominent
- No misleading profit claims
- No trading execution UI
- Professional, conservative presentation

## Notes
- This is a read-only display
- Emphasize risk and limitations
- Conservative presentation builds trust
- Users should understand this is scanning, not trading

## Future Work (Out of Scope)
- Real-time WebSocket updates (future PR)
- Historical opportunity chart (future PR)
- Alert notifications (future PR)
- Export to CSV (future PR)
