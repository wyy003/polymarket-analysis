import { useParams, Link } from 'react-router-dom';
import { useMarketDetail } from '../hooks/useMarkets';

export default function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useMarketDetail(id || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading market details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-red-800">
            {error?.message || 'Market not found'}
          </p>
          <Link to="/" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
            ← Back to markets
          </Link>
        </div>
      </div>
    );
  }

  const { market, outcomes, priceHistory } = data;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to markets
      </Link>

      {/* Layout: Left sidebar (25%) + Right content (75%) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Market Info */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            {/* Category */}
            {market.category && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mb-4">
                {market.category}
              </span>
            )}

            {/* Question */}
            <h1 className="text-xl font-bold text-gray-900 mb-4">
              {market.question}
            </h1>

            {/* Description */}
            {market.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-6">
                {market.description}
              </p>
            )}

            {/* Stats */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div>
                <div className="text-xs text-gray-500 mb-1">Volume</div>
                <div className="text-lg font-semibold text-gray-900">
                  ${(market.volume / 1000000).toFixed(2)}M
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Liquidity</div>
                <div className="text-lg font-semibold text-gray-900">
                  ${(market.liquidity / 1000).toFixed(0)}K
                </div>
              </div>

              {market.end_date && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">End Date</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(market.end_date).toLocaleDateString()}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div className="text-sm font-medium text-green-600">
                  {market.active ? 'Active' : 'Closed'}
                </div>
              </div>
            </div>

            {/* Current Prices */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-3">Current Prices</div>
              <div className="space-y-2">
                {outcomes.map((outcome) => (
                  <div key={outcome.id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{outcome.name}</span>
                    <span className={`text-lg font-bold ${
                      outcome.name === 'Yes' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(outcome.price * 100).toFixed(1)}¢
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Tabs */}
        <div className="lg:w-3/4">
          <div className="bg-white rounded-lg shadow">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button className="px-6 py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                  Analysis
                </button>
                <button className="px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                  Backtest
                </button>
              </nav>
            </div>

            {/* Tab Content - Analysis */}
            <div className="p-6">
              {/* Price Chart Placeholder */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price History</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                  <div className="text-center">
                    <p className="text-gray-500">Price chart coming soon</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {priceHistory.length} data points available
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-1">24h Volume</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${(market.volume / 1000000).toFixed(2)}M
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-1">Total Volume</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${(market.volume / 1000000).toFixed(2)}M
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-1">Liquidity</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${(market.liquidity / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-1">Data Points</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {priceHistory.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
