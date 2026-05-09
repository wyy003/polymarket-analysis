import WebSocket from 'ws';
import { outcomeRepository, priceHistoryRepository } from '../database/repositories';

// WebSocket configuration
const WEBSOCKET_CONFIG = {
  url: 'wss://ws-subscriptions-clob.polymarket.com/ws/market',
  heartbeatInterval: 30000,     // 30 seconds
  maxReconnectAttempts: 10,
  reconnectBackoff: 2,
  maxReconnectDelay: 30000,     // 30 seconds
};

export class PolymarketWebSocketClient {
  private ws: WebSocket | null = null;
  private subscribedMarkets: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = WEBSOCKET_CONFIG.maxReconnectAttempts;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private lastMessageTime: number = 0;
  private priceUpdateCallback: ((marketId: string, prices: any) => void) | null = null;

  /**
   * Connect to Polymarket WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('[WebSocket] Connecting to Polymarket...');
        this.ws = new WebSocket(WEBSOCKET_CONFIG.url);

        this.ws.on('open', () => {
          console.log('[WebSocket] Connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.resubscribeAll();
          this.startHeartbeat();
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        });

        this.ws.on('close', () => {
          console.log('[WebSocket] Connection closed');
          this.isConnected = false;
          this.stopHeartbeat();
          this.reconnect();
        });

        this.ws.on('error', (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        });

        this.ws.on('pong', () => {
          // Heartbeat response received
        });
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Subscribe to a market for real-time updates
   */
  subscribe(marketId: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Not connected, queuing subscription:', marketId);
      this.subscribedMarkets.add(marketId);
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        market: marketId,
      }));

      this.subscribedMarkets.add(marketId);
      console.log(`[WebSocket] Subscribed to market: ${marketId}`);
    } catch (error) {
      console.error(`[WebSocket] Failed to subscribe to ${marketId}:`, error);
    }
  }

  /**
   * Unsubscribe from a market
   */
  unsubscribe(marketId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          type: 'unsubscribe',
          market: marketId,
        }));
        console.log(`[WebSocket] Unsubscribed from market: ${marketId}`);
      } catch (error) {
        console.error(`[WebSocket] Failed to unsubscribe from ${marketId}:`, error);
      }
    }
    this.subscribedMarkets.delete(marketId);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    this.lastMessageTime = Date.now();

    if (message.type === 'price_update' || message.event === 'price_change') {
      // Handle price update
      const marketId = message.market || message.condition_id;
      const prices = message.prices || message.outcome_prices;

      if (marketId && prices) {
        this.updateMarketPrice(marketId, prices);

        // Call callback if registered
        if (this.priceUpdateCallback) {
          this.priceUpdateCallback(marketId, prices);
        }
      }
    }
  }

  /**
   * Update market price in database
   */
  private async updateMarketPrice(marketId: string, prices: any): Promise<void> {
    try {
      // Handle different price formats
      let priceEntries: [string, number][] = [];

      if (Array.isArray(prices)) {
        // Array format: ["0.52", "0.48"]
        priceEntries = prices.map((price, index) => [
          index === 0 ? 'Yes' : 'No',
          parseFloat(price)
        ]);
      } else if (typeof prices === 'object') {
        // Object format: { "Yes": "0.52", "No": "0.48" }
        priceEntries = Object.entries(prices).map(([name, price]) => [
          name,
          parseFloat(price as string)
        ]);
      }

      for (const [outcomeName, price] of priceEntries) {
        if (isNaN(price)) continue;

        const outcomeId = `${marketId}_${outcomeName}`;

        // Update outcome price
        outcomeRepository.upsert({
          id: outcomeId,
          market_id: marketId,
          name: outcomeName,
          price: price,
        });

        // Record price history
        priceHistoryRepository.insert(marketId, outcomeId, price);
      }

      console.log(`[WebSocket] Updated prices for market: ${marketId}`);
    } catch (error) {
      console.error(`[WebSocket] Failed to update prices for ${marketId}:`, error);
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached, giving up');
      return;
    }

    const delay = Math.min(
      1000 * Math.pow(WEBSOCKET_CONFIG.reconnectBackoff, this.reconnectAttempts),
      WEBSOCKET_CONFIG.maxReconnectDelay
    );

    this.reconnectAttempts++;

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('[WebSocket] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Resubscribe to all markets after reconnection
   */
  private resubscribeAll(): void {
    console.log(`[WebSocket] Resubscribing to ${this.subscribedMarkets.size} markets...`);
    for (const marketId of this.subscribedMarkets) {
      this.subscribe(marketId);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, WEBSOCKET_CONFIG.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Register callback for price updates
   */
  onPriceUpdate(callback: (marketId: string, prices: any) => void): void {
    this.priceUpdateCallback = callback;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      subscribedMarkets: this.subscribedMarkets.size,
      lastMessageTime: this.lastMessageTime,
    };
  }

  /**
   * Get subscribed markets
   */
  getSubscribedMarkets(): string[] {
    return Array.from(this.subscribedMarkets);
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

export const wsClient = new PolymarketWebSocketClient();
