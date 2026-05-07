import { useState } from 'react';

export interface FilterOptions {
  priceMin?: number;
  priceMax?: number;
  volumeMin?: number;
  endDateFrom?: string;
  endDateTo?: string;
  activeOnly?: boolean;
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
}

export function AdvancedFilters({ filters, onFiltersChange, onReset }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <span className="font-medium text-gray-900">Advanced Filters</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range (Yes outcome)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min (¢)"
                value={filters.priceMin ?? ''}
                onChange={(e) => handleChange('priceMin', e.target.value ? Number(e.target.value) : undefined)}
                min="0"
                max="100"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="number"
                placeholder="Max (¢)"
                value={filters.priceMax ?? ''}
                onChange={(e) => handleChange('priceMax', e.target.value ? Number(e.target.value) : undefined)}
                min="0"
                max="100"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Volume */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Volume ($)
            </label>
            <input
              type="number"
              placeholder="e.g., 100000"
              value={filters.volumeMin ?? ''}
              onChange={(e) => handleChange('volumeMin', e.target.value ? Number(e.target.value) : undefined)}
              min="0"
              step="10000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* End Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.endDateFrom ?? ''}
                onChange={(e) => handleChange('endDateFrom', e.target.value || undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="date"
                value={filters.endDateTo ?? ''}
                onChange={(e) => handleChange('endDateTo', e.target.value || undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Active Only */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.activeOnly ?? false}
                onChange={(e) => handleChange('activeOnly', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Active markets only</span>
            </label>
          </div>

          {/* Reset Button */}
          <button
            onClick={onReset}
            className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
