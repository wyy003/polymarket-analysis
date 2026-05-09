import express from 'express';
import * as polymarketOrderbook from '../services/polymarketOrderbook.js';

const router = express.Router();

/**
 * GET /api/polymarket/orderbook/:tokenId
 * Get full orderbook for a token
 */
router.get('/orderbook/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;

    if (!tokenId) {
      return res.status(400).json({ error: 'Token ID is required' });
    }

    const orderbook = await polymarketOrderbook.getOrderbook(tokenId);
    res.json({ orderbook });
  } catch (error) {
    console.error('Error fetching Polymarket orderbook:', error);
    res.status(500).json({
      error: 'Failed to fetch orderbook',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/polymarket/orderbook/:tokenId/best
 * Get best bid/ask only (lighter response)
 */
router.get('/orderbook/:tokenId/best', async (req, res) => {
  try {
    const { tokenId } = req.params;

    if (!tokenId) {
      return res.status(400).json({ error: 'Token ID is required' });
    }

    const bestBidAsk = await polymarketOrderbook.getBestBidAsk(tokenId);
    res.json(bestBidAsk);
  } catch (error) {
    console.error('Error fetching best bid/ask:', error);
    res.status(500).json({
      error: 'Failed to fetch best bid/ask',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/polymarket/orderbooks/batch
 * Get multiple orderbooks at once
 * Body: { tokenIds: string[] }
 */
router.post('/orderbooks/batch', async (req, res) => {
  try {
    const { tokenIds } = req.body;

    if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
      return res.status(400).json({ error: 'tokenIds array is required' });
    }

    if (tokenIds.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 tokens per batch request' });
    }

    const orderbooks = await polymarketOrderbook.getBatchOrderbooks(tokenIds);
    res.json({ orderbooks, count: orderbooks.length });
  } catch (error) {
    console.error('Error fetching batch orderbooks:', error);
    res.status(500).json({
      error: 'Failed to fetch batch orderbooks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
