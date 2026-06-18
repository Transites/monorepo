import untypedLogger from '../middleware/logging';
import { LoggerWithAudit } from '../types/migration';
import { DatabaseException, SubmissionNotFoundException } from '../utils/exceptions';

const logger = untypedLogger as unknown as LoggerWithAudit;

export interface SuggestionData {
  suggested_title?: string;
  suggested_summary?: string;
  suggested_content?: string;
  suggested_category?: string;
  suggested_keywords?: string[];
  suggested_metadata?: Record<string, any>;
  notes: string;
}

export interface Suggestion {
  id: string;
  submission_id: string;
  admin_id: string;
  suggested_title?: string;
  suggested_summary?: string;
  suggested_content?: string;
  suggested_category?: string;
  suggested_keywords?: string[];
  suggested_metadata?: Record<string, any>;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date;
  resolved_at?: Date;
  admin_name?: string;
}

class SubmissionSuggestionsService {
  constructor(private readonly db: any) {}

  /**
   * Criar nova sugestão de revisão
   */
  async createSuggestion(
    submissionId: string,
    adminId: string,
    data: SuggestionData
  ): Promise<Suggestion> {
    try {
      // Verificar se a submissão existe
      const submissionResult = await this.db.query(
        'SELECT id FROM submissions WHERE id = $1',
        [submissionId]
      );

      if (submissionResult.rows.length === 0) {
        throw new SubmissionNotFoundException('Submissão não encontrada');
      }

      // Cancelar sugestões pendentes anteriores do mesmo admin para essa submissão
      await this.db.query(
        `UPDATE submission_suggestions
         SET status = 'rejected', resolved_at = NOW()
         WHERE submission_id = $1 AND admin_id = $2 AND status = 'pending'`,
        [submissionId, adminId]
      );

      // Criar nova sugestão
      const result = await this.db.query(
        `INSERT INTO submission_suggestions (
          submission_id, admin_id,
          suggested_title, suggested_summary, suggested_content,
          suggested_category, suggested_keywords, suggested_metadata,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          submissionId,
          adminId,
          data.suggested_title ?? null,
          data.suggested_summary ?? null,
          data.suggested_content ?? null,
          data.suggested_category ?? null,
          data.suggested_keywords ?? null,
          data.suggested_metadata ?? null,
          data.notes,
        ]
      );

      const suggestion = result.rows[0];

      // Atualizar status da submissão para CHANGES_REQUESTED
      await this.db.query(
        `UPDATE submissions SET status = 'CHANGES_REQUESTED', updated_at = NOW() WHERE id = $1`,
        [submissionId]
      );

      logger.audit('Suggestion created', { submissionId, adminId, suggestionId: suggestion.id });

      return suggestion;
    } catch (error: any) {
      logger.error('Error creating suggestion', { submissionId, adminId, error: error?.message });
      if (error instanceof SubmissionNotFoundException) throw error;
      throw new DatabaseException('Erro ao criar sugestão', error);
    }
  }

  /**
   * Listar sugestões de uma submissão
   */
  async getSuggestionsBySubmission(submissionId: string): Promise<Suggestion[]> {
    try {
      const result = await this.db.query(
        `SELECT ss.*, a.name as admin_name
         FROM submission_suggestions ss
         LEFT JOIN admins a ON ss.admin_id = a.id
         WHERE ss.submission_id = $1
         ORDER BY ss.created_at DESC`,
        [submissionId]
      );

      return result.rows;
    } catch (error: any) {
      logger.error('Error getting suggestions', { submissionId, error: error?.message });
      throw new DatabaseException('Erro ao buscar sugestões', error);
    }
  }

  /**
   * Buscar sugestão pendente de uma submissão (a mais recente)
   */
  async getPendingSuggestion(submissionId: string): Promise<Suggestion | null> {
    try {
      const result = await this.db.query(
        `SELECT ss.*, a.name as admin_name
         FROM submission_suggestions ss
         LEFT JOIN admins a ON ss.admin_id = a.id
         WHERE ss.submission_id = $1 AND ss.status = 'pending'
         ORDER BY ss.created_at DESC
         LIMIT 1`,
        [submissionId]
      );

      return result.rows[0] ?? null;
    } catch (error: any) {
      logger.error('Error getting pending suggestion', { submissionId, error: error?.message });
      throw new DatabaseException('Erro ao buscar sugestão pendente', error);
    }
  }

  /**
   * Buscar submissão completa com sugestão pendente (para a página de revisão)
   */
  async getSubmissionForReview(submissionId: string): Promise<any> {
    try {
      const submissionResult = await this.db.query(
        `SELECT s.*, a.name as assigned_admin_name
         FROM submissions s
         LEFT JOIN admins a ON s.assigned_to = a.id
         WHERE s.id = $1`,
        [submissionId]
      );

      if (submissionResult.rows.length === 0) {
        throw new SubmissionNotFoundException('Submissão não encontrada');
      }

      const submission = submissionResult.rows[0];
      const pendingSuggestion = await this.getPendingSuggestion(submissionId);

      return { submission, pendingSuggestion };
    } catch (error: any) {
      logger.error('Error getting submission for review', { submissionId, error: error?.message });
      if (error instanceof SubmissionNotFoundException) throw error;
      throw new DatabaseException('Erro ao buscar submissão para revisão', error);
    }
  }
}

export default SubmissionSuggestionsService;