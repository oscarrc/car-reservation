import { searchConfig } from '@/lib/query-config';
import { useDebounced } from './useDebounced';
import { useState } from 'react';

export function useOptimizedSearch(initialValue: string = '') {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const debouncedSearchTerm = useDebounced(searchTerm, searchConfig.debounceDelay);

  // Only search if term meets minimum length requirement
  const shouldSearch = debouncedSearchTerm.length >= searchConfig.minSearchLength || debouncedSearchTerm.length === 0;
  const effectiveSearchTerm = shouldSearch ? debouncedSearchTerm : '';

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm: effectiveSearchTerm,
    isSearching: searchTerm !== debouncedSearchTerm,
    shouldSearch,
  };
}