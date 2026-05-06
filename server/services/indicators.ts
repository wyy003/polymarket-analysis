// 技术指标计算服务

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface MAResult {
  timestamp: number;
  ma: number;
}

export interface RSIResult {
  timestamp: number;
  rsi: number;
}

export interface BollingerBandsResult {
  timestamp: number;
  upper: number;
  middle: number;
  lower: number;
}

/**
 * 计算简单移动平均线 (Simple Moving Average)
 * @param prices 价格数据点数组
 * @param period 周期（默认 20）
 * @returns MA 结果数组
 */
export function calculateMA(prices: PricePoint[], period: number = 20): MAResult[] {
  if (prices.length < period) {
    return [];
  }

  const results: MAResult[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, p) => acc + p.price, 0);
    const ma = sum / period;

    const currentPrice = prices[i];
    if (currentPrice) {
      results.push({
        timestamp: currentPrice.timestamp,
        ma: parseFloat(ma.toFixed(4))
      });
    }
  }

  return results;
}

/**
 * 计算相对强弱指标 (Relative Strength Index)
 * @param prices 价格数据点数组
 * @param period 周期（默认 14）
 * @returns RSI 结果数组
 */
export function calculateRSI(prices: PricePoint[], period: number = 14): RSIResult[] {
  if (prices.length < period + 1) {
    return [];
  }

  const results: RSIResult[] = [];
  const changes: number[] = [];

  // 计算价格变化
  for (let i = 1; i < prices.length; i++) {
    const curr = prices[i];
    const prev = prices[i - 1];
    if (curr && prev) {
      changes.push(curr.price - prev.price);
    }
  }

  // 计算第一个 RSI（使用简单平均）
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    const change = changes[i];
    if (change !== undefined) {
      if (change > 0) {
        avgGain += change;
      } else {
        avgLoss += Math.abs(change);
      }
    }
  }

  avgGain /= period;
  avgLoss /= period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));

  const firstPrice = prices[period];
  if (firstPrice) {
    results.push({
      timestamp: firstPrice.timestamp,
      rsi: parseFloat(rsi.toFixed(2))
    });
  }

  // 使用 Wilder's smoothing 计算后续 RSI
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    if (change === undefined) continue;

    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));

    const currentPrice = prices[i + 1];
    if (currentPrice) {
      results.push({
        timestamp: currentPrice.timestamp,
        rsi: parseFloat(rsi.toFixed(2))
      });
    }
  }

  return results;
}

/**
 * 计算布林带 (Bollinger Bands)
 * @param prices 价格数据点数组
 * @param period 周期（默认 20）
 * @param stdDev 标准差倍数（默认 2）
 * @returns 布林带结果数组
 */
export function calculateBollingerBands(
  prices: PricePoint[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult[] {
  if (prices.length < period) {
    return [];
  }

  const results: BollingerBandsResult[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);

    // 计算中轨（SMA）
    const sum = slice.reduce((acc, p) => acc + p.price, 0);
    const middle = sum / period;

    // 计算标准差
    const squaredDiffs = slice.map(p => Math.pow(p.price - middle, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    // 计算上下轨
    const upper = middle + (stdDev * standardDeviation);
    const lower = middle - (stdDev * standardDeviation);

    const currentPrice = prices[i];
    if (currentPrice) {
      results.push({
        timestamp: currentPrice.timestamp,
        upper: parseFloat(upper.toFixed(4)),
        middle: parseFloat(middle.toFixed(4)),
        lower: parseFloat(lower.toFixed(4))
      });
    }
  }

  return results;
}

/**
 * 计算所有技术指标
 * @param prices 价格数据点数组
 * @returns 包含所有指标的对象
 */
export function calculateAllIndicators(prices: PricePoint[]) {
  return {
    ma7: calculateMA(prices, 7),
    ma20: calculateMA(prices, 20),
    ma50: calculateMA(prices, 50),
    rsi: calculateRSI(prices, 14),
    bollingerBands: calculateBollingerBands(prices, 20, 2)
  };
}
