-- ===============================================
-- ÍNDICES DE PERFORMANCE (CLEANED FOR REACT FRONTEND)
-- ===============================================
--
-- This file contains only indexes for tables actively used by the React frontend.
-- The React frontend only uses the submissions table via 2 endpoints:
-- - GET /api/submissions (homepage/search) 
-- - GET /api/submissions/id/:id (individual articles)
--
-- All unused table indexes have been archived to /database/archive/archived-indexes.sql

-- Core performance indexes for submissions table queries
CREATE INDEX idx_submissions_status ON submissions (status);
CREATE INDEX idx_submissions_category ON submissions (category);
CREATE INDEX idx_submissions_author_email ON submissions (author_email);

-- Indexes for sorting and pagination (used by React frontend)
CREATE INDEX idx_submissions_created_at ON submissions (created_at DESC);
CREATE INDEX idx_submissions_updated_at ON submissions (updated_at DESC);
CREATE INDEX idx_submissions_status_created ON submissions (status, created_at DESC);
CREATE INDEX idx_submissions_status_updated ON submissions (status, updated_at DESC);
CREATE INDEX idx_submissions_category_updated ON submissions (category, updated_at DESC);

-- Combined filter indexes for complex queries
CREATE INDEX idx_submissions_filters ON submissions (status, category, updated_at DESC);

-- Full-text search indexes for search functionality used by React frontend
CREATE INDEX idx_submissions_title_search ON submissions USING gin (to_tsvector('portuguese', title));
CREATE INDEX idx_submissions_content_search ON submissions USING gin (to_tsvector('portuguese', COALESCE(content, '')));

-- Combined search index for comprehensive search (used by search endpoint)
CREATE INDEX idx_submissions_combined_search ON submissions USING gin (
    to_tsvector('portuguese', title || ' ' || COALESCE(summary, '') || ' ' || COALESCE(content, ''))
);

-- JSONB indexes for metadata and keywords (used by React frontend for rich display)
CREATE INDEX idx_submissions_keywords ON submissions USING gin (keywords);
CREATE INDEX idx_submissions_metadata ON submissions USING gin (metadata);