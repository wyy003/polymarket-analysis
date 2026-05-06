import express, { Request, Response } from 'express';
import { marketRepository, outcomeRepository, priceHistoryRepository } from '../database/repositories';

const router = express.Router();

// GET /api/markets - List all markets
router.get('/markets', (req: Request, res: Response) => {
  try {
    const limitParam = req.query.limit as string | undefined;
    const offsetParam = req.query.offset as string | undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const markets = marketRepository.findAll(limit, offset);
    res.json({ data: markets, count: markets.length });
  } catch (error) {
    console.error('Error fetching markets:', error);
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
});

// GET /api/markets/:id - Get market details
router.get('/markets/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'Invalid Market ID' });
    }

    const market = marketRepository.findById(id);

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    const outcomes = outcomeRepository.findByMarketId(id);
    const limitParam = req.query.limit as string | undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : 100;
    const priceHistory = priceHistoryRepository.findByMarketId(id, limit);

    res.json({
      market,
      outcomes,
      priceHistory,
    });
  } catch (error) {
    console.error('Error fetching market details:', error);
    res.status(500).json({ error: 'Failed to fetch market details' });
  }
});

// GET /api/markets/:id/price-history - Get price history for a market
router.get('/markets/:id/price-history', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'Invalid Market ID' });
    }

    const limitParam = req.query.limit as string | undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    const priceHistory = priceHistoryRepository.findByMarketId(id, limit);
    res.json({ data: priceHistory });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

export default router;
