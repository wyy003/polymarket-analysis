import express, { Response } from 'express';
import { wsClient } from '../services/websocketClient';

const router = express.Router();

// Store connected SSE clients
const clients: Set<Response> = new Set();

/**
 * GET /api/realtime/stream
 * Server-Sent Events endpoint for real-time price updates
 */
router.get('/realtime/stream', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Add client to set
  clients.add(res);
  console.log(`[SSE] Client connected. Total clients: ${clients.size}`);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  // Remove client on disconnect
  req.on('close', () => {
    clients.delete(res);
    console.log(`[SSE] Client disconnected. Total clients: ${clients.size}`);
  });
});

/**
 * Broadcast price update to all connected clients
 */
export function broadcastPriceUpdate(marketId: string, prices: any): void {
  if (clients.size === 0) {
    return; // No clients connected, skip broadcast
  }

  const data = JSON.stringify({
    type: 'price_update',
    marketId,
    prices,
    timestamp: Date.now(),
  });

  // Send to all connected clients
  for (const client of clients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error('[SSE] Failed to send to client:', error);
      clients.delete(client);
    }
  }
}

/**
 * Get number of connected clients
 */
export function getConnectedClientsCount(): number {
  return clients.size;
}

// Register price update callback with WebSocket client
wsClient.onPriceUpdate((marketId, prices) => {
  broadcastPriceUpdate(marketId, prices);
});

export default router;
