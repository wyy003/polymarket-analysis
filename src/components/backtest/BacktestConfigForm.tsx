import { useState } from 'react';

export type StrategyType = 'ma_crossover' | 'rsi_threshold' | 'bollinger_bands';

export interface BacktestConfig {
  marketId: string;
  outcomeId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  strategy: {
    type: StrategyType;
    params: {
      fastPeriod?: number;
      slowPeriod?: number;
      oversoldThreshold?: number;
      overboughtThreshold?: number;
      period?: number;
      stdDev?: number;
    };
  };
}

interface BacktestConfigFormProps {
  marketId: string;
  outcomeId: string;
  onRun: (config: BacktestConfig) => void;
  isRunning: boolean;
}

export function BacktestConfigForm({ marketId, outcomeId, onRun, isRunning }: BacktestConfigFormProps) {
  const [strategyType, setStrategyType] = useState<StrategyType>('ma_crossover');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0] || '';
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0] || '';
  });

  // MA Crossover params
  const [fastPeriod, setFastPeriod] = useState(7);
  const [slowPeriod, setSlowPeriod] = useState(20);

  // RSI params
  const [oversoldThreshold, setOversoldThreshold] = useState(30);
  const [overboughtThreshold, setOverboughtThreshold] = useState(70);

  // Bollinger Bands params
  const [bbPeriod, setBbPeriod] = useState(20);
  const [bbStdDev, setBbStdDev] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const config: BacktestConfig = {
      marketId,
      outcomeId,
      startDate,
      endDate,
      initialCapital,
      strategy: {
        type: strategyType,
        params: {}
      }
    };

    if (strategyType === 'ma_crossover') {
      config.strategy.params = { fastPeriod, slowPeriod };
    } else if (strategyType === 'rsi_threshold') {
      config.strategy.params = { oversoldThreshold, overboughtThreshold };
    } else if (strategyType === 'bollinger_bands') {
      config.strategy.params = { period: bbPeriod, stdDev: bbStdDev };
    }

    onRun(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <div>
        <h3 className="text-lg font-semibold mb-4">Backtest Configuration</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Initial Capital ($)
        </label>
        <input
          type="number"
          value={initialCapital}
          onChange={(e) => setInitialCapital(Number(e.target.value))}
          min="100"
          step="100"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Strategy
        </label>
        <select
          value={strategyType}
          onChange={(e) => setStrategyType(e.target.value as StrategyType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="ma_crossover">MA Crossover</option>
          <option value="rsi_threshold">RSI Threshold</option>
          <option value="bollinger_bands">Bollinger Bands</option>
        </select>
      </div>

      {strategyType === 'ma_crossover' && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fast Period
            </label>
            <input
              type="number"
              value={fastPeriod}
              onChange={(e) => setFastPeriod(Number(e.target.value))}
              min="2"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slow Period
            </label>
            <input
              type="number"
              value={slowPeriod}
              onChange={(e) => setSlowPeriod(Number(e.target.value))}
              min="2"
              max="200"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}

      {strategyType === 'rsi_threshold' && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Oversold Threshold
            </label>
            <input
              type="number"
              value={oversoldThreshold}
              onChange={(e) => setOversoldThreshold(Number(e.target.value))}
              min="0"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overbought Threshold
            </label>
            <input
              type="number"
              value={overboughtThreshold}
              onChange={(e) => setOverboughtThreshold(Number(e.target.value))}
              min="50"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}

      {strategyType === 'bollinger_bands' && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period
            </label>
            <input
              type="number"
              value={bbPeriod}
              onChange={(e) => setBbPeriod(Number(e.target.value))}
              min="2"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Std Dev Multiplier
            </label>
            <input
              type="number"
              value={bbStdDev}
              onChange={(e) => setBbStdDev(Number(e.target.value))}
              min="0.5"
              max="5"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isRunning}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isRunning ? 'Running Backtest...' : 'Run Backtest'}
      </button>
    </form>
  );
}
