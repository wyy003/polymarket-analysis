# Polymarket Analysis

A comprehensive analysis platform for Polymarket prediction markets, featuring technical indicators, backtesting, and arbitrage detection.

## Features

### Market Analysis
- **Real-time Market Data**: Browse and search prediction markets with advanced filtering
- **Price History Charts**: Interactive charts with multiple outcome tracking
- **Technical Indicators**: 
  - Moving Averages (MA7, MA20, MA50)
  - Relative Strength Index (RSI)
  - Bollinger Bands
- **Statistical Metrics**: 8 real-time calculated metrics including volatility, liquidity, and trend analysis

### Trading Tools
- **Backtesting Engine**: Test trading strategies with historical data
  - MA Crossover Strategy
  - RSI Threshold Strategy
  - Bollinger Bands Breakout Strategy
  - Performance metrics: ROI, Win Rate, Max Drawdown, Sharpe Ratio
- **Arbitrage Detection**: Identify profit opportunities
  - Price Sum Arbitrage (outcomes don't sum to 100%)
  - Cross-Market Arbitrage (same event, different markets)
  - Risk assessment and profit calculations

### User Experience
- **Advanced Filtering**: Filter by price range, volume, date, and status
- **Smart Search**: Debounced search with localStorage persistence
- **Responsive Design**: Optimized for desktop and mobile
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Loading States**: Skeleton screens for better perceived performance

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (data fetching)
- Recharts (charting)
- Tailwind CSS (styling)

**Backend:**
- Node.js + Express
- TypeScript
- Better-SQLite3 (database)
- Node-cron (scheduled tasks)

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/wyy003/polymarket-analysis.git
cd polymarket-analysis
```

2. Install dependencies:
```bash
npm install
```

3. Start development servers:
```bash
# Terminal 1: Start backend
npm run dev:server

# Terminal 2: Start frontend
npm run dev
```

4. Open browser:
```
http://localhost:5174
```

## Scripts

### Development
- `npm run dev` - Start frontend dev server
- `npm run dev:server` - Start backend dev server
- `npm run build` - Build both frontend and backend
- `npm run build:server` - Build backend only

### Production
- `npm run preview` - Preview production build

## Project Structure

```
polymarket-analysis/
├── src/                    # Frontend source
│   ├── components/         # React components
│   │   ├── backtest/      # Backtesting components
│   │   ├── detail/        # Market detail components
│   │   └── ui/            # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and API client
│   ├── pages/             # Page components
│   └── App.tsx            # Root component
├── server/                # Backend source
│   ├── database/          # Database schema and connection
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   │   ├── arbitrage.ts   # Arbitrage detection
│   │   ├── backtest.ts    # Backtesting engine
│   │   ├── indicators.ts  # Technical indicators
│   │   ├── polymarket.ts  # Polymarket API client
│   │   └── statistics.ts  # Statistical calculations
│   └── index.ts           # Server entry point
└── data/                  # SQLite database
```

## API Documentation

### Markets
- `GET /api/markets` - List markets (with pagination)
- `GET /api/markets/:id` - Get market details
- `GET /api/markets/:id/price-history` - Get price history
- `GET /api/markets/:id/indicators` - Get technical indicators
- `GET /api/markets/:id/statistics` - Get statistical metrics

### Backtesting
- `POST /api/backtest` - Run backtest simulation

### Arbitrage
- `GET /api/arbitrage` - Get arbitrage opportunities

### Health
- `GET /api/health` - Server health check

## Features Overview

### Technical Indicators
- **MA (Moving Average)**: Identify trends with 7, 20, and 50-period moving averages
- **RSI (Relative Strength Index)**: Detect overbought/oversold conditions
- **Bollinger Bands**: Measure volatility and potential breakouts

### Backtesting
Test your trading strategies against historical data:
1. Select a strategy type
2. Configure parameters (periods, thresholds)
3. Set date range and initial capital
4. View results: equity curve, trade history, performance metrics

### Arbitrage Detection
Automatically scans for profit opportunities:
- **Price Sum**: When Yes + No prices ≠ 100%
- **Cross-Market**: Same event priced differently across markets
- Risk levels and profit estimates included

## Development

### Adding New Technical Indicators

1. Add calculation logic to `server/services/indicators.ts`
2. Update `calculateAllIndicators` function
3. Add UI controls in `src/pages/MarketDetailPage.tsx`
4. Update chart rendering in `src/components/PriceChart.tsx`

### Adding New Backtest Strategies

1. Add strategy logic to `server/services/backtest.ts`
2. Update `BacktestConfig` type in `src/lib/api.ts`
3. Add strategy option in `src/components/backtest/BacktestConfigForm.tsx`

## License

MIT License

## Acknowledgments

- [Polymarket](https://polymarket.com) for providing the prediction market data
- [Recharts](https://recharts.org) for charting library
- [TanStack Query](https://tanstack.com/query) for data fetching

