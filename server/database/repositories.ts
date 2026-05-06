import { db } from '../database/schema';

export interface Market {
  id: string;
  question: string;
  description: string | null;
  category: string | null;
  end_date: string | null;
  volume: number;
  liquidity: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface Outcome {
  id: string;
  market_id: string;
  name: string;
  price: number;
}

export interface PriceHistory {
  id: number;
  market_id: string;
  outcome_id: string;
  price: number;
  timestamp: string;
}

export const marketRepository = {
  findAll: (limit = 50, offset = 0) => {
    return db
      .prepare('SELECT * FROM markets WHERE active = 1 ORDER BY updated_at DESC LIMIT ? OFFSET ?')
      .all(limit, offset) as Market[];
  },

  findById: (id: string) => {
    return db.prepare('SELECT * FROM markets WHERE id = ?').get(id) as Market | undefined;
  },

  upsert: (market: Omit<Market, 'created_at' | 'updated_at'>) => {
    const stmt = db.prepare(`
      INSERT INTO markets (id, question, description, category, end_date, volume, liquidity, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        question = excluded.question,
        description = excluded.description,
        category = excluded.category,
        end_date = excluded.end_date,
        volume = excluded.volume,
        liquidity = excluded.liquidity,
        active = excluded.active,
        updated_at = CURRENT_TIMESTAMP
    `);

    return stmt.run(
      market.id,
      market.question,
      market.description,
      market.category,
      market.end_date,
      market.volume,
      market.liquidity,
      market.active
    );
  },
};

export const outcomeRepository = {
  findByMarketId: (marketId: string) => {
    return db
      .prepare('SELECT * FROM outcomes WHERE market_id = ?')
      .all(marketId) as Outcome[];
  },

  upsert: (outcome: Outcome) => {
    const stmt = db.prepare(`
      INSERT INTO outcomes (id, market_id, name, price)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        price = excluded.price
    `);

    return stmt.run(outcome.id, outcome.market_id, outcome.name, outcome.price);
  },
};

export const priceHistoryRepository = {
  findByMarketId: (marketId: string, limit = 100) => {
    return db
      .prepare('SELECT * FROM price_history WHERE market_id = ? ORDER BY timestamp DESC LIMIT ?')
      .all(marketId, limit) as PriceHistory[];
  },

  insert: (marketId: string, outcomeId: string, price: number) => {
    const stmt = db.prepare(`
      INSERT INTO price_history (market_id, outcome_id, price)
      VALUES (?, ?, ?)
    `);

    return stmt.run(marketId, outcomeId, price);
  },
};
