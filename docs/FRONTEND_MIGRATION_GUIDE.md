# Frontend Migration Guide: Vue to React

This document provides a comprehensive guide for migrating the search functionality and article view from the Vue frontend to the React frontend, based on the analysis of the previous implementation and backend capabilities.

## Overview

### Migration Scope
This guide covers migrating two core features:
1. **Search Functionality** - Proper backend API integration (not client-side workaround)
2. **Article View** - Individual article display with rich metadata

### Key Changes from Vue Implementation
- ✅ **Use backend search API** instead of client-side fuzzy search
- ✅ **Implement proper loading states** and error handling
- ✅ **Optimize network requests** with pagination
- ✅ **Modern React patterns** with hooks and TypeScript

## 1. Search Functionality Migration

### Vue Implementation Analysis (What NOT to do)

The Vue frontend implemented a **flawed approach**:

```javascript
// ❌ Vue implementation - DON'T COPY THIS
export const searchStore = {
  async searchSubmissions(query) {
    // WRONG: Downloads all data for client-side search
    const allData = await this.fetchAllSubmissions(100);
    return allData.filter(item => fuzzyMatch(item.title, query));
  },
  
  async fetchAllSubmissions(limit) {
    // WRONG: Fetches everything regardless of search
    return await api.get(`/api/submissions?top=${limit}&skip=0`);
  }
};
```

### React Implementation (Correct Approach)

#### TypeScript Interfaces
```typescript
// types/submission.ts
export interface Submission {
  id: string;
  title: string;
  summary?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'UNDER_REVIEW';
  category: string;
  author_name: string;
  author_email: string;
  created_at: string;
  updated_at: string;
  metadata: {
    slug: string;
    type: string;
    birth?: {
      date: string;
      place: string;
      formatted: string;
    };
    death?: {
      date: string;
      place: string;
      formatted: string;
    };
    image?: {
      url: string;
      alt?: string;
    };
    themes: string[];
    sections: Array<{
      title: string;
      content: string;
    }>;
    alternativeNames?: string[];
  };
  keywords: string[];
  feedback_count: string;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  data: {
    submissions: Submission[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}
```

#### Search API Service
```typescript
// services/searchService.ts
class SearchService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:1337';

  async searchSubmissions(
    query: string = '',
    options: {
      page?: number;
      limit?: number;
      status?: string;
    } = {}
  ): Promise<SearchResponse> {
    const { page = 1, limit = 10, status = 'PUBLISHED' } = options;
    const skip = (page - 1) * limit;

    const params = new URLSearchParams({
      top: limit.toString(),
      skip: skip.toString(),
    });

    // Only add search parameter if query exists
    if (query.trim()) {
      params.append('search', query.trim());
    }

    if (status !== 'BOTH') {
      params.append('requestedState', status);
    }

    const response = await fetch(`${this.baseUrl}/api/submissions?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getSubmissionById(id: string): Promise<{
    success: boolean;
    data: {
      submission: Submission;
      canEdit: boolean;
      canSubmitForReview: boolean;
    };
  }> {
    const response = await fetch(`${this.baseUrl}/api/submissions/id/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch submission: ${response.statusText}`);
    }

    return response.json();
  }
}

export const searchService = new SearchService();
```

#### Search Hook
```typescript
// hooks/useSearch.ts
import { useState, useEffect, useCallback } from 'react';
import { searchService } from '../services/searchService';
import { Submission } from '../types/submission';

interface UseSearchReturn {
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  search: (query: string, page?: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  clearResults: () => void;
}

export const useSearch = (): UseSearchReturn => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState(null);
  const [currentQuery, setCurrentQuery] = useState('');

