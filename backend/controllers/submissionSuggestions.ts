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
   * GET /api/admin/revie
   * w/submissions/:id/review-detail
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

    /**
   * GET /api/author/submissions/:id/suggestions
   * Autor lista sugestões da sua submissão
   */
  getAuthorSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: submissionId } = req.params;
      const authorEmail = req.user!.email;

      // Verifica que a submissão pertence ao autor
      const isOwner = await this.suggestionsService.verifyAuthorOwnership(submissionId, authorEmail);
      if (!isOwner) {
        return responses.notFound(res, 'Submissão não encontrada');
      }

      const suggestions = await this.suggestionsService.getSuggestionsBySubmission(submissionId);
      return responses.success(res, { suggestions }, 'Sugestões carregadas');
    } catch (error: any) {
      return handleControllerError(error, res, next, {
        submissionId: req.params.id,
        operation: 'getAuthorSuggestions',
      });
    }
  };

  /**
   * POST /api/author/submissions/:id/suggestions/:suggestionId/accept
   * Autor aceita sugestão do curador
   */
  acceptSuggestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: submissionId, suggestionId } = req.params;
      const authorEmail = req.user!.email;

      const result = await this.suggestionsService.acceptSuggestion(
        submissionId, suggestionId, authorEmail
      );
      return responses.success(res, result, 'Sugestão aceita e aplicada com sucesso');
    } catch (error: any) {
      return handleControllerError(error, res, next, {
        submissionId: req.params.id,
        operation: 'acceptSuggestion',
      });
    }
  };

  /**
   * POST /api/author/submissions/:id/suggestions/:suggestionId/counter
   * Autor cria contra-proposta
   */
  counterSuggestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: submissionId, suggestionId } = req.params;
      const authorEmail = req.user!.email;
      const data = req.body;
      
      console.log('Body recebido:', JSON.stringify(req.body));
      console.log('notes:', req.body.notes);
      if (!data.notes?.trim()) {
        return responses.badRequest(res, 'Notas são obrigatórias', ['O campo notes é obrigatório']);
      }

      const suggestion = await this.suggestionsService.createAuthorCounterProposal(
        submissionId, authorEmail, suggestionId, data
      );

      logger.audit('Counter-proposal created via API', {
        submissionId, authorEmail, originalSuggestionId: suggestionId
      });

      return responses.created(res, { suggestion }, 'Contra-proposta enviada com sucesso');
    } catch (error: any) {
      return handleControllerError(error, res, next, {
        submissionId: req.params.id,
        operation: 'counterSuggestion',
      });
    }
  };

  /**
   * GET /api/author/submissions/:id/versions
   * Lista as versões de uma submissão específica
   */
  getSubmissionVersions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: submissionId } = req.params;
      const authorEmail = req.user!.email;
      const isOwner = await this.suggestionsService.verifyAuthorOwnership(submissionId, authorEmail);
      if (!isOwner) {
        return responses.notFound(res, 'Submissão não encontrada');
      }
      const versions = await this.suggestionsService.getVersionsBySubmission(submissionId);
      return responses.success(res, { versions }, 'Versões carregadas');
    } catch (error: any) {
      return handleControllerError(error, res, next, { operation: 'getSubmissionVersions' });
    }
  };

}

export default SubmissionSuggestionsController;