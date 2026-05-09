import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export function ArbitrageOpportunities() {
  const { data: opportunities, isLoading, error } = useQuery({
    queryKey: ['arbitrage'],
    queryFn: () => api.getArbitrageOpportunities(),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Scanning for arbitrage opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load arbitrage opportunities</p>
      </div>
    );
  }

  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Price-Sum Imbalances Detected</h3>
        <p className="mt-1 text-sm text-gray-500">
          No markets with outcome price sums deviating from 1.00 found right now.
        </p>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    if (type === 'price_sum') return 'Price Sum';
    return type;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) {
      return 'text-green-600';
    } else if (confidence >= 50) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 70) {
      return '高';
    } else if (confidence >= 50) {
      return '中';
    } else {
      return '低';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Arbitrage Opportunities ({opportunities.length})
        </h2>
        <div className="text-sm text-gray-500">
          Auto-refreshing every minute
        </div>
      </div>

      <div className="grid gap-4">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getRiskColor(opp.risk_level)}`}>
                    {opp.risk_level.toUpperCase()} RISK
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                    {getTypeLabel(opp.type)}
                  </span>
                </div>

                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {opp.market_question}
                </h3>

                <p className="text-sm text-gray-600 mb-3">
                  {opp.description}
                </p>

                {opp.outcomes && opp.outcomes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {opp.outcomes.map((outcome, idx) => (
                      <div key={idx} className="text-xs bg-gray-50 px-2 py-1 rounded">
                        <span className="text-gray-600">{outcome.name}:</span>{' '}
                        <span className="font-semibold text-gray-900">
                          {(outcome.price * 100).toFixed(1)}¢
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    Detected: {new Date(opp.detected_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="ml-4 text-right">
                <div className="text-xs text-gray-500 mb-1">Potential Profit</div>
                <div className="text-2xl font-bold text-green-600">
                  {opp.potential_profit.toFixed(2)}%
                </div>
                <div className="mt-2 flex items-center justify-end gap-1">
                  <span className="text-xs text-gray-500">置信度:</span>
                  <span className={`text-sm font-semibold ${getConfidenceColor(opp.confidence)}`}>
                    {opp.confidence}分
                  </span>
                  <span className={`text-xs ${getConfidenceColor(opp.confidence)}`}>
                    ({getConfidenceLabel(opp.confidence)})
                  </span>
                </div>
                <Link
                  to={`/market/${opp.market_id}`}
                  className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800"
                >
                  View Market →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
