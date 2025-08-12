import {Request, Response, NextFunction} from 'express';
import submissionService from '../services/submission';
import emailService from '../services/email';
import responses from '../utils/responses';
import {validationResult} from 'express-validator';
import {handleControllerError} from '../utils/errorHandler';
import untypedLogger from '../middleware/logging';
import {LoggerWithAudit} from "../types/migration";

const logger = untypedLogger as unknown as LoggerWithAudit;

interface SubmissionRequest extends Request {
    submission?: any;
    tokenInfo?: any;
    authorEmail?: string;
}

class SubmissionController {
    /**
     * POST /api/submissions
     * Criar nova submissão
     */
    async createSubmission(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const submissionData = req.body;

            // Criar submissão
            const submission = await submissionService.createSubmission(submissionData);

            logger.audit('New submission created', {
                submissionId: submission.id,
                authorEmail: submission.author_email,
                title: submission.title,
                ip: req.ip
            });

            return responses.created(res, {
                submission: {
                    id: submission.id,
                    token: submission.token,
                    title: submission.title,
                    status: submission.status,
                    author_name: submission.author_name,
                    created_at: submission.created_at,
                    expires_at: submission.expires_at
                },
                accessUrl: `${process.env.FRONTEND_URL}/submissao/editar/${submission.token}`,
                instructions: 'Token de acesso enviado por email. Salve este link para acessar sua submissão.'
            }, 'Submissão criada com sucesso');

        } catch (error: any) {
            return handleControllerError(error, res, next, {
                submissionId: undefined,
                authorEmail: req.body.author_email,
                title: req.body.title,
                ip: req.ip
            });
        }
    }

    /**
     * GET /api/submissions/id/:id
     * Buscar submissão por ID
     */
    async getSubmissionById(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const {id} = req.params;
            const includeVersions = req.query.include_versions === 'true';

            // Validar UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                return responses.badRequest(res, 'ID inválido', ['ID deve ser um UUID válido']);
            }

            const result = await submissionService.getSubmissionById(id, includeVersions);

            const response = {
                submission: result.submission,
                canEdit: ['DRAFT', 'CHANGES_REQUESTED'].includes(result.submission.status),
                canSubmitForReview: result.submission.status === 'DRAFT' ||
                    (result.submission.status === 'CHANGES_REQUESTED' &&
                        result.submission.feedback?.length > 0)
            };

            return responses.success(res, response, 'Submissão encontrada');

        } catch (error: any) {
            return handleControllerError(error, res, next, {
                submissionId: req.params.id,
                ip: req.ip
            });
        }
    }

    /**
     * GET /api/submissions/:token
     * Buscar submissão por token
     */
    async getSubmissionByToken(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const {token} = req.params;
            const includeVersions = req.query.include_versions === 'true';

            const result = await submissionService.getSubmissionByToken(token, includeVersions);

            const response = {
                submission: result.submission,
                tokenInfo: result.tokenInfo,
                canEdit: ['DRAFT', 'CHANGES_REQUESTED'].includes(result.submission.status),
                canSubmitForReview: result.submission.status === 'DRAFT' ||
                    (result.submission.status === 'CHANGES_REQUESTED' &&
                        result.submission.feedback?.length > 0)
            };

            return responses.success(res, response, 'Submissão encontrada');

        } catch (error: any) {
            return handleControllerError(error, res, next, {
                token: req.params.token?.substring(0, 8) + '...',
                ip: req.ip
            });
        }
    }

    /**
     * PUT /api/submissions/:token
     * Atualizar submissão
     */
    async updateSubmission(req: SubmissionRequest, res: Response, next: NextFunction): Promise<any> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const updateData = req.body;
            const submission = req.submission; // Vem do middleware de token
            const authorEmail = req.authorEmail!; // Vem do middleware de validação de email

            // Atualizar submissão
            const updatedSubmission = await submissionService.updateSubmission(
                submission.id,
                updateData,
                authorEmail
            );

            // Calcular estatísticas de completude
            const stats = await submissionService.getSubmissionStats(submission.id);

            return responses.updated(res, {
                submission: updatedSubmission,
                completeness: stats.completeness,
                autoSaved: true,
                lastUpdated: updatedSubmission.updated_at
            }, 'Submissão atualizada com sucesso');

        } catch (error: any) {
            return handleControllerError(error, res, next, {
                submissionId: req.submission?.id,
                token: req.params.token?.substring(0, 8) + '...',
                ip: req.ip
            });
        }
    }

    /**
     * POST /api/submissions/:token/submit
     * Enviar submissão para revisão
     */
    async submitForReview(req: SubmissionRequest, res: Response, next: NextFunction): Promise<any> {
        try {
            const submission = req.submission;
            const authorEmail = req.authorEmail!;

            // Enviar para revisão
            const updatedSubmission = await submissionService.submitForReview(
                submission.id,
                authorEmail
            );

            return responses.success(res, {
                submission: {
                    id: updatedSubmission.id,
                    status: updatedSubmission.status,
                    submitted_at: updatedSubmission.submitted_at,
                    title: updatedSubmission.title
                },
                message: 'Sua submissão foi enviada para revisão. Você receberá um email quando houver feedback.',
                nextSteps: [
                    'Aguarde feedback dos revisores',
                    'Você receberá um email quando houver novidades',
                    'O token foi renovado automaticamente'
                ]
            }, 'Submissão enviada para revisão com sucesso');

        } catch (error: any) {
            return handleControllerError(error, res, next, {
                submissionId: req.submission?.id,
                token: req.params.token?.substring(0, 8) + '...',
                ip: req.ip
            });
        }
    }

    /**
     * GET /api/submissions/:token/preview
     * Gerar preview da submissão
     */
    async getSubmissionPreview(req: SubmissionRequest, res: Response, next: NextFunction): Promise<any> {
        try {
            const submission = req.submission;

            const preview = await submissionService.generatePreview(submission.id);

            return responses.success(res, {
                preview,
                disclaimers: [
                    'Este é um preview de como seu artigo apareceria publicado',
                    'Formatação final pode variar ligeiramente',
                    'Imagens e anexos serão processados durante a publicação'
                ]
            }, 'Preview gerado com sucesso');

        } catch (error: any) {
            return handleControllerError(error, res, next, {
                submissionId: req.submission?.id,
                operation: 'generatePreview'
            });
        }
    }

    /**
     * GET /api/submissions/:token/stats
     * Obter estatísticas da submissão
     */
    async getSubmissionStats(req: SubmissionRequest, res: Response, next: NextFunction): Promise<any> {
        try {
            const submission = req.submission;

            const stats = await submissionService.getSubmissionStats(submission.id);

            return responses.success(res, {
                stats: {
                    content: stats.contentStats,
                    completeness: stats.completeness,
                    versions: stats.version_count,
                    attachments: stats.attachment_count,
                    feedback: stats.feedback_count,
                    timeline: {
                        daysSinceCreation: Math.floor(stats.days_since_creation),
                        daysToExpiry: Math.ceil(stats.days_to_expiry)
                    }
                }
            }, 'Estatísticas da submissão');

        } catch (error: any) {
            return handleControllerError(error, res, next, {
                submissionId: req.submission?.id,
                operation: 'getStats'
            });
        }
    }

    /**
     * GET /api/author/submissions
     * Listar submissões do autor (requer email)
     */
    async getAuthorSubmissions(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const {email} = req.query;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await submissionService.getSubmissionsByAuthor(
                email as string,
                {page, limit}
            );

            return responses.success(res, {
                submissions: result.submissions,
                pagination: result.pagination
            }, 'Submissões do autor');

        } catch (error: any) {
            return handleControllerError(error, res, next, {
                email: req.query.email,
                operation: 'getAuthorSubmissions'
            });
        }
    }

    /**
     * POST /api/submissions/:token/auto-save
     * Auto-save (salvamento automático)
     */
    async autoSave(req: SubmissionRequest, res: Response, next: NextFunction): Promise<any> {
        try {
            const updateData = req.body;
            const submission = req.submission;

            // Auto-save com dados mínimos (sem validação rigorosa)
            const updatedSubmission = await submissionService.updateSubmission(
                submission.id,
                updateData,
                submission.author_email
            );

            return responses.success(res, {
                autoSaved: true,
                lastSaved: updatedSubmission.updated_at,
                message: 'Rascunho salvo automaticamente'
            });

        } catch (error: any) {
            // Auto-save falhas não devem bloquear o usuário
            logger.warn('Auto-save failed', {
                submissionId: req.submission?.id,
                error: error?.message
            });

            return responses.success(res, {
                autoSaved: false,
                error: 'Falha no salvamento automático',
                message: 'Continue editando, tentaremos salvar novamente'
            });
        }
    }

    /**
     * POST /api/submissions/edit
     * Verificar artigos em progresso por email
     */
    async checkInProgressArticles(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const {email} = req.body;

            // Buscar submissões em progresso do autor
            const result = await submissionService.getInProgressSubmissionsByAuthor(email);

            if (result.submissions.length === 0) {
                return responses.notFound(res, 'Nenhum artigo em progresso encontrado para este email');
            }

            // Enviar email com links de acesso (async - não bloqueia)
            setImmediate(async () => {
                try {
                    await emailService.sendSubmissionAccessLinks(
                        email,
                        result.submissions
                    );
                } catch (emailError: any) {
                    logger.error('Failed to send submission access links email', {
                        authorEmail: email,
                        error: emailError?.message
                    });
                }
            });

            logger.audit('In-progress submissions checked', {
                authorEmail: email,
                submissionCount: result.submissions.length
            });

            return responses.success(res, {
                count: result.submissions.length,
                message: `Um email com os acessos para os ${result.submissions.length} artigos em progresso foi enviado para ${email}`
            });

        } catch (error: any) {
            return handleControllerError(error, res, next, {
                email: req.body.email,
                operation: 'checkInProgressArticles'
            });
        }
    }

    /**
     * GET /api/submissions
     * Listar todas as submissões com suporte a busca e paginação
     */
    async listSubmissions(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            // Extrair parâmetros de busca e paginação
            const requestedSubmissionState = validateListSubmissionsState(req.query.requestedState as string | undefined);
            const searchTerm = req.query.search as string | undefined;
            const top = parseInt(req.query.top as string) || 10;
            const skip = parseInt(req.query.skip as string) || 0;

            // Buscar submissões
            const result = await submissionService.listSubmissions(searchTerm, requestedSubmissionState, {top, skip});

            return responses.success(res, {
                submissions: result.submissions,
                pagination: result.pagination
            }, 'Submissões listadas com sucesso');

        } catch (error: any) {
            return handleControllerError(error, res, next, {
                searchTerm: req.query.search,
                operation: 'listSubmissions'
            });
        }
    }
}

function validateListSubmissionsState(submissionState: string | undefined): string | undefined {
    if (submissionState != undefined && (submissionState === 'DRAFT' || submissionState === 'READY' || submissionState === 'BOTH')) {
        return submissionState;
    }
    return undefined;
}

export default new SubmissionController();
