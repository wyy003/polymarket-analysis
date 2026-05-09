import type { CrossVenueOpportunity } from '../types/arbitrage';

interface OpportunityCardProps {
  opportunity: CrossVenueOpportunity;
}

const OpportunityCard = ({ opportunity }: OpportunityCardProps) => {
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDirection = (direction: string) => {
    if (direction === 'BUY_POLY_YES_BUY_KALSHI_NO') {
      return 'Buy Polymarket YES + Kalshi NO';
    }
    return 'Buy Kalshi YES + Polymarket NO';
  };

  const formatCents = (value: number) => {
    return `${(value * 100).toFixed(2)}¢`;
  };

  const formatDollar = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Header with Risk Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {opportunity.pair_id.replace(/_/g, ' ').toUpperCase()}
          </h3>
          <p className="text-sm text-gray-600">{formatDirection(opportunity.direction)}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskBadgeColor(
            opportunity.risk_level
          )}`}
        >
          {opportunity.risk_level.toUpperCase()}
        </span>
      </div>

      {/* Net Edge - Most Prominent */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-gray-600 mb-1">Net Edge</div>
        <div className="text-2xl font-bold text-blue-900">
          {formatCents(opportunity.net_edge)} per $1 payout
        </div>
        <div className="text-xs text-gray-500 mt-1">
          ({formatPercent(opportunity.net_edge)} return)
        </div>
      </div>

      {/* Max Size */}
      <div className="mb-4">
        <div className="text-sm text-gray-600">Max Executable Size</div>
        <div className="text-lg font-semibold text-gray-900">
          {opportunity.max_size > 0 ? formatDollar(opportunity.max_size) : 'N/A'}
        </div>
      </div>

      {/* Prices */}
      <div className="mb-4 space-y-2">
        <div className="text-sm font-medium text-gray-700">Prices:</div>
        {opportunity.poly_yes_ask && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Polymarket YES Ask:</span>
            <span className="font-medium">{formatDollar(opportunity.poly_yes_ask)}</span>
          </div>
        )}
        {opportunity.poly_no_ask && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Polymarket NO Ask:</span>
            <span className="font-medium">{formatDollar(opportunity.poly_no_ask)}</span>
          </div>
        )}
        {opportunity.kalshi_yes_ask && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Kalshi YES Ask:</span>
            <span className="font-medium">{formatDollar(opportunity.kalshi_yes_ask)}</span>
          </div>
        )}
        {opportunity.kalshi_no_ask && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Kalshi NO Ask:</span>
            <span className="font-medium">{formatDollar(opportunity.kalshi_no_ask)}</span>
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      <div className="mb-4 space-y-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Gross Edge:</span>
          <span>{formatCents(opportunity.gross_edge)}</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Fees:</span>
          <span>-{formatCents(opportunity.estimated_fees)}</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Slippage:</span>
          <span>-{formatCents(opportunity.estimated_slippage)}</span>
        </div>
      </div>

      {/* Risk Flags */}
      {opportunity.risk_flags.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Risk Flags:</div>
          <div className="flex flex-wrap gap-2">
            {opportunity.risk_flags.map((flag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-300"
              >
                {flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tradeable Status */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              opportunity.tradeable
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {opportunity.tradeable ? 'Tradeable' : 'Not Tradeable'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OpportunityCard;
