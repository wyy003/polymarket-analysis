import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/polymarket.db';
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  // Markets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS markets (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      description TEXT,
      category TEXT,
      end_date TEXT,
      volume REAL DEFAULT 0,
      liquidity REAL DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Outcomes table (Yes/No for each market)
  db.exec(`
    CREATE TABLE IF NOT EXISTS outcomes (
      id TEXT PRIMARY KEY,
      market_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE
    )
  `);

  // Price history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      market_id TEXT NOT NULL,
      outcome_id TEXT NOT NULL,
      price REAL NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE,
      FOREIGN KEY (outcome_id) REFERENCES outcomes(id) ON DELETE CASCADE
    )
  `);

  // Arbitrage opportunities table
  db.exec(`
    CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      market_id_1 TEXT NOT NULL,
      market_id_2 TEXT NOT NULL,
      price_diff REAL NOT NULL,
      detected_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (market_id_1) REFERENCES markets(id) ON DELETE CASCADE,
      FOREIGN KEY (market_id_2) REFERENCES markets(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);
    CREATE INDEX IF NOT EXISTS idx_markets_active ON markets(active);
    CREATE INDEX IF NOT EXISTS idx_markets_updated ON markets(updated_at);
    CREATE INDEX IF NOT EXISTS idx_outcomes_market ON outcomes(market_id);
    CREATE INDEX IF NOT EXISTS idx_price_history_market ON price_history(market_id);
    CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp);
  `);

  console.log('Database initialized successfully');
}

// Initialize on import
initializeDatabase();
