import express from 'express';
import * as manifoldService from '../services/manifold';

const router = express.Router();

/**
 * GET /api/manifold/markets/:marketId
 * Get single market details
 */
router.get('/manifold/markets/:marketId', async (req, res) => {
  try {
    const { marketId } = req.params;

    const market = await manifoldService.getMarket(marketId);

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    res.json({ market });
  } catch (error) {
    console.error(`Error in GET /api/manifold/markets/${req.params.marketId}:`, error);
    res.status(500).json({ error: 'Failed to fetch Manifold market' });
  }
});

/**
 * GET /api/manifold/markets/:marketId/answers/:answerId
 * Get probability for a specific answer
 */
router.get('/manifold/markets/:marketId/answers/:answerId', async (req, res) => {
  try {
    const { marketId, answerId } = req.params;

    const probability = await manifoldService.getAnswerProbability(marketId, answerId);

    if (probability === null) {
      return res.status(404).json({ error: 'Answer not found or market is not multi-choice' });
    }

    res.json({ marketId, answerId, probability });
  } catch (error) {
    console.error(`Error in GET /api/manifold/markets/${req.params.marketId}/answers/${req.params.answerId}:`, error);
    res.status(500).json({ error: 'Failed to fetch Manifold answer probability' });
  }
});

/**
 * GET /api/manifold/search
 * Search markets by term
 */
router.get('/manifold/search', async (req, res) => {
  try {
    const term = req.query.term as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const markets = await manifoldService.searchMarkets(term, limit);

    res.json({ markets, count: markets.length });
  } catch (error) {
    console.error('Error in GET /api/manifold/search:', error);
    res.status(500).json({ error: 'Failed to search Manifold markets' });
  }
});

export default router;