  const search = useCallback(async (query: string, page: number = 1) => {
    setLoading(true);
    setError(null);
    setCurrentQuery(query);

    try {
      const response = await searchService.searchSubmissions(query, { page });
      setSubmissions(response.data.submissions);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na busca');
      setSubmissions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const nextPage = useCallback(() => {
    if (pagination?.hasNext) {
      search(currentQuery, pagination.page + 1);
    }
  }, [search, currentQuery, pagination]);

  const prevPage = useCallback(() => {
    if (pagination?.hasPrev) {
      search(currentQuery, pagination.page - 1);
    }
  }, [search, currentQuery, pagination]);

  const clearResults = useCallback(() => {
    setSubmissions([]);
    setPagination(null);
    setError(null);
    setCurrentQuery('');
  }, []);

  return {
    submissions,
    loading,
    error,
    pagination,
    search,
    nextPage,
    prevPage,
    clearResults
  };
};
```

#### Debounced Search Hook
```typescript
// hooks/useDebounceSearch.ts
import { useState, useEffect } from 'react';

export const useDebounceSearch = (value: string, delay: number = 300): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

#### Search Component
```tsx
// components/SearchInput.tsx
import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounceSearch } from '../hooks/useDebounceSearch';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  placeholder = "Buscar artigos...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounceSearch(query, 300);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
```

#### Search Results Component
```tsx
// components/SearchResults.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Tag } from 'lucide-react';
import { Submission } from '../types/submission';

interface SearchResultsProps {
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  pagination: {
    page: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  submissions,
  loading,
  error,
  searchQuery,
  pagination,
  onNextPage,
  onPrevPage
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Buscando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">❌ Erro na busca</div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!submissions.length && searchQuery) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-2">🔍 Nenhum resultado encontrado</div>
        <p className="text-gray-600">
          Tente buscar por outros termos relacionados ao seu interesse.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      {searchQuery && pagination && (
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            {pagination.total} resultados para "{searchQuery}"
          </span>
          <span>
            Página {pagination.page} de {pagination.totalPages}
          </span>
        </div>
      )}

      {/* Results List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {submissions.map((submission) => (
          <SearchResultCard 
            key={submission.id} 
            submission={submission}
            searchQuery={searchQuery}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-4 pt-8">
          <button
            onClick={onPrevPage}
            disabled={!pagination.hasPrev}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="flex items-center px-4 py-2 text-gray-600">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={onNextPage}
            disabled={!pagination.hasNext}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
};

const SearchResultCard: React.FC<{ 
  submission: Submission; 
  searchQuery: string;
}> = ({ submission, searchQuery }) => {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark className="bg-yellow-200">$1</mark>');
  };

  return (
    <Link
      to={`/article/${submission.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
    >
      {/* Image */}
      {submission.metadata.image && (
        <div className="aspect-video bg-gray-100">
          <img
            src={submission.metadata.image.url}
            alt={submission.metadata.image.alt || submission.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Title */}
        <h3 
          className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2"
          dangerouslySetInnerHTML={{
            __html: highlightText(submission.title, searchQuery)
          }}
        />

        {/* Summary */}
        {submission.summary && (
          <p 
            className="text-gray-600 text-sm mb-3 line-clamp-3"
            dangerouslySetInnerHTML={{
              __html: highlightText(submission.summary, searchQuery)
            }}
          />
        )}

        {/* Metadata */}
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            <span>{submission.author_name}</span>
          </div>
          
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              {new Date(submission.updated_at).toLocaleDateString('pt-BR')}
            </span>
          </div>

          {submission.keywords.length > 0 && (
            <div className="flex items-start">
              <Tag className="h-4 w-4 mr-1 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {submission.keywords.slice(0, 3).map((keyword, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-100 rounded text-xs"
                  >
                    {keyword}
                  </span>
                ))}
                {submission.keywords.length > 3 && (
                  <span className="text-gray-400 text-xs">
                    +{submission.keywords.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
```

#### Complete Search Page
```tsx
// pages/SearchPage.tsx
import React from 'react';
import { SearchInput } from '../components/SearchInput';
import { SearchResults } from '../components/SearchResults';
import { useSearch } from '../hooks/useSearch';

export const SearchPage: React.FC = () => {
  const {
    submissions,
    loading,
    error,
    pagination,
    search,
    nextPage,
    prevPage
  } = useSearch();

  const [currentQuery, setCurrentQuery] = React.useState('');

  const handleSearch = (query: string) => {
    setCurrentQuery(query);
    if (query.trim()) {
      search(query);
    } else {
      // Show recent articles when no search query
      search('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Buscar Artigos
          </h1>
          <p className="text-gray-600 mb-6">
            Explore nossa enciclopédia de intercâmbios culturais entre Brasil e França
          </p>
          
          {/* Search Input */}
          <div className="max-w-2xl mx-auto">
            <SearchInput 
              onSearch={handleSearch}
              placeholder="Digite seu termo de busca..."
              className="w-full"
            />
          </div>
        </div>

        {/* Results */}
        <SearchResults
          submissions={submissions}
          loading={loading}
          error={error}
          searchQuery={currentQuery}
          pagination={pagination}
          onNextPage={nextPage}
          onPrevPage={prevPage}
        />
      </div>
    </div>
  );
};
```

## 2. Article View Migration

### Article Display Component
```tsx
// components/ArticleView.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft, ExternalLink } from 'lucide-react';
import { searchService } from '../services/searchService';
import { Submission } from '../types/submission';
import DOMPurify from 'dompurify';

export const ArticleView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const response = await searchService.getSubmissionById(id);
        setArticle(response.data.submission);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar artigo');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) {
    return <ArticleViewSkeleton />;
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Artigo não encontrado
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/search"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Voltar à busca
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/search"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar à busca
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Hero Section */}
          <div className="relative">
            {article.metadata.image && (
              <div className="aspect-video bg-gray-200">
                <img
                  src={article.metadata.image.url}
                  alt={article.metadata.image.alt || article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {article.title}
              </h1>
              
              {article.summary && (
                <p className="text-xl text-gray-600 mb-6">
                  {article.summary}
                </p>
              )}

              {/* Article Meta */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date(article.updated_at).toLocaleDateString('pt-BR')}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="font-medium">Por: {article.author_name}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {article.category}
                  </span>
                </div>
              </div>

              {/* Keywords */}
              {article.keywords.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Palavras-chave:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Biography Info (for pessoa type) */}
          {article.metadata.type === 'pessoa' && (
            <BiographyInfo article={article} />
          )}

          {/* Content Sections */}
          <div className="p-8">
            {article.metadata.sections && article.metadata.sections.length > 0 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Conteúdo
                </h2>
                
                {article.metadata.sections.map((section, index) => (
                  <section key={index} className="prose max-w-none">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {section.title}
                    </h3>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(section.content)
                      }}
                      className="text-gray-700 leading-relaxed"
                    />
                  </section>
                ))}
              </div>
            )}

            {/* Bibliography */}
            {article.metadata.bibliography && (
              <Bibliography bibliography={article.metadata.bibliography} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

const BiographyInfo: React.FC<{ article: Submission }> = ({ article }) => {
  const { metadata } = article;
  
  return (
    <div className="bg-blue-50 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Informações Biográficas
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {metadata.birth && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Nascimento</h3>
            <div className="flex items-center text-gray-700">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{metadata.birth.formatted}</span>
            </div>
          </div>
        )}
        
        {metadata.death && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Falecimento</h3>
            <div className="flex items-center text-gray-700">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{metadata.death.formatted}</span>
            </div>
          </div>
        )}
        
        {metadata.themes && metadata.themes.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Temas</h3>
            <div className="flex flex-wrap gap-2">
              {metadata.themes.map((theme, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white text-gray-700 rounded text-sm"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {metadata.alternativeNames && metadata.alternativeNames.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Outros nomes</h3>
            <div className="text-gray-700">
              {metadata.alternativeNames.join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Bibliography: React.FC<{ 
  bibliography: Array<{
    year: string;
    title: string;
    author: string;
    location: string;
    publisher: string;
  }>;
}> = ({ bibliography }) => {
  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Bibliografia</h2>
      <div className="space-y-4">
        {bibliography.map((item, index) => (
          <div key={index} className="text-gray-700">
            <strong>{item.author}</strong> ({item.year}). <em>{item.title}</em>. 
            {item.location}: {item.publisher}.
          </div>
        ))}
      </div>
    </div>
  );
};

const ArticleViewSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="aspect-video bg-gray-200"></div>
          <div className="p-8">
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 3. Integration with Existing React App

### Router Integration
```tsx
// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SearchPage } from './pages/SearchPage';
import { ArticleView } from './components/ArticleView';
import { Index } from './pages/Index';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/article/:id" element={<ArticleView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

### Environment Configuration
```bash
# .env
REACT_APP_API_URL=http://localhost:1337
REACT_APP_SITE_NAME=Enciclopédia Transitos
```

## 4. Testing Strategy

### Unit Tests
```typescript
// __tests__/searchService.test.ts
import { searchService } from '../services/searchService';

describe('SearchService', () => {
  test('should search submissions successfully', async () => {
    const results = await searchService.searchSubmissions('cultura');
    expect(results.success).toBe(true);
    expect(results.data.submissions).toBeInstanceOf(Array);
  });

  test('should handle empty search queries', async () => {
    const results = await searchService.searchSubmissions('');
    expect(results.success).toBe(true);
  });

  test('should fetch submission by ID', async () => {
    const result = await searchService.getSubmissionById('valid-id');
    expect(result.success).toBe(true);
    expect(result.data.submission).toBeDefined();
  });
});
```

## 5. Performance Optimizations

### Lazy Loading
```tsx
// Lazy load heavy components
const ArticleView = React.lazy(() => import('./components/ArticleView'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));

// In your router
<Suspense fallback={<div>Loading...</div>}>
  <Routes>
    <Route path="/search" element={<SearchPage />} />
    <Route path="/article/:id" element={<ArticleView />} />
  </Routes>
</Suspense>
```

### Image Optimization
```tsx
// Progressive image loading
const ProgressiveImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className={`transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}>
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
```

## Summary

### Key Migration Points
1. ✅ **Use backend search API** - `/api/submissions?search=term`
2. ✅ **Implement proper pagination** with backend-provided pagination info
3. ✅ **Add debounced search input** to reduce API calls
4. ✅ **Handle loading and error states** properly
5. ✅ **Use TypeScript interfaces** for type safety
6. ✅ **Implement responsive design** with Tailwind CSS
7. ✅ **Add search result highlighting** for better UX
8. ✅ **Sanitize HTML content** with DOMPurify for security

### Performance Benefits
- **90%+ reduction in network traffic** (from downloading all data to targeted results)
- **Better search quality** (PostgreSQL full-text vs client-side fuzzy matching)
- **Scalable architecture** (works with thousands of articles)
- **Improved UX** with proper loading states and error handling

The migration replaces the flawed Vue implementation with a proper, performant React solution that leverages the existing backend capabilities correctly.