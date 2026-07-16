import untypedLogger from '../middleware/logging';
import { LoggerWithAudit } from '../types/migration';
import { DatabaseException, SubmissionNotFoundException, ValidationException } from '../utils/exceptions';
import submissionService from '../services/submission';
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
  admin_id?: string;
  author_email?: string;
  created_by: 'admin' | 'author';
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
   * Criar sugestão do curador
   */
  async createSuggestion(
    submissionId: string,
    adminId: string,
    data: SuggestionData
  ): Promise<Suggestion> {
    try {
      const submissionResult = await this.db.query(
        'SELECT id FROM submissions WHERE id = $1',
        [submissionId]
      );

      if (submissionResult.rows.length === 0) {
        throw new SubmissionNotFoundException('Submissão não encontrada');
      }

      // Cancela sugestões pendentes anteriores do mesmo admin
      await this.db.query(
        `UPDATE submission_suggestions
         SET status = 'rejected', resolved_at = NOW()
         WHERE submission_id = $1 AND admin_id = $2 AND status = 'pending'`,
        [submissionId, adminId]
      );

      const result = await this.db.query(
        `INSERT INTO submission_suggestions (
          submission_id, admin_id, created_by,
          suggested_title, suggested_summary, suggested_content,
          suggested_category, suggested_keywords, suggested_metadata,
          notes
        ) VALUES ($1, $2, 'admin', $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          submissionId, adminId,
          data.suggested_title ?? null,
          data.suggested_summary ?? null,
          data.suggested_content ?? null,
          data.suggested_category ?? null,
          data.suggested_keywords ?? null,
          data.suggested_metadata ?? null,
          data.notes,
        ]
      );

      // Atualiza status da submissão para CHANGES_REQUESTED
      await this.db.query(
        `UPDATE submissions SET status = 'CHANGES_REQUESTED', updated_at = NOW() WHERE id = $1`,
        [submissionId]
      );

      logger.audit('Suggestion created by admin', {
        submissionId, adminId, suggestionId: result.rows[0].id
      });

      return result.rows[0];
    } catch (error: any) {
      logger.error('Error creating suggestion', { submissionId, adminId, error: error?.message });
      if (error instanceof SubmissionNotFoundException) throw error;
      throw new DatabaseException('Erro ao criar sugestão', error);
    }
  }

  /**
   * Autor cria contra-proposta
   * Rejeita a sugestão do curador e cria uma nova com created_by = 'author'
   */
  async createAuthorCounterProposal(
    submissionId: string,
    authorEmail: string,
    originalSuggestionId: string,
    data: SuggestionData
  ): Promise<Suggestion> {
    try {
      // Verifica que a submissão pertence ao autor
      const submissionResult = await this.db.query(
        'SELECT id, author_email FROM submissions WHERE id = $1',
        [submissionId]
      );

      if (submissionResult.rows.length === 0) {
        throw new SubmissionNotFoundException('Submissão não encontrada');
      }

      if (submissionResult.rows[0].author_email !== authorEmail) {
        throw new ValidationException('Acesso negado', ['Você não é o autor desta submissão']);
      }

      return await this.db.transaction(async (client: any) => {
        
        // Rejeita a sugestão original (Ver se é uma boa ideia apagar)
        await client.query(
          `UPDATE submission_suggestions
           SET status = 'rejected', resolved_at = NOW()
           WHERE id = $1 AND submission_id = $2`,
          [originalSuggestionId, submissionId]
        );

        // Atualiza a submissão original (Rascunho Oficial)
        const updatedSubmissionResult = await client.query(
          `UPDATE submissions 
           SET title = COALESCE($1, title),
               summary = COALESCE($2, summary),
               content = COALESCE($3, content),
               category = COALESCE($4, category),
               keywords = COALESCE($5, keywords),
               status = 'UNDER_REVIEW',
               updated_at = NOW()
           WHERE id = $6
           RETURNING *`,
          [
            data.suggested_title ?? null,
            data.suggested_summary ?? null,
            data.suggested_content ?? null,
            data.suggested_category ?? null,
            data.suggested_keywords ?? null,
            submissionId
          ]
        );

        const updatedSubmission = updatedSubmissionResult.rows[0];

        // Cria uma nova versão!
        await submissionService.createVersionSnapshot(submissionId, {
            title: updatedSubmission.title,
            summary: updatedSubmission.summary,
            content: updatedSubmission.content,
            metadata: updatedSubmission.metadata || {},
            created_by: 'author',
            change_summary: data.notes
        }, client);

        logger.audit('Counter-proposal applied to submission as new version', {
          submissionId, 
          authorEmail, 
          originalSuggestionId
        });

        return updatedSubmission;
      });
    } catch (error: any) {
      logger.error('Error creating counter-proposal', { submissionId, authorEmail, error: error?.message });
      if (error instanceof SubmissionNotFoundException || error instanceof ValidationException) throw error;
      throw new DatabaseException('Erro ao criar contra-proposta', error);
    }
  }

  /**
   * Autor aceita sugestão — aplica os campos na submissão original
   */
  async acceptSuggestion(
    submissionId: string,
    suggestionId: string,
    authorEmail: string
  ): Promise<{ success: boolean }> {
    try {
      const submissionResult = await this.db.query(
        'SELECT * FROM submissions WHERE id = $1',
        [submissionId]
      );

      if (submissionResult.rows.length === 0) {
        throw new SubmissionNotFoundException('Submissão não encontrada');
      }

      if (submissionResult.rows[0].author_email !== authorEmail) {
        throw new ValidationException('Acesso negado', ['Você não é o autor desta submissão']);
      }

      const suggestionResult = await this.db.query(
        `SELECT * FROM submission_suggestions
         WHERE id = $1 AND submission_id = $2 AND status = 'pending'`,
        [suggestionId, submissionId]
      );

      if (suggestionResult.rows.length === 0) {
        throw new SubmissionNotFoundException('Sugestão não encontrada ou já resolvida');
      }

      const s = suggestionResult.rows[0];

      // Monta os campos a atualizar — só os que o curador sugeriu
      const fields: string[] = [];
      const values: any[] = [];
      let i = 1;

      const mapping: Record<string, string> = {
        suggested_title:    'title',
        suggested_summary:  'summary',
        suggested_content:  'content',
        suggested_category: 'category',
        suggested_keywords: 'keywords',
        suggested_metadata: 'metadata',
      };

      Object.entries(mapping).forEach(([suggField, subField]) => {
        if (s[suggField] !== null && s[suggField] !== undefined) {
          fields.push(`${subField} = $${i}`);
          values.push(s[suggField]);
          i++;
        }
      });

      // Aplica os campos na submissão e volta pra UNDER_REVIEW
      if (fields.length > 0) {
        fields.push(`updated_at = $${i}`, `status = $${i + 1}`);
        values.push(new Date(), 'UNDER_REVIEW');
        i += 2;
        values.push(submissionId);

        await this.db.query(
          `UPDATE submissions SET ${fields.join(', ')} WHERE id = $${i}`,
          values
        );
      }

      // Marca a sugestão como aceita
      await this.db.query(
        `UPDATE submission_suggestions
         SET status = 'accepted', resolved_at = NOW()
         WHERE id = $1`,
        [suggestionId]
      );

      logger.audit('Suggestion accepted by author', { submissionId, suggestionId, authorEmail });

      return { success: true };
    } catch (error: any) {
      logger.error('Error accepting suggestion', { submissionId, suggestionId, error: error?.message });
      if (error instanceof SubmissionNotFoundException || error instanceof ValidationException) throw error;
      throw new DatabaseException('Erro ao aceitar sugestão', error);
    }
  }

  /**
   * Listar todas as sugestões de uma submissão
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
   * Buscar sugestão pendente de uma submissão
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
   * Buscar submissão completa com sugestão pendente (para página de revisão do curador)
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
      const suggestions = await this.getSuggestionsBySubmission(submissionId);

      return { submission, suggestions };
    } catch (error: any) {
      logger.error('Error getting submission for review', { submissionId, error: error?.message });
      if (error instanceof SubmissionNotFoundException) throw error;
      throw new DatabaseException('Erro ao buscar submissão para revisão', error);
    }
  }

  async verifyAuthorOwnership(submissionId: string, authorEmail: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT author_email FROM submissions WHERE id = $1',
      [submissionId]
    );
    if (result.rows.length === 0) return false;
    return result.rows[0].author_email === authorEmail;
  }

  // Adicionar em SubmissionSuggestionsService
  async getVersionsBySubmission(submissionId: string): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT version_number, title, summary, content, change_summary, created_by, created_at
        FROM submission_versions
        WHERE submission_id = $1
        ORDER BY version_number DESC`,
        [submissionId]
      );
      return result.rows;
    } catch (error: any) {
      logger.error('Error getting versions', { submissionId, error: error?.message });
      throw new DatabaseException('Erro ao buscar versões', error);
    }
  }


}



export default SubmissionSuggestionsService;