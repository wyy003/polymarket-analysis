import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { BacktestConfig, BacktestResult } from '../../lib/api';
import { BacktestConfigForm } from './BacktestConfigForm';
import { BacktestResults } from './BacktestResults';

interface BacktestTabProps {
  marketId: string;
  outcomeId: string;
}

export function BacktestTab({ marketId, outcomeId }: BacktestTabProps) {
  const [result, setResult] = useState<BacktestResult | null>(null);

  const backtestMutation = useMutation({
    mutationFn: (config: BacktestConfig) => api.runBacktest(config),
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleRunBacktest = (config: BacktestConfig) => {
    setResult(null);
    backtestMutation.mutate(config);
  };

  return (
    <div className="space-y-6">
      <BacktestConfigForm
        marketId={marketId}
        outcomeId={outcomeId}
        onRun={handleRunBacktest}
        isRunning={backtestMutation.isPending}
      />

      {backtestMutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p className="font-semibold">Backtest Failed</p>
          <p className="text-sm">
            {backtestMutation.error instanceof Error
              ? backtestMutation.error.message
              : 'An error occurred while running the backtest'}
          </p>
        </div>
      )}

      {backtestMutation.isPending && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
          <p className="font-semibold">Running Backtest...</p>
          <p className="text-sm">This may take a few moments.</p>
        </div>
      )}

      {result && <BacktestResults result={result} />}
    </div>
  );
}
