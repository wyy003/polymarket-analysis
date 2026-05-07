import { useState, useEffect, useMemo } from 'react';
import type { FilterOptions } from '../components/ui/AdvancedFilters';
import type { SortOption } from '../components/ui/SortDropdown';

const STORAGE_KEY = 'polymarket-filters';

export function useFilters() {
  // Load initial state from localStorage
  const [searchQuery, setSearchQuery] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).searchQuery || '' : '';
  });

  const [category, setCategory] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).category || 'all' : 'all';
  });

  const [filters, setFilters] = useState<FilterOptions>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).filters || {} : {};
  });

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).sortBy || 'volume-desc' : 'volume-desc';
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    const state = { searchQuery, category, filters, sortBy };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [searchQuery, category, filters, sortBy]);

  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const resetFilters = () => {
    setSearchQuery('');
    setCategory('all');
    setFilters({});
    setSortBy('volume-desc');
  };

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== '' ||
      category !== 'all' ||
      Object.keys(filters).length > 0 ||
      sortBy !== 'volume-desc'
    );
  }, [searchQuery, category, filters, sortBy]);

  return {
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
  };
}
