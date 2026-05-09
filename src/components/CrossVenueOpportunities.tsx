import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { CrossVenueOpportunity } from '../types/arbitrage';
import OpportunityCard from './OpportunityCard';

const CrossVenueOpportunities = () => {
  const [opportunities, setOpportunities] = useState<CrossVenueOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getCrossVenueOpportunities();

      const opps = showAll ? response.all_opportunities || [] : response.opportunities;
      setOpportunities(opps);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching cross-venue opportunities:', err);
      setError('Failed to load opportunities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [showAll]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchOpportunities();
      setCountdown(30);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, showAll]);

  // Countdown timer
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh]);

  const filteredOpportunities = opportunities.filter((opp) => {
    if (riskFilter === 'all') return true;
    return opp.risk_level === riskFilter;
  });

  const sortedOpportunities = [...filteredOpportunities].sort(
    (a, b) => b.net_edge - a.net_edge
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading opportunities...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchOpportunities}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cross-Venue Arbitrage</h2>
            <p className="text-sm text-gray-600 mt-1">
              Polymarket ↔ Manifold Markets opportunities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                autoRefresh
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {autoRefresh ? `Auto (${countdown}s)` : 'Auto Off'}
            </button>
            <button
              onClick={fetchOpportunities}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {lastUpdated && (
          <div className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Show:</label>
            <button
              onClick={() => setShowAll(false)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                !showAll
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tradeable Only
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                showAll
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Risk:</label>
            {(['all', 'low', 'medium', 'high'] as const).map((risk) => (
              <button
                key={risk}
                onClick={() => setRiskFilter(risk)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  riskFilter === risk
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {risk.charAt(0).toUpperCase() + risk.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      {sortedOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedOpportunities.map((opp, index) => (
            <OpportunityCard key={`${opp.pair_id}-${opp.direction}-${index}`} opportunity={opp} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="max-w-md mx-auto">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Arbitrage Opportunities Found
            </h3>
            <p className="text-gray-600 mb-4">
              There are currently no {!showAll && 'tradeable '}opportunities matching your filters.
            </p>
            <div className="text-sm text-gray-500 space-y-2 text-left">
              <p className="font-medium">Possible reasons:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>No market pairs configured yet</li>
                <li>No positive net edge after fees and slippage</li>
                <li>Orderbook data unavailable</li>
                <li>Markets are efficiently priced</li>
              </ul>
              <p className="mt-4 text-xs">
                Add confirmed market pairs in the configuration to start scanning.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossVenueOpportunities;
