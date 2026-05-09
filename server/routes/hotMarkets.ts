import express from 'express';
import { hotMarketManager } from '../services/hotMarketManager';
import { hotMarketRepository } from '../database/repositories';

const router = express.Router();

/**
 * GET /api/hot-markets
 * Get list of hot markets
 */
router.get('/hot-markets', (_req, res) => {
  try {
    const hotMarkets = hotMarketManager.getHotMarkets();
    res.json({
      hotMarkets,
      count: hotMarkets.length,
      config: hotMarketManager.getConfig(),
    });
  } catch (error) {
    console.error('Error fetching hot markets:', error);
    res.status(500).json({ error: 'Failed to fetch hot markets' });
  }
});

/**
 * POST /api/hot-markets/refresh
 * Manually refresh hot markets list
 */
router.post('/hot-markets/refresh', async (_req, res) => {
  try {
    const result = await hotMarketManager.updateHotMarkets();
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error refreshing hot markets:', error);
    res.status(500).json({ error: 'Failed to refresh hot markets' });
  }
});

/**
 * POST /api/hot-markets/:id
 * Manually add a market to hot markets
 */
router.post('/hot-markets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    hotMarketManager.addHotMarket(id, priority || 1);

    res.json({
      success: true,
      marketId: id,
    });
  } catch (error) {
    console.error('Error adding hot market:', error);
    res.status(500).json({ error: 'Failed to add hot market' });
  }
});

/**
 * DELETE /api/hot-markets/:id
 * Remove a market from hot markets
 */
router.delete('/hot-markets/:id', (req, res) => {
  try {
    const { id } = req.params;

    hotMarketManager.removeHotMarket(id);

    res.json({
      success: true,
      marketId: id,
    });
  } catch (error) {
    console.error('Error removing hot market:', error);
    res.status(500).json({ error: 'Failed to remove hot market' });
  }
});

export default router;
