import { db } from '../database/schema';
import { calculateMA, calculateRSI, calculateBollingerBands } from './indicators';

export interface BacktestConfig {
  marketId: string;
  outcomeId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  strategy: {
    type: 'ma_crossover' | 'rsi_threshold' | 'bollinger_bands';
    params: {
      // MA Crossover
      fastPeriod?: number;
      slowPeriod?: number;
      // RSI Threshold
      oversoldThreshold?: number;
      overboughtThreshold?: number;
      // Bollinger Bands
      period?: number;
      stdDev?: number;
    };
  };
}

export interface Trade {
  timestamp: string;
  type: 'buy' | 'sell';
  price: number;
  shares: number;
  capital: number;
  reason: string;
}

export interface BacktestResult {
  trades: Trade[];
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  equityCurve: Array<{ timestamp: string; equity: number }>;
}

export async function runBacktest(config: BacktestConfig): Promise<BacktestResult> {
  // Fetch price history
  const priceHistory = db.prepare(`
    SELECT timestamp, price
    FROM price_history
    WHERE outcome_id = ? AND timestamp BETWEEN ? AND ?
    ORDER BY timestamp ASC
  `).all(config.outcomeId, config.startDate, config.endDate) as Array<{ timestamp: string; price: number }>;

  if (priceHistory.length === 0) {
    throw new Error('No price history found for the specified period');
  }

  // Initialize backtest state
  let capital = config.initialCapital;
  let shares = 0;
  let position: 'long' | 'flat' = 'flat';
  const trades: Trade[] = [];
  const equityCurve: Array<{ timestamp: string; equity: number }> = [];
  let maxEquity = capital;
  let maxDrawdown = 0;

  // Calculate indicators based on strategy type
  let signals: Array<{ timestamp: string; signal: 'buy' | 'sell' | 'hold' }> = [];

  switch (config.strategy.type) {
    case 'ma_crossover':
      signals = generateMACrossoverSignals(priceHistory, config.strategy.params);
      break;
    case 'rsi_threshold':
      signals = generateRSISignals(priceHistory, config.strategy.params);
      break;
    case 'bollinger_bands':
      signals = generateBollingerSignals(priceHistory, config.strategy.params);
      break;
  }

  // Execute trades based on signals
  for (let i = 0; i < priceHistory.length; i++) {
    const currentPoint = priceHistory[i];
    if (!currentPoint) continue;

    const { timestamp, price } = currentPoint;
    const signal = signals[i]?.signal || 'hold';

    // Calculate current equity
    const currentEquity = capital + (shares * price);
    equityCurve.push({ timestamp, equity: currentEquity });

    // Update max drawdown
    if (currentEquity > maxEquity) {
      maxEquity = currentEquity;
    }
    const drawdown = (maxEquity - currentEquity) / maxEquity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }

    // Execute trades
    if (signal === 'buy' && position === 'flat' && capital > 0) {
      // Buy with all available capital
      shares = capital / price;
      position = 'long';
      trades.push({
        timestamp,
        type: 'buy',
        price,
        shares,
        capital: 0,
        reason: getSignalReason(config.strategy.type, 'buy', i, priceHistory, config.strategy.params)
      });
      capital = 0;
    } else if (signal === 'sell' && position === 'long' && shares > 0) {
      // Sell all shares
      capital = shares * price;
      position = 'flat';
      trades.push({
        timestamp,
        type: 'sell',
        price,
        shares,
        capital,
        reason: getSignalReason(config.strategy.type, 'sell', i, priceHistory, config.strategy.params)
      });
      shares = 0;
    }
  }

  // Close any open position at the end
  if (position === 'long' && shares > 0) {
    const lastPoint = priceHistory[priceHistory.length - 1];
    if (lastPoint) {
      capital = shares * lastPoint.price;
      trades.push({
        timestamp: lastPoint.timestamp,
        type: 'sell',
        price: lastPoint.price,
        shares,
        capital,
        reason: 'Close position at end of backtest period'
      });
      shares = 0;
    }
  }

  // Calculate performance metrics
  const lastPoint = priceHistory[priceHistory.length - 1];
  if (!lastPoint) {
    throw new Error('No price data available');
  }
  const finalCapital = capital + (shares * lastPoint.price);
  const totalReturn = finalCapital - config.initialCapital;
  const totalReturnPercent = (totalReturn / config.initialCapital) * 100;

  // Calculate win rate
  let winningTrades = 0;
  let losingTrades = 0;
  for (let i = 0; i < trades.length; i += 2) {
    const buyTrade = trades[i];
    const sellTrade = trades[i + 1];
    if (buyTrade && sellTrade && buyTrade.type === 'buy' && sellTrade.type === 'sell') {
      const buyPrice = buyTrade.price;
      const sellPrice = sellTrade.price;
      if (sellPrice > buyPrice) {
        winningTrades++;
      } else {
        losingTrades++;
      }
    }
  }
  const winRate = trades.length > 0 ? (winningTrades / (winningTrades + losingTrades)) * 100 : 0;

  // Calculate Sharpe ratio (simplified)
  const returns = equityCurve.map((point, i) => {
    if (i === 0) return 0;
    const prevPoint = equityCurve[i - 1];
    if (!prevPoint || prevPoint.equity === 0) return 0;
    return (point.equity - prevPoint.equity) / prevPoint.equity;
  });
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const stdReturn = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0; // Annualized

  return {
    trades,
    finalCapital,
    totalReturn,
    totalReturnPercent,
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    winRate,
    maxDrawdown: maxDrawdown * 100,
    sharpeRatio,
    equityCurve
  };
}

