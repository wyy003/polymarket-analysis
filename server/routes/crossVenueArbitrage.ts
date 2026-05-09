import express from 'express';
import * as crossVenue from '../services/arbitrage/crossVenue.js';
import * as marketPairs from '../services/marketPairs.js';

const router = express.Router();

/**
 * GET /api/arbitrage/cross-venue
 * Get all current cross-venue arbitrage opportunities
 */
router.get('/arbitrage/cross-venue', async (_req, res) => {
  try {
    const opportunities = await crossVenue.calculateCrossVenueOpportunities();

    // Filter to only tradeable opportunities by default
    const tradeable = opportunities.filter((opp) => opp.tradeable);
    const all = opportunities;

    res.json({
      opportunities: tradeable,
      all_opportunities: all,
      tradeable_count: tradeable.length,
      total_count: all.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error calculating cross-venue opportunities:', error);
    res.status(500).json({
      error: 'Failed to calculate opportunities',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/arbitrage/cross-venue/all
 * Get all opportunities including non-tradeable ones
 */
router.get('/arbitrage/cross-venue/all', async (_req, res) => {
  try {
    const opportunities = await crossVenue.calculateCrossVenueOpportunities();

    res.json({
      opportunities,
      count: opportunities.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error calculating cross-venue opportunities:', error);
    res.status(500).json({
      error: 'Failed to calculate opportunities',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/arbitrage/cross-venue/:pairId
 * Get opportunities for a specific market pair
 */
router.get('/arbitrage/cross-venue/:pairId', async (req, res) => {
  try {
    const { pairId } = req.params;

    if (!pairId) {
      return res.status(400).json({ error: 'Pair ID is required' });
    }

    // Check if pair exists
    const pair = marketPairs.getPairById(pairId);
    if (!pair) {
      return res.status(404).json({ error: 'Market pair not found' });
    }

    // Calculate all opportunities and filter for this pair
    const allOpportunities = await crossVenue.calculateCrossVenueOpportunities();
    const pairOpportunities = allOpportunities.filter(
      (opp) => opp.pair_id === pairId
    );

    res.json({
      pair_id: pairId,
      opportunities: pairOpportunities,
      count: pairOpportunities.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error calculating opportunities for pair:', error);
    res.status(500).json({
      error: 'Failed to calculate opportunities',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/arbitrage/cross-venue/stats
 * Get statistics about cross-venue opportunities
 */
router.get('/arbitrage/cross-venue/stats', async (_req, res) => {
  try {
    const opportunities = await crossVenue.calculateCrossVenueOpportunities();

    const tradeable = opportunities.filter((opp) => opp.tradeable);
    const byRisk = {
      low: opportunities.filter((opp) => opp.risk_level === 'low').length,
      medium: opportunities.filter((opp) => opp.risk_level === 'medium').length,
      high: opportunities.filter((opp) => opp.risk_level === 'high').length,
    };

    const avgNetEdge =
      tradeable.length > 0
        ? tradeable.reduce((sum, opp) => sum + opp.net_edge, 0) / tradeable.length
        : 0;

    const maxNetEdge =
      tradeable.length > 0
        ? Math.max(...tradeable.map((opp) => opp.net_edge))
        : 0;

    res.json({
      total_opportunities: opportunities.length,
      tradeable_opportunities: tradeable.length,
      by_risk: byRisk,
      avg_net_edge: avgNetEdge,
      max_net_edge: maxNetEdge,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error calculating opportunity stats:', error);
    res.status(500).json({
      error: 'Failed to calculate stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
