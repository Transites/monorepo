import { useState, useEffect } from 'react';
import { FeaturedContentItem } from '../lib/api';

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
        // Fetch all published submissions and pick 3 deterministically per day
        const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:1337/api').replace(/\/\/$/, '');
        const resp = await fetch(`${apiBase}/submissions`, { cache: 'no-store' });
        if (!resp.ok) throw new Error(`HTTP error fetching submissions: ${resp.status}`);
        const json = await resp.json();
        const submissions = (json.data && json.data.submissions) || json.submissions || [];

        // seed functions
        function hashString(str: string) {
          let hash = 5381;
          for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & 0xffffffff;
          }
          return hash >>> 0;
        }
        function mulberry32(a: number) {
          return function() {
            a |= 0;
            a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
          };
        }

        const now = new Date();
        const seed = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const rand = mulberry32(hashString(seed));

        const pool = submissions.map((s: any) => ({
          id: s.id,
          title: s.title,
          summary: s.summary,
          category: s.category,
          author_name: s.author_name,
          metadata: s.metadata
        }));

        // seeded shuffle
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          const tmp = pool[i];
          pool[i] = pool[j];
          pool[j] = tmp;
        }

        const picked = pool.slice(0, 3).map((p: any) => ({
          id: p.id,
          title: p.title,
          summary: p.summary,
          category: p.category,
          author_name: p.author_name,
          metadata: p.metadata,
          display_order: 0
        } as FeaturedContentItem));

        setState({ data: picked, isLoading: false, error: null });
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