function generateMACrossoverSignals(
  priceHistory: Array<{ timestamp: string; price: number }>,
  params: { fastPeriod?: number; slowPeriod?: number }
): Array<{ timestamp: string; signal: 'buy' | 'sell' | 'hold' }> {
  const fastPeriod = params.fastPeriod || 7;
  const slowPeriod = params.slowPeriod || 20;

  // Convert to PricePoint format
  const pricePoints = priceHistory.map(p => ({
    timestamp: new Date(p.timestamp).getTime(),
    price: p.price
  }));

  const fastMA = calculateMA(pricePoints, fastPeriod);
  const slowMA = calculateMA(pricePoints, slowPeriod);

  // Create a map for quick lookup
  const fastMAMap = new Map(fastMA.map(m => [m.timestamp, m.ma]));
  const slowMAMap = new Map(slowMA.map(m => [m.timestamp, m.ma]));

  const signals: Array<{ timestamp: string; signal: 'buy' | 'sell' | 'hold' }> = [];
  let previousCross: 'above' | 'below' | null = null;

  for (const point of priceHistory) {
    const ts = new Date(point.timestamp).getTime();
    const fastValue = fastMAMap.get(ts);
    const slowValue = slowMAMap.get(ts);

    if (fastValue === undefined || slowValue === undefined) {
      signals.push({ timestamp: point.timestamp, signal: 'hold' });
      continue;
    }

    const currentCross = fastValue > slowValue ? 'above' : 'below';

    if (previousCross === 'below' && currentCross === 'above') {
      signals.push({ timestamp: point.timestamp, signal: 'buy' });
    } else if (previousCross === 'above' && currentCross === 'below') {
      signals.push({ timestamp: point.timestamp, signal: 'sell' });
    } else {
      signals.push({ timestamp: point.timestamp, signal: 'hold' });
    }

    previousCross = currentCross;
  }

  return signals;
}

function generateRSISignals(
  priceHistory: Array<{ timestamp: string; price: number }>,
  params: { oversoldThreshold?: number; overboughtThreshold?: number }
): Array<{ timestamp: string; signal: 'buy' | 'sell' | 'hold' }> {
  const oversoldThreshold = params.oversoldThreshold || 30;
  const overboughtThreshold = params.overboughtThreshold || 70;

  // Convert to PricePoint format
  const pricePoints = priceHistory.map(p => ({
    timestamp: new Date(p.timestamp).getTime(),
    price: p.price
  }));

  const rsiResults = calculateRSI(pricePoints, 14);

  // Create a map for quick lookup
  const rsiMap = new Map(rsiResults.map(r => [r.timestamp, r.rsi]));

  const signals: Array<{ timestamp: string; signal: 'buy' | 'sell' | 'hold' }> = [];

  for (const point of priceHistory) {
    const ts = new Date(point.timestamp).getTime();
    const rsi = rsiMap.get(ts);

    if (rsi === undefined) {
      signals.push({ timestamp: point.timestamp, signal: 'hold' });
      continue;
    }

    if (rsi < oversoldThreshold) {
      signals.push({ timestamp: point.timestamp, signal: 'buy' });
    } else if (rsi > overboughtThreshold) {
      signals.push({ timestamp: point.timestamp, signal: 'sell' });
    } else {
      signals.push({ timestamp: point.timestamp, signal: 'hold' });
    }
  }

  return signals;
}

function generateBollingerSignals(
  priceHistory: Array<{ timestamp: string; price: number }>,
  params: { period?: number; stdDev?: number }
): Array<{ timestamp: string; signal: 'buy' | 'sell' | 'hold' }> {
  const period = params.period || 20;
  const stdDev = params.stdDev || 2;

  // Convert to PricePoint format
  const pricePoints = priceHistory.map(p => ({
    timestamp: new Date(p.timestamp).getTime(),
    price: p.price
  }));

  const bbResults = calculateBollingerBands(pricePoints, period, stdDev);

  // Create a map for quick lookup
  const bbMap = new Map(bbResults.map(b => [b.timestamp, { upper: b.upper, lower: b.lower }]));

  const signals: Array<{ timestamp: string; signal: 'buy' | 'sell' | 'hold' }> = [];

  for (const point of priceHistory) {
    const ts = new Date(point.timestamp).getTime();
    const bb = bbMap.get(ts);

    if (bb === undefined) {
      signals.push({ timestamp: point.timestamp, signal: 'hold' });
      continue;
    }

    if (point.price <= bb.lower) {
      signals.push({ timestamp: point.timestamp, signal: 'buy' });
    } else if (point.price >= bb.upper) {
      signals.push({ timestamp: point.timestamp, signal: 'sell' });
    } else {
      signals.push({ timestamp: point.timestamp, signal: 'hold' });
    }
  }

  return signals;
}

function getSignalReason(
  strategyType: string,
  signal: 'buy' | 'sell',
  _index: number,
  _priceHistory: Array<{ timestamp: string; price: number }>,
  params: any
): string {
  switch (strategyType) {
    case 'ma_crossover':
      return signal === 'buy'
        ? `Fast MA crossed above Slow MA (${params.fastPeriod || 7}/${params.slowPeriod || 20})`
        : `Fast MA crossed below Slow MA (${params.fastPeriod || 7}/${params.slowPeriod || 20})`;
    case 'rsi_threshold':
      return signal === 'buy'
        ? `RSI below ${params.oversoldThreshold || 30} (oversold)`
        : `RSI above ${params.overboughtThreshold || 70} (overbought)`;
    case 'bollinger_bands':
      return signal === 'buy'
        ? 'Price touched lower Bollinger Band'
        : 'Price touched upper Bollinger Band';
    default:
      return 'Unknown signal';
  }
}
