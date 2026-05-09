import express from 'express';
import * as marketPairs from '../services/marketPairs.js';

const router = express.Router();

/**
 * GET /api/market-pairs
 * Get all confirmed market pairs
 */
router.get('/market-pairs', (_req, res) => {
  try {
    const pairs = marketPairs.getAllPairs();
    res.json({
      pairs,
      count: pairs.length,
      message: pairs.length === 0 ? 'No confirmed market pairs yet' : undefined,
    });
  } catch (error) {
    console.error('Error fetching market pairs:', error);
    res.status(500).json({
      error: 'Failed to fetch market pairs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/market-pairs/stats
 * Get market pairs statistics
 */
router.get('/market-pairs/stats', (_req, res) => {
  try {
    const pairsByRisk = marketPairs.getPairsByRisk();
    const total = marketPairs.getPairCount();

    res.json({
      total,
      by_risk: {
        low: pairsByRisk.low.length,
        medium: pairsByRisk.medium.length,
        high: pairsByRisk.high.length,
      },
    });
  } catch (error) {
    console.error('Error fetching market pairs stats:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/market-pairs/:pairId
 * Get a specific market pair by ID
 */
router.get('/market-pairs/:pairId', (req, res) => {
  try {
    const { pairId } = req.params;

    if (!pairId) {
      return res.status(400).json({ error: 'Pair ID is required' });
    }

    const pair = marketPairs.getPairById(pairId);

    if (!pair) {
      return res.status(404).json({ error: 'Market pair not found' });
    }

    res.json({ pair });
  } catch (error) {
    console.error('Error fetching market pair:', error);
    res.status(500).json({
      error: 'Failed to fetch market pair',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/market-pairs/polymarket/:marketId
 * Find market pairs by Polymarket market ID
 */
router.get('/market-pairs/polymarket/:marketId', (req, res) => {
  try {
    const { marketId } = req.params;

    if (!marketId) {
      return res.status(400).json({ error: 'Market ID is required' });
    }

    const pairs = marketPairs.getPairsByPolymarketId(marketId);

    res.json({
      pairs,
      count: pairs.length,
    });
  } catch (error) {
    console.error('Error fetching pairs by Polymarket ID:', error);
    res.status(500).json({
      error: 'Failed to fetch pairs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/market-pairs/kalshi/:ticker
 * Find market pairs by Kalshi ticker
 */
router.get('/market-pairs/kalshi/:ticker', (req, res) => {
  try {
    const { ticker } = req.params;

    if (!ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }

    const pairs = marketPairs.getPairsByKalshiTicker(ticker);

    res.json({
      pairs,
      count: pairs.length,
    });
  } catch (error) {
    console.error('Error fetching pairs by Kalshi ticker:', error);
    res.status(500).json({
      error: 'Failed to fetch pairs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
