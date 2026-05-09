import express from 'express';
import * as kalshiService from '../services/kalshi';

const router = express.Router();

/**
 * GET /api/kalshi/markets
 * List all active Kalshi markets
 */
router.get('/kalshi/markets', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const cursor = req.query.cursor as string | undefined;

    const result = await kalshiService.getMarkets(limit, cursor);

    res.json({
      markets: result.markets,
      cursor: result.cursor,
      count: result.markets.length,
    });
  } catch (error) {
    console.error('Error in GET /api/kalshi/markets:', error);
    res.status(500).json({ error: 'Failed to fetch Kalshi markets' });
  }
});

/**
 * GET /api/kalshi/markets/:ticker
 * Get single market details
 */
router.get('/kalshi/markets/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;

    const market = await kalshiService.getMarket(ticker);

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    res.json({ market });
  } catch (error) {
    console.error(`Error in GET /api/kalshi/markets/${req.params.ticker}:`, error);
    res.status(500).json({ error: 'Failed to fetch Kalshi market' });
  }
});

/**
 * GET /api/kalshi/markets/:ticker/orderbook
 * Get orderbook with implied asks calculated
 */
router.get('/kalshi/markets/:ticker/orderbook', async (req, res) => {
  try {
    const { ticker } = req.params;

    const orderbook = await kalshiService.getOrderbook(ticker);

    res.json({ orderbook });
  } catch (error) {
    console.error(`Error in GET /api/kalshi/markets/${req.params.ticker}/orderbook:`, error);
    res.status(500).json({ error: 'Failed to fetch Kalshi orderbook' });
  }
});

export default router;
