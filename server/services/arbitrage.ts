import { db } from '../database/schema';

export interface ArbitrageOpportunity {
  id: string;
  market_id: string;
  detected_at: string;
  type: 'price_sum';
  description: string;
  potential_profit: number;
  risk_level: 'low' | 'medium' | 'high';
  confidence: number; // 0-100的置信度评分
  market_question?: string;
  outcomes?: Array<{ name: string; price: number }>;
}

// Markets whose prices haven't been refreshed within this window are skipped
// to avoid phantom deviations from stale data.
const FRESHNESS_WINDOW_MS = 30 * 60 * 1000;

/**
 * 计算套利机会的置信度（优化版）
 * 基于多个因素综合评估：交易量、流动性、价格偏差、波动率、市场成熟度、时间因素
 */
function calculateConfidence(
  volume: number,
  liquidity: number,
  deviation: number,
  type: 'price_sum' | 'cross_market',
  marketData?: {
    createdAt?: string;
    endDate?: string;
    priceHistory?: Array<{ price: number }>;
  }
): number {
  let confidence = 0;

  // 1. 交易量评分 (0-25分)
  // 使用对数函数，避免极端值影响
  const volumeScore = Math.min(25, Math.log10(volume + 1) * 5);
  confidence += volumeScore;

  // 2. 流动性评分 (0-25分)
  // 流动性越好，套利越容易执行
  const liquidityScore = Math.min(25, Math.log10(liquidity + 1) * 5);
  confidence += liquidityScore;

  // 3. 价格偏差评分 (0-20分)
  // 偏差适中最好：太小利润低，太大可能是数据错误
  let deviationScore = 0;
  if (type === 'price_sum') {
    // 价格总和套利：2%-8%偏差最理想
    if (deviation >= 0.02 && deviation <= 0.08) {
      deviationScore = 20;
    } else if (deviation > 0.08 && deviation <= 0.15) {
      deviationScore = 15; // 偏差较大
    } else if (deviation > 0.15 && deviation <= 0.25) {
      deviationScore = 8; // 偏差很大，可能有问题
    } else if (deviation > 0.25) {
      deviationScore = 0; // 偏差过大，很可能是数据错误
    } else {
      deviationScore = 10; // 偏差太小，利润有限
    }
  } else {
    // 跨市场套利：10%-25%差异最理想
    if (deviation >= 0.10 && deviation <= 0.25) {
      deviationScore = 20;
    } else if (deviation > 0.25 && deviation <= 0.40) {
      deviationScore = 15;
    } else if (deviation > 0.40) {
      deviationScore = 5;
    } else {
      deviationScore = 10;
    }
  }
  confidence += deviationScore;

  // 4. 价格波动率评分 (0-15分)
  // 波动率低 = 价格稳定 = 套利机会更可靠
  if (marketData?.priceHistory && marketData.priceHistory.length > 1) {
    const prices = marketData.priceHistory.map(p => p.price);
    const volatility = calculateVolatility(prices);

    let volatilityScore = 0;
    if (volatility < 0.05) {
      volatilityScore = 15; // 低波动率，非常稳定
    } else if (volatility < 0.10) {
      volatilityScore = 12; // 中等波动率
    } else if (volatility < 0.20) {
      volatilityScore = 8; // 较高波动率
    } else {
      volatilityScore = 3; // 高波动率，不稳定
    }
    confidence += volatilityScore;
  } else {
    // 没有历史数据，给予中等分数
    confidence += 8;
  }

  // 5. 市场成熟度评分 (0-10分)
  // 市场存在时间越长，数据越可靠
  if (marketData?.createdAt) {
    const createdDate = new Date(marketData.createdAt);
    const now = new Date();
    const daysOld = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

    let maturityScore = 0;
    if (daysOld >= 30) {
      maturityScore = 10; // 超过30天，非常成熟
    } else if (daysOld >= 14) {
      maturityScore = 8; // 超过2周
    } else if (daysOld >= 7) {
      maturityScore = 6; // 超过1周
    } else if (daysOld >= 3) {
      maturityScore = 4; // 超过3天
    } else {
      maturityScore = 2; // 新市场，数据可能不稳定
    }
    confidence += maturityScore;
  } else {
    confidence += 5; // 没有创建时间数据，给予中等分数
  }

  // 6. 时间衰减因素 (0-5分)
  // 距离结束时间越近，风险越高（流动性可能下降）
  if (marketData?.endDate) {
    const endDate = new Date(marketData.endDate);
    const now = new Date();
    const daysUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    let timeScore = 0;
    if (daysUntilEnd > 30) {
      timeScore = 5; // 充足时间
    } else if (daysUntilEnd > 14) {
      timeScore = 4;
    } else if (daysUntilEnd > 7) {
      timeScore = 3;
    } else if (daysUntilEnd > 3) {
      timeScore = 2;
    } else if (daysUntilEnd > 0) {
      timeScore = 1; // 即将结束，风险高
    } else {
      timeScore = 0; // 已结束或即将结束
    }
    confidence += timeScore;
  } else {
    confidence += 3; // 没有结束时间数据
  }

  // 确保置信度在0-100之间
  return Math.max(0, Math.min(100, Math.round(confidence)));
}

