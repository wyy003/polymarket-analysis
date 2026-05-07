import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useMarketDetail } from '../hooks/useMarkets';
import { PriceChart } from '../components/PriceChart';
import StatisticsGrid from '../components/detail/StatisticsGrid';
import { BacktestTab } from '../components/backtest/BacktestTab';
import { ChartSkeleton, StatCardSkeleton } from '../components/ui/Skeleton';

export default function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useMarketDetail(id || '');
  const [activeTab, setActiveTab] = useState<'analysis' | 'backtest'>('analysis');

  const [selectedIndicators, setSelectedIndicators] = useState({
    ma7: false,
    ma20: false,
    ma50: false,
    rsi: false,
    bollingerBands: false,
  });

  const toggleIndicator = (indicator: keyof typeof selectedIndicators) => {
    setSelectedIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator],
    }));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="flex gap-6">
          {/* Sidebar skeleton */}
          <div className="w-1/4 space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-5/6 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          {/* Main content skeleton */}
          <div className="flex-1">
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-red-900">Failed to Load Market</h2>
          </div>
          <p className="text-red-800 mb-4">
            {error?.message || 'Market not found'}
          </p>
          <div className="flex gap-3">
            <Link to="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              ← Back to markets
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Try Again
            </button>
          </div>
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
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'analysis'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Analysis
                </button>
                <button
                  onClick={() => setActiveTab('backtest')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'backtest'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Backtest
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'analysis' && (
                <>
                  {/* Technical Indicators Control Panel */}
                  <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Technical Indicators</h3>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIndicators.ma7}
                      onChange={() => toggleIndicator('ma7')}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">MA7</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIndicators.ma20}
                      onChange={() => toggleIndicator('ma20')}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">MA20</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIndicators.ma50}
                      onChange={() => toggleIndicator('ma50')}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">MA50</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIndicators.rsi}
                      onChange={() => toggleIndicator('rsi')}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">RSI</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIndicators.bollingerBands}
                      onChange={() => toggleIndicator('bollingerBands')}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Bollinger Bands</span>
                  </label>
                </div>
              </div>

              {/* Price Chart */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price History</h3>
                <PriceChart
                  priceHistory={priceHistory}
                  outcomes={outcomes}
                  selectedIndicators={selectedIndicators}
                  marketId={id || ''}
                />
              </div>

              {/* Statistics Grid */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                <StatisticsGrid
                  marketId={id || ''}
                  outcomeId={outcomes[0]?.id || ''}
                />
              </div>
            </>
          )}

          {activeTab === 'backtest' && (
            <BacktestTab
              marketId={id || ''}
              outcomeId={outcomes[0]?.id || ''}
            />
          )}
        </div>
      </div>
    </div>
  </div>
</div>
);
}
