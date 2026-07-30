/**
 * Testes para AdminReviewController
 */
const { validationResult } = require('express-validator');
const AdminReviewControllerModule = require('../../controllers/adminReview');
// Garante a importação correta seja CommonJS ou ESModule
const AdminReviewController = AdminReviewControllerModule.default || AdminReviewControllerModule;

jest.mock('express-validator', () => ({
    validationResult: jest.fn()
}));

describe('AdminReviewController', () => {
    let controller;
    let adminReviewService;
    let logger;
    let responses;
    let req;
    let res;
    let next;

    const mockNoErrors = () => ({ isEmpty: () => true, array: () => [] });
    const mockWithErrors = (errs = [{ msg: 'erro de validação' }]) => ({
        isEmpty: () => false,
        array: () => errs
    });

    beforeEach(() => {
        jest.clearAllMocks();

        adminReviewService = {
            getDashboard: jest.fn(),
            getSubmissions: jest.fn(),
            assignSubmission: jest.fn(),
            unassignSubmission: jest.fn(),
            reviewSubmission: jest.fn(),
            sendFeedback: jest.fn(),
            publishSubmission: jest.fn(),
            searchSubmissions: jest.fn(),
            performBulkAction: jest.fn(),
            getAdminActionLog: jest.fn(),
            updateSubmissionStatus: jest.fn()
        };

        logger = {
            audit: jest.fn(),
            error: jest.fn(),
            info: jest.fn()
        };

        responses = {
            success: jest.fn(),
            badRequest: jest.fn(),
            created: jest.fn(),
            error: jest.fn()
        };

        req = {
            user: { id: 'admin-123' },
            params: {},
            body: {},
            query: {}
        };

        res = {};
        next = jest.fn();

        validationResult.mockReturnValue(mockNoErrors());

        controller = new AdminReviewController(adminReviewService, logger, responses);
    });

    describe('getDashboard', () => {
        test('deve retornar dashboard com sucesso', async () => {
            const mockDashboard = { summary: {} };
            adminReviewService.getDashboard.mockResolvedValue(mockDashboard);

            await controller.getDashboard(req, res, next);

            expect(adminReviewService.getDashboard).toHaveBeenCalledWith('admin-123');
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({ dashboard: mockDashboard }),
                'Dashboard carregado com sucesso'
            );
            expect(next).not.toHaveBeenCalled();
        });

        test('deve chamar next com erro em caso de falha', async () => {
            const testError = new Error('Falha ao carregar dashboard');
            adminReviewService.getDashboard.mockRejectedValue(testError);

            await controller.getDashboard(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error getting admin dashboard', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('getSubmissions', () => {
        test('deve retornar submissões com filtros processados', async () => {
            req.query = {
                status: 'pending,approved',
                category: 'article,essay',
                authorEmail: 'author@example.com',
                assignedTo: 'ME',
                unassigned: 'false',
                dateFrom: '2025-01-01',
                dateTo: '2025-07-01',
                expiringDays: '10',
                hasFiles: 'true',
                sortBy: 'created_at',
                sortOrder: 'asc',
                page: '2',
                limit: '10'
            };

            const mockResult = { submissions: [], pagination: {} };
            adminReviewService.getSubmissions.mockResolvedValue(mockResult);

            await controller.getSubmissions(req, res, next);

            expect(adminReviewService.getSubmissions).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: ['pending', 'approved'],
                    category: ['article', 'essay'],
                    authorEmail: 'author@example.com',
                    assignedTo: 'admin-123',
                    unassigned: false,
                    page: 2,
                    limit: 10
                }),
                'admin-123'
            );
            expect(responses.success).toHaveBeenCalledWith(res, mockResult, 'Submissões carregadas com sucesso');
        });

        test('deve aplicar valores padrão quando filtros ausentes', async () => {
            req.query = {};
            adminReviewService.getSubmissions.mockResolvedValue({ submissions: [], pagination: {} });

            await controller.getSubmissions(req, res, next);

            expect(adminReviewService.getSubmissions).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: undefined,
                    category: undefined,
                    sortBy: 'updated_at',
                    sortOrder: 'desc',
                    page: 1,
                    limit: 20
                }),
                'admin-123'
            );
        });

        test('deve retornar badRequest quando filtros inválidos', async () => {
            validationResult.mockReturnValue(mockWithErrors());

            await controller.getSubmissions(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Filtros inválidos', expect.any(Array));
            expect(adminReviewService.getSubmissions).not.toHaveBeenCalled();
        });

        test('deve chamar next com erro em caso de falha', async () => {
            const testError = new Error('Erro de banco');
            adminReviewService.getSubmissions.mockRejectedValue(testError);

            await controller.getSubmissions(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error getting submissions for admin', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('assignSubmission', () => {
        test('deve atribuir submissão com sucesso', async () => {
            req.params = { id: 'sub-123' };
            const mockSubmission = { id: 'sub-123', assigned_to: 'admin-123' };
            adminReviewService.assignSubmission.mockResolvedValue(mockSubmission);

            await controller.assignSubmission(req, res, next);

            expect(adminReviewService.assignSubmission).toHaveBeenCalledWith('sub-123', 'admin-123');
            expect(logger.audit).toHaveBeenCalledWith('Submission assigned via API', expect.any(Object));
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({ submission: mockSubmission }),
                'Submissão atribuída com sucesso'
            );
        });

        test('deve chamar next com erro em caso de falha', async () => {
            req.params = { id: 'sub-123' };
            const testError = new Error('Submissão já possui um responsável');
            adminReviewService.assignSubmission.mockRejectedValue(testError);

            await controller.assignSubmission(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error assigning submission', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('unassignSubmission', () => {
        test('deve remover atribuição com sucesso', async () => {
            req.params = { id: 'sub-123' };
            const mockSubmission = { id: 'sub-123', assigned_to: null };
            adminReviewService.unassignSubmission.mockResolvedValue(mockSubmission);

            await controller.unassignSubmission(req, res, next);

            expect(adminReviewService.unassignSubmission).toHaveBeenCalledWith('sub-123', 'admin-123');
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({ submission: mockSubmission }),
                'Atribuição removida com sucesso'
            );
        });

        test('deve chamar next com erro em caso de falha', async () => {
            req.params = { id: 'sub-123' };
            const testError = new Error('Submissão não encontrada ou você não é o responsável');
            adminReviewService.unassignSubmission.mockRejectedValue(testError);

            await controller.unassignSubmission(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error unassigning submission', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('reviewSubmission', () => {
        test('deve revisar submissão com sucesso (approved)', async () => {
            req.params = { id: 'sub-123' };
            req.body = { status: 'approved', notes: 'Ótimo trabalho' };
            const mockReview = { id: 'review-1', status: 'approved' };
            adminReviewService.reviewSubmission.mockResolvedValue(mockReview);

            await controller.reviewSubmission(req, res, next);

            expect(adminReviewService.reviewSubmission).toHaveBeenCalledWith(
                'sub-123', 'admin-123', 'approved', 'Ótimo trabalho', undefined
            );
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    review: mockReview,
                    message: 'Submissão aprovada. Agora pode ser publicada.'
                }),
                'Revisão realizada com sucesso'
            );
        });

        test('deve retornar mensagem correta para cada status', async () => {
            const cases = [
                ['rejected', 'Submissão rejeitada. Autor será notificado.'],
                ['changes_requested', 'Correções solicitadas. Autor será notificado.'],
                ['pending', 'Revisão iniciada.'],
                ['unknown_status', 'Revisão processada.']
            ];

            for (const [status, expectedMessage] of cases) {
                req.params = { id: 'sub-123' };
                req.body = { status };
                adminReviewService.reviewSubmission.mockResolvedValue({ id: 'review-1', status });

                await controller.reviewSubmission(req, res, next);

                expect(responses.success).toHaveBeenCalledWith(
                    res,
                    expect.objectContaining({ message: expectedMessage }),
                    'Revisão realizada com sucesso'
                );
            }
        });

        test('deve retornar badRequest quando dados inválidos', async () => {
            validationResult.mockReturnValue(mockWithErrors());

            await controller.reviewSubmission(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Dados de revisão inválidos', expect.any(Array));
            expect(adminReviewService.reviewSubmission).not.toHaveBeenCalled();
        });

        test('deve chamar next com erro em caso de falha', async () => {
            req.params = { id: 'sub-123' };
            req.body = { status: 'approved' };
            const testError = new Error('Submissão não encontrada');
            adminReviewService.reviewSubmission.mockRejectedValue(testError);

            await controller.reviewSubmission(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error reviewing submission', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('sendFeedback', () => {
        test('deve enviar feedback com sucesso', async () => {
            req.params = { id: 'sub-123' };
            req.body = { content: 'Feedback para o autor', isPublic: true };
            const mockFeedback = { id: 'feedback-1', content: 'Feedback para o autor' };
            adminReviewService.sendFeedback.mockResolvedValue(mockFeedback);

            await controller.sendFeedback(req, res, next);

            expect(adminReviewService.sendFeedback).toHaveBeenCalledWith('sub-123', 'admin-123', 'Feedback para o autor');
            expect(logger.audit).toHaveBeenCalledWith('Feedback sent via API', expect.any(Object));
            expect(responses.created).toHaveBeenCalledWith(
                res,
                expect.objectContaining({ feedback: mockFeedback }),
                'Feedback enviado para o autor'
            );
        });

        test('deve retornar badRequest quando dados inválidos', async () => {
            validationResult.mockReturnValue(mockWithErrors());

            await controller.sendFeedback(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Dados de feedback inválidos', expect.any(Array));
            expect(adminReviewService.sendFeedback).not.toHaveBeenCalled();
        });

        test('deve chamar next com erro em caso de falha', async () => {
            req.params = { id: 'sub-123' };
            req.body = { content: 'Feedback' };
            const testError = new Error('Submissão não encontrada');
            adminReviewService.sendFeedback.mockRejectedValue(testError);

            await controller.sendFeedback(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error sending feedback', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('publishSubmission', () => {
        test('deve publicar submissão com sucesso', async () => {
            req.params = { id: 'sub-123' };
            req.body = {
                publishNotes: 'Notas',
                categoryOverride: 'artigo-especial',
                keywordsOverride: ['k1'],
                depositToZenodo: true
            };
            const mockResult = {
                success: true,
                articleId: 'article-1',
                publishedAt: new Date(),
                articleUrl: 'https://example.com/article-1',
                zenodo: { doi: '10.1234/abc' }
            };
            adminReviewService.publishSubmission.mockResolvedValue(mockResult);

            await controller.publishSubmission(req, res, next);

            expect(adminReviewService.publishSubmission).toHaveBeenCalledWith(
                'sub-123', 'admin-123',
                expect.objectContaining({ submissionId: 'sub-123', publishNotes: 'Notas' })
            );
            expect(logger.audit).toHaveBeenCalledWith('Article published via API', expect.any(Object));
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({ articleId: 'article-1', articleUrl: mockResult.articleUrl }),
                'Submissão publicada como artigo'
            );
        });

        test('deve retornar erro quando publicação falha', async () => {
            req.params = { id: 'sub-123' };
            req.body = {};
            adminReviewService.publishSubmission.mockResolvedValue({
                success: false,
                error: 'Apenas submissões aprovadas podem ser publicadas'
            });

            await controller.publishSubmission(req, res, next);

            expect(responses.error).toHaveBeenCalledWith(res, 'Apenas submissões aprovadas podem ser publicadas', 400);
        });

        test('deve usar mensagem padrão de erro quando ausente', async () => {
            req.params = { id: 'sub-123' };
            req.body = {};
            adminReviewService.publishSubmission.mockResolvedValue({ success: false });

            await controller.publishSubmission(req, res, next);

            expect(responses.error).toHaveBeenCalledWith(res, 'Erro ao publicar artigo', 400);
        });

        test('deve retornar badRequest quando dados inválidos', async () => {
            validationResult.mockReturnValue(mockWithErrors());

            await controller.publishSubmission(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Dados de publicação inválidos', expect.any(Array));
            expect(adminReviewService.publishSubmission).not.toHaveBeenCalled();
        });

        test('deve chamar next com erro em caso de exceção', async () => {
            req.params = { id: 'sub-123' };
            req.body = {};
            const testError = new Error('Erro inesperado');
            adminReviewService.publishSubmission.mockRejectedValue(testError);

            await controller.publishSubmission(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error publishing submission', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('searchSubmissions', () => {
        test('deve buscar submissões com sucesso', async () => {
            req.query = { q: 'termo de busca', status: 'pending,approved', category: 'article' };
            const mockSubmissions = [{ id: 'sub1' }, { id: 'sub2' }];
            adminReviewService.searchSubmissions.mockResolvedValue(mockSubmissions);

            await controller.searchSubmissions(req, res, next);

            expect(adminReviewService.searchSubmissions).toHaveBeenCalledWith(
                'termo de busca',
                'admin-123',
                expect.objectContaining({ status: ['pending', 'approved'], category: ['article'] })
            );
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({ submissions: mockSubmissions, count: 2 }),
                'Busca realizada com sucesso'
            );
        });

        test('deve retornar badRequest quando query muito curta', async () => {
            req.query = { q: 'a' };

            await controller.searchSubmissions(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Query de busca deve ter pelo menos 2 caracteres');
            expect(adminReviewService.searchSubmissions).not.toHaveBeenCalled();
        });

        test('deve retornar badRequest quando query ausente', async () => {
            req.query = {};

            await controller.searchSubmissions(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Query de busca deve ter pelo menos 2 caracteres');
        });

        test('deve retornar badRequest quando parâmetros inválidos', async () => {
            validationResult.mockReturnValue(mockWithErrors());
            req.query = { q: 'termo válido' };

            await controller.searchSubmissions(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Parâmetros de busca inválidos', expect.any(Array));
            expect(adminReviewService.searchSubmissions).not.toHaveBeenCalled();
        });

        test('deve chamar next com erro em caso de falha', async () => {
            req.query = { q: 'termo válido' };
            const testError = new Error('Erro ao buscar');
            adminReviewService.searchSubmissions.mockRejectedValue(testError);

            await controller.searchSubmissions(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error searching submissions', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('performBulkAction', () => {
        test('deve realizar ação em lote com sucesso total', async () => {
            req.body = {
                submissionIds: ['sub1', 'sub2'],
                action: 'approve',
                notes: 'Notas',
                reason: 'Motivo'
            };
            const mockResult = {
                summary: { total: 2, successful: 2, failed: 0 },
                successful: ['sub1', 'sub2'],
                failed: []
            };
            adminReviewService.performBulkAction.mockResolvedValue(mockResult);

            await controller.performBulkAction(req, res, next);

            expect(adminReviewService.performBulkAction).toHaveBeenCalledWith(
                expect.objectContaining({ submissionIds: ['sub1', 'sub2'], action: 'approve' }),
                'admin-123'
            );
            expect(logger.audit).toHaveBeenCalledWith('Bulk action performed via API', expect.any(Object));
            expect(responses.success).toHaveBeenCalledWith(
                res, mockResult, 'Ação realizada com sucesso em 2 submissões'
            );
        });

        test('deve informar sucessos e falhas parciais', async () => {
            req.body = { submissionIds: ['sub1', 'sub2'], action: 'approve' };
            const mockResult = {
                summary: { total: 2, successful: 1, failed: 1 },
                successful: ['sub1'],
                failed: [{ submissionId: 'sub2', error: 'Erro' }]
            };
            adminReviewService.performBulkAction.mockResolvedValue(mockResult);

            await controller.performBulkAction(req, res, next);

            expect(responses.success).toHaveBeenCalledWith(
                res, mockResult, 'Ação realizada: 1 sucessos, 1 falhas'
            );
        });

        test('deve retornar badRequest quando dados inválidos', async () => {
            validationResult.mockReturnValue(mockWithErrors([{ msg: 'Ação inválida' }]));

            await controller.performBulkAction(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(
                res,
                'Dados de ação em lote inválidos: Ação inválida',
                expect.any(Object)
            );
            expect(adminReviewService.performBulkAction).not.toHaveBeenCalled();
        });

        test('deve chamar next com erro em caso de falha', async () => {
            req.body = { submissionIds: ['sub1'], action: 'approve' };
            const testError = new Error('Erro ao processar');
            adminReviewService.performBulkAction.mockRejectedValue(testError);

            await controller.performBulkAction(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error performing bulk action', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('getActivityLog', () => {
        test('deve retornar histórico com sucesso', async () => {
            req.query = {
                action: 'review',
                targetType: 'submission',
                dateFrom: '2025-01-01',
                dateTo: '2025-07-01',
                page: '2',
                limit: '10'
            };
            const mockResult = { logs: [], total: 0 };
            adminReviewService.getAdminActionLog.mockResolvedValue(mockResult);

            await controller.getActivityLog(req, res, next);

            expect(adminReviewService.getAdminActionLog).toHaveBeenCalledWith(
                'admin-123',
                expect.objectContaining({ action: 'review', targetType: 'submission', page: 2, limit: 10 })
            );
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({ logs: [], total: 0 }),
                'Histórico de ações carregado'
            );
        });

        test('deve aplicar valores padrão quando ausentes', async () => {
            req.query = {};
            adminReviewService.getAdminActionLog.mockResolvedValue({ logs: [], total: 0 });

            await controller.getActivityLog(req, res, next);

            expect(adminReviewService.getAdminActionLog).toHaveBeenCalledWith(
                'admin-123',
                expect.objectContaining({ page: 1, limit: 50 })
            );
        });

        test('deve chamar next com erro em caso de falha', async () => {
            req.query = {};
            const testError = new Error('Erro ao buscar histórico');
            adminReviewService.getAdminActionLog.mockRejectedValue(testError);

            await controller.getActivityLog(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error getting activity log', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('updateSubmissionStatus', () => {
        test('deve aprovar submissão com sucesso', async () => {
            req.params = { id: 'sub-123' };
            req.body = { status: 'approved' };
            const mockSubmission = { id: 'sub-123', status: 'APPROVED' };
            adminReviewService.updateSubmissionStatus.mockResolvedValue(mockSubmission);

            await controller.updateSubmissionStatus(req, res, next);

            expect(adminReviewService.updateSubmissionStatus).toHaveBeenCalledWith('sub-123', 'admin-123', 'approved');
            expect(logger.audit).toHaveBeenCalledWith('Submission status updated via API', expect.any(Object));
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({ submission: mockSubmission, message: 'Submissão aprovada com sucesso' }),
                'Submissão aprovada com sucesso'
            );
        });

        test('deve rejeitar submissão com sucesso', async () => {
            req.params = { id: 'sub-123' };
            req.body = { status: 'rejected' };
            adminReviewService.updateSubmissionStatus.mockResolvedValue({ id: 'sub-123', status: 'REJECTED' });

            await controller.updateSubmissionStatus(req, res, next);

            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({ message: 'Submissão rejeitada com sucesso' }),
                'Submissão rejeitada com sucesso'
            );
        });

        test('deve retornar badRequest quando dados inválidos', async () => {
            validationResult.mockReturnValue(mockWithErrors());

            await controller.updateSubmissionStatus(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Dados inválidos', expect.any(Array));
            expect(adminReviewService.updateSubmissionStatus).not.toHaveBeenCalled();
        });

        test('deve retornar badRequest quando status inválido', async () => {
            req.params = { id: 'sub-123' };
            req.body = { status: 'invalid' };

            await controller.updateSubmissionStatus(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Status inválido. Use "approved" ou "rejected".');
            expect(adminReviewService.updateSubmissionStatus).not.toHaveBeenCalled();
        });

        test('deve chamar next com erro em caso de falha', async () => {
            req.params = { id: 'sub-123' };
            req.body = { status: 'approved' };
            const testError = new Error('Erro ao atualizar status');
            adminReviewService.updateSubmissionStatus.mockRejectedValue(testError);

            await controller.updateSubmissionStatus(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error updating submission status', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });
});