/**
 * 计算价格波动率（标准差）
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;

  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const squaredDiffs = prices.map(p => Math.pow(p - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / prices.length;

  return Math.sqrt(variance);
}

/**
 * 检测价格总和套利机会
 * 当所有结果的价格总和不等于1时存在套利机会
 */
export function detectPriceSumArbitrage(): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  const markets = db.prepare(`
    SELECT id, question, active, volume, liquidity, created_at, end_date, updated_at
    FROM markets
    WHERE active = 1
  `).all() as Array<{
    id: string;
    question: string;
    active: number;
    volume: number;
    liquidity: number;
    created_at: string;
    end_date: string | null;
    updated_at: string | null;
  }>;

  for (const market of markets) {
    // Skip markets with stale data
    if (market.updated_at) {
      const age = Date.now() - new Date(market.updated_at).getTime();
      if (age > FRESHNESS_WINDOW_MS) continue;
    }
    // 获取该市场的所有结果及其最新价格
    const outcomes = db.prepare(`
      SELECT o.id, o.name, o.price
      FROM outcomes o
      WHERE o.market_id = ?
    `).all(market.id) as Array<{ id: string; name: string; price: number }>;

    if (outcomes.length < 2) continue;

    // 获取价格历史（最近30条）用于计算波动率
    const priceHistory = db.prepare(`
      SELECT price
      FROM price_history
      WHERE market_id = ?
      ORDER BY timestamp DESC
      LIMIT 30
    `).all(market.id) as Array<{ price: number }>;

    // 计算价格总和
    const priceSum = outcomes.reduce((sum, outcome) => sum + outcome.price, 0);
    const deviation = Math.abs(priceSum - 1.0);

    // 如果偏差超过阈值（例如2%），则存在套利机会
    if (deviation > 0.02) {
      const potentialProfit = deviation * 100; // 转换为百分比
      let riskLevel: 'low' | 'medium' | 'high' = 'low';

      if (deviation > 0.1) {
        riskLevel = 'high';
      } else if (deviation > 0.05) {
        riskLevel = 'medium';
      }

      // 计算置信度（使用优化后的算法）
      const confidence = calculateConfidence(
        market.volume,
        market.liquidity,
        deviation,
        'price_sum',
        {
          createdAt: market.created_at,
          endDate: market.end_date || undefined,
          priceHistory: priceHistory
        }
      );

      opportunities.push({
        id: `arb_${market.id}_${Date.now()}`,
        market_id: market.id,
        detected_at: new Date().toISOString(),
        type: 'price_sum',
        description: `Price sum is ${priceSum.toFixed(4)} (deviation: ${(deviation * 100).toFixed(2)}%)`,
        potential_profit: potentialProfit,
        risk_level: riskLevel,
        confidence: confidence,
        market_question: market.question,
        outcomes: outcomes.map(o => ({ name: o.name, price: o.price }))
      });
    }
  }

  return opportunities;
}


