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
    video?: {
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
  hasPrevious: boolean;
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
  message?: string;
  error?: string;
  timestamp: string;
  data: T;
  errors?: string[];
  details?: unknown;
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

function parseApiErrors(data: APIResponse<unknown>): string[] | undefined {
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors;
  }

  if (Array.isArray(data.details)) {
    return data.details
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg?: string }).msg ?? '');
        }
        return '';
      })
      .filter(Boolean);
  }

  if (data.details && typeof data.details === 'object' && !Array.isArray(data.details)) {
    const details = data.details as { errors?: string[]; missingFields?: string[] };
    if (details.errors?.length) return details.errors;
    if (details.missingFields?.length) {
      return details.missingFields.map((field) => `Campo obrigatório: ${field}`);
    }
  }

  return undefined;
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

    const data = (await response.json()) as APIResponse<T>;
    const message = data.message || data.error || `HTTP ${response.status}`;
    const errors = parseApiErrors(data);

    if (!response.ok) {
      throw new ApiError(message, response.status, errors);
    }

    if (!data.success) {
      throw new ApiError(message, undefined, errors);
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

// Essa interface descreve o formato de um artigo no catálogo.
export interface ArticleSummary {
  id: string;
  title: string;
  summary?: string;
  author_name?: string;
  author_institution?: string;
  category?: string;
  keywords?: string[];
  published_at?: string;
  created_at: string;
  metadata?: {
    image?: {
      url: string;
      alternativeText?: string;
    };
    featured?: boolean;
  };
}

// O que a API devolve quando pedimos a lista de artigos
export interface CatalogResult {
  articles: ArticleSummary[];
  categories: string[];          
  pagination: PaginationInfo;   
}

export interface FetchArticlesOptions {
  search?:   string;
  category?: string;
  page?:     number;
  limit?:    number;
}

/**
 * Busca artigos publicados para o catálogo.
 * Chama GET /api/articles com filtros opcionais.
 */
export async function fetchArticles(
  options: FetchArticlesOptions = {}
): Promise<CatalogResult> {
  // URLSearchParams monta a query string automaticamente.
  // Ex: { search: "arte", page: 2 } → "?search=arte&page=2"
  const params = new URLSearchParams();

  if (options.search?.trim()) {
    params.append('search', options.search.trim());
  }
  if (options.category) {
    params.append('category', options.category);
  }
  if (options.page) {
    params.append('page', options.page.toString());
  }
  if (options.limit) {
    params.append('limit', options.limit.toString());
  }

  const endpoint = `/articles?${params.toString()}`;

  // apiRequest já existe no arquivo — cuida de erros, headers, etc.
  const response = await apiRequest<CatalogResult>(endpoint);
  return response.data;
}


/** Bibliography item — same shape as ArticleEditor metadata.bibliography[]. */
export interface BibliographyItem {
  year: string;
  title: string;
  author: string;
  location?: string;
  publisher?: string;
}

/** Payload for creating a new article submission (POST /submissions). */
export interface CreateArticleSubmissionPayload {
  author_name: string;
  author_email: string;
  author_institution?: string;
  title: string;
  summary: string;
  content: string;
  keywords: string[];
  category: string;
  metadata?: {
    bibliography?: BibliographyItem[];
    [key: string]: unknown;
  };
  submit_for_review?: boolean;
}

export interface CreateArticleSubmissionResponse {
  submission: Submission;
  accessUrl?: string;
}

/**
 * Submits a new article for editorial review.
 * Backend: POST /api/submissions (to be wired when endpoint is active).
 */
export async function createArticleSubmission(
  payload: CreateArticleSubmissionPayload
): Promise<CreateArticleSubmissionResponse> {
  const response = await apiRequest<CreateArticleSubmissionResponse>(
    '/submissions',
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        submit_for_review: payload.submit_for_review ?? true,
      }),
    }
  );
  return response.data;
}

export { ApiError };

// Campos que podem ser editados pelo admin
export interface ArticleUpdateData {
  title?:              string;
  summary?:            string;
  content?:            string;
  content_html?:       string;
  keywords?:           string[];
  category?:           string;
  author_name?:        string;
  author_institution?: string;
  metadata?:           Record<string, any>;
}

/**
 * Atualiza um artigo pelo ID.
 * Chama PATCH /api/articles/:id com os campos alterados.
 */
