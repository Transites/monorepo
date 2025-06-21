/**
 * Testes para EmailNotificationJob
 */
const emailNotificationJob = require('../../jobs/emailNotifications');
const emailService = require('../../services/email');
const tokenService = require('../../services/tokens');
const db = require('../../database/client');
const logger = require('../../middleware/logging');
const constants = require('../../utils/constants');

// Mock dependencies
jest.mock('../../services/email');
jest.mock('../../services/tokens');
jest.mock('../../database/client');
jest.mock('../../middleware/logging');
jest.mock('node-cron', () => ({
    schedule: jest.fn()
}));

describe('EmailNotificationJob', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('checkExpiringTokens', () => {
        test('deve encontrar tokens expirando e enviar avisos', async () => {
            const mockSubmissions5Days = [
                { id: 'sub1', author_email: 'author1@example.com', days_to_expiry: 5 },
                { id: 'sub2', author_email: 'author2@example.com', days_to_expiry: 3.5 } // Não deve enviar para este
            ];

            const mockSubmissions3Days = [
                { id: 'sub3', author_email: 'author3@example.com', days_to_expiry: 3 }
            ];

            const mockSubmissions1Day = [
                { id: 'sub4', author_email: 'author4@example.com', days_to_expiry: 1 }
            ];
            tokenService.findExpiringSubmissions
                .mockResolvedValueOnce(mockSubmissions5Days)
                .mockResolvedValueOnce(mockSubmissions3Days)
                .mockResolvedValueOnce(mockSubmissions1Day);
            emailService.sendExpirationWarning.mockResolvedValue({ success: true });

            await emailNotificationJob.checkExpiringTokens();

            expect(tokenService.findExpiringSubmissions).toHaveBeenCalledTimes(3);
            expect(tokenService.findExpiringSubmissions).toHaveBeenCalledWith(5);
            expect(tokenService.findExpiringSubmissions).toHaveBeenCalledWith(3);
            expect(tokenService.findExpiringSubmissions).toHaveBeenCalledWith(1);

            // Should send 3 emails (one for each exact day match)
            expect(emailService.sendExpirationWarning).toHaveBeenCalledTimes(3);
            expect(emailService.sendExpirationWarning).toHaveBeenCalledWith(mockSubmissions5Days[0], 5);
            expect(emailService.sendExpirationWarning).toHaveBeenCalledWith(mockSubmissions3Days[0], 3);
            expect(emailService.sendExpirationWarning).toHaveBeenCalledWith(mockSubmissions1Day[0], 1);

            expect(logger.audit).toHaveBeenCalledWith('Expiring tokens check completed', expect.any(Object));
        });

        test('deve lidar com erros graciosamente', async () => {
            // Setup
            tokenService.findExpiringSubmissions.mockRejectedValue(new Error('Test error'));

            // Execute
            await emailNotificationJob.checkExpiringTokens();

            // Verify
            expect(logger.error).toHaveBeenCalledWith('Error in expiring tokens check', expect.any(Object));
            expect(emailNotificationJob.isRunning).toBe(false); // Should reset running flag
        });
    });

    describe('processExpiredTokens', () => {
        test('deve notificar sobre tokens expirados', async () => {
            // Setup
            const mockExpiredSubmissions = {
                rows: [
                    { id: 'sub1', author_email: 'author1@example.com', title: 'Submission 1' },
                    { id: 'sub2', author_email: 'author2@example.com', title: 'Submission 2' }
                ]
            };

            db.query.mockResolvedValue(mockExpiredSubmissions);
            emailService.notifyTokenExpired.mockResolvedValue({ success: true });
            tokenService.cleanupExpiredTokens.mockResolvedValue({ expiredCount: 2 });

            // Execute
            await emailNotificationJob.processExpiredTokens();

            // Verify
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT id, token, author_name'), [
                constants.SUBMISSION_STATUS.DRAFT,
                constants.SUBMISSION_STATUS.CHANGES_REQUESTED
            ]);

            expect(emailService.notifyTokenExpired).toHaveBeenCalledTimes(2);
            expect(emailService.notifyTokenExpired).toHaveBeenCalledWith(mockExpiredSubmissions.rows[0]);
            expect(emailService.notifyTokenExpired).toHaveBeenCalledWith(mockExpiredSubmissions.rows[1]);

            expect(tokenService.cleanupExpiredTokens).toHaveBeenCalled();
            expect(logger.audit).toHaveBeenCalledTimes(2);
        });
    });

    describe('sendDailySummary', () => {
        test('deve enviar resumo diário quando houver atividade', async () => {
            // Setup
            const mockStats = {
                rows: [{
                    new_submissions: '2',
                    pending_reviews: '3',
                    published_today: '1',
                    expiring_tokens: '4'
                }]
            };

            db.query.mockResolvedValue(mockStats);
            emailService.sendDailySummary.mockResolvedValue({ success: true });

            // Execute
            await emailNotificationJob.sendDailySummary();

            // Verify
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), expect.any(Array));

            expect(emailService.sendDailySummary).toHaveBeenCalledWith(
                {
                    newSubmissions: 2,
                    pendingReviews: 3,
                    publishedArticles: 1,
                    expiringTokens: 4
                },
                expect.any(Array)
            );

            expect(logger.audit).toHaveBeenCalledWith('Daily summary sent', expect.any(Object));
        });

        test('não deve enviar resumo quando não houver atividade', async () => {
            // Setup
            const mockStats = {
                rows: [{
                    new_submissions: '0',
                    pending_reviews: '0',
                    published_today: '0',
                    expiring_tokens: '4' // Apenas tokens expirando não deve disparar email
                }]
            };

            db.query.mockResolvedValue(mockStats);

            // Execute
            await emailNotificationJob.sendDailySummary();

            // Verify
            expect(emailService.sendDailySummary).not.toHaveBeenCalled();
        });
    });

    describe('runManualNotification', () => {
        test('deve executar notificação manual do tipo especificado', async () => {
            // Setup
            jest.spyOn(emailNotificationJob, 'checkExpiringTokens').mockResolvedValue();
            jest.spyOn(emailNotificationJob, 'sendDailySummary').mockResolvedValue();
            jest.spyOn(emailNotificationJob, 'processExpiredTokens').mockResolvedValue();

            // Execute & Verify
            await expect(emailNotificationJob.runManualNotification('expiring_tokens')).resolves.toEqual({
                success: true,
                type: 'expiring_tokens'
            });
            expect(emailNotificationJob.checkExpiringTokens).toHaveBeenCalled();

            await expect(emailNotificationJob.runManualNotification('daily_summary')).resolves.toEqual({
                success: true,
                type: 'daily_summary'
            });
            expect(emailNotificationJob.sendDailySummary).toHaveBeenCalled();

            await expect(emailNotificationJob.runManualNotification('expired_tokens')).resolves.toEqual({
                success: true,
                type: 'expired_tokens'
            });
            expect(emailNotificationJob.processExpiredTokens).toHaveBeenCalled();
        });

        test('deve rejeitar com erro para tipo desconhecido', async () => {
            await expect(emailNotificationJob.runManualNotification('unknown_type')).rejects.toThrow('Unknown notification type');
            expect(logger.error).toHaveBeenCalledWith('Manual notification failed', expect.any(Object));
        });
    });
});
