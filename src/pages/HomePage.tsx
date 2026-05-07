import { useMarkets } from '../hooks/useMarkets';
import { useFilters } from '../hooks/useFilters';
import MarketCard from '../components/MarketCard';
import { ArbitrageOpportunities } from '../components/ArbitrageOpportunities';
import { AdvancedFilters } from '../components/ui/AdvancedFilters';
import { SortDropdown } from '../components/ui/SortDropdown';

export default function HomePage() {
  const {
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    category,
    setCategory,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    resetFilters,
    hasActiveFilters,
  } = useFilters();

  const { data, isLoading, error } = useMarkets(100, 0);

  // Filter and sort markets
  const filteredAndSortedMarkets = (() => {
    if (!data?.data) return [];

    let result = data.data.filter((market) => {
      // Search filter
      const matchesSearch =
        debouncedSearchQuery === '' ||
        market.question.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        market.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      // Category filter
      const matchesCategory = category === 'all' || market.category === category;

      // Price filter (Yes outcome)
      const yesOutcome = market.outcomes.find((o) => o.name === 'Yes');
      const yesPrice = yesOutcome ? yesOutcome.price * 100 : null;
      const matchesPriceMin = filters.priceMin === undefined || (yesPrice !== null && yesPrice >= filters.priceMin);
      const matchesPriceMax = filters.priceMax === undefined || (yesPrice !== null && yesPrice <= filters.priceMax);

      // Volume filter
      const matchesVolume = filters.volumeMin === undefined || market.volume >= filters.volumeMin;

      // End date filter
      const matchesEndDateFrom =
        filters.endDateFrom === undefined ||
        !market.end_date ||
        new Date(market.end_date) >= new Date(filters.endDateFrom);
      const matchesEndDateTo =
        filters.endDateTo === undefined ||
        !market.end_date ||
        new Date(market.end_date) <= new Date(filters.endDateTo);

      // Active filter
      const matchesActive = filters.activeOnly === undefined || filters.activeOnly === false || market.active === 1;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPriceMin &&
        matchesPriceMax &&
        matchesVolume &&
        matchesEndDateFrom &&
        matchesEndDateTo &&
        matchesActive
      );
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'volume-desc':
          return b.volume - a.volume;
        case 'volume-asc':
          return a.volume - b.volume;
        case 'price-desc': {
          const aPrice = a.outcomes.find((o) => o.name === 'Yes')?.price ?? 0;
          const bPrice = b.outcomes.find((o) => o.name === 'Yes')?.price ?? 0;
          return bPrice - aPrice;
        }
        case 'price-asc': {
          const aPrice = a.outcomes.find((o) => o.name === 'Yes')?.price ?? 0;
          const bPrice = b.outcomes.find((o) => o.name === 'Yes')?.price ?? 0;
          return aPrice - bPrice;
        }
        case 'end-date-asc':
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        case 'end-date-desc':
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  })();

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
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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

      {/* Advanced Filters and Sort */}
      <div className="flex flex-col lg:flex-row gap-4 items-start mb-6">
        <div className="flex-1">
          <AdvancedFilters filters={filters} onFiltersChange={setFilters} onReset={resetFilters} />
        </div>
        <div className="flex items-center gap-4">
          <SortDropdown value={sortBy} onChange={setSortBy} />
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear All
            </button>
          )}
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
          <div className="text-sm text-gray-600 mb-4">
            Showing {filteredAndSortedMarkets.length} of {data?.data.length || 0} markets
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredAndSortedMarkets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                outcomes={market.outcomes}
              />
            ))}
          </div>

          {/* No Results */}
          {filteredAndSortedMarkets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No markets found matching your criteria
            </div>
          )}
        </>
      )}
    </div>
  );
}
