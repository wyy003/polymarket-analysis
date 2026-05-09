import express from 'express';
import * as paperTrade from '../services/paperTrade.js';
import { PaperTradeSource, LogFilters } from '../types/paperTrade.js';

const router = express.Router();

/**
 * POST /api/paper-trade/log
 * Log a new paper trade
 */
router.post('/paper-trade/log', async (req, res) => {
  try {
    const { opportunity, targetSize, source, notes } = req.body;

    if (!opportunity) {
      return res.status(400).json({ error: 'Opportunity is required' });
    }

    if (!targetSize || targetSize <= 0) {
      return res.status(400).json({ error: 'Valid target size is required' });
    }

    const validSources: PaperTradeSource[] = ['manual', 'auto_scan'];
    if (!source || !validSources.includes(source)) {
      return res.status(400).json({ error: 'Valid source is required (manual or auto_scan)' });
    }

    const log = paperTrade.logOpportunity(opportunity, targetSize, source, notes);

    res.json({
      success: true,
      log,
    });
  } catch (error) {
    console.error('Error logging paper trade:', error);
    res.status(500).json({
      error: 'Failed to log paper trade',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/paper-trade/logs
 * Get all paper trade logs with optional filters
 */
router.get('/paper-trade/logs', (req, res) => {
  try {
    const filters: LogFilters = {};

    if (req.query.startDate) {
      filters.startDate = parseInt(req.query.startDate as string);
    }

    if (req.query.endDate) {
      filters.endDate = parseInt(req.query.endDate as string);
    }

    if (req.query.riskLevel) {
      filters.riskLevel = req.query.riskLevel as 'low' | 'medium' | 'high';
    }

    if (req.query.pairId) {
      filters.pairId = req.query.pairId as string;
    }

    if (req.query.source) {
      filters.source = req.query.source as PaperTradeSource;
    }

    const logs = paperTrade.getAllLogs(filters);

    res.json({
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error fetching paper trade logs:', error);
    res.status(500).json({
      error: 'Failed to fetch logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/paper-trade/logs/:id
 * Get a specific paper trade log
 */
router.get('/paper-trade/logs/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Log ID is required' });
    }

    const log = paperTrade.getLogById(id);

    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json({ log });
  } catch (error) {
    console.error('Error fetching paper trade log:', error);
    res.status(500).json({
      error: 'Failed to fetch log',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PATCH /api/paper-trade/logs/:id/outcome
 * Update outcome for a paper trade log
 */
router.patch('/paper-trade/logs/:id/outcome', (req, res) => {
  try {
    const { id } = req.params;
    const { outcome } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Log ID is required' });
    }

    if (!outcome || !outcome.resolvedAt || outcome.actualProfit === undefined) {
      return res.status(400).json({
        error: 'Valid outcome is required (resolvedAt, actualProfit, actualProfitPercent)',
      });
    }

    const success = paperTrade.updateOutcome(id, outcome);

    if (!success) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json({
      success: true,
      message: 'Outcome updated successfully',
    });
  } catch (error) {
    console.error('Error updating outcome:', error);
    res.status(500).json({
      error: 'Failed to update outcome',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/paper-trade/logs/:id
 * Delete a paper trade log
 */
router.delete('/paper-trade/logs/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Log ID is required' });
    }

    const success = paperTrade.deleteLog(id);

    if (!success) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json({
      success: true,
      message: 'Log deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({
      error: 'Failed to delete log',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/paper-trade/stats
 * Get aggregate statistics
 */
router.get('/paper-trade/stats', (req, res) => {
  try {
    const stats = paperTrade.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
