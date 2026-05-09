import express from 'express';
import { realtimeSyncService } from '../services/realtimeSync';
import { hotMarketRepository, marketRepository } from '../database/repositories';
import { getConnectedClientsCount } from './realtime';

const router = express.Router();

/**
 * GET /api/sync-status
 * Get current sync status and statistics
 */
router.get('/sync-status', (_req, res) => {
  try {
    const realtimeStatus = realtimeSyncService.getStatus();
    const hotMarketsCount = hotMarketRepository.count();
    const totalMarketsCount = marketRepository.findAll(10000, 0).length;

    res.json({
      websocket: {
        connected: realtimeStatus.websocket.connected,
        subscribedMarkets: realtimeStatus.websocket.subscribedMarkets,
        lastMessage: realtimeStatus.websocket.lastMessageTime,
      },
      hotMarkets: {
        count: hotMarketsCount,
        updateMethod: 'websocket',
      },
      polling: {
        totalMarkets: totalMarketsCount,
        nonHotMarkets: totalMarketsCount - hotMarketsCount,
        updateInterval: '30 seconds',
        concurrency: 5,
      },
      sse: {
        connectedClients: getConnectedClientsCount(),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

export default router;
