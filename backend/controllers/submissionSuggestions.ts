import { Request, Response, NextFunction } from 'express';
import SubmissionSuggestionsService from '../services/submissionSuggestions';
import responses from '../utils/responses';
import { handleControllerError } from '../utils/errorHandler';
import untypedLogger from '../middleware/logging';
import { LoggerWithAudit } from '../types/migration';

const logger = untypedLogger as unknown as LoggerWithAudit;

class SubmissionSuggestionsController {
  constructor(private readonly suggestionsService: SubmissionSuggestionsService) {}

  /**
   * GET /api/admin/review/submissions/:id/review-detail
   * Buscar submissão completa + sugestão pendente para a página de revisão
   */
  getSubmissionForReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: submissionId } = req.params;
      const result = await this.suggestionsService.getSubmissionForReview(submissionId);

      return responses.success(res, result, 'Submissão carregada para revisão');
    } catch (error: any) {
      return handleControllerError(error, res, next, {
        submissionId: req.params.id,
        adminId: req.user?.id,
      });
    }
  };

  /**
   * POST /api/admin/review/submissions/:id/suggestions
   * Criar sugestão de revisão
   */
  createSuggestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: submissionId } = req.params;
      const adminId = req.user!.id.toString();
      const {
        suggested_title,
        suggested_summary,
        suggested_content,
        suggested_category,
        suggested_keywords,
        suggested_metadata,
        notes,
      } = req.body;

      if (!notes?.trim()) {
        return responses.badRequest(res, 'Notas são obrigatórias', ['O campo notes é obrigatório']);
      }

      const suggestion = await this.suggestionsService.createSuggestion(
        submissionId,
        adminId,
        {
          suggested_title,
          suggested_summary,
          suggested_content,
          suggested_category,
          suggested_keywords,
          suggested_metadata,
          notes,
        }
      );

      logger.audit('Suggestion created via API', { submissionId, adminId, suggestionId: suggestion.id });

      return responses.created(res, { suggestion }, 'Sugestão criada com sucesso');
    } catch (error: any) {
      return handleControllerError(error, res, next, {
        submissionId: req.params.id,
        adminId: req.user?.id,
      });
    }
  };

  /**
   * GET /api/admin/review/submissions/:id/suggestions
   * Listar todas as sugestões de uma submissão
   */
  getSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: submissionId } = req.params;
      const suggestions = await this.suggestionsService.getSuggestionsBySubmission(submissionId);

      return responses.success(res, { suggestions }, 'Sugestões carregadas');
    } catch (error: any) {
      return handleControllerError(error, res, next, {
        submissionId: req.params.id,
        adminId: req.user?.id,
      });
    }
  };
}

export default SubmissionSuggestionsController;