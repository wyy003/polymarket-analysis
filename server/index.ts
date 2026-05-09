import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import './database/schema';
import marketRoutes from './routes/markets';
import statisticsRoutes from './routes/statistics';
import backtestRoutes from './routes/backtest';
import arbitrageRoutes from './routes/arbitrage';
import { dataSyncService } from './services/dataSync';

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

// Schedule automatic sync every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  console.log('[Cron] Running scheduled market sync...');
  try {
    await dataSyncService.syncMarkets();
  } catch (error) {
    console.error('[Cron] Sync failed:', error);
  }
});

// Initial sync on startup
(async () => {
  console.log('[Startup] Running initial market sync...');
  try {
    await dataSyncService.syncMarkets();
  } catch (error) {
    console.error('[Startup] Initial sync failed:', error);
  }
})();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
