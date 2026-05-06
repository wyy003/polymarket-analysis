import { useState } from 'react';
import { useMarkets } from '../hooks/useMarkets';
import MarketCard from '../components/MarketCard';
import { ArbitrageOpportunities } from '../components/ArbitrageOpportunities';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data, isLoading, error } = useMarkets(100, 0);

  // Filter markets based on search and category
  const filteredMarkets = data?.data.filter((market) => {
    const matchesSearch = market.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || market.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Extract unique categories
  const categories = ['all', ...new Set(data?.data.map((m) => m.category).filter(Boolean) as string[])];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Polymarket Markets
        </h1>
        <p className="text-gray-600">
          {data?.count || 0} active prediction markets
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading markets...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load markets: {error.message}
        </div>
      )}

      {/* Arbitrage Opportunities Section */}
      {!isLoading && !error && (
        <div className="mb-8">
          <ArbitrageOpportunities />
        </div>
      )}

      {/* Markets Grid */}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredMarkets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                outcomes={market.outcomes}
              />
            ))}
          </div>

          {/* No Results */}
          {filteredMarkets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No markets found matching your criteria
            </div>
          )}
        </>
      )}
    </div>
  );
}
