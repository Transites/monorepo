-- ===============================================
-- ÍNDICES DE PERFORMANCE
-- ===============================================

-- Índices únicos (já criados automaticamente)
-- submissions.token, admins.email, articles.slug

-- Índices compostos para queries frequentes
CREATE INDEX idx_submissions_status_created ON submissions(status, created_at DESC);
CREATE INDEX idx_submissions_author_email ON submissions(author_email);
CREATE INDEX idx_submissions_reviewed_by ON submissions(reviewed_by);
CREATE INDEX idx_submissions_expires_at ON submissions(expires_at) WHERE status IN ('DRAFT', 'CHANGES_REQUESTED');

-- Índices para busca full-text
CREATE INDEX idx_submissions_title_search ON submissions USING gin(to_tsvector('portuguese', title));
CREATE INDEX idx_submissions_content_search ON submissions USING gin(to_tsvector('portuguese', content));
CREATE INDEX idx_articles_title_search ON articles USING gin(to_tsvector('portuguese', title));
CREATE INDEX idx_articles_content_search ON articles USING gin(to_tsvector('portuguese', content));

-- Índices para arrays e JSONB
CREATE INDEX idx_submissions_keywords ON submissions USING gin(keywords);
CREATE INDEX idx_submissions_metadata ON submissions USING gin(metadata);
CREATE INDEX idx_articles_keywords ON articles USING gin(keywords);

-- Índices para feedback
CREATE INDEX idx_feedback_submission_status ON feedback(submission_id, status);
CREATE INDEX idx_feedback_admin_created ON feedback(admin_id, created_at DESC);

-- Índices para audit logs
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Índice parcial para artigos em destaque
CREATE INDEX idx_articles_featured ON articles(published_at DESC) WHERE is_featured = TRUE;

-- Índices para anexos
CREATE INDEX idx_attachments_submission ON submission_attachments(submission_id);
CREATE INDEX idx_attachments_file_type ON submission_attachments(file_type);
CREATE INDEX idx_attachments_created_at ON submission_attachments(created_at DESC);

-- Índices para performance
CREATE INDEX idx_file_uploads_submission ON file_uploads(submission_id);
CREATE INDEX idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);
CREATE INDEX idx_file_uploads_resource_type ON file_uploads(resource_type);
CREATE INDEX idx_file_uploads_format ON file_uploads(format);
CREATE INDEX idx_file_uploads_uploaded_at ON file_uploads(uploaded_at DESC);
CREATE INDEX idx_file_uploads_size ON file_uploads(size);

-- Índice para busca por tags
CREATE INDEX idx_file_uploads_tags ON file_uploads USING gin(tags);

-- Índice para busca por metadata
CREATE INDEX idx_file_uploads_metadata ON file_uploads USING gin(metadata);
