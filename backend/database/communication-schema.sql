-- ===============================================
-- SCHEMA DE COMUNICAÇÃO E FEEDBACK
-- ===============================================

-- Tabela de comunicações
CREATE TABLE IF NOT EXISTS communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    direction VARCHAR(30) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    admin_id UUID REFERENCES admins(id),
    feedback_id UUID REFERENCES feedback(id),
    status VARCHAR(20) DEFAULT 'sent',
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT communications_type_check CHECK (type IN (
        'new_submission', 'feedback', 'token_resend', 'token_regenerated',
        'reactivated', 'custom_reminder', 'expiration_alert', 'expired_notification'
    )),
    CONSTRAINT communications_direction_check CHECK (direction IN (
        'admin_to_author', 'system_to_author', 'system_to_admin'
    )),
    CONSTRAINT communications_status_check CHECK (status IN ('sent', 'failed', 'pending'))
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    recipient_type VARCHAR(20) NOT NULL,
    recipient_count INTEGER DEFAULT 0,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT notifications_type_check CHECK (type IN (
        'new_submission', 'mass_expiration', 'daily_summary', 'security_alert'
    )),
    CONSTRAINT notifications_recipient_type_check CHECK (recipient_type IN ('admin', 'author', 'system'))
);

-- Tabela de lembretes agendados
CREATE TABLE IF NOT EXISTS scheduled_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,

    -- Constraints
    CONSTRAINT reminders_type_check CHECK (type IN ('feedback_reminder', 'expiration_reminder')),
    CONSTRAINT reminders_status_check CHECK (status IN ('pending', 'sent', 'cancelled'))
);

-- Índices para performance
CREATE INDEX idx_communications_submission ON communications(submission_id);
CREATE INDEX idx_communications_admin ON communications(admin_id);
CREATE INDEX idx_communications_type ON communications(type);
CREATE INDEX idx_communications_direction ON communications(direction);
CREATE INDEX idx_communications_recipient ON communications(recipient_email);
CREATE INDEX idx_communications_created_at ON communications(created_at DESC);

CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_submission ON notifications(submission_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_scheduled_reminders_submission ON scheduled_reminders(submission_id);
CREATE INDEX idx_scheduled_reminders_scheduled_for ON scheduled_reminders(scheduled_for);
CREATE INDEX idx_scheduled_reminders_status ON scheduled_reminders(status);

-- Trigger para atualização automática
CREATE TRIGGER update_communications_updated_at
    BEFORE UPDATE ON communications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para estatísticas de comunicação
CREATE OR REPLACE FUNCTION get_communication_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
    communication_type VARCHAR(50),
    direction VARCHAR(30),
    total_count BIGINT,
    successful_count BIGINT,
    failed_count BIGINT,
    success_rate NUMERIC(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.type as communication_type,
        c.direction,
        COUNT(*) as total_count,
        COUNT(CASE WHEN c.status = 'sent' THEN 1 END) as successful_count,
        COUNT(CASE WHEN c.status = 'failed' THEN 1 END) as failed_count,
        ROUND(
            COUNT(CASE WHEN c.status = 'sent' THEN 1 END) * 100.0 / COUNT(*),
            2
        ) as success_rate
    FROM communications c
    WHERE c.created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY c.type, c.direction
    ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql;

-- View para histórico de comunicações com detalhes
CREATE OR REPLACE VIEW communication_history_view AS
SELECT
    c.*,
    s.title as submission_title,
    s.author_name,
    a.name as admin_name,
    EXTRACT(EPOCH FROM (NOW() - c.created_at)) / 3600 as hours_ago
FROM communications c
LEFT JOIN submissions s ON c.submission_id = s.id
LEFT JOIN admins a ON c.admin_id = a.id
ORDER BY c.created_at DESC;
