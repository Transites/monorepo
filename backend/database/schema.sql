-- ===============================================
-- SCHEMA PRINCIPAL - SISTEMA TRANSITOS
-- ===============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum para status das submissões
CREATE TYPE submission_status AS ENUM (
    'DRAFT',           -- Rascunho inicial
    'UNDER_REVIEW',    -- Em revisão pelo admin
    'CHANGES_REQUESTED', -- Correções solicitadas
    'APPROVED',        -- Aprovado para publicação
    'PUBLISHED',       -- Publicado como artigo
    'REJECTED',        -- Rejeitado definitivamente
    'EXPIRED'          -- Token expirado
);

-- Enum para status do feedback
CREATE TYPE feedback_status AS ENUM (
    'PENDING',    -- Pendente de resposta
    'ADDRESSED',  -- Endereçado pelo autor
    'RESOLVED'    -- Resolvido pelo admin
);

-- Tabela de administradores
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT admins_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT admins_name_check CHECK (LENGTH(name) >= 2)
);

-- Tabela de submissões
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(256) UNIQUE NOT NULL,
    status submission_status DEFAULT 'DRAFT',

    -- Dados do autor
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    author_institution TEXT,

    -- Conteúdo
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    keywords TEXT[],
    category VARCHAR(100),

    -- Metadados e arquivos
    metadata JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',

    -- Gestão
    reviewed_by UUID REFERENCES admins(id),
    review_notes TEXT,
    rejection_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,

    -- Constraints
    CONSTRAINT submissions_title_check CHECK (LENGTH(title) >= 5),
    CONSTRAINT submissions_author_name_check CHECK (LENGTH(author_name) >= 2),
    CONSTRAINT submissions_author_email_check CHECK (author_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
--     CONSTRAINT submissions_token_check CHECK (LENGTH(token) = 64),
    CONSTRAINT submissions_expires_check CHECK (expires_at > created_at)
);

-- Tabela de artigos publicados
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID UNIQUE REFERENCES submissions(id),
    slug VARCHAR(255) UNIQUE NOT NULL,

    -- Conteúdo final
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    keywords TEXT[],
    category VARCHAR(100),

    -- Metadados de publicação
    metadata JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Timestamps
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT articles_title_check CHECK (LENGTH(title) >= 5),
    CONSTRAINT articles_content_check CHECK (LENGTH(content) >= 100),
    CONSTRAINT articles_slug_check CHECK (slug ~* '^[a-z0-9-]+$')
);

-- Tabela de feedback/comentários
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id),

    -- Conteúdo do feedback
    content TEXT NOT NULL,
    status feedback_status DEFAULT 'PENDING',
    section VARCHAR(100), -- Seção específica comentada
    line_number INTEGER,  -- Linha específica se aplicável

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,

    -- Constraints
    CONSTRAINT feedback_content_check CHECK (LENGTH(content) >= 10)
);

-- Tabela de histórico de versões
CREATE TABLE submission_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,

    -- Snapshot do conteúdo
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    metadata JSONB DEFAULT '{}',

    -- Metadados da versão
    created_by VARCHAR(255), -- email do autor
    change_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(submission_id, version_number),
    CONSTRAINT versions_number_check CHECK (version_number > 0)
);

-- Tabela de logs de auditoria
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
