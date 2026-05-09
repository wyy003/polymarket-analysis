import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import './database/schema';
import marketRoutes from './routes/markets';
import statisticsRoutes from './routes/statistics';
import backtestRoutes from './routes/backtest';
import arbitrageRoutes from './routes/arbitrage';
import hotMarketsRoutes from './routes/hotMarkets';
import realtimeRoutes from './routes/realtime';
import syncStatusRoutes from './routes/sync-status';
import kalshiRoutes from './routes/kalshi';
import crossVenueArbitrageRoutes from './routes/crossVenueArbitrage';
import marketPairsRoutes from './routes/marketPairs';
import polymarketOrderbookRoutes from './routes/polymarketOrderbook';
import { dataSyncService } from './services/dataSync';
import { hotMarketManager } from './services/hotMarketManager';
import { realtimeSyncService } from './services/realtimeSync';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', marketRoutes);
app.use('/api', statisticsRoutes);
app.use('/api', backtestRoutes);
app.use('/api', arbitrageRoutes);
app.use('/api', hotMarketsRoutes);
app.use('/api', realtimeRoutes);
app.use('/api', syncStatusRoutes);
app.use('/api', kalshiRoutes);
app.use('/api', crossVenueArbitrageRoutes);
app.use('/api', marketPairsRoutes);
app.use('/api/polymarket', polymarketOrderbookRoutes);

// Manual sync endpoint
app.post('/api/sync', async (_req, res) => {
  try {
    const result = await dataSyncService.syncMarkets();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ success: false, error: 'Sync failed' });
  }
});

// Schedule automatic sync every 30 seconds (parallel)
cron.schedule('*/30 * * * * *', async () => {
  console.log('[Cron] Running scheduled parallel market sync...');
  try {
    await dataSyncService.syncMarketsParallel();
  } catch (error) {
    console.error('[Cron] Sync failed:', error);
  }
});

// Schedule hot markets refresh every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('[Cron] Refreshing hot markets list...');
  try {
    await hotMarketManager.updateHotMarkets();
  } catch (error) {
    console.error('[Cron] Hot markets refresh failed:', error);
  }
});

// Initial sync on startup
(async () => {
  console.log('[Startup] Running initial market sync...');
  try {
    await dataSyncService.syncMarkets();

    // Initialize hot markets list
    console.log('[Startup] Initializing hot markets...');
    await hotMarketManager.updateHotMarkets();

    // Start real-time sync service (WebSocket)
    console.log('[Startup] Starting real-time sync service...');
    await realtimeSyncService.start();
  } catch (error) {
    console.error('[Startup] Initial sync failed:', error);
  }
})();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
