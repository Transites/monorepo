import { useState, useCallback, useRef, useEffect } from 'react';
import { search as apiSearch, SearchResult, ApiError } from '@/lib/api';

export interface UseSearchOptions {
  threshold?: number;
  top?: number;
  debounceMs?: number;
}

export interface SearchState {
  query: string;
  results: SearchResult | null;
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  page: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const {
    threshold = 0.15,
    top = 10,
    debounceMs = 300
  } = options;

  const debounceRef = useRef<NodeJS.Timeout>();

  const [state, setState] = useState<SearchState>({
    query: '',
    results: null,
    isLoading: false,
    error: null,
    hasSearched: false,
    page: 1
  });

  const search = useCallback(async (
    searchTerm: string,
    immediateOrPage: boolean | number = false,
    maybePage = 1
  ) => {
    const immediate = typeof immediateOrPage === 'boolean' ? immediateOrPage : true;
    const page = typeof immediateOrPage === 'number' ? immediateOrPage : maybePage;
    const normalizedPage = Number.isFinite(page) && page > 0 ? page : 1;

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Update query immediately
    setState(prev => ({ ...prev, query: searchTerm, page: normalizedPage }));

    // Don't search empty terms
    if (!searchTerm.trim()) {
      setState(prev => ({
        ...prev,
        results: null,
        error: null,
        hasSearched: false,
        isLoading: false,
        page: 1
      }));
      return;
    }

    const performSearch = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null, page: normalizedPage }));

      try {
        const skip = (normalizedPage - 1) * top;
        const results = await apiSearch(searchTerm, { threshold, top, skip });

        setState(prev => ({
          ...prev,
          results,
          isLoading: false,
          hasSearched: true,
          error: null,
          page: normalizedPage
        }));

      } catch (error) {
        const errorMessage = error instanceof ApiError 
          ? error.message 
          : 'Erro ao realizar busca';

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          hasSearched: true,
          results: null,
          page: normalizedPage
        }));
      }
    };

    if (immediate || debounceMs === 0) {
      await performSearch();
    } else {
      debounceRef.current = setTimeout(performSearch, debounceMs);
    }
  }, [threshold, top, debounceMs]);

  const clearSearch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setState({
      query: '',
      results: null,
      isLoading: false,
      error: null,
      hasSearched: false,
      page: 1
    });
  }, []);

  const setQuery = useCallback((query: string) => {
    search(query, false, 1);
  }, [search]);

  const searchImmediate = useCallback((query: string, page = 1) => {
    search(query, true, page);
  }, [search]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    ...state,
    search,
    searchImmediate,
    setQuery,
    clearSearch,
    // Helper computed values
    hasResults: state.results && state.results.submissions.length > 0,
    totalResults: state.results?.pagination.total || 0
  };
}