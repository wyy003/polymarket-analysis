import { db } from '../database/schema';

export interface ArbitrageOpportunity {
  id: string;
  market_id: string;
  detected_at: string;
  type: 'price_sum';
  description: string;
  potential_profit: number;
  risk_level: 'low' | 'medium' | 'high';
  market_question?: string;
  outcomes?: Array<{ name: string; price: number }>;
}

// Markets whose prices haven't been refreshed within this window are skipped
// to avoid phantom deviations from stale data.
const FRESHNESS_WINDOW_MS = 30 * 60 * 1000;

/**
 * 检测价格总和套利机会
 * 当所有结果的价格总和不等于1时存在套利机会
 */
export function detectPriceSumArbitrage(): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  const markets = db.prepare(`
    SELECT id, question, active, updated_at
    FROM markets
    WHERE active = 1
  `).all() as Array<{ id: string; question: string; active: number; updated_at: string | null }>;

  for (const market of markets) {
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


export function getAllArbitrageOpportunities(): ArbitrageOpportunity[] {
  return detectPriceSumArbitrage()
    .sort((a, b) => b.potential_profit - a.potential_profit)
    .slice(0, 20);
}