export async function updateArticle(
  id: string,
  data: ArticleUpdateData
): Promise<Submission> {
  const response = await apiRequest<{ submission: Submission }>(
    `/articles/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
  return response.data.submission;
}

// Admin Review Queue 
import { supabase } from './supabase';

export interface AdminSubmission {
  id: string;
  token: string;
  status: string;
  authorName: string;
  authorEmail: string;
  authorInstitution?: string;
  title: string;
  summary: string;
  content: string;
  keywords: string[];
  category?: string;
  metadata?: Record<string, unknown>;
  reviewedBy?: string;
  assignedTo?: string;
  assignedToName?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  daysUntilExpiry: number;
  canBePublished: boolean;
  lastActivity: string;
}

export interface AdminPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface AdminSubmissionsResult {
  submissions: AdminSubmission[];
  pagination: AdminPagination;
}

export interface GetReviewQueueOptions {
  page?: number;
  limit?: number;
  status?: string[];
  unassigned?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Faz uma requisição autenticada para o backend, anexando o JWT do Supabase.
 */
async function adminRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new ApiError('Sessão expirada. Faça login novamente.', 401);
  }

  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Lista submissões enviadas para revisão com filtros no backend
 */

export async function getReviewQueue(
  options: GetReviewQueueOptions = {}
): Promise<AdminSubmissionsResult> {
  const params = new URLSearchParams();

  // Se a tela mandou status (ex: ["UNDER_REVIEW", "CHANGES_REQUESTED"]), junta tudo com vírgula
  if (options.status && options.status.length > 0) {
    params.append('status', options.status.join(','));
  }

  // Filtro extra para a aba "Sem revisão"
  if (options.unassigned) {
    params.append('unassigned', 'true');
  }

  params.append('sortBy', options.sortBy || 'updated_at');
  params.append('sortOrder', options.sortOrder || 'desc');

  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());

  const endpoint = `/admin/review/submissions?${params.toString()}`;

  console.log(endpoint);

  const response = await adminRequest<AdminSubmissionsResult>(
    `/admin/review/submissions?${params.toString()}`
  );
  return response.data;
}

/**
 * Lista submissões atribuídas ao admin autenticado.
 */
export async function getMyReviews(
  adminId: string,
  options: { page?: number; limit?: number } = {}
): Promise<AdminSubmissionsResult> {
  const params = new URLSearchParams();
 // params.append('status', 'DRAFT');
  //console.log("IDDDDDDDDDDDDDDDDD: ", adminId );
  params.append('assignedTo', 'ME');
  params.append('sortOrder', 'asc');

  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());

  const response = await adminRequest<AdminSubmissionsResult>(
    `/admin/review/submissions?${params.toString()}`
  );
  return response.data;
}

/**
 * Torna o admin autenticado responsável pela revisão da submissão.
 */
export async function assignSubmission(submissionId: string): Promise<AdminSubmission> {
  const response = await adminRequest<{ submission: AdminSubmission }>(
    `/admin/review/submissions/${submissionId}/assign`,
    { method: 'POST' }
  );
  return response.data.submission;
}

/**
 * Devolve a submissão para a fila geral (remove o responsável).
 */
export async function unassignSubmission(submissionId: string): Promise<AdminSubmission> {
  const response = await adminRequest<{ submission: AdminSubmission }>(
    `/admin/review/submissions/${submissionId}/unassign`,
    { method: 'POST' }
  );
  return response.data.submission;
}

// Autor
export interface AuthorSubmission {
  id: string;
  title: string;
  status: string;
  category?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  pending_suggestions_count: string;
}

export interface SubmissionSuggestion {
  id: string;
  submission_id: string;
  admin_name?: string;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  resolved_at?: string;
  suggested_title?: string;
  suggested_summary?: string;
  suggested_content?: string;
  suggested_category?: string;
  suggested_keywords?: string[];
  suggested_metadata?: Record<string, any>;
}

/**
 * Faz requisição autenticada como autor (usa token Supabase)
 */
async function authorRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new ApiError('Sessão expirada. Faça login novamente.', 401);
  }

  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Lista todas as submissões do autor logado
 */
export async function getMySubmissions(): Promise<AuthorSubmission[]> {
  const response = await authorRequest<{ submissions: AuthorSubmission[] }>(
    '/author/submissions'
  );
  return response.data.submissions;
}

/**
 * Lista sugestões do curador para uma submissão
 */
export async function getSubmissionSuggestions(
  submissionId: string
): Promise<SubmissionSuggestion[]> {
  const response = await authorRequest<{ suggestions: SubmissionSuggestion[] }>(
    `/author/submissions/${submissionId}/suggestions`
  );
  return response.data.suggestions;
}

/**
 * Autor aceita uma sugestão do curador
 */
export async function acceptSuggestion(
  submissionId: string,
  suggestionId: string
): Promise<void> {
  await authorRequest(
    `/author/submissions/${submissionId}/suggestions/${suggestionId}/accept`,
    { method: 'POST' }
  );
}

/**
 * Autor rejeita uma sugestão do curador
 */
export async function rejectSuggestion(
  submissionId: string,
  suggestionId: string
): Promise<void> {
  await authorRequest(
    `/author/submissions/${submissionId}/suggestions/${suggestionId}/reject`,
    { method: 'POST' }
  );
}

// Interface para o payload da contra-proposta
export interface CounterSuggestionPayload {
  suggested_title?: string;
  suggested_summary?: string;
  suggested_content?: string;
  suggested_category?: string;
  suggested_keywords?: string[];
  notes: string; // Obrigatório para explicar as mudanças
}

/**
 * Envia uma contra-proposta do autor baseada em uma sugestão do curador
 */
export async function counterSuggestion(
  submissionId: string,
  suggestionId: string,
  payload: CounterSuggestionPayload
): Promise<void> {
  console.log('Contra-proposta enviada:', JSON.stringify(payload));
  await authorRequest(
    `/author/submissions/${submissionId}/suggestions/${suggestionId}/counter`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  console.log('Contra-proposta enviada:', JSON.stringify(payload));
}

// Interface para uma versão de submissão
export interface SubmissionVersion {
  version_number: number;
  title: string;
  summary?: string;
  content?: string;
  change_summary?: string;
  created_by: string;
  created_at: string;
}

// Função para obter as versões de uma submissão específica
export async function getSubmissionVersions(
  submissionId: string
): Promise<SubmissionVersion[]> {
  const response = await authorRequest<{ versions: SubmissionVersion[] }>(
    `/author/submissions/${submissionId}/versions`
  );
  return response.data.versions;
}