import { Router } from 'express';
import { getAllArbitrageOpportunities } from '../services/arbitrage';
import { arbitrageCache } from '../services/arbitrage/cache.js';
import { crossVenueRealtimeService } from '../services/crossVenueRealtime.js';

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

/**
 * GET /api/arbitrage/cross-venue
 * 获取跨平台套利机会（从缓存）
 */
router.get('/arbitrage/cross-venue', (_req, res) => {
  try {
    const opportunities = arbitrageCache.getOpportunities();
    const lastUpdate = arbitrageCache.getLastUpdate();
    const isStale = arbitrageCache.isStale();

    res.json({
      opportunities,
      lastUpdate,
      isStale,
      count: opportunities.length,
      tradeable: opportunities.filter(opp => opp.tradeable).length
    });
  } catch (error) {
    console.error('Error fetching cross-venue opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch cross-venue opportunities' });
  }
});

/**
 * POST /api/arbitrage/cross-venue/refresh
 * 强制刷新跨平台套利机会
 */
router.post('/arbitrage/cross-venue/refresh', async (_req, res) => {
  try {
    await crossVenueRealtimeService.forceUpdate();
    const opportunities = arbitrageCache.getOpportunities();
    const lastUpdate = arbitrageCache.getLastUpdate();

    res.json({
      success: true,
      opportunities,
      lastUpdate,
      count: opportunities.length,
      tradeable: opportunities.filter(opp => opp.tradeable).length
    });
  } catch (error) {
    console.error('Error refreshing cross-venue opportunities:', error);
    res.status(500).json({ error: 'Failed to refresh cross-venue opportunities' });
  }
});

export default router;