<<<<<<< HEAD
=======
  // 查询所有活跃市场
  const markets = db.prepare(`
    SELECT id, question, category, active, volume, liquidity, created_at, end_date
    FROM markets
    WHERE active = 1
    LIMIT 100
  `).all() as Array<{
    id: string;
    question: string;
    category: string | null;
    active: number;
    volume: number;
    liquidity: number;
    created_at: string;
    end_date: string | null;
  }>;

  // 按类别分组
  const marketsByCategory = new Map<string, typeof markets>();
  for (const market of markets) {
    if (!market.category) continue;
    if (!marketsByCategory.has(market.category)) {
      marketsByCategory.set(market.category, []);
    }
    marketsByCategory.get(market.category)!.push(market);
  }

  // 在同一类别内查找相似市场
  for (const [_category, categoryMarkets] of marketsByCategory) {
    if (categoryMarkets.length < 2) continue;

    for (let i = 0; i < categoryMarkets.length; i++) {
      for (let j = i + 1; j < categoryMarkets.length; j++) {
        const market1 = categoryMarkets[i];
        const market2 = categoryMarkets[j];

        if (!market1 || !market2) continue;

        // 检查问题相似度（简单的关键词匹配）
        const similarity = calculateQuestionSimilarity(market1.question, market2.question);
        if (similarity < 0.3) continue;

        // 获取两个市场的Yes结果价格
        const outcome1 = db.prepare(`
          SELECT price FROM outcomes WHERE market_id = ? AND name = 'Yes'
        `).get(market1.id) as { price: number } | undefined;

        const outcome2 = db.prepare(`
          SELECT price FROM outcomes WHERE market_id = ? AND name = 'Yes'
        `).get(market2.id) as { price: number } | undefined;

        if (!outcome1 || !outcome2) continue;

        // 获取价格历史用于计算波动率
        const priceHistory1 = db.prepare(`
          SELECT price
          FROM price_history
          WHERE market_id = ?
          ORDER BY timestamp DESC
          LIMIT 30
        `).all(market1.id) as Array<{ price: number }>;

        const priceHistory2 = db.prepare(`
          SELECT price
          FROM price_history
          WHERE market_id = ?
          ORDER BY timestamp DESC
          LIMIT 30
        `).all(market2.id) as Array<{ price: number }>;

        // 计算价格差异
        const priceDiff = Math.abs(outcome1.price - outcome2.price);

        // 如果价格差异超过阈值（例如10%），则存在套利机会
        if (priceDiff > 0.1) {
          const potentialProfit = priceDiff * 100;
          let riskLevel: 'low' | 'medium' | 'high' = 'medium';

          if (priceDiff > 0.3) {
            riskLevel = 'high';
          } else if (priceDiff < 0.15) {
            riskLevel = 'low';
          }

          // 计算置信度（使用两个市场的平均值和综合数据）
          const avgVolume = (market1.volume + market2.volume) / 2;
          const avgLiquidity = (market1.liquidity + market2.liquidity) / 2;

          // 合并价格历史
          const combinedPriceHistory = [...priceHistory1, ...priceHistory2];

          // 使用较早的创建时间和较近的结束时间
          const earlierCreatedAt = new Date(market1.created_at) < new Date(market2.created_at)
            ? market1.created_at
            : market2.created_at;

          const closerEndDate = (() => {
            if (!market1.end_date) return market2.end_date;
            if (!market2.end_date) return market1.end_date;
            return new Date(market1.end_date) < new Date(market2.end_date)
              ? market1.end_date
              : market2.end_date;
          })();

          const confidence = calculateConfidence(
            avgVolume,
            avgLiquidity,
            priceDiff,
            'cross_market',
            {
              createdAt: earlierCreatedAt,
              endDate: closerEndDate || undefined,
              priceHistory: combinedPriceHistory
            }
          );

          opportunities.push({
            id: `arb_cross_${market1.id}_${market2.id}_${Date.now()}`,
            market_id: market1.id,
            detected_at: new Date().toISOString(),
            type: 'cross_market',
            description: `Similar markets with ${(priceDiff * 100).toFixed(1)}% price difference`,
            potential_profit: potentialProfit,
            risk_level: riskLevel,
            confidence: confidence,
            market_question: `${market1.question} vs ${market2.question}`,
            outcomes: [
              { name: `Market 1 (Yes)`, price: outcome1.price },
              { name: `Market 2 (Yes)`, price: outcome2.price }
            ]
          });
        }
      }
    }
  }

  return opportunities;
}

/**
 * 计算两个问题的相似度
 */
function calculateQuestionSimilarity(q1: string, q2: string): number {
  const words1 = q1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const words2 = q2.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter(w => set2.has(w)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * 获取所有套利机会
 */
>>>>>>> 635f7db (feat: Add optimized confidence algorithm and manual refresh)
export function getAllArbitrageOpportunities(): ArbitrageOpportunity[] {
  return detectPriceSumArbitrage()
    .sort((a, b) => b.potential_profit - a.potential_profit)
    .slice(0, 20);
}
