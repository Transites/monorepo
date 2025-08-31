import { useState, useCallback, useRef, useEffect } from 'react';
import { search as apiSearch, SearchResult, ApiError } from '@/lib/api';
import { useToast } from './use-toast';

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
}

export function useSearch(options: UseSearchOptions = {}) {
  const {
    threshold = 0.15,
    top = 10,
    debounceMs = 300
  } = options;

  const { toast } = useToast();
  const debounceRef = useRef<NodeJS.Timeout>();

  const [state, setState] = useState<SearchState>({
    query: '',
    results: null,
    isLoading: false,
    error: null,
    hasSearched: false
  });

  const search = useCallback(async (
    searchTerm: string,
    immediate = false
  ) => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Update query immediately
    setState(prev => ({ ...prev, query: searchTerm }));

    // Don't search empty terms
    if (!searchTerm.trim()) {
      setState(prev => ({
        ...prev,
        results: null,
        error: null,
        hasSearched: false,
        isLoading: false
      }));
      return;
    }

    const performSearch = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const results = await apiSearch(searchTerm, { threshold, top });

        setState(prev => ({
          ...prev,
          results,
          isLoading: false,
          hasSearched: true,
          error: null
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
          results: null
        }));

        toast({
          title: "Erro na busca",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    if (immediate || debounceMs === 0) {
      await performSearch();
    } else {
      debounceRef.current = setTimeout(performSearch, debounceMs);
    }
  }, [threshold, top, debounceMs, toast]);

  const clearSearch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setState({
      query: '',
      results: null,
      isLoading: false,
      error: null,
      hasSearched: false
    });
  }, []);

  const setQuery = useCallback((query: string) => {
    search(query);
  }, [search]);

  const searchImmediate = useCallback((query: string) => {
    search(query, true);
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
    search: searchImmediate,
    setQuery,
    clearSearch,
    // Helper computed values
    hasResults: state.results && state.results.submissions.length > 0,
    totalResults: state.results?.pagination.total || 0
  };
}