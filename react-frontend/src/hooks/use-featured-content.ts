import { useState, useEffect } from 'react';
import { getFeaturedContent, FeaturedContentItem } from '../lib/api';

export interface UseFeaturedContentState {
  data: FeaturedContentItem[] | null;
  isLoading: boolean;
  error: string | null;
}

export function useFeaturedContent() {
  const [state, setState] = useState<UseFeaturedContentState>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        const response = await getFeaturedContent();
        setState({ data: response.featured, isLoading: false, error: null });
      } catch (error) {
        console.error('Failed to fetch featured content:', error);
        setState({ 
          data: null, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to fetch featured content' 
        });
      }
    }

    fetchData();
  }, []);

  return state;
}