import express, { Request, Response } from 'express';
import { runBacktest, BacktestConfig } from '../services/backtest';

const router = express.Router();

// POST /api/backtest - Run backtest
router.post('/backtest', async (req: Request, res: Response) => {
  try {
    const config: BacktestConfig = req.body;

    // Validate config
    if (!config.marketId || !config.outcomeId) {
      return res.status(400).json({ error: 'marketId and outcomeId are required' });
    }

    if (!config.startDate || !config.endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    if (!config.initialCapital || config.initialCapital <= 0) {
      return res.status(400).json({ error: 'initialCapital must be greater than 0' });
    }

    if (!config.strategy || !config.strategy.type) {
      return res.status(400).json({ error: 'strategy type is required' });
    }

    // Run backtest
    const result = await runBacktest(config);

    res.json(result);
  } catch (error) {
    console.error('Backtest error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Backtest failed';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
