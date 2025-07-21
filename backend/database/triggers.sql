-- ===============================================
-- TRIGGERS DE AUDITORIA
-- ===============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE
    ON admins
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE
    ON submissions
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE
    ON articles
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Função para criar versão automática das submissões
CREATE OR REPLACE FUNCTION create_submission_version()
    RETURNS TRIGGER AS
$$
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
        INSERT INTO submission_versions (submission_id, version_number, title, summary,
                                         content, metadata, created_by, change_summary)
        VALUES (NEW.id, next_version, NEW.title, NEW.summary,
                NEW.content, NEW.metadata, NEW.author_email,
                'Atualização automática');
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_submission_version_trigger
    AFTER UPDATE
    ON submissions
    FOR EACH ROW
EXECUTE FUNCTION create_submission_version();

-- Função para limpeza automática de tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_submissions()
    RETURNS void AS
$$
BEGIN
    UPDATE submissions
    SET status = 'EXPIRED'
    WHERE status IN ('DRAFT', 'CHANGES_REQUESTED')
      AND expires_at < CURRENT_TIMESTAMP;
END;
$$ language 'plpgsql';

-- Função para audit log genérico
CREATE OR REPLACE FUNCTION audit_trigger_function()
    RETURNS TRIGGER AS
$$
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
CREATE TRIGGER audit_admins
    AFTER INSERT OR UPDATE OR DELETE
    ON admins
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_submissions
    AFTER INSERT OR UPDATE OR DELETE
    ON submissions
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_articles
    AFTER INSERT OR UPDATE OR DELETE
    ON articles
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER update_attachments_updated_at
    BEFORE UPDATE
    ON submission_attachments
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- View para estatísticas de upload
CREATE OR REPLACE VIEW upload_stats AS
SELECT resource_type,
       format,
       COUNT(*)         as file_count,
       SUM(size)        as total_size,
       AVG(size)        as avg_size,
       MAX(size)        as max_size,
       MIN(size)        as min_size,
       MAX(uploaded_at) as last_upload
FROM file_uploads
GROUP BY resource_type, format
ORDER BY total_size DESC;

-- Função para limpeza de arquivos órfãos
CREATE OR REPLACE FUNCTION cleanup_orphaned_uploads()
    RETURNS TABLE
            (
                deleted_count  INTEGER,
                orphaned_files TEXT[]
            )
AS
$$
DECLARE
    orphaned_record RECORD;
    deleted_files   TEXT[]  := '{}';
    delete_count    INTEGER := 0;
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

-- Triggers para atualização automática
CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE
    ON feedback
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE
    ON notification_settings
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Função para estatísticas do dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
    RETURNS TABLE
            (
                total_submissions BIGINT,
                pending_review    BIGINT,
                changes_requested BIGINT,
                approved          BIGINT,
                published         BIGINT,
                rejected          BIGINT,
                expiring_soon     BIGINT
            )
AS
$$
BEGIN
    RETURN QUERY
        SELECT COUNT(*)                                                 as total_submissions,
               COUNT(CASE WHEN status = 'UNDER_REVIEW' THEN 1 END)      as pending_review,
               COUNT(CASE WHEN status = 'CHANGES_REQUESTED' THEN 1 END) as changes_requested,
               COUNT(CASE WHEN status = 'APPROVED' THEN 1 END)          as approved,
               COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END)         as published,
               COUNT(CASE WHEN status = 'REJECTED' THEN 1 END)          as rejected,
               COUNT(CASE
                         WHEN expires_at < NOW() + INTERVAL '5 days' AND status NOT IN ('PUBLISHED', 'REJECTED')
                             THEN 1 END)                                as expiring_soon
        FROM submissions;
END;
$$ LANGUAGE 'plpgsql';

-- View para submissões com informações extras
CREATE OR REPLACE VIEW submissions_with_details AS
SELECT s.*,
       a.name                                             as admin_name,
       COUNT(fu.id)                                       as file_count,
       COALESCE(SUM(fu.size), 0)                          as total_size,
       EXTRACT(EPOCH FROM (s.expires_at - NOW())) / 86400 as days_until_expiry,
       CASE
           WHEN s.status = 'APPROVED' THEN true
           ELSE false
           END                                            as can_be_published,
       GREATEST(s.created_at, s.updated_at)               as last_activity,
       COUNT(f.id)                                        as feedback_count
FROM submissions s
         LEFT JOIN admins a ON s.reviewed_by = a.id
         LEFT JOIN file_uploads fu ON s.id = fu.submission_id
         LEFT JOIN feedback f ON s.id = f.submission_id
GROUP BY s.id, a.name;

-- Função para busca textual avançada
CREATE OR REPLACE FUNCTION search_submissions(
    search_term TEXT,
    status_filter TEXT[] DEFAULT NULL,
    category_filter TEXT[] DEFAULT NULL,
    result_limit INTEGER DEFAULT 50
)
    RETURNS TABLE
            (
                id           UUID,
                title        TEXT,
                author_name  VARCHAR(255),
                author_email VARCHAR(255),
                status       submission_status,
                category     VARCHAR(100),
                rank         REAL
            )
AS
$$
BEGIN
    RETURN QUERY
        SELECT s.id,
               s.title,
               s.author_name,
               s.author_email,
               s.status,
               s.category,
               ts_rank(
                   to_tsvector('portuguese',
                               s.title || ' ' || COALESCE(s.summary, '') || ' ' || COALESCE(s.content, '')),
                   plainto_tsquery('portuguese', search_term)
               ) as rank
        FROM submissions s
        WHERE to_tsvector('portuguese', s.title || ' ' || COALESCE(s.summary, '') || ' ' || COALESCE(s.content, ''))
            @@ plainto_tsquery('portuguese', search_term)
          AND (status_filter IS NULL OR s.status = ANY (status_filter::submission_status[]))
          AND (category_filter IS NULL OR s.category = ANY (category_filter))
        ORDER BY rank DESC, s.updated_at DESC
        LIMIT result_limit;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger para log automático de ações críticas
CREATE OR REPLACE FUNCTION log_submission_changes()
    RETURNS TRIGGER AS
$$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Log mudanças de status
        IF OLD.status != NEW.status THEN
            INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, details)
            VALUES (NEW.reviewed_by,
                    'status_change',
                    'submission',
                    NEW.id::TEXT,
                    jsonb_build_object(
                        'old_status', OLD.status,
                        'new_status', NEW.status,
                        'review_notes', NEW.review_notes
                    ));
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER log_submission_status_changes
    AFTER UPDATE
    ON submissions
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_submission_changes();

-- Inserir configurações padrão para admins existentes
INSERT INTO notification_settings (admin_id)
SELECT id
FROM admins
WHERE id NOT IN (SELECT admin_id FROM notification_settings);
