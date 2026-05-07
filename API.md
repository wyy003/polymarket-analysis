# API Documentation

Base URL: `http://localhost:3001/api`

## Markets

### List Markets
Get a paginated list of prediction markets.

**Endpoint:** `GET /api/markets`

**Query Parameters:**
- `limit` (optional): Number of markets to return (default: 100)
- `offset` (optional): Number of markets to skip (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "question": "string",
      "description": "string",
      "category": "string",
      "end_date": "string (ISO 8601)",
      "volume": "number",
      "active": 0 | 1,
      "created_at": "string (ISO 8601)",
      "outcomes": [
        {
          "id": "string",
          "name": "string",
          "price": "number (0-1)"
        }
      ]
    }
  ],
  "count": "number",
  "limit": "number",
  "offset": "number"
}
```

### Get Market Details
Get detailed information about a specific market.

**Endpoint:** `GET /api/markets/:id`

**Parameters:**
- `id`: Market ID

**Response:**
```json
{
  "id": "string",
  "question": "string",
  "description": "string",
  "category": "string",
  "end_date": "string (ISO 8601)",
  "volume": "number",
  "active": 0 | 1,
  "created_at": "string (ISO 8601)",
  "outcomes": [
    {
      "id": "string",
      "name": "string",
      "price": "number (0-1)"
    }
  ]
}
```

### Get Price History
Get historical price data for a market.

**Endpoint:** `GET /api/markets/:id/price-history`

**Parameters:**
- `id`: Market ID

**Response:**
```json
[
  {
    "id": "number",
    "market_id": "string",
    "outcome_id": "string",
    "outcome_name": "string",
    "price": "number (0-1)",
    "timestamp": "string (ISO 8601)"
  }
]
```

### Get Technical Indicators
Calculate technical indicators for a specific outcome.

**Endpoint:** `GET /api/markets/:id/indicators`

**Parameters:**
- `id`: Market ID

**Query Parameters:**
- `outcomeId`: Outcome ID (required)

**Response:**
```json
{
  "ma7": [
    {
      "timestamp": "string (ISO 8601)",
      "value": "number"
    }
  ],
  "ma20": [...],
  "ma50": [...],
  "rsi": [
    {
      "timestamp": "string (ISO 8601)",
      "value": "number (0-100)"
    }
  ],
  "bollingerBands": [
    {
      "timestamp": "string (ISO 8601)",
      "upper": "number",
      "middle": "number",
      "lower": "number"
    }
  ]
}
```

### Get Statistics
Get statistical metrics for a market.

**Endpoint:** `GET /api/markets/:id/statistics`

**Parameters:**
- `id`: Market ID

**Query Parameters:**
- `outcomeId`: Outcome ID (required)

**Response:**
```json
{
  "currentPrice": "number (0-1)",
  "change24h": "number (percentage)",
  "volume": "number",
  "volume24h": "number",
  "volatility": "number",
  "liquidity": "number",
  "rsiStatus": "oversold" | "neutral" | "overbought",
  "maTrend": "bullish" | "neutral" | "bearish"
}
```

## Backtesting

### Run Backtest
Execute a backtest simulation with specified strategy and parameters.

**Endpoint:** `POST /api/backtest`

**Request Body:**
```json
{
  "marketId": "string",
  "outcomeId": "string",
  "strategy": "ma_crossover" | "rsi_threshold" | "bollinger_bands",
  "params": {
    // For ma_crossover:
    "fastPeriod": "number",
    "slowPeriod": "number",
    
    // For rsi_threshold:
    "period": "number",
    "oversold": "number (0-100)",
    "overbought": "number (0-100)",
    
    // For bollinger_bands:
    "period": "number",
    "stdDev": "number"
  },
  "startDate": "string (ISO 8601)",
  "endDate": "string (ISO 8601)",
  "initialCapital": "number"
}
```

**Response:**
```json
{
  "totalReturn": "number (percentage)",
  "winRate": "number (percentage)",
  "maxDrawdown": "number (percentage)",
  "totalTrades": "number",
  "sharpeRatio": "number",
  "trades": [
    {
      "timestamp": "string (ISO 8601)",
      "type": "buy" | "sell",
      "price": "number",
      "quantity": "number",
      "pnl": "number"
    }
  ],
  "equityCurve": [
    {
      "timestamp": "string (ISO 8601)",
      "equity": "number"
    }
  ]
}
```

## Arbitrage

### Get Arbitrage Opportunities
Scan for arbitrage opportunities across markets.

**Endpoint:** `GET /api/arbitrage`

**Response:**
```json
[
  {
    "type": "price_sum" | "cross_market",
    "marketId": "string",
    "marketQuestion": "string",
    "potentialProfit": "number (percentage)",
    "risk": "low" | "medium" | "high",
    "details": {
      "outcomes": [
        {
          "name": "string",
          "price": "number (0-1)"
        }
      ],
      "priceSum": "number",
      // For cross_market type:
      "market1": {...},
      "market2": {...},
      "priceDifference": "number"
    }
  }
]
```

## Health Check

### Server Health
Check if the server is running.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "string (ISO 8601)"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "string (error message)"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Request succeeded
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

Currently, there are no rate limits implemented. For production use, consider implementing rate limiting to prevent abuse.

## Data Updates

Market data is automatically updated every 30 minutes from the Polymarket API. Price history is continuously accumulated for all active markets.
