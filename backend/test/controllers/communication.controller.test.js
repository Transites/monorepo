const {validationResult} = require('express-validator');
const communicationService = require('../../services/communicationService');
const logger = require('../../middleware/logging');
const responses = require('../../utils/responses');
const communicationController = require('../../controllers/communication');

jest.mock('../../middleware/logging', () => {
    const loggerMethods = ['audit', 'security', 'database', 'performance', 'error', 'warn', 'info', 'debug'];
    const mockLogger = {};

    loggerMethods.forEach(method => {
        mockLogger[method] = jest.fn((message, meta) => {
            console.log(`Logger.${method}:`, message, meta || '');
        });
    });

    mockLogger.createPerformanceLogger = jest.fn((operationName) => {
        console.log(`Performance logger created: ${operationName}`);
        return {
            end: jest.fn((meta) => {
                console.log(`Performance logger ended: ${operationName}`, meta || '');
            })
        };
    });

    return mockLogger;
});
jest.mock('express-validator', () => ({
    validationResult: jest.fn()
}));
jest.mock('../../services/communicationService');
jest.mock('../../utils/responses');
jest.mock('../../database/client');

describe('CommunicationController', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            params: {},
            query: {},
            user: {id: 'admin-id', email: 'admin@iea.usp.br', name: 'Admin'}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();

        responses.success = jest.fn().mockReturnValue('success');
        responses.badRequest = jest.fn().mockReturnValue('badRequest');
        responses.error = jest.fn().mockReturnValue('error');

        validationResult.mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(true),
            array: jest.fn().mockReturnValue([])
        });
    });

    describe('resendToken', () => {
        test('deve reenviar token com sucesso', async () => {
            req.params = {submissionId: 'submission-id'};
            req.body = {customMessage: 'Mensagem personalizada'};

            communicationService.resendTokenToAuthor.mockResolvedValue({
                success: true
            });

            await communicationController.resendToken(req, res, next);

            expect(communicationService.resendTokenToAuthor).toHaveBeenCalledWith(
                'submission-id',
                'admin-id',
                'Mensagem personalizada'
            );

            expect(logger.audit).toHaveBeenCalledWith('Token resent via API', {
                submissionId: 'submission-id',
                adminId: 'admin-id',
                hasCustomMessage: true
            });

            expect(responses.success).toHaveBeenCalledWith(res, {
                sent: true,
                message: 'Token reenviado com sucesso'
            });
        });

        test('deve reenviar token sem mensagem customizada', async () => {
            req.params = {submissionId: 'submission-id'};
            req.body = {};

            communicationService.resendTokenToAuthor.mockResolvedValue({
                success: true
            });

            await communicationController.resendToken(req, res, next);

            expect(communicationService.resendTokenToAuthor).toHaveBeenCalledWith(
                'submission-id',
                'admin-id',
                undefined
            );

            expect(logger.audit).toHaveBeenCalledWith('Token resent via API', {
                submissionId: 'submission-id',
                adminId: 'admin-id',
                hasCustomMessage: false
            });
        });

        test('deve tratar erro do serviço', async () => {
            req.params = {submissionId: 'submission-id'};

            communicationService.resendTokenToAuthor.mockResolvedValue({
                success: false,
                error: 'Submissão não encontrada'
            });

            await communicationController.resendToken(req, res, next);

            expect(responses.error).toHaveBeenCalledWith(res, 'Submissão não encontrada', 400);
        });

        test('deve validar dados de entrada', async () => {
            validationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue([{msg: 'ID inválido'}])
            });

            req.params = {submissionId: 'invalid-id'};

            await communicationController.resendToken(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Dados inválidos', [{msg: 'ID inválido'}]);
            expect(communicationService.resendTokenToAuthor).not.toHaveBeenCalled();
        });

        test('deve tratar exceções', async () => {
            req.params = {submissionId: 'submission-id'};

            const error = new Error('Erro interno');
            communicationService.resendTokenToAuthor.mockRejectedValue(error);

            await communicationController.resendToken(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error in resendToken controller', {
                submissionId: 'submission-id',
                adminId: 'admin-id',
                error: 'Erro interno'
            });

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('regenerateToken', () => {
        test('deve regenerar token com sucesso', async () => {
            req.params = {submissionId: 'submission-id'};
            req.body = {reason: 'Token comprometido'};

            communicationService.regenerateAndSendToken.mockResolvedValue({
                success: true,
                newToken: 'new-token-123'
            });

            await communicationController.regenerateToken(req, res, next);

            expect(communicationService.regenerateAndSendToken).toHaveBeenCalledWith(
                'submission-id',
                'admin-id',
                'Token comprometido'
            );

            expect(logger.audit).toHaveBeenCalledWith('Token regenerated via API', {
                submissionId: 'submission-id',
                adminId: 'admin-id',
                newToken: 'new-token-123',
                reason: 'Token comprometido'
            });

            expect(responses.success).toHaveBeenCalledWith(res, {
                regenerated: true,
                newToken: 'new-token-123',
                message: 'Token regenerado e enviado com sucesso'
            });
        });

        test('deve tratar falha na regeneração', async () => {
            req.params = {submissionId: 'submission-id'};
            req.body = {reason: 'Motivo de regeneração'};

            communicationService.regenerateAndSendToken.mockResolvedValue({
                success: false,
                error: 'Erro ao regenerar token'
            });

            await communicationController.regenerateToken(req, res, next);

            expect(responses.error).toHaveBeenCalledWith(res, 'Erro ao regenerar token', 400);
        });

        test('deve tratar exceções na regeneração', async () => {
            req.params = {submissionId: 'submission-id'};

            const error = new Error('Erro interno');
            communicationService.regenerateAndSendToken.mockRejectedValue(error);

            await communicationController.regenerateToken(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error in regenerateToken controller', {
                submissionId: 'submission-id',
                adminId: 'admin-id',
                error: 'Erro interno'
            });

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('reactivateSubmission', () => {
        test('deve reativar submissão com sucesso', async () => {
            req.params = {submissionId: 'submission-id'};
            req.body = {newExpiryDays: 45};

            const mockResult = {
                success: true,
                token: 'reactivated-token-123',
                expiresAt: new Date('2025-12-31')
            };

            communicationService.reactivateExpiredSubmission.mockResolvedValue(mockResult);

            await communicationController.reactivateSubmission(req, res, next);

            expect(communicationService.reactivateExpiredSubmission).toHaveBeenCalledWith(
                'submission-id',
                'admin-id',
                45
            );

            expect(logger.audit).toHaveBeenCalledWith('Submission reactivated via API', {
                submissionId: 'submission-id',
                adminId: 'admin-id',
                newToken: 'reactivated-token-123',
                newExpiryDays: 45
            });

            expect(responses.success).toHaveBeenCalledWith(res, {
                reactivated: true,
                newToken: 'reactivated-token-123',
                newExpiresAt: mockResult.expiresAt,
                message: 'Submissão reativada com sucesso'
            });
        });

        test('deve usar valor padrão de 30 dias se não especificado', async () => {
            req.params = {submissionId: 'submission-id'};
            req.body = {};

            communicationService.reactivateExpiredSubmission.mockResolvedValue({
                success: true,
                token: 'token-123',
                expiresAt: new Date()
            });

            await communicationController.reactivateSubmission(req, res, next);

            expect(communicationService.reactivateExpiredSubmission).toHaveBeenCalledWith(
                'submission-id',
                'admin-id',
                30
            );
        });

        test('deve tratar erro na reativação', async () => {
            req.params = {submissionId: 'submission-id'};

            communicationService.reactivateExpiredSubmission.mockResolvedValue({
                success: false,
                error: 'Submissão não pode ser reativada'
            });

            await communicationController.reactivateSubmission(req, res, next);

            expect(responses.error).toHaveBeenCalledWith(res, 'Submissão não pode ser reativada', 400);
        });
    });

    describe('sendCustomReminder', () => {
        test('deve enviar lembrete personalizado com sucesso', async () => {
            req.params = {submissionId: 'submission-id'};
            req.body = {
                message: 'Lembrete importante sobre sua submissão',
                urgency: 'high'
            };

            communicationService.sendCustomReminder.mockResolvedValue({
                success: true
            });

            await communicationController.sendCustomReminder(req, res, next);

            expect(communicationService.sendCustomReminder).toHaveBeenCalledWith(
                'submission-id',
                'admin-id',
                'Lembrete importante sobre sua submissão',
                'high'
            );

            expect(logger.audit).toHaveBeenCalledWith('Custom reminder sent via API', {
                submissionId: 'submission-id',
                adminId: 'admin-id',
                urgency: 'high',
                messageLength: 'Lembrete importante sobre sua submissão'.length
            });

            expect(responses.success).toHaveBeenCalledWith(res, {
                sent: true,
                message: 'Lembrete enviado com sucesso'
            });
        });

        test('deve usar urgência padrão normal', async () => {
            req.params = {submissionId: 'submission-id'};
            req.body = {message: 'Mensagem de lembrete'};

            communicationService.sendCustomReminder.mockResolvedValue({
                success: true
            });

            await communicationController.sendCustomReminder(req, res, next);

            expect(communicationService.sendCustomReminder).toHaveBeenCalledWith(
                'submission-id',
                'admin-id',
                'Mensagem de lembrete',
                'normal'
            );
        });

        test('deve tratar falha no envio do lembrete', async () => {
            req.params = {submissionId: 'submission-id'};
            req.body = {message: 'Mensagem teste'};

            communicationService.sendCustomReminder.mockResolvedValue({
                success: false,
                error: 'Falha ao enviar email'
            });

            await communicationController.sendCustomReminder(req, res, next);

            expect(responses.error).toHaveBeenCalledWith(res, 'Falha ao enviar email', 400);
        });
    });

    describe('getCommunicationHistory', () => {
        test('deve obter histórico de comunicações com sucesso', async () => {
            req.params = {submissionId: 'submission-id'};
            req.query = {limit: '25'};

            const mockHistory = [
                {id: 1, type: 'token_sent', created_at: new Date()},
                {id: 2, type: 'reminder_sent', created_at: new Date()}
            ];

            communicationService.getCommunicationHistory.mockResolvedValue(mockHistory);

            await communicationController.getCommunicationHistory(req, res, next);

            expect(communicationService.getCommunicationHistory).toHaveBeenCalledWith('submission-id', 25);

            expect(responses.success).toHaveBeenCalledWith(res, {
                submissionId: 'submission-id',
                history: mockHistory,
                count: 2
            }, 'Histórico de comunicações carregado');
        });

        test('deve usar limite padrão de 50', async () => {
            req.params = {submissionId: 'submission-id'};
            req.query = {};

            communicationService.getCommunicationHistory.mockResolvedValue([]);

            await communicationController.getCommunicationHistory(req, res, next);

            expect(communicationService.getCommunicationHistory).toHaveBeenCalledWith('submission-id', 50);
        });

        test('deve tratar exceções ao buscar histórico', async () => {
            req.params = {submissionId: 'submission-id'};

            const error = new Error('Erro ao buscar histórico');
            communicationService.getCommunicationHistory.mockRejectedValue(error);

            await communicationController.getCommunicationHistory(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error in getCommunicationHistory controller', {
                submissionId: 'submission-id',
                error: 'Erro ao buscar histórico'
            });

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('processExpirationAlerts', () => {
        test('deve processar alertas de expiração manualmente', async () => {
            const mockResult = {
                totalAlertsSent: 5
            };

            communicationService.processExpirationAlerts.mockResolvedValue(mockResult);

            await communicationController.processExpirationAlerts(req, res, next);

            expect(communicationService.processExpirationAlerts).toHaveBeenCalled();

            expect(logger.audit).toHaveBeenCalledWith('Expiration alerts processed manually', {
                adminId: 'admin-id',
                totalAlertsSent: 5
            });

            expect(responses.success).toHaveBeenCalledWith(res, {
                processed: true,
                totalAlertsSent: 5,
                message: '5 alertas de expiração processados'
            });
        });

        test('deve tratar exceções ao processar alertas', async () => {
            const error = new Error('Erro ao processar alertas');
            communicationService.processExpirationAlerts.mockRejectedValue(error);

            await communicationController.processExpirationAlerts(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error processing expiration alerts manually', {
                adminId: 'admin-id',
                error: 'Erro ao processar alertas'
            });

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('sendDailySummary', () => {
        test('deve enviar resumo diário manualmente', async () => {
            const mockResult = {
                sent: 3,
                totalAdmins: 3,
                stats: {
                    totalSubmissions: 15,
                    pending: 5,
                    expired: 2
                }
            };

            communicationService.sendDailySummaryToAdmins.mockResolvedValue(mockResult);

            await communicationController.sendDailySummary(req, res, next);

            expect(communicationService.sendDailySummaryToAdmins).toHaveBeenCalled();

            expect(logger.audit).toHaveBeenCalledWith('Daily summary sent manually', {
                adminId: 'admin-id',
                sent: 3,
                totalAdmins: 3
            });

            expect(responses.success).toHaveBeenCalledWith(res, {
                sent: 3,
                totalAdmins: 3,
                stats: mockResult.stats,
                message: 'Resumo diário enviado para 3 administradores'
            });
        });

        test('deve tratar erro ao enviar resumo diário', async () => {
            const error = new Error('Erro ao enviar resumo');
            communicationService.sendDailySummaryToAdmins.mockRejectedValue(error);

            await communicationController.sendDailySummary(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error sending daily summary manually', {
                adminId: 'admin-id',
                error: 'Erro ao enviar resumo'
            });

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getCommunicationStats', () => {
        test('deve obter estatísticas de comunicação', async () => {
            req.query = {days: '7'};

            const mockStats = {
                byType: [
                    {type: 'token_sent', direction: 'outbound', count: '10', successful: '9', failed: '1'},
                    {type: 'reminder_sent', direction: 'outbound', count: '5', successful: '5', failed: '0'}
                ],
                total: 15,
                period: 7
            };

            // Mockar o método do serviço
            communicationService.getCommunicationStatsFromDB.mockResolvedValue(mockStats);

            await communicationController.getCommunicationStats(req, res, next);

            expect(communicationService.getCommunicationStatsFromDB).toHaveBeenCalledWith(7);

            expect(responses.success).toHaveBeenCalledWith(res, {
                period: '7 dias',
                stats: mockStats,
                generatedAt: expect.any(Date)
            }, 'Estatísticas de comunicação');
        });

        test('deve usar período padrão de 30 dias', async () => {
            req.query = {};

            const mockStats = {
                byType: [],
                total: 0,
                period: 30
            };

            communicationService.getCommunicationStatsFromDB.mockResolvedValue(mockStats);

            await communicationController.getCommunicationStats(req, res, next);

            expect(communicationService.getCommunicationStatsFromDB).toHaveBeenCalledWith(30);
        });

        test('deve tratar erro ao obter estatísticas', async () => {
            const error = new Error('Erro ao buscar estatísticas');
            communicationService.getCommunicationStatsFromDB.mockRejectedValue(error);

            await communicationController.getCommunicationStats(req, res, next);

            expect(logger.error).toHaveBeenCalledWith('Error getting communication stats', {
                error: 'Erro ao buscar estatísticas'
            });

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
