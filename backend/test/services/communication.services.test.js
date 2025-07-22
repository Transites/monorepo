const emailService = require('../../services/email');
const tokenService = require('../../services/tokens');
const logger = require('../../middleware/logging');
const db = require('../../database/client');
const constants = require('../../utils/constants');

// Mock dependencies
jest.mock('../../services/email');
jest.mock('../../services/tokens');
jest.mock('../../middleware/logging');
jest.mock('../../database/client');
jest.mock('../../utils/constants');
jest.mock('node-cron', () => ({
    schedule: jest.fn()
}));

describe('CommunicationService', () => {
    let communicationService;
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup environment variables
        process.env = {
            ...originalEnv,
            FRONTEND_URL: 'https://frontend.test',
            FROM_EMAIL: 'noreply@test.com'
        };

        // Setup mocks
        db.query = jest.fn();
        emailService.sendTokenResend = jest.fn();
        emailService.sendTokenRegenerated = jest.fn();
        emailService.sendSubmissionReactivated = jest.fn();
        emailService.sendCustomReminder = jest.fn();
        emailService.sendExpirationAlert = jest.fn();
        emailService.sendSubmissionExpired = jest.fn();
        emailService.sendDailySummary = jest.fn();
        emailService.sendMassExpirationAlert = jest.fn();

        tokenService.regenerateToken = jest.fn();
        tokenService.reactivateExpired = jest.fn();

        logger.audit = jest.fn();
        logger.error = jest.fn();
        logger.info = jest.fn();

        constants.SUBMISSION_STATUS = {
            DRAFT: 'DRAFT',
            UNDER_REVIEW: 'UNDER_REVIEW',
            CHANGES_REQUESTED: 'CHANGES_REQUESTED',
            APPROVED: 'APPROVED',
            PUBLISHED: 'PUBLISHED',
            REJECTED: 'REJECTED',
            EXPIRED: 'EXPIRED'
        };

        communicationService = require('../../services/communicationService');
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('resendTokenToAuthor', () => {
        test('deve reenviar token com sucesso', async () => {
            const submissionId = 'sub-123';
            const adminId = 'admin-123';
            const customMessage = 'Mensagem personalizada';

            const mockSubmission = {
                id: submissionId,
                author_name: 'Test Author',
                author_email: 'author@test.com',
                title: 'Test Submission',
                status: 'UNDER_REVIEW',
                token: 'token-123',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 dia no futuro
                updated_at: new Date(),
            };

            db.query.mockResolvedValueOnce({ rows: [mockSubmission] });
            emailService.sendTokenResend.mockResolvedValue({ success: true });

            const result = await communicationService.resendTokenToAuthor(
                submissionId,
                adminId,
                customMessage
            );

            // Verify database calls
            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM submissions WHERE id = $1',
                [submissionId]
            );

            // Verify email service call
            expect(emailService.sendTokenResend).toHaveBeenCalledWith(
                expect.objectContaining({
                    authorName: 'Test Author',
                    submissionTitle: 'Test Submission',
                    tokenUrl: 'https://frontend.test/submissao/editar/token-123',
                    customMessage: 'Mensagem personalizada'
                })
            );

            // Verify audit log
            expect(logger.audit).toHaveBeenCalledWith('Token resent to author', expect.objectContaining({
                submissionId,
                adminId,
                authorEmail: 'author@test.com',
                hasCustomMessage: true
            }));

            expect(result).toEqual({ success: true });
        });

        test('deve rejeitar token expirado', async () => {
            const submissionId = 'sub-123';
            const adminId = 'admin-123';

            const mockSubmission = {
                id: submissionId,
                expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 dia no passado
            };

            db.query.mockResolvedValueOnce({ rows: [mockSubmission] });

            await expect(communicationService.resendTokenToAuthor(submissionId, adminId))
                .rejects
                .toThrow('Token expirado - use reativar ao invés de re-enviar');

            expect(emailService.sendTokenResend).not.toHaveBeenCalled();
        });

        test('deve rejeitar submissão não encontrada', async () => {
            const submissionId = 'non-existent';
            const adminId = 'admin-123';

            db.query.mockResolvedValueOnce({ rows: [] });

            await expect(communicationService.resendTokenToAuthor(submissionId, adminId))
                .rejects
                .toThrow('Submissão não encontrada');

            expect(emailService.sendTokenResend).not.toHaveBeenCalled();
        });

        test('deve tratar erro no envio de email', async () => {
            const submissionId = 'sub-123';
            const adminId = 'admin-123';

            const mockSubmission = {
                id: submissionId,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                author_email: 'author@test.com'
            };

            db.query.mockResolvedValueOnce({ rows: [mockSubmission] });
            emailService.sendTokenResend.mockResolvedValue({ success: false, error: 'Email error' });

            const result = await communicationService.resendTokenToAuthor(submissionId, adminId);

            expect(result).toEqual({ success: false, error: 'Email error' });
            expect(logger.audit).not.toHaveBeenCalled();
        });

        test('deve tratar exceções', async () => {
            const submissionId = 'sub-123';
            const adminId = 'admin-123';
            const error = new Error('Database error');

            db.query.mockRejectedValue(error);

            await expect(communicationService.resendTokenToAuthor(submissionId, adminId))
                .rejects
                .toThrow('Database error');

            expect(logger.error).toHaveBeenCalledWith('Error resending token to author', expect.objectContaining({
                submissionId,
                adminId,
                error: 'Database error'
            }));
        });
    });

    describe('regenerateAndSendToken', () => {
        test('deve regenerar e enviar token com sucesso', async () => {
            const submissionId = 'sub-123';
            const adminId = 'admin-123';
            const reason = 'Token comprometido';
            const newToken = 'new-token-456';

            const mockSubmission = {
                id: submissionId,
                author_name: 'Test Author',
                author_email: 'author@test.com',
                title: 'Test Submission',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
            };

            tokenService.regenerateToken.mockResolvedValue(newToken);
            db.query.mockResolvedValueOnce({ rows: [mockSubmission] });
            emailService.sendTokenRegenerated.mockResolvedValue({ success: true });

            const result = await communicationService.regenerateAndSendToken(
                submissionId,
                adminId,
                reason
            );

            // Verify token service call
            expect(tokenService.regenerateToken).toHaveBeenCalledWith(submissionId);

            // Verify database call
            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM submissions WHERE id = $1',
                [submissionId]
            );

            // Verify email service call
            expect(emailService.sendTokenRegenerated).toHaveBeenCalledWith(
                expect.objectContaining({
                    authorName: 'Test Author',
                    submissionTitle: 'Test Submission',
                    tokenUrl: `https://frontend.test/submissao/editar/${newToken}`,
                    reason: reason,
                    oldTokenInvalidated: true
                })
            );

            // Verify audit log
            expect(logger.audit).toHaveBeenCalledWith('Token regenerated and sent', expect.objectContaining({
                submissionId,
                adminId,
                authorEmail: 'author@test.com',
                reason,
                newToken
            }));

            expect(result).toEqual(expect.objectContaining({
                success: true,
                newToken
            }));
        });

        test('deve tratar erro na regeneração do token', async () => {
            const submissionId = 'sub-123';
            const adminId = 'admin-123';
            const error = new Error('Token service error');

            tokenService.regenerateToken.mockRejectedValue(error);

            await expect(communicationService.regenerateAndSendToken(submissionId, adminId))
                .rejects
                .toThrow('Token service error');

            expect(logger.error).toHaveBeenCalledWith('Error regenerating and sending token', expect.objectContaining({
                submissionId,
                adminId,
                error: 'Token service error'
            }));
        });
    });

    describe('reactivateExpiredSubmission', () => {
        test('deve reativar submissão expirada com sucesso', async () => {
            const submissionId = 'sub-123';
            const adminId = 'admin-123';
            const newExpiryDays = 30;

            const mockReactivationResult = {
                token: 'reactivated-token-789',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            };

            const mockSubmission = {
                id: submissionId,
                author_name: 'Test Author',
                author_email: 'author@test.com',
                title: 'Test Submission',
                status: 'UNDER_REVIEW'
            };

            const spy = jest.spyOn(communicationService, 'getAdminName');
            spy.mockResolvedValue('Admin User');

            tokenService.reactivateExpired.mockResolvedValue(mockReactivationResult);
            db.query.mockResolvedValueOnce({ rows: [mockSubmission] });
            emailService.sendSubmissionReactivated.mockResolvedValue({ success: true });

            const result = await communicationService.reactivateExpiredSubmission(
                submissionId,
                adminId,
                newExpiryDays
            );

            // Verify token service call
            expect(tokenService.reactivateExpired).toHaveBeenCalledWith(submissionId, newExpiryDays);

            // Verify email service call
            expect(emailService.sendSubmissionReactivated).toHaveBeenCalledWith(
                expect.objectContaining({
                    authorName: 'Test Author',
                    submissionTitle: 'Test Submission',
                    tokenUrl: 'https://frontend.test/submissao/editar/reactivated-token-789',
                    reactivatedBy: 'Admin User',
                    newExpiryDate: mockReactivationResult.expiresAt
                })
            );

            // Verify audit log
            expect(logger.audit).toHaveBeenCalledWith('Expired submission reactivated', expect.objectContaining({
                submissionId,
                adminId,
                authorEmail: 'author@test.com',
                newExpiryDays,
                newToken: 'reactivated-token-789'
            }));

            expect(result).toEqual(expect.objectContaining({
                success: true,
                token: 'reactivated-token-789',
                expiresAt: mockReactivationResult.expiresAt
            }));

            spy.mockRestore();
        });

        test('deve usar valor padrão de 30 dias', async () => {
            const submissionId = 'sub-123';
            const adminId = 'admin-123';

            const spy = jest.spyOn(communicationService, 'getAdminName');
            spy.mockResolvedValue('Admin User');

            tokenService.reactivateExpired.mockResolvedValue({
                token: 'token-123',
                expiresAt: new Date()
            });
            db.query.mockResolvedValueOnce({ rows: [{ id: submissionId, author_email: 'test@test.com' }] });
            emailService.sendSubmissionReactivated.mockResolvedValue({ success: true });

            await communicationService.reactivateExpiredSubmission(submissionId, adminId);

            expect(tokenService.reactivateExpired).toHaveBeenCalledWith(submissionId, 30);

            spy.mockRestore();
        });
    });

    describe('sendCustomReminder', () => {
        test('deve enviar lembrete personalizado com sucesso', async () => {
            const submissionId = 'sub-123';
            const adminId = 'admin-123';
            const message = 'Lembrete importante';
            const urgency = 'high';

            const mockSubmission = {
                id: submissionId,
                author_name: 'Test Author',
                author_email: 'author@test.com',
                title: 'Test Submission',
                status: 'UNDER_REVIEW',
                token: 'token-123',
                updated_at: new Date(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
            };

            const spy = jest.spyOn(communicationService, 'getAdminName');
            spy.mockResolvedValue('Admin User');

            db.query.mockResolvedValueOnce({ rows: [mockSubmission] });
            emailService.sendCustomReminder.mockResolvedValue({ success: true });

            const result = await communicationService.sendCustomReminder(
                submissionId,
                adminId,
                message,
                urgency
            );

            // Verify email service call
            expect(emailService.sendCustomReminder).toHaveBeenCalledWith(
                expect.objectContaining({
                    authorName: 'Test Author',
                    submissionTitle: 'Test Submission',
                    customMessage: message,
                    adminName: 'Admin User',
                    urgency: urgency,
                    tokenUrl: 'https://frontend.test/submissao/editar/token-123'
                })
            );

            // Verify audit log
            expect(logger.audit).toHaveBeenCalledWith('Custom reminder sent', expect.objectContaining({
                submissionId,
                adminId,
                authorEmail: 'author@test.com',
                urgency,
                messageLength: message.length
            }));

            expect(result).toEqual({ success: true });

            spy.mockRestore();
        });

        test('deve usar urgência padrão normal', async () => {
            const submissionId = 'sub-123';
            const adminId = 'admin-123';
            const message = 'Lembrete';

            const spy = jest.spyOn(communicationService, 'getAdminName');
            spy.mockResolvedValue('Admin User');

            db.query.mockResolvedValueOnce({ rows: [{
                    id: submissionId,
                    author_email: 'test@test.com',
                    token: 'token-123'
                }] });
            emailService.sendCustomReminder.mockResolvedValue({ success: true });

            await communicationService.sendCustomReminder(submissionId, adminId, message);

            expect(emailService.sendCustomReminder).toHaveBeenCalledWith(
                expect.objectContaining({
                    urgency: 'normal'
                })
            );

            spy.mockRestore();
        });

        test('deve rejeitar submissão não encontrada', async () => {
            const submissionId = 'non-existent';
            const adminId = 'admin-123';
            const message = 'Lembrete';

            db.query.mockResolvedValueOnce({ rows: [] });

            await expect(communicationService.sendCustomReminder(submissionId, adminId, message))
                .rejects
                .toThrow('Submissão não encontrada');

            expect(emailService.sendCustomReminder).not.toHaveBeenCalled();
        });
    });

    describe('processExpirationAlerts', () => {
        test('deve processar alertas de expiração com sucesso', async () => {
            const mockSubmissions5Days = [
                { id: 'sub1', author_email: 'author1@test.com', author_name: 'Author 1' },
                { id: 'sub2', author_email: 'author2@test.com', author_name: 'Author 2' }
            ];
            const mockSubmissions2Days = [
                { id: 'sub3', author_email: 'author3@test.com', author_name: 'Author 3' }
            ];
            const mockSubmissions1Day = [];

            const spy1 = jest.spyOn(communicationService, 'getSubmissionsExpiringIn');
            const spy2 = jest.spyOn(communicationService, 'hasExpirationAlertBeenSent');
            const spy3 = jest.spyOn(communicationService, 'sendExpirationAlert');

            spy1.mockResolvedValueOnce(mockSubmissions5Days)
                .mockResolvedValueOnce(mockSubmissions2Days)
                .mockResolvedValueOnce(mockSubmissions1Day);

            spy2.mockResolvedValue(false); // Nenhum alerta foi enviado ainda
            spy3.mockResolvedValue({ success: true });

            const result = await communicationService.processExpirationAlerts();

            // Verify que buscou submissões para cada período
            expect(spy1).toHaveBeenCalledTimes(3);
            expect(spy1).toHaveBeenNthCalledWith(1, 5);
            expect(spy1).toHaveBeenNthCalledWith(2, 2);
            expect(spy1).toHaveBeenNthCalledWith(3, 1);

            // Verify que verificou se alertas já foram enviados
            expect(spy2).toHaveBeenCalledTimes(3);
            expect(spy2).toHaveBeenCalledWith('sub1', 5);
            expect(spy2).toHaveBeenCalledWith('sub2', 5);
            expect(spy2).toHaveBeenCalledWith('sub3', 2);

            // Verify que enviou alertas
            expect(spy3).toHaveBeenCalledTimes(3);

            // Verify audit log
            expect(logger.audit).toHaveBeenCalledWith('Expiration alerts processing completed', expect.objectContaining({
                totalAlertsSent: 3,
                processedDays: [5, 2, 1]
            }));

            expect(result).toEqual({ totalAlertsSent: 3 });

            spy1.mockRestore();
            spy2.mockRestore();
            spy3.mockRestore();
        });

        test('deve pular alertas já enviados', async () => {
            const mockSubmissions = [
                { id: 'sub1', author_email: 'author1@test.com' }
            ];

            const spy1 = jest.spyOn(communicationService, 'getSubmissionsExpiringIn');
            const spy2 = jest.spyOn(communicationService, 'hasExpirationAlertBeenSent');
            const spy3 = jest.spyOn(communicationService, 'sendExpirationAlert');

            spy1.mockResolvedValue(mockSubmissions);
            spy2.mockResolvedValue(true); // Alerta já foi enviado
            spy3.mockResolvedValue({ success: true });

            const result = await communicationService.processExpirationAlerts();

            // Verify que não enviou alerta porque já foi enviado
            expect(spy3).not.toHaveBeenCalled();
            expect(result).toEqual({ totalAlertsSent: 0 });

            spy1.mockRestore();
            spy2.mockRestore();
            spy3.mockRestore();
        });

        test('deve tratar erros', async () => {
            const error = new Error('Processing error');
            const spy = jest.spyOn(communicationService, 'getSubmissionsExpiringIn');
            spy.mockRejectedValue(error);

            await expect(communicationService.processExpirationAlerts())
                .rejects
                .toThrow('Processing error');

            expect(logger.error).toHaveBeenCalledWith('Error processing expiration alerts', {
                error: 'Processing error'
            });

            spy.mockRestore();
        });
    });

    describe('markExpiredSubmissions', () => {
        test('deve marcar submissões expiradas com sucesso', async () => {
            const mockExpiredSubmissions = [
                { id: 'sub1', author_email: 'author1@test.com', title: 'Sub 1', author_name: 'Author 1' },
                { id: 'sub2', author_email: 'author2@test.com', title: 'Sub 2', author_name: 'Author 2' }
            ];

            const spy1 = jest.spyOn(communicationService, 'sendExpirationNotification');
            const spy2 = jest.spyOn(communicationService, 'notifyAdminsOfMassExpiration');

            db.query.mockResolvedValueOnce({ rows: mockExpiredSubmissions });
            spy1.mockResolvedValue({ success: true });
            spy2.mockResolvedValue({ success: true });

            const result = await communicationService.markExpiredSubmissions();

            // Verify database call
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE submissions'),
                expect.arrayContaining([
                    constants.SUBMISSION_STATUS.EXPIRED,
                    constants.SUBMISSION_STATUS.PUBLISHED,
                    constants.SUBMISSION_STATUS.REJECTED,
                    constants.SUBMISSION_STATUS.EXPIRED
                ])
            );

            // Verify que enviou notificação para cada submissão
            expect(spy1).toHaveBeenCalledTimes(2);
            expect(spy1).toHaveBeenCalledWith(mockExpiredSubmissions[0]);
            expect(spy1).toHaveBeenCalledWith(mockExpiredSubmissions[1]);

            // Verify que não notificou admins (menos de 5 expirações)
            expect(spy2).not.toHaveBeenCalled();

            // Verify audit log
            expect(logger.audit).toHaveBeenCalledWith('Expired submissions marked', {
                count: 2,
                submissionIds: ['sub1', 'sub2']
            });

            expect(result).toEqual({ expiredCount: 2 });

            spy1.mockRestore();
            spy2.mockRestore();
        });

        test('deve notificar admins para expirações em massa', async () => {
            const mockExpiredSubmissions = Array(6).fill().map((_, i) => ({
                id: `sub${i}`,
                author_email: `author${i}@test.com`,
                title: `Sub ${i}`,
                author_name: `Author ${i}`
            }));

            const spy1 = jest.spyOn(communicationService, 'sendExpirationNotification');
            const spy2 = jest.spyOn(communicationService, 'notifyAdminsOfMassExpiration');

            db.query.mockResolvedValueOnce({ rows: mockExpiredSubmissions });
            spy1.mockResolvedValue({ success: true });
            spy2.mockResolvedValue({ success: true });

            const result = await communicationService.markExpiredSubmissions();

            // Verify que notificou admins porque houve mais de 5 expirações
            expect(spy2).toHaveBeenCalledWith(mockExpiredSubmissions);

            expect(result).toEqual({ expiredCount: 6 });

            spy1.mockRestore();
            spy2.mockRestore();
        });
    });

    describe('sendDailySummaryToAdmins', () => {
        test('deve enviar resumo diário com sucesso', async () => {
            const mockStats = {
                new_submissions: 5,
                pending_reviews: 10,
                published_articles: 2,
                expiring_tokens: 3
            };

            const mockAdmins = [
                { id: 'admin1', email: 'admin1@test.com', daily_summary: true },
                { id: 'admin2', email: 'admin2@test.com', daily_summary: null }, // null = true
                { id: 'admin3', email: 'admin3@test.com', daily_summary: true }
            ];

            const spy = jest.spyOn(communicationService, 'getDailyStats');
            spy.mockResolvedValue(mockStats);

            db.query.mockResolvedValueOnce({ rows: mockAdmins });
            emailService.sendDailySummary
                .mockResolvedValueOnce({ success: true })
                .mockResolvedValueOnce({ success: true })
                .mockResolvedValueOnce({ success: false }); // Um falha

            const result = await communicationService.sendDailySummaryToAdmins();

            // Verify que buscou estatísticas
            expect(spy).toHaveBeenCalled();

            // Verify que buscou admins ativos
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT a.*, ns.daily_summary'),
            );

            // Verify que enviou email para cada admin
            expect(emailService.sendDailySummary).toHaveBeenCalledTimes(3);

            // Verify audit log
            expect(logger.audit).toHaveBeenCalledWith('Daily summary sent to admins', {
                totalAdmins: 3,
                sent: 2, // Apenas 2 enviados com sucesso
                stats: mockStats
            });

            expect(result).toEqual({
                sent: 2,
                totalAdmins: 3,
                stats: mockStats
            });

            spy.mockRestore();
        });

        test('deve retornar sem envio quando nenhum admin quer resumo', async () => {
            db.query.mockResolvedValue({ rows: [] });

            const result = await communicationService.sendDailySummaryToAdmins();

            expect(result).toEqual({
                sent: 0,
                reason: 'No admins want daily summary'
            });

            expect(emailService.sendDailySummary).not.toHaveBeenCalled();
        });
    });

    describe('getCommunicationHistory', () => {
        test('deve retornar histórico de comunicações', async () => {
            const submissionId = 'sub-123';
            const limit = 25;

            const mockHistory = [
                {
                    id: 'comm1',
                    submission_id: submissionId,
                    type: 'token_resend',
                    direction: 'admin_to_author',
                    recipient_email: 'author@test.com',
                    admin_id: 'admin-123',
                    admin_name: 'Admin User',
                    status: 'sent',
                    data: { hasCustomMessage: true },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];

            db.query.mockResolvedValueOnce({ rows: mockHistory });

            const result = await communicationService.getCommunicationHistory(submissionId, limit);

            // Verify database call
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('FROM communications c'),
                [submissionId, limit]
            );

            // Verify result structure
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(expect.objectContaining({
                id: 'comm1',
                submissionId: submissionId,
                type: 'token_resend',
                direction: 'admin_to_author',
                recipientEmail: 'author@test.com',
                adminId: 'admin-123',
                adminName: 'Admin User',
                status: 'sent',
                data: { hasCustomMessage: true }
            }));
        });

        test('deve usar limite padrão de 50', async () => {
            const submissionId = 'sub-123';

            db.query.mockResolvedValueOnce({ rows: [] });

            await communicationService.getCommunicationHistory(submissionId);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('LIMIT $2'),
                [submissionId, 50]
            );
        });

        test('deve tratar erros', async () => {
            const submissionId = 'sub-123';
            const error = new Error('Database error');

            db.query.mockRejectedValue(error);

            await expect(communicationService.getCommunicationHistory(submissionId))
                .rejects
                .toThrow('Database error');

            expect(logger.error).toHaveBeenCalledWith('Error getting communication history', {
                submissionId,
                error: 'Database error'
            });
        });
    });

    describe('getStatusDisplayName', () => {
        test('deve retornar nomes de status em português', () => {
            expect(communicationService.getStatusDisplayName('DRAFT')).toBe('Rascunho');
            expect(communicationService.getStatusDisplayName('UNDER_REVIEW')).toBe('Em Revisão');
            expect(communicationService.getStatusDisplayName('PUBLISHED')).toBe('Publicado');
            expect(communicationService.getStatusDisplayName('EXPIRED')).toBe('Expirado');
        });

        test('deve retornar status original se não mapeado', () => {
            expect(communicationService.getStatusDisplayName('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS');
        });
    });

    describe('getAdminName', () => {
        test('deve retornar nome do admin', async () => {
            const adminId = 'admin-123';

            db.query.mockResolvedValueOnce({
                rows: [{ name: 'Admin User' }]
            });

            const result = await communicationService.getAdminName(adminId);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT name FROM admins WHERE id = $1',
                [adminId]
            );

            expect(result).toBe('Admin User');
        });

        test('deve retornar "Sistema" para adminId nulo', async () => {
            const result = await communicationService.getAdminName(null);

            expect(result).toBe('Sistema');
            expect(db.query).not.toHaveBeenCalled();
        });

        test('deve retornar "Admin" se admin não encontrado', async () => {
            const adminId = 'non-existent';

            db.query.mockResolvedValueOnce({ rows: [] });

            const result = await communicationService.getAdminName(adminId);

            expect(result).toBe('Admin');
        });
    });

    describe('recordCommunication', () => {
        test('deve registrar comunicação com sucesso', async () => {
            const commData = {
                submissionId: 'sub-123',
                type: 'token_resend',
                direction: 'admin_to_author',
                recipientEmail: 'author@test.com',
                adminId: 'admin-123',
                data: { customMessage: 'teste' }
            };

            db.query.mockResolvedValueOnce({ rows: [{}] });

            await communicationService.recordCommunication(commData);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO communications'),
                expect.arrayContaining([
                    expect.any(String), // UUID
                    'sub-123',
                    'token_resend',
                    'admin_to_author',
                    'author@test.com',
                    'admin-123',
                    null, // feedbackId
                    JSON.stringify({ customMessage: 'teste' })
                ])
            );
        });

        test('deve tratar erro sem falhar', async () => {
            const commData = {
                submissionId: 'sub-123',
                type: 'token_resend',
                direction: 'admin_to_author',
                recipientEmail: 'author@test.com'
            };

            const error = new Error('Database error');
            db.query.mockRejectedValue(error);

            // Não deve lançar erro
            await expect(communicationService.recordCommunication(commData))
                .resolves
                .toBeUndefined();

            expect(logger.error).toHaveBeenCalledWith('Error recording communication', {
                commData,
                error: 'Database error'
            });
        });
    });

    describe('getDailyStats', () => {
        test('deve retornar estatísticas diárias', async () => {
            const mockStats = {
                new_submissions: '5',
                pending_reviews: '10',
                published_articles: '2',
                expiring_tokens: '3'
            };

            db.query.mockResolvedValueOnce({ rows: [mockStats] });

            const result = await communicationService.getDailyStats();

            // Verify database call with correct date range
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                expect.arrayContaining([
                    expect.any(Date), // today
                    expect.any(Date)  // tomorrow
                ])
            );

            expect(result).toEqual(mockStats);
        });
    });

    describe('cleanupOldCommunications', () => {
        test('deve limpar comunicações antigas', async () => {
            const deletedCount = 15;

            db.query.mockResolvedValueOnce({ rowCount: deletedCount });

            const result = await communicationService.cleanupOldCommunications();

            // Verify database call
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM communications'),
                expect.arrayContaining([expect.any(Date)])
            );

            // Verify audit log
            expect(logger.audit).toHaveBeenCalledWith('Old communications cleaned up', {
                cutoffDate: expect.any(Date),
                deletedCount
            });

            expect(result).toBe(deletedCount);
        });
    });

    describe('getCommunicationStatsFromDB', () => {
        test('deve executar queries corretas e retornar estatísticas formatadas', async () => {
            const mockByTypeResults = [
                {type: 'token_sent', direction: 'outbound', count: '10', successful: '9', failed: '1'},
                {type: 'reminder_sent', direction: 'outbound', count: '5', successful: '4', failed: '1'}
            ];

            const mockTotalResult = [
                {total_communications: '15'}
            ];

            db.query
                .mockResolvedValueOnce({rows: mockByTypeResults})
                .mockResolvedValueOnce({rows: mockTotalResult});

            const result = await communicationService.getCommunicationStatsFromDB(30);

            expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('GROUP BY type, direction'));
            expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('COUNT(*) as total_communications'));

            expect(result).toEqual({
                byType: mockByTypeResults,
                total: 15,
                period: 30
            });
        });

        test('deve usar o número correto de dias na query', async () => {
            db.query
                .mockResolvedValueOnce({rows: []})
                .mockResolvedValueOnce({rows: [{total_communications: '0'}]});

            await communicationService.getCommunicationStatsFromDB(7);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("INTERVAL '7 days'")
            );
        });
    });
});
