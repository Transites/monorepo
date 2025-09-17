import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import AdminReviewService from '../services/adminReview';
import ResponseHelpers from '../utils/responses';
import {
	SubmissionFilters,
	BulkAction,
	PublishRequest,
	FeedbackStatus,
	AdminFeedback, SubmissionStatus, ReviewStatus
} from '../types/admin';

class AdminReviewController {
	constructor(
		private readonly adminReviewService: AdminReviewService,
		private readonly logger: any,
		private readonly responses: typeof ResponseHelpers
	) {
	}

	/**
	 * GET /api/admin/review/dashboard
	 * Dashboard completo para admin
	 */
	public getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const adminId = req.user!.id.toString();
			const dashboard = await this.adminReviewService.getDashboard(adminId);

			this.responses.success(res, {
				dashboard,
				timestamp: new Date().toISOString()
			}, 'Dashboard carregado com sucesso');

		} catch (error) {
			this.logger.error('Error getting admin dashboard', {
				adminId: req.user?.id,
				error: error instanceof Error ? error.message : String(error)
			});
			next(error);
		}
	};

	/**
	 * GET /api/admin/review/submissions
	 * Listar submissões com filtros
	 */
	public getSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				this.responses.badRequest(res, 'Filtros inválidos', errors.array());
				return;
			}

			const adminId = req.user!.id.toString();
			const filters: SubmissionFilters = {
				status: req.query.status as SubmissionStatus[],
				category: req.query.category as string[],
				authorEmail: req.query.authorEmail as string,
				adminId: req.query.adminId as string,
				dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
				dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
				search: req.query.search as string,
				expiringDays: req.query.expiringDays ? parseInt(req.query.expiringDays as string) : undefined,
				hasFiles: req.query.hasFiles ? req.query.hasFiles === 'true' : undefined,
				sortBy: req.query.sortBy as any || 'updated_at',
				sortOrder: req.query.sortOrder as any || 'desc',
				page: parseInt(req.query.page as string) || 1,
				limit: parseInt(req.query.limit as string) || 20
			};

			const result = await this.adminReviewService.getSubmissions(filters, adminId);

			this.responses.success(res, result, 'Submissões carregadas com sucesso');

		} catch (error) {
			this.logger.error('Error getting submissions for admin', {
				adminId: req.user?.id,
				filters: req.query,
				error: error instanceof Error ? error.message : String(error)
			});
			next(error);
		}
	};

	/**
	 * PUT /api/admin/review/submissions/:id/review
	 * Revisar submissão
	 */
	public reviewSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				this.responses.badRequest(res, 'Dados de revisão inválidos', errors.array());
				return;
			}

			const { id: submissionId } = req.params;
			const adminId = req.user!.id.toString();
			const { status, notes, rejectionReason } = req.body;

			const review = await this.adminReviewService.reviewSubmission(
				submissionId,
				adminId,
				status as FeedbackStatus,
				notes,
				rejectionReason
			);

			this.logger.audit('Submission reviewed via API', {
				submissionId,
				adminId,
				status,
				hasNotes: !!notes,
				hasRejectionReason: !!rejectionReason
			});

			this.responses.success(res, {
				review,
				message: this.getReviewMessage(status)
			}, 'Revisão realizada com sucesso');

		} catch (error) {
			this.logger.error('Error reviewing submission', {
				submissionId: req.params.id,
				adminId: req.user?.id,
				status: req.body.status,
				error: error instanceof Error ? error.message : String(error)
			});
			next(error);
		}
	};

	/**
	 * POST /api/admin/review/submissions/:id/feedback
	 * Enviar feedback para autor
	 */
	public sendFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				this.responses.badRequest(res, 'Dados de feedback inválidos', errors.array());
				return;
			}

			const { id: submissionId } = req.params;
			const adminId = req.user!.id.toString();
			const { content, isPublic = true } = req.body;

			const feedback: AdminFeedback = await this.adminReviewService.sendFeedback(
				submissionId,
				adminId,
				content,
			);

			this.logger.audit('Feedback sent via API', {
				submissionId,
				adminId,
				feedbackId: feedback.id,
				contentLength: content.length,
				isPublic
			});

			this.responses.created(res, {
				feedback,
				message: 'Feedback enviado com sucesso'
			}, 'Feedback enviado para o autor');

		} catch (error) {
			this.logger.error('Error sending feedback', {
				submissionId: req.params.id,
				adminId: req.user?.id,
				contentLength: req.body.content?.length || 0,
				error: error instanceof Error ? error.message : String(error)
			});
			next(error);
		}
	};

	/**
	 * POST /api/admin/review/submissions/:id/publish
	 * Publicar submissão como artigo
	 */
	public publishSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				this.responses.badRequest(res, 'Dados de publicação inválidos', errors.array());
				return;
			}

			const { id: submissionId } = req.params;
			const adminId = req.user!.id.toString();
			const publishRequest: PublishRequest = {
				submissionId,
				publishNotes: req.body.publishNotes,
				categoryOverride: req.body.categoryOverride,
				keywordsOverride: req.body.keywordsOverride
			};

			const result = await this.adminReviewService.publishSubmission(
				submissionId,
				adminId,
				publishRequest
			);

			if (result.success) {
				this.logger.audit('Article published via API', {
					submissionId,
					articleId: result.articleId,
					adminId,
					publishedAt: result.publishedAt
				});

				this.responses.success(res, {
					articleId: result.articleId,
					publishedAt: result.publishedAt,
					message: 'Artigo publicado com sucesso',
					articleUrl: result.articleUrl
				}, 'Submissão publicada como artigo');
			} else {
				this.responses.error(res, result.error || 'Erro ao publicar artigo', 400);
			}

		} catch (error) {
			this.logger.error('Error publishing submission', {
				submissionId: req.params.id,
				adminId: req.user?.id,
				publishRequest: req.body,
				error: error instanceof Error ? error.message : String(error)
			});
			next(error);
		}
	};

	/**
	 * GET /api/admin/review/submissions/search
	 * Buscar submissões
	 */
	public searchSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				this.responses.badRequest(res, 'Parâmetros de busca inválidos', errors.array());
				return;
			}

			const adminId = req.user!.id.toString();
			const { q: query, status, category } = req.query;

			if (!query || (query as string).length < 2) {
				this.responses.badRequest(res, 'Query de busca deve ter pelo menos 2 caracteres');
				return;
			}

			const filters = {
				status: status ? (status as string).split(',') as SubmissionStatus[] : undefined,
				category: category ? (category as string).split(',') : undefined
			};

			const submissions = await this.adminReviewService.searchSubmissions(
				query as string,
				adminId,
				filters
			);

			this.responses.success(res, {
				submissions,
				query,
				count: submissions.length
			}, 'Busca realizada com sucesso');

		} catch (error) {
			this.logger.error('Error searching submissions', {
				adminId: req.user?.id,
				query: req.query.q,
				error: error instanceof Error ? error.message : String(error)
			});
			next(error);
		}
	};

	/**
	 * POST /api/admin/review/submissions/bulk-action
	 * Ações em lote
	 */
	public performBulkAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				const errorMessage = errors.array().map(err => `${err.msg}`).join(', ');
				this.responses.badRequest(res, `Dados de ação em lote inválidos: ${errorMessage}`, { errors: errors.array() });
				return;
			}

			const adminId = req.user!.id.toString();
			const bulkAction: BulkAction = {
				submissionIds: req.body.submissionIds,
				action: req.body.action,
				reason: req.body.reason,
				notes: req.body.notes
			};

			const result = await this.adminReviewService.performBulkAction(bulkAction, adminId);

			this.logger.audit('Bulk action performed via API', {
				adminId,
				action: bulkAction.action,
				submissionCount: bulkAction.submissionIds.length,
				successful: result.summary.successful,
				failed: result.summary.failed
			});

			if (result.summary.failed > 0) {
				this.responses.success(res, result,
					`Ação realizada: ${result.summary.successful} sucessos, ${result.summary.failed} falhas`);
			} else {
				this.responses.success(res, result,
					`Ação realizada com sucesso em ${result.summary.successful} submissões`);
			}

		} catch (error) {
			this.logger.error('Error performing bulk action', {
				adminId: req.user?.id,
				action: req.body.action,
				submissionCount: req.body.submissionIds?.length || 0,
				error: error instanceof Error ? error.message : String(error)
			});
			next(error);
		}
	};

	/**
	 * GET /api/admin/review/activity-log
	 * Histórico de ações do admin
	 */
	public getActivityLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const adminId = req.user!.id.toString();
			const filters = {
				action: req.query.action as string,
				targetType: req.query.targetType as string,
				dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
				dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
				page: parseInt(req.query.page as string) || 1,
				limit: parseInt(req.query.limit as string) || 50
			};

			const result = await this.adminReviewService.getAdminActionLog(adminId, filters);

			this.responses.success(res, {
				logs: result.logs,
				total: result.total,
				filters
			}, 'Histórico de ações carregado');

		} catch (error) {
			this.logger.error('Error getting activity log', {
				adminId: req.user?.id,
				filters: req.query,
				error: error instanceof Error ? error.message : String(error)
			});
			next(error);
		}
	};

	// =============================================================================
	// MÉTODOS PRIVADOS
	// =============================================================================

	private getReviewMessage(status: ReviewStatus): string {
		switch (status) {
			case 'approved':
				return 'Submissão aprovada. Agora pode ser publicada.';
			case 'rejected':
				return 'Submissão rejeitada. Autor será notificado.';
			case 'changes_requested':
				return 'Correções solicitadas. Autor será notificado.';
			case 'pending':
				return 'Revisão iniciada.';
			default:
				return 'Revisão processada.';
		}
	}
}

export default AdminReviewController;
