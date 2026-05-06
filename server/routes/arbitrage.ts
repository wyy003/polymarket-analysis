import { Router } from 'express';
import { getAllArbitrageOpportunities } from '../services/arbitrage';

const router = Router();

/**
 * GET /api/arbitrage
 * 获取所有套利机会
 */
router.get('/arbitrage', (_req, res) => {
  try {
    const opportunities = getAllArbitrageOpportunities();
    res.json(opportunities);
  } catch (error) {
    console.error('Error fetching arbitrage opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch arbitrage opportunities' });
  }
});

export default router;
