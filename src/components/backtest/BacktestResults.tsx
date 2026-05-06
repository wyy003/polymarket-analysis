import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface Trade {
  timestamp: number;
  type: 'buy' | 'sell';
  price: number;
  shares: number;
  capital: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercentage: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  finalCapital: number;
}

export interface BacktestResult {
  trades: Trade[];
  equityCurve: Array<{ timestamp: number; equity: number }>;
  performance: PerformanceMetrics;
}

interface BacktestResultsProps {
  result: BacktestResult;
}

export function BacktestResults({ result }: BacktestResultsProps) {
  const { trades, equityCurve, performance } = result;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Total Return</div>
            <div className={`text-2xl font-bold ${performance.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(performance.totalReturn)}
            </div>
            <div className={`text-sm ${performance.totalReturnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(performance.totalReturnPercentage)}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Final Capital</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(performance.finalCapital)}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Win Rate</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPercentage(performance.winRate)}
            </div>
            <div className="text-sm text-gray-600">
              {performance.winningTrades}W / {performance.losingTrades}L
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Total Trades</div>
            <div className="text-2xl font-bold text-gray-900">
              {performance.totalTrades}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Max Drawdown</div>
            <div className="text-2xl font-bold text-red-600">
              {formatPercentage(performance.maxDrawdown)}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Sharpe Ratio</div>
            <div className="text-2xl font-bold text-gray-900">
              {performance.sharpeRatio.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatDate}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                formatter={(value: any) => formatCurrency(value as number)}
                labelFormatter={(label: any) => formatDate(label as number)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                name="Portfolio Value"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Trade History</h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Shares</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Capital</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trades.map((trade, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDateTime(trade.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        trade.type === 'buy'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {formatCurrency(trade.price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {trade.shares.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {formatCurrency(trade.capital)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
