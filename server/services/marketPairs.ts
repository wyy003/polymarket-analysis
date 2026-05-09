import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAIRS_FILE = path.join(__dirname, '../config/marketPairs.json');

export type MarketPairMapping = 'POLY_YES_EQUALS_KALSHI_YES' | 'POLY_YES_EQUALS_KALSHI_NO';
export type ResolutionRisk = 'low' | 'medium' | 'high';

export interface MarketPair {
  pair_id: string;
  polymarket_market_id: string;
  polymarket_yes_token_id: string;
  polymarket_no_token_id: string;
  kalshi_ticker: string;
  mapping: MarketPairMapping;
  resolution_risk: ResolutionRisk;
  notes: string;
  created_at: string;
  verified_by: string;
}

/**
 * Load market pairs from JSON file
 */
function loadPairs(): MarketPair[] {
  try {
    if (!fs.existsSync(PAIRS_FILE)) {
      console.warn(`Market pairs file not found: ${PAIRS_FILE}`);
      return [];
    }

    const data = fs.readFileSync(PAIRS_FILE, 'utf-8');
    const pairs = JSON.parse(data);

    if (!Array.isArray(pairs)) {
      console.error('Market pairs file does not contain an array');
      return [];
    }

    return pairs;
  } catch (error) {
    console.error('Error loading market pairs:', error);
    return [];
  }
}

/**
 * Validate market pair structure
 */
export function validatePair(pair: any): pair is MarketPair {
  if (!pair || typeof pair !== 'object') return false;

  const requiredFields = [
    'pair_id',
    'polymarket_market_id',
    'polymarket_yes_token_id',
    'polymarket_no_token_id',
    'kalshi_ticker',
    'mapping',
    'resolution_risk',
    'notes',
    'created_at',
    'verified_by',
  ];

  for (const field of requiredFields) {
    if (!(field in pair) || typeof pair[field] !== 'string') {
      return false;
    }
  }

  // Validate mapping enum
  if (
    pair.mapping !== 'POLY_YES_EQUALS_KALSHI_YES' &&
    pair.mapping !== 'POLY_YES_EQUALS_KALSHI_NO'
  ) {
    return false;
  }

  // Validate resolution_risk enum
  if (
    pair.resolution_risk !== 'low' &&
    pair.resolution_risk !== 'medium' &&
    pair.resolution_risk !== 'high'
  ) {
    return false;
  }

  return true;
}

/**
 * Get all confirmed market pairs
 */
export function getAllPairs(): MarketPair[] {
  const pairs = loadPairs();
  return pairs.filter(validatePair);
}

/**
 * Get a specific pair by ID
 */
export function getPairById(pairId: string): MarketPair | null {
  const pairs = getAllPairs();
  return pairs.find((pair) => pair.pair_id === pairId) || null;
}

/**
 * Find pairs by Polymarket market ID
 */
export function getPairsByPolymarketId(marketId: string): MarketPair[] {
  const pairs = getAllPairs();
  return pairs.filter((pair) => pair.polymarket_market_id === marketId);
}

/**
 * Find pairs by Kalshi ticker
 */
export function getPairsByKalshiTicker(ticker: string): MarketPair[] {
  const pairs = getAllPairs();
  return pairs.filter((pair) => pair.kalshi_ticker === ticker);
}

/**
 * Get count of confirmed pairs
 */
export function getPairCount(): number {
  return getAllPairs().length;
}

/**
 * Get pairs grouped by resolution risk
 */
export function getPairsByRisk(): Record<ResolutionRisk, MarketPair[]> {
  const pairs = getAllPairs();
  return {
    low: pairs.filter((p) => p.resolution_risk === 'low'),
    medium: pairs.filter((p) => p.resolution_risk === 'medium'),
    high: pairs.filter((p) => p.resolution_risk === 'high'),
  };
}
