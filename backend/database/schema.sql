-- ===============================================
-- SCHEMA PRINCIPAL - SISTEMA TRANSITOS (CLEANED FOR REACT FRONTEND)
-- ===============================================
-- 
-- This schema contains only the tables actively used by the React frontend.
-- The React frontend only uses 2 API endpoints:
-- - GET /api/submissions (for homepage and search)
-- - GET /api/submissions/id/:id (for individual articles)
--
-- All admin workflow, authentication, file upload, and communication
-- tables have been archived to /database/archive/ as they are not
-- used by the current frontend implementation.
--
-- See /docs/BACKEND_ROUTE_USAGE_ANALYSIS.md for detailed usage analysis.

SET timezone = 'UTC';

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum para status das submissões (simplified for display-only frontend)
CREATE TYPE submission_status AS ENUM (
    'DRAFT', -- Rascunho inicial
    'UNDER_REVIEW', -- Em revisão pelo admin
    'CHANGES_REQUESTED', -- Correções solicitadas
    'APPROVED', -- Aprovado para publicação
    'PUBLISHED', -- Publicado como artigo (actively displayed)
    'REJECTED', -- Rejeitado definitivamente
    'EXPIRED' -- Token expirado
);

-- Tabela de submissões (CORE TABLE - actively used by React frontend)
CREATE TABLE submissions
(
    id                 UUID PRIMARY KEY  DEFAULT uuid_generate_v4(),
    token              VARCHAR(256) UNIQUE, -- Keep for potential future use
    status             submission_status DEFAULT 'PUBLISHED', -- Most content should be published for display

    -- Dados do autor (displayed in React frontend)
    author_name        VARCHAR(255)        NOT NULL,
    author_email       VARCHAR(255)        NOT NULL,
    author_institution TEXT,

    -- Conteúdo (core display data for React frontend)
    title              TEXT                NOT NULL,
    summary            TEXT,
    content            TEXT,
    content_html       TEXT,  -- HTML cache for display (used by React frontend)
    keywords           TEXT[], -- Used for search functionality
    category           VARCHAR(100), -- Used for filtering

    -- Metadados (used by React frontend for rich display)
    metadata           JSONB             DEFAULT '{}', -- Contains images, biographical data, etc.
    attachments        JSONB             DEFAULT '[]', -- Legacy field, may contain file references

    -- Simplified workflow fields (keep for data integrity)
    reviewed_by        UUID, -- No foreign key since admins table archived
    review_notes       TEXT,
    rejection_reason   TEXT,

    -- Timestamps (used for sorting and display)
    created_at         TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
    expires_at         TIMESTAMP         DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    submitted_at       TIMESTAMP,
    reviewed_at        TIMESTAMP,

    -- Constraints (keep data integrity)
    CONSTRAINT submissions_title_check CHECK (LENGTH(title) >= 5),
    CONSTRAINT submissions_author_name_check CHECK (LENGTH(author_name) >= 2),
    CONSTRAINT submissions_author_email_check CHECK (author_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT submissions_expires_check CHECK (expires_at > created_at)
);

-- Basic indexes for the submissions table (performance for React frontend queries)
CREATE INDEX idx_submissions_status ON submissions (status);
CREATE INDEX idx_submissions_category ON submissions (category);
CREATE INDEX idx_submissions_author_email ON submissions (author_email);
CREATE INDEX idx_submissions_created_at ON submissions (created_at DESC);
CREATE INDEX idx_submissions_updated_at ON submissions (updated_at DESC);

-- Full-text search indexes (used by search functionality in React frontend)
CREATE INDEX idx_submissions_title_search ON submissions USING gin (to_tsvector('portuguese', title));
CREATE INDEX idx_submissions_content_search ON submissions USING gin (to_tsvector('portuguese', COALESCE(content, '')));
CREATE INDEX idx_submissions_combined_search ON submissions USING gin (
    to_tsvector('portuguese', title || ' ' || COALESCE(summary, '') || ' ' || COALESCE(content, ''))
);

-- JSONB indexes for metadata queries
CREATE INDEX idx_submissions_keywords ON submissions USING gin (keywords);
CREATE INDEX idx_submissions_metadata ON submissions USING gin (metadata);

-- Trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migration tracking table (keep for database management)
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);