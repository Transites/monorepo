-- ===============================================
-- TRIGGERS DE AUDITORIA (CLEANED FOR REACT FRONTEND)
-- ===============================================
--
-- This file contains only triggers and functions needed for the submissions table
-- used by the React frontend. All admin workflow, authentication, and file management 
-- triggers have been archived to /database/archive/archived-triggers.sql
--
-- The React frontend is display-only and doesn't need complex workflow triggers.

-- Função para atualizar updated_at automaticamente (ESSENTIAL - keep this)
CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for submissions table updated_at (USED - keep for data integrity)
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE
    ON submissions
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();