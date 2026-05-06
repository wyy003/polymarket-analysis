// 统计指标计算服务

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface VolatilityResult {
  volatility: number;
  period: string;
}

export interface SpreadResult {
  spread: number;
  spreadPercent: number;
}

export interface Change24hResult {
  change: number;
  changePercent: number;
  currentPrice: number;
  price24hAgo: number;
}

export interface TechnicalSummary {
  rsi: {
    value: number;
    status: 'overbought' | 'oversold' | 'neutral';
  } | null;
  maTrend: {
    trend: 'bullish' | 'bearish' | 'neutral';
    description: string;
  } | null;
}

/**
 * 计算价格波动率（标准差）
 * @param prices 价格数据点数组
 * @param period 周期描述（如 "7d", "30d"）
 * @returns 波动率结果
 */
export function calculateVolatility(prices: PricePoint[], period: string = '7d'): VolatilityResult {
  if (prices.length < 2) {
    return { volatility: 0, period };
  }

  const mean = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
  const squaredDiffs = prices.map(p => Math.pow(p.price - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / prices.length;
  const volatility = Math.sqrt(variance);

  return {
    volatility: parseFloat(volatility.toFixed(4)),
    period,
  };
}

/**
 * 计算买卖价差（流动性指标）
 * @param yesPrice Yes 结果的当前价格
 * @param noPrice No 结果的当前价格
 * @returns 价差结果
 */
export function calculateSpread(yesPrice: number, noPrice: number): SpreadResult {
  const spread = Math.abs(yesPrice - noPrice);
  const spreadPercent = (spread / Math.max(yesPrice, noPrice)) * 100;

  return {
    spread: parseFloat(spread.toFixed(4)),
    spreadPercent: parseFloat(spreadPercent.toFixed(2)),
  };
}

/**
 * 计算 24 小时价格变化
 * @param prices 价格数据点数组（按时间升序）
 * @returns 24h 变化结果
 */
export function calculate24hChange(prices: PricePoint[]): Change24hResult | null {
  if (prices.length < 2) {
    return null;
  }

  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  const currentPrice = prices[prices.length - 1];
  if (!currentPrice) {
    return null;
  }

  // 找到最接近 24 小时前的价格点
  let price24hAgo = prices[0];
  for (const p of prices) {
    if (p && Math.abs(p.timestamp - twentyFourHoursAgo) < Math.abs((price24hAgo?.timestamp || 0) - twentyFourHoursAgo)) {
      price24hAgo = p;
    }
  }

  if (!price24hAgo) {
    return null;
  }

  const change = currentPrice.price - price24hAgo.price;
  const changePercent = (change / price24hAgo.price) * 100;

  return {
    change: parseFloat(change.toFixed(4)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    currentPrice: currentPrice.price,
    price24hAgo: price24hAgo.price,
  };
}

/**
 * 汇总当前技术指标状态
 * @param rsiValue 当前 RSI 值
 * @param ma7 MA7 最新值
 * @param ma20 MA20 最新值
 * @param currentPrice 当前价格
 * @returns 技术指标摘要
 */
export function calculateTechnicalSummary(
  rsiValue: number | null,
  ma7: number | null,
  ma20: number | null,
  currentPrice: number
): TechnicalSummary {
  const summary: TechnicalSummary = {
    rsi: null,
    maTrend: null,
  };

  // RSI 状态
  if (rsiValue !== null) {
    let status: 'overbought' | 'oversold' | 'neutral' = 'neutral';
    if (rsiValue >= 70) {
      status = 'overbought';
    } else if (rsiValue <= 30) {
      status = 'oversold';
    }
    summary.rsi = { value: rsiValue, status };
  }

  // MA 趋势
  if (ma7 !== null && ma20 !== null) {
    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let description = '';

    if (currentPrice > ma7 && ma7 > ma20) {
      trend = 'bullish';
      description = 'Price above MA7 and MA20, bullish trend';
    } else if (currentPrice < ma7 && ma7 < ma20) {
      trend = 'bearish';
      description = 'Price below MA7 and MA20, bearish trend';
    } else if (ma7 > ma20) {
      trend = 'bullish';
      description = 'MA7 above MA20, potential uptrend';
    } else if (ma7 < ma20) {
      trend = 'bearish';
      description = 'MA7 below MA20, potential downtrend';
    } else {
      description = 'No clear trend';
    }

    summary.maTrend = { trend, description };
  }

  return summary;
}

/**
 * 查找历史相似事件（基于类别和关键词）
 * @param category 事件类别
 * @param keywords 关键词数组
 * @param allMarkets 所有市场数据
 * @returns 相似事件数组
 */
export function findSimilarEvents(
  category: string | null,
  keywords: string[],
  allMarkets: Array<{ id: string; question: string; category: string | null; active: number }>
): Array<{ id: string; question: string; similarity: number }> {
  if (!category && keywords.length === 0) {
    return [];
  }

  const similarEvents = allMarkets
    .filter(m => m.active === 0) // 只看已结束的市场
    .map(m => {
      let similarity = 0;

      // 类别匹配
      if (category && m.category === category) {
        similarity += 0.5;
      }

      // 关键词匹配
      const questionLower = m.question.toLowerCase();
      const matchedKeywords = keywords.filter(kw => questionLower.includes(kw.toLowerCase()));
      similarity += (matchedKeywords.length / keywords.length) * 0.5;

      return { id: m.id, question: m.question, similarity };
    })
    .filter(e => e.similarity > 0.3) // 相似度阈值
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5); // 最多返回 5 个

  return similarEvents;
}
