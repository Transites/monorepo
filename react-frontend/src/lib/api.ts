/**
 * API service functions for the Transitos project
 * Handles communication with the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1337/api';

export interface Submission {
  id: string;
  title: string;
  status: string;
  category: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  feedback_count?: string;
  author_name?: string;
  author_email?: string;
  author_institution?: string;
  summary?: string;
  content?: string; // Raw content from API
  content_html?: string; // HTML content from API
  keywords?: string[];
  attachments?: unknown[];
  reviewed_by?: string;
  review_notes?: string;
  rejection_reason?: string;
  submitted_at?: string;
  reviewed_at?: string;
  token?: string;
  versions?: unknown[];
  feedback?: unknown[];
  metadata?: {
    slug?: string;
    type?: string;
    image?: {
      url: string;
      caption?: string;
      credit?: string;
      alternativeText?: string;
    };
    birth?: {
      date: string;
      place?: string;
      formatted: string;
    };
    death?: {
      date: string;
      place?: string;
      formatted: string;
    };
    works?: Array<{
      year: string;
      title: string;
      location?: string;
      publisher?: string;
    }>;
    source?: string;
    themes?: string[];
    periods?: {
      main_period?: string;
      career_period?: string;
      france_period?: string;
    };
    featured?: boolean;
    sections?: Array<{
      title: string;
      content: string;
    }>;
    cache_file?: string;
    occupation?: string[];
    bibliography?: Array<{
      year: string;
      title: string;
      author: string;
      location?: string;
      publisher?: string;
    }>;
    organizations?: string[];
    processed_date?: string;
    alternativeNames?: string[];
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SearchMetadata {
  searchTerm: string;
  threshold: number;
  exactMatches: number;
  fuzzyMatches: number;
  totalMatches: number;
  averageRelevance: number;
  searchType: 'fuzzy' | 'exact';
}

export interface SearchResult {
  submissions: Submission[];
  pagination: PaginationInfo;
  searchMetadata?: SearchMetadata;
  tips?: string[];
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  timestamp: string;
  data: T;
  errors?: string[];
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Makes HTTP requests to the API
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data: APIResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || `HTTP ${response.status}`,
        response.status,
        data.errors
      );
    }

    if (!data.success) {
      throw new ApiError(data.message, undefined, data.errors);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Unable to connect to server. Please check your connection.');
    }
    
    throw new ApiError('An unexpected error occurred');
  }
}

/**
 * Searches submissions using regular (exact) search
 */
export async function searchSubmissions(
  searchTerm?: string,
  options: {
    top?: number;
    skip?: number;
    requestedState?: 'DRAFT' | 'READY' | 'BOTH';
  } = {}
): Promise<SearchResult> {
  const params = new URLSearchParams();
  
  if (searchTerm?.trim()) {
    params.append('search', searchTerm.trim());
  }
  
  if (options.top) {
    params.append('top', options.top.toString());
  }
  
  if (options.skip) {
    params.append('skip', options.skip.toString());
  }
  
  if (options.requestedState) {
    params.append('requestedState', options.requestedState);
  }

  const endpoint = `/submissions?${params.toString()}`;
  const response = await apiRequest<SearchResult>(endpoint);
  
  return response.data;
}

/**
 * Searches submissions using fuzzy search (typo-tolerant)
 */
export async function searchWithFuzzy(
  searchTerm: string,
  options: {
    threshold?: number;
    top?: number;
    skip?: number;
  } = {}
): Promise<SearchResult> {
  if (!searchTerm?.trim()) {
    throw new ApiError('Search term is required for fuzzy search');
  }

  const params = new URLSearchParams();
  params.append('search', searchTerm.trim());
  
  if (options.threshold !== undefined) {
    params.append('threshold', options.threshold.toString());
  }
  
  if (options.top) {
    params.append('top', options.top.toString());
  }
  
  if (options.skip) {
    params.append('skip', options.skip.toString());
  }

  const endpoint = `/submissions/search-fuzzy?${params.toString()}`;
  const response = await apiRequest<SearchResult>(endpoint);
  
  return response.data;
}

/**
 * Gets a submission by ID
 */
export async function getSubmissionById(id: string): Promise<Submission> {
  const endpoint = `/submissions/id/${id}`;
  const response = await apiRequest<{ submission: Submission; canEdit: boolean; canSubmitForReview: boolean }>(endpoint);
  
  return response.data.submission;
}

/**
 * Main search function - uses fuzzy search for better user experience
 */
export async function search(
  searchTerm: string,
  options: {
    threshold?: number;
    top?: number;
    skip?: number;
  } = {}
): Promise<SearchResult> {
  return searchWithFuzzy(searchTerm, options);
}

// Featured Content interfaces and API
export interface FeaturedContentItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  author_name?: string;
  metadata?: {
    image?: {
      url: string;
      caption?: string;
      credit?: string;
      alternativeText?: string;
    };
    [key: string]: unknown;
  };
  display_order: number;
}

export interface FeaturedContentResponse {
  featured: FeaturedContentItem[];
}

/**
 * Get featured content items from the API
 */
export async function getFeaturedContent(): Promise<FeaturedContentResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/featured-content`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching featured content:', error);
    throw error;
  }
}

export { ApiError };