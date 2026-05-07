import { Link } from 'react-router-dom';
import { memo } from 'react';
import type { Market, Outcome } from '../lib/api';

interface MarketCardProps {
  market: Market;
  outcomes: Outcome[];
}

function MarketCard({ market, outcomes }: MarketCardProps) {
  const yesOutcome = outcomes.find((o) => o.name === 'Yes');
  const noOutcome = outcomes.find((o) => o.name === 'No');

  // Format volume
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
  };

  return (
    <Link
      to={`/market/${market.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 border border-gray-200"
    >
      {/* Category badge */}
      {market.category && (
        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mb-2">
          {market.category}
        </span>
      )}

      {/* Question */}
      <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">
        {market.question}
      </h3>

      {/* Outcomes */}
      <div className="space-y-2 mb-3">
        {yesOutcome && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Yes</span>
            <span className="text-lg font-bold text-green-600">
              {(yesOutcome.price * 100).toFixed(1)}¢
            </span>
          </div>
        )}
        {noOutcome && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">No</span>
            <span className="text-lg font-bold text-red-600">
              {(noOutcome.price * 100).toFixed(1)}¢
            </span>
          </div>
        )}
      </div>

      {/* Mini chart placeholder */}
      <div className="h-12 bg-gray-50 rounded mb-3 flex items-center justify-center">
        <span className="text-xs text-gray-400">24h chart</span>
      </div>

      {/* Volume */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Volume</span>
        <span className="font-medium">{formatVolume(market.volume)}</span>
      </div>
    </Link>
  );
}

export default memo(MarketCard);
