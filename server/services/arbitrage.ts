// 套利机会识别服务

import { db } from '../database/schema';

export interface ArbitrageOpportunity {
  id: string;
  market_id: string;
  detected_at: string;
  type: 'price_sum' | 'cross_market';
  description: string;
  potential_profit: number;
  risk_level: 'low' | 'medium' | 'high';
  market_question?: string;
  outcomes?: Array<{ name: string; price: number }>;
}

/**
 * 检测价格总和套利机会
 * 当所有结果的价格总和不等于1时存在套利机会
 */
export function detectPriceSumArbitrage(): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  // 查询所有活跃市场
  const markets = db.prepare(`
    SELECT id, question, active
    FROM markets
    WHERE active = 1
  `).all() as Array<{ id: string; question: string; active: number }>;

  for (const market of markets) {
    // 获取该市场的所有结果及其最新价格
    const outcomes = db.prepare(`
      SELECT o.id, o.name, o.price
      FROM outcomes o
      WHERE o.market_id = ?
    `).all(market.id) as Array<{ id: string; name: string; price: number }>;

    if (outcomes.length < 2) continue;

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

      opportunities.push({
        id: `arb_${market.id}_${Date.now()}`,
        market_id: market.id,
        detected_at: new Date().toISOString(),
        type: 'price_sum',
        description: `Price sum is ${priceSum.toFixed(4)} (deviation: ${(deviation * 100).toFixed(2)}%)`,
        potential_profit: potentialProfit,
        risk_level: riskLevel,
        market_question: market.question,
        outcomes: outcomes.map(o => ({ name: o.name, price: o.price }))
      });
    }
  }

  return opportunities;
}

/**
 * 检测跨市场套利机会
 * 查找相关市场之间的价格差异
 */
export function detectCrossMarketArbitrage(): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  // 查询所有活跃市场
  const markets = db.prepare(`
    SELECT id, question, category, active
    FROM markets
    WHERE active = 1
    LIMIT 100
  `).all() as Array<{ id: string; question: string; category: string | null; active: number }>;

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

          opportunities.push({
            id: `arb_cross_${market1.id}_${market2.id}_${Date.now()}`,
            market_id: market1.id,
            detected_at: new Date().toISOString(),
            type: 'cross_market',
            description: `Similar markets with ${(priceDiff * 100).toFixed(1)}% price difference`,
            potential_profit: potentialProfit,
            risk_level: riskLevel,
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
export function getAllArbitrageOpportunities(): ArbitrageOpportunity[] {
  const priceSumOpportunities = detectPriceSumArbitrage();
  const crossMarketOpportunities = detectCrossMarketArbitrage();

  return [...priceSumOpportunities, ...crossMarketOpportunities]
    .sort((a, b) => b.potential_profit - a.potential_profit)
    .slice(0, 20); // 返回前20个最佳机会
}
