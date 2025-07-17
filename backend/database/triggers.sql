-- ===============================================
-- TRIGGERS DE AUDITORIA
-- ===============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar versão automática das submissões
CREATE OR REPLACE FUNCTION create_submission_version()
RETURNS TRIGGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    -- Só cria versão se o conteúdo mudou
    IF (OLD.title IS DISTINCT FROM NEW.title OR
        OLD.summary IS DISTINCT FROM NEW.summary OR
        OLD.content IS DISTINCT FROM NEW.content) THEN

        -- Busca próximo número de versão
        SELECT COALESCE(MAX(version_number), 0) + 1
        INTO next_version
        FROM submission_versions
        WHERE submission_id = NEW.id;

        -- Insere nova versão
        INSERT INTO submission_versions (
            submission_id, version_number, title, summary,
            content, metadata, created_by, change_summary
        ) VALUES (
            NEW.id, next_version, NEW.title, NEW.summary,
            NEW.content, NEW.metadata, NEW.author_email,
            'Atualização automática'
        );
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_submission_version_trigger
    AFTER UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION create_submission_version();

-- Função para limpeza automática de tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_submissions()
RETURNS void AS $$
BEGIN
    UPDATE submissions
    SET status = 'EXPIRED'
    WHERE status IN ('DRAFT', 'CHANGES_REQUESTED')
    AND expires_at < CURRENT_TIMESTAMP;
END;
$$ language 'plpgsql';

-- Função para audit log genérico
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Triggers de auditoria
CREATE TRIGGER audit_admins AFTER INSERT OR UPDATE OR DELETE ON admins
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_submissions AFTER INSERT OR UPDATE OR DELETE ON submissions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_articles AFTER INSERT OR UPDATE OR DELETE ON articles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER update_attachments_updated_at
    BEFORE UPDATE ON submission_attachments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View para estatísticas de upload
CREATE OR REPLACE VIEW upload_stats AS
SELECT
    resource_type,
    format,
    COUNT(*) as file_count,
    SUM(size) as total_size,
    AVG(size) as avg_size,
    MAX(size) as max_size,
    MIN(size) as min_size,
    MAX(uploaded_at) as last_upload
FROM file_uploads
GROUP BY resource_type, format
ORDER BY total_size DESC;

-- Função para limpeza de arquivos órfãos
CREATE OR REPLACE FUNCTION cleanup_orphaned_uploads()
    RETURNS TABLE(deleted_count INTEGER, orphaned_files TEXT[]) AS $$
DECLARE
    orphaned_record RECORD;
    deleted_files TEXT[] := '{}';
    delete_count INTEGER := 0;
BEGIN
    -- Buscar arquivos órfãos
    FOR orphaned_record IN
        SELECT fu.id, fu.original_name, fu.cloudinary_public_id
        FROM file_uploads fu
                 LEFT JOIN submissions s ON fu.submission_id = s.id
        WHERE s.id IS NULL
        LOOP
            -- Adicionar à lista de arquivos deletados
            deleted_files := array_append(deleted_files, orphaned_record.original_name);

            -- Deletar do banco
            DELETE FROM file_uploads WHERE id = orphaned_record.id;

            delete_count := delete_count + 1;
        END LOOP;

    RETURN QUERY SELECT delete_count, deleted_files;
END;
$$ language 'plpgsql';
