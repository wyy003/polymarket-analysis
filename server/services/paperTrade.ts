import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import {
  PaperTradeLog,
  PaperTradeStats,
  LogFilters,
  PaperTradeOutcome,
  PaperTradeDirection,
  PaperTradeSource,
} from '../types/paperTrade.js';
import { CrossVenueOpportunity } from './arbitrage/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const LOGS_FILE = path.join(DATA_DIR, 'paperTrades.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize logs file if it doesn't exist
if (!fs.existsSync(LOGS_FILE)) {
  fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2));
}

/**
 * Load paper trade logs from file
 */
function loadLogs(): PaperTradeLog[] {
  try {
    const data = fs.readFileSync(LOGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading paper trade logs:', error);
    return [];
  }
}

/**
 * Save paper trade logs to file
 */
function saveLogs(logs: PaperTradeLog[]): void {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error saving paper trade logs:', error);
    throw error;
  }
}

/**
 * Convert CrossVenueOpportunity direction to PaperTradeDirection
 */
function convertDirection(direction: string): PaperTradeDirection {
  if (direction === 'BUY_POLY_YES_BUY_KALSHI_NO') {
    return 'poly_yes_kalshi_no';
  }
  return 'kalshi_yes_poly_no';
}

/**
 * Log a new paper trade opportunity
 */
export function logOpportunity(
  opportunity: CrossVenueOpportunity,
  targetSize: number,
  source: PaperTradeSource,
  notes?: string
): PaperTradeLog {
  const logs = loadLogs();

  // Determine prices based on direction
  let polyPrice: number;
  let kalshiPrice: number;

  if (opportunity.direction === 'BUY_POLY_YES_BUY_KALSHI_NO') {
    polyPrice = opportunity.poly_yes_ask || 0;
    kalshiPrice = opportunity.kalshi_no_ask || 0;
  } else {
    polyPrice = opportunity.poly_no_ask || 0;
    kalshiPrice = opportunity.kalshi_yes_ask || 0;
  }

  const totalCost = polyPrice + kalshiPrice;
  const netProfit = opportunity.net_edge * targetSize;
  const profitPercent = opportunity.net_edge;

  const log: PaperTradeLog = {
    id: randomUUID(),
    timestamp: Date.now(),
    pairId: opportunity.pair_id,
    direction: convertDirection(opportunity.direction),
    polyPrice,
    kalshiPrice,
    totalCost,
    netProfit,
    profitPercent,
    fees: {
      polymarketFee: opportunity.estimated_fees * 0.67, // Approximate split
      kalshiFee: opportunity.estimated_fees * 0.33,
      totalFees: opportunity.estimated_fees,
    },
    targetSize,
    estimatedSlippage: opportunity.estimated_slippage,
    riskLevel: opportunity.risk_level,
    riskFlags: opportunity.risk_flags,
    source,
    notes,
  };

  logs.push(log);
  saveLogs(logs);

  console.log(`[PaperTrade] Logged opportunity: ${log.id} (${log.pairId})`);
  return log;
}

/**
 * Get all paper trade logs with optional filters
 */
export function getAllLogs(filters?: LogFilters): PaperTradeLog[] {
  let logs = loadLogs();

  if (!filters) return logs;

  // Apply filters
  if (filters.startDate) {
    logs = logs.filter((log) => log.timestamp >= filters.startDate!);
  }

  if (filters.endDate) {
    logs = logs.filter((log) => log.timestamp <= filters.endDate!);
  }

  if (filters.riskLevel) {
    logs = logs.filter((log) => log.riskLevel === filters.riskLevel);
  }

  if (filters.pairId) {
    logs = logs.filter((log) => log.pairId === filters.pairId);
  }

  if (filters.source) {
    logs = logs.filter((log) => log.source === filters.source);
  }

  return logs;
}

/**
 * Get a specific log by ID
 */
export function getLogById(id: string): PaperTradeLog | null {
  const logs = loadLogs();
  return logs.find((log) => log.id === id) || null;
}

/**
 * Update outcome for a paper trade log
 */
export function updateOutcome(id: string, outcome: PaperTradeOutcome): boolean {
  const logs = loadLogs();
  const index = logs.findIndex((log) => log.id === id);

  if (index === -1) {
    return false;
  }

  logs[index].outcome = outcome;
  saveLogs(logs);

  console.log(`[PaperTrade] Updated outcome for log: ${id}`);
  return true;
}

/**
 * Get aggregate statistics
 */
export function getStats(): PaperTradeStats {
  const logs = loadLogs();

  const byRisk = {
    low: logs.filter((log) => log.riskLevel === 'low').length,
    medium: logs.filter((log) => log.riskLevel === 'medium').length,
    high: logs.filter((log) => log.riskLevel === 'high').length,
  };

  const bySource = {
    manual: logs.filter((log) => log.source === 'manual').length,
    auto_scan: logs.filter((log) => log.source === 'auto_scan').length,
  };

  const avgNetProfit =
    logs.length > 0
      ? logs.reduce((sum, log) => sum + log.netProfit, 0) / logs.length
      : 0;

  const totalHypotheticalProfit = logs.reduce(
    (sum, log) => sum + log.netProfit,
    0
  );

  const resolvedLogs = logs.filter((log) => log.outcome !== undefined);
  const resolvedCount = resolvedLogs.length;

  const successfulLogs = resolvedLogs.filter(
    (log) => log.outcome!.actualProfit > 0
  );
  const successRate =
    resolvedCount > 0 ? successfulLogs.length / resolvedCount : 0;

  return {
    totalLogs: logs.length,
    byRisk,
    bySource,
    avgNetProfit,
    totalHypotheticalProfit,
    resolvedCount,
    successRate,
  };
}

/**
 * Delete a paper trade log
 */
export function deleteLog(id: string): boolean {
  const logs = loadLogs();
  const filteredLogs = logs.filter((log) => log.id !== id);

  if (filteredLogs.length === logs.length) {
    return false; // Log not found
  }

  saveLogs(filteredLogs);
  console.log(`[PaperTrade] Deleted log: ${id}`);
  return true;
}
