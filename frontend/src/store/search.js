import axios from 'axios';
import api from "@/services/api";

// Utility function to normalize strings (remove accents, convert to lowercase)
const normalizeString = (str) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase();
};

// Levenshtein distance algorithm for finding similar terms
const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
};

// Check if two strings are similar based on Levenshtein distance
const isSimilar = (a, b, threshold = 0.3) => {
  if (!a || !b) return false;

  // Normalize strings
  const normalizedA = normalizeString(a);
  const normalizedB = normalizeString(b);

  // Exact match after normalization
  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) {
    return true;
  }

  // For very short strings, be more strict
  if (normalizedA.length < 3 || normalizedB.length < 3) {
    return normalizedA === normalizedB;
  }

  // Calculate distance
  const distance = levenshteinDistance(normalizedA, normalizedB);

  // Calculate similarity ratio (0 to 1, where 1 is exact match)
  const maxLength = Math.max(normalizedA.length, normalizedB.length);
  const similarityRatio = 1 - distance / maxLength;

  return similarityRatio >= threshold;
};

export default {
  namespaced: true,
  state: {
    searchQuery: '',
    results: [],
    isLoading: false,
    error: null,
  },
  mutations: {
    SET_SEARCH_QUERY(state, query) {
      state.searchQuery = query;
    },
    SET_RESULTS(state, results) {
      state.results = results;
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    }
  },
  actions: {
    setSearchQuery({ commit }, query) {
      commit('SET_SEARCH_QUERY', query);
    },
    async performSearch({ commit, state }) {
      if (!state.searchQuery || !state.searchQuery.trim()) {
        commit('SET_RESULTS', []);
        return;
      }

      commit('SET_LOADING', true);
      commit('SET_ERROR', null);

      try {
        // Normalize the search query to make it accent-insensitive
        const normalizedQuery = normalizeString(state.searchQuery);

        // First try with exact normalized query
        const response = await api.get("/submissions", {
          params: {
            search: normalizedQuery,
            top: 20,
            skip: 0
          }
        });

        let results = response.data.data.submissions.map(item => ({
          id: item.id,
          type: 'submission',
          title: item.title || 'Título indisponível',
          subtitle: item.category || 'Categoria indisponível',
          text: item.summary || 'Resumo indisponível',
          tags: item.keywords?.map(keyword => ({
            name: keyword
          })) || [],
          status: item.status,
          author: item.author_name
        }));

        // If no results found, try a broader search
        if (results.length === 0 && normalizedQuery.length > 2) {
          // Get all articles (with a reasonable limit) to perform similarity search
          const allResponse = await api.get("/submissions", {
            params: {
              top: 100, // Limit to prevent performance issues
              skip: 0
            }
          });

          const allArticles = allResponse.data.data.submissions.map(item => ({
            id: item.id,
            type: 'submission',
            image: item.metadata.image.url || null,
            title: item.title || 'Título indisponível',
            subtitle: item.category || 'Categoria indisponível',
            tags: item.keywords?.map(keyword => ({
              name: keyword
            })) || [],
            status: item.status,
            author: item.author_name
          }));

          // Filter by similarity
          results = allArticles.filter(article => 
            isSimilar(article.title, state.searchQuery)
          );
        }

        commit('SET_RESULTS', results);
      } catch (error) {
        console.error('Error performing search:', error);
        commit('SET_ERROR', 'Erro ao realizar a busca. Por favor, tente novamente.');
      } finally {
        commit('SET_LOADING', false);
      }
    }
  },
  getters: {
    filteredResults: (state) => {
      if (state.searchQuery.trim() === '') {
        return state.results;
      }

      const query = state.searchQuery;

      return state.results.filter(entry => {
        if (!entry.title) return false;

        // First try exact match (after normalization)
        const normalizedTitle = normalizeString(entry.title);
        const normalizedQuery = normalizeString(query);

        if (normalizedTitle.includes(normalizedQuery)) {
          return true;
        }

        // If no exact match, try similarity match
        return isSimilar(entry.title, query);
      });
    }
  }
};
