import express, { Request, Response } from 'express';
import { priceHistoryRepository, outcomeRepository, marketRepository } from '../database/repositories';
import { calculateVolatility, calculateSpread, calculate24hChange, calculateTechnicalSummary, findSimilarEvents } from '../services/statistics';
import { calculateAllIndicators } from '../services/indicators';

const router = express.Router();

// GET /api/markets/:id/statistics - Get market statistics
router.get('/markets/:id/statistics', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'Invalid Market ID' });
    }

    const outcomeIdParam = req.query.outcomeId as string | undefined;
    if (!outcomeIdParam) {
      return res.status(400).json({ error: 'outcomeId query parameter is required' });
    }

    // Get market info
    const market = marketRepository.findById(id);
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    // Get all outcomes for this market
    const outcomes = outcomeRepository.findByMarketId(id);
    const yesOutcome = outcomes.find(o => o.name === 'Yes');
    const noOutcome = outcomes.find(o => o.name === 'No');

    // Get price history for the specific outcome
    const priceHistory = priceHistoryRepository.findByMarketId(id, 500);
    const outcomePrices = priceHistory
      .filter(p => p.outcome_id === outcomeIdParam)
      .map(p => ({
        timestamp: new Date(p.timestamp).getTime(),
        price: p.price
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    if (outcomePrices.length === 0) {
      return res.json({
        currentPrice: 0,
        change24h: null,
        totalVolume: market.volume,
        volume24h: 0,
        volatility: null,
        spread: null,
        technicalSummary: { rsi: null, maTrend: null },
        similarEvents: [],
      });
    }

    // Calculate statistics
    const currentPrice = outcomePrices[outcomePrices.length - 1]?.price || 0;
    const change24h = calculate24hChange(outcomePrices);
    const volatility = calculateVolatility(outcomePrices, '7d');

    let spread = null;
    if (yesOutcome && noOutcome) {
      spread = calculateSpread(yesOutcome.price, noOutcome.price);
    }

    // Calculate technical indicators for summary
    const indicators = calculateAllIndicators(outcomePrices);
    const latestRSI = indicators.rsi.length > 0 ? indicators.rsi[indicators.rsi.length - 1]?.rsi || null : null;
    const latestMA7 = indicators.ma7.length > 0 ? indicators.ma7[indicators.ma7.length - 1]?.ma || null : null;
    const latestMA20 = indicators.ma20.length > 0 ? indicators.ma20[indicators.ma20.length - 1]?.ma || null : null;

    const technicalSummary = calculateTechnicalSummary(
      latestRSI,
      latestMA7,
      latestMA20,
      currentPrice
    );

    // Find similar events
    const allMarkets = marketRepository.findAll(1000, 0);
    const keywords = market.question.split(' ').filter(w => w.length > 3).slice(0, 5);
    const similarEvents = findSimilarEvents(market.category, keywords, allMarkets);

    // Calculate 24h volume (placeholder - would need timestamp-based filtering)
    const volume24h = market.volume * 0.1; // Rough estimate

    res.json({
      currentPrice,
      change24h,
      totalVolume: market.volume,
      volume24h,
      volatility,
      spread,
      technicalSummary,
      similarEvents,
    });
  } catch (error) {
    console.error('Error calculating statistics:', error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

export default router;
