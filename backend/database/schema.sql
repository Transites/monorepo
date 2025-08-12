-- ===============================================
-- SCHEMA PRINCIPAL - SISTEMA TRANSITOS
-- ===============================================

SET timezone = 'UTC';

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum para status das submissões
CREATE TYPE submission_status AS ENUM (
    'DRAFT', -- Rascunho inicial
    'UNDER_REVIEW', -- Em revisão pelo admin
    'CHANGES_REQUESTED', -- Correções solicitadas
    'APPROVED', -- Aprovado para publicação
    'PUBLISHED', -- Publicado como artigo
    'REJECTED', -- Rejeitado definitivamente
    'EXPIRED' -- Token expirado
    );

-- Enum para status do feedback
CREATE TYPE feedback_status AS ENUM (
    'PENDING', -- Pendente de resposta
    'ADDRESSED', -- Endereçado pelo autor
    'RESOLVED' -- Resolvido pelo admin
    );

-- Tabela de administradores
CREATE TABLE admins
(
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    name          VARCHAR(255)        NOT NULL,
    is_active     BOOLEAN          DEFAULT TRUE,
    last_login    TIMESTAMP,
    created_at    TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT admins_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT admins_name_check CHECK (LENGTH(name) >= 2)
);

-- Tabela de submissões
CREATE TABLE submissions
(
    id                 UUID PRIMARY KEY  DEFAULT uuid_generate_v4(),
    token              VARCHAR(256) UNIQUE NOT NULL,
    status             submission_status DEFAULT 'DRAFT',

    -- Dados do autor
    author_name        VARCHAR(255)        NOT NULL,
    author_email       VARCHAR(255)        NOT NULL,
    author_institution TEXT,

    -- Conteúdo
    title              TEXT                NOT NULL,
    summary            TEXT,
    content            TEXT,
    keywords           TEXT[],
    category           VARCHAR(100),

    -- Metadados e arquivos
    metadata           JSONB             DEFAULT '{}',
    attachments        JSONB             DEFAULT '[]',

    -- Gestão
    reviewed_by        UUID REFERENCES admins (id),
    review_notes       TEXT,
    rejection_reason   TEXT,

    -- Timestamps
    created_at         TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
    expires_at         TIMESTAMP         DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    submitted_at       TIMESTAMP,
    reviewed_at        TIMESTAMP,

    -- Constraints
    CONSTRAINT submissions_title_check CHECK (LENGTH(title) >= 5),
    CONSTRAINT submissions_author_name_check CHECK (LENGTH(author_name) >= 2),
    CONSTRAINT submissions_author_email_check CHECK (author_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
--     CONSTRAINT submissions_token_check CHECK (LENGTH(token) = 64),
    CONSTRAINT submissions_expires_check CHECK (expires_at > created_at)
);

-- Tabela de feedback/comentários
CREATE TABLE feedback
(
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions (id) ON DELETE CASCADE,
    admin_id      UUID REFERENCES admins (id),

    -- Conteúdo do feedback
    content       TEXT NOT NULL,
    status        feedback_status  DEFAULT 'PENDING',
    section       VARCHAR(100), -- Seção específica comentada
    line_number   INTEGER,      -- Linha específica se aplicável

    -- Timestamps
    created_at    TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    resolved_at   TIMESTAMP,

    -- Constraints
    CONSTRAINT feedback_content_check CHECK (LENGTH(content) >= 10)
);

-- Tabela de histórico de versões
CREATE TABLE submission_versions
(
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id  UUID REFERENCES submissions (id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,

    -- Snapshot do conteúdo
    title          TEXT    NOT NULL,
    summary        TEXT,
    content        TEXT,
    metadata       JSONB            DEFAULT '{}',

    -- Metadados da versão
    created_by     VARCHAR(255), -- email do autor
    change_summary TEXT,
    created_at     TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE (submission_id, version_number),
    CONSTRAINT versions_number_check CHECK (version_number > 0)
);

-- Tabela de logs de auditoria
CREATE TABLE audit_logs
(
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id  UUID        NOT NULL,
    action     VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP        DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submission_attachments
(
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions (id) ON DELETE CASCADE,
    filename      VARCHAR(255) NOT NULL,
    url           TEXT         NOT NULL,
    file_type     VARCHAR(100) NOT NULL,
    size          INTEGER      NOT NULL,
    metadata      JSONB            DEFAULT '{}',
    created_at    TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT attachments_filename_check CHECK (LENGTH(filename) >= 1),
    CONSTRAINT attachments_size_check CHECK (size > 0),
    CONSTRAINT attachments_file_type_check CHECK (file_type IN
                                                  ('image/jpeg', 'image/png', 'image/gif', 'application/pdf',
                                                   'application/msword',
                                                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
);

CREATE TABLE IF NOT EXISTS file_uploads
(
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id        UUID REFERENCES submissions (id) ON DELETE CASCADE,
    original_name        VARCHAR(255)        NOT NULL,
    cloudinary_public_id VARCHAR(255) UNIQUE NOT NULL,
    url                  TEXT                NOT NULL,
    secure_url           TEXT                NOT NULL,
    format               VARCHAR(10)         NOT NULL,
    resource_type        VARCHAR(20)         NOT NULL CHECK (resource_type IN ('image', 'document')),
    size                 INTEGER             NOT NULL,
    width                INTEGER,
    height               INTEGER,
    tags                 JSONB            DEFAULT '[]',
    metadata             JSONB            DEFAULT '{}',
    uploaded_at          TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    uploaded_by          VARCHAR(255)        NOT NULL,

    -- Constraints
    CONSTRAINT file_uploads_size_check CHECK (size > 0),
    CONSTRAINT file_uploads_format_check CHECK (LENGTH(format) >= 1),
    CONSTRAINT file_uploads_name_check CHECK (LENGTH(original_name) >= 1)
);

-- Tabela de logs de ações administrativas
CREATE TABLE IF NOT EXISTS admin_action_logs
(
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id    UUID REFERENCES admins (id) ON DELETE CASCADE,
    action      VARCHAR(100) NOT NULL,
    target_type VARCHAR(50)  NOT NULL,
    target_id   VARCHAR(255) NOT NULL,
    details     JSONB            DEFAULT '{}',
    ip_address  INET,
    user_agent  TEXT,
    timestamp   TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT action_logs_action_check CHECK (LENGTH(action) >= 1),
    CONSTRAINT action_logs_target_type_check CHECK (target_type IN
                                                    ('submission', 'feedback', 'article', 'admin', 'multiple'))
);

-- Tabela de configurações de notificação
CREATE TABLE IF NOT EXISTS notification_settings
(
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id          UUID REFERENCES admins (id) ON DELETE CASCADE UNIQUE,
    new_submissions   BOOLEAN          DEFAULT true,
    changes_requested BOOLEAN          DEFAULT true,
    expiring_tokens   BOOLEAN          DEFAULT true,
    daily_summary     BOOLEAN          DEFAULT true,
    security_alerts   BOOLEAN          DEFAULT true,
    created_at        TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP        DEFAULT CURRENT_TIMESTAMP
);
