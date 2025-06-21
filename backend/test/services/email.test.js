/**
 * Testes para EmailService
 */
const emailService = require('../../services/email');
const { Resend } = require('resend');
const logger = require('../../middleware/logging');

// Mock dependencies
jest.mock('resend');
jest.mock('../../middleware/logging');

describe('EmailService', () => {
    let mockResendInstance;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup Resend mock
        mockResendInstance = {
            emails: {
                send: jest.fn()
            }
        };

        Resend.mockImplementation(() => mockResendInstance);

        // Reinstantiate service with mocks
        emailService.resend = mockResendInstance;
    });

    describe('sendEmail', () => {
        test('deve enviar email com dados válidos', async () => {
            // Setup
            const emailData = {
                to: 'test@example.com',
                subject: 'Test Subject',
                html: '<p>Test content</p>'
            };

            mockResendInstance.emails.send.mockResolvedValue({
                data: { id: 'mock-email-id' }
            });

            // Execute
            const result = await emailService.sendEmail(emailData);

            // Verify
            expect(mockResendInstance.emails.send).toHaveBeenCalledWith(expect.objectContaining({
                from: expect.any(String),
                to: ['test@example.com'],
                subject: 'Test Subject',
                html: '<p>Test content</p>'
            }));

            expect(result).toEqual({
                success: true,
                messageId: 'mock-email-id',
                retryCount: 0
            });

            expect(logger.audit).toHaveBeenCalledWith('Email sent successfully', expect.any(Object));
        });

        test('deve aplicar retry em caso de falha', async () => {
            // Setup
            const emailData = {
                to: 'test@example.com',
                subject: 'Test Subject',
                html: '<p>Test content</p>'
            };

            // Fail on first attempt, succeed on second
            mockResendInstance.emails.send
                .mockRejectedValueOnce(new Error('Test error'))
                .mockResolvedValueOnce({ data: { id: 'mock-email-id' } });

            // Mock sleep to avoid waiting
            jest.spyOn(emailService, 'sleep').mockImplementation(() => Promise.resolve());

            // Execute
            const result = await emailService.sendEmail(emailData);

            // Verify
            expect(mockResendInstance.emails.send).toHaveBeenCalledTimes(2);
            expect(emailService.sleep).toHaveBeenCalledWith(expect.any(Number));
            expect(logger.error).toHaveBeenCalledWith('Email sending failed', expect.any(Object));
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Retrying email'), expect.any(Object));

            expect(result).toEqual({
                success: true,
                messageId: 'mock-email-id',
                retryCount: 1
            });
        });

        test('deve falhar após esgotar tentativas', async () => {
            // Setup
            const emailData = {
                to: 'test@example.com',
                subject: 'Test Subject',
                html: '<p>Test content</p>'
            };

            // Fail on all attempts
            mockResendInstance.emails.send.mockRejectedValue(new Error('Test error'));

            // Mock sleep to avoid waiting
            jest.spyOn(emailService, 'sleep').mockImplementation(() => Promise.resolve());

            // Execute & Verify
            await expect(emailService.sendEmail(emailData)).rejects.toThrow('Falha ao enviar email');

            // Should have tried the maximum number of times
            expect(mockResendInstance.emails.send).toHaveBeenCalledTimes(emailService.retryAttempts + 1);
            expect(emailService.sleep).toHaveBeenCalledTimes(emailService.retryAttempts);
            expect(logger.error).toHaveBeenCalledWith('Email sending failed after all retries', expect.any(Object));
        });
    });

    describe('sendSubmissionToken', () => {
        test('deve enviar token para autor', async () => {
            // Setup
            const authorEmail = 'author@example.com';
            const submission = {
                id: 'sub123',
                author_name: 'Test Author',
                title: 'Test Submission',
                expires_at: new Date(Date.now() + 86400000) // tomorrow
            };
            const token = 'test-token-123';

            // Mock sendEmail
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });

            // Execute
            const result = await emailService.sendSubmissionToken(authorEmail, submission, token);

            // Verify
            expect(emailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: authorEmail,
                subject: expect.stringContaining(submission.title),
                html: expect.any(String)
            }));

            expect(result).toEqual({ success: true });
            expect(logger.audit).toHaveBeenCalledWith('Submission token email sent', expect.any(Object));
        });
    });

    describe('notifyAdminNewSubmission', () => {
        test('deve notificar admin sobre nova submissão', async () => {
            // Setup
            const submission = {
                id: 'sub123',
                author_name: 'Test Author',
                author_email: 'author@example.com',
                title: 'Test Submission',
                category: 'Test Category',
                summary: 'Test Summary',
                created_at: new Date()
            };
            const adminEmails = ['admin1@example.com', 'admin2@example.com'];

            // Mock sendEmail
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });

            // Execute
            const result = await emailService.notifyAdminNewSubmission(submission, adminEmails);

            // Verify
            expect(emailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: adminEmails,
                subject: expect.stringContaining(submission.title),
                html: expect.any(String)
            }));

            expect(result).toEqual({ success: true });
            expect(logger.audit).toHaveBeenCalledWith('Admin notification sent for new submission', expect.any(Object));
        });

        test('deve tratar erros ao notificar admin', async () => {
            // Setup
            const submission = {
                id: 'sub123',
                author_name: 'Test Author',
                author_email: 'author@example.com',
                title: 'Test Submission',
                category: 'Test Category',
                summary: 'Test Summary',
                created_at: new Date()
            };
            const adminEmails = ['admin1@example.com', 'admin2@example.com'];
            const testError = new Error('Test error');

            // Mock sendEmail to throw error
            jest.spyOn(emailService, 'sendEmail').mockRejectedValue(testError);

            // Execute & Verify
            await expect(emailService.notifyAdminNewSubmission(submission, adminEmails))
                .rejects.toThrow(testError);

            expect(logger.error).toHaveBeenCalledWith('Failed to send admin notification', expect.any(Object));
        });
    });

    describe('sendFeedbackToAuthor', () => {
        test('deve enviar feedback para autor', async () => {
            // Setup
            const submission = {
                id: 'sub123',
                author_name: 'Test Author',
                author_email: 'author@example.com',
                title: 'Test Submission',
                token: 'test-token-123'
            };
            const feedback = {
                id: 'feedback123',
                content: 'This is test feedback',
                created_at: new Date()
            };
            const adminName = 'Admin User';

            // Mock sendEmail
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });

            // Execute
            const result = await emailService.sendFeedbackToAuthor(submission, feedback, adminName);

            // Verify
            expect(emailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: submission.author_email,
                subject: expect.stringContaining(submission.title),
                html: expect.any(String)
            }));

            expect(result).toEqual({ success: true });
            expect(logger.audit).toHaveBeenCalledWith('Feedback email sent to author', expect.any(Object));
        });

        test('deve tratar erros ao enviar feedback', async () => {
            // Setup
            const submission = {
                id: 'sub123',
                author_name: 'Test Author',
                author_email: 'author@example.com',
                title: 'Test Submission',
                token: 'test-token-123'
            };
            const feedback = {
                id: 'feedback123',
                content: 'This is test feedback',
                created_at: new Date()
            };
            const adminName = 'Admin User';
            const testError = new Error('Test error');

            // Mock sendEmail to throw error
            jest.spyOn(emailService, 'sendEmail').mockRejectedValue(testError);

            // Execute & Verify
            await expect(emailService.sendFeedbackToAuthor(submission, feedback, adminName))
                .rejects.toThrow(testError);

            expect(logger.error).toHaveBeenCalledWith('Failed to send feedback email', expect.any(Object));
        });
    });

    describe('notifyAuthorApproval', () => {
        test('deve notificar autor sobre aprovação', async () => {
            // Setup
            const submission = {
                id: 'sub123',
                author_name: 'Test Author',
                author_email: 'author@example.com',
                title: 'Test Submission'
            };
            const articleUrl = 'https://example.com/article/123';

            // Mock sendEmail
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });

            // Execute
            const result = await emailService.notifyAuthorApproval(submission, articleUrl);

            // Verify
            expect(emailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: submission.author_email,
                subject: expect.stringContaining(submission.title),
                html: expect.any(String)
            }));

            expect(result).toEqual({ success: true });
            expect(logger.audit).toHaveBeenCalledWith('Approval notification sent to author', expect.any(Object));
        });

        test('deve tratar erros ao notificar aprovação', async () => {
            // Setup
            const submission = {
                id: 'sub123',
                author_name: 'Test Author',
                author_email: 'author@example.com',
                title: 'Test Submission'
            };
            const articleUrl = 'https://example.com/article/123';
            const testError = new Error('Test error');

            // Mock sendEmail to throw error
            jest.spyOn(emailService, 'sendEmail').mockRejectedValue(testError);

            // Execute & Verify
            await expect(emailService.notifyAuthorApproval(submission, articleUrl))
                .rejects.toThrow(testError);

            expect(logger.error).toHaveBeenCalledWith('Failed to send approval notification', expect.any(Object));
        });
    });

    describe('sendExpirationWarning', () => {
        test('deve enviar aviso de expiração', async () => {
            // Setup
            const submission = {
                id: 'sub123',
                author_name: 'Test Author',
                author_email: 'author@example.com',
                title: 'Test Submission',
                token: 'test-token-123',
                expires_at: new Date(Date.now() + 86400000) // tomorrow
            };
            const daysRemaining = 1;

            // Mock sendEmail
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });

            // Execute
            const result = await emailService.sendExpirationWarning(submission, daysRemaining);

            // Verify
            expect(emailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: submission.author_email,
                subject: expect.stringContaining(String(daysRemaining)),
                html: expect.any(String)
            }));

            expect(result).toEqual({ success: true });
            expect(logger.audit).toHaveBeenCalledWith('Expiration warning sent', expect.any(Object));
        });

        test('deve tratar erros ao enviar aviso de expiração', async () => {
            // Setup
            const submission = {
                id: 'sub123',
                author_name: 'Test Author',
                author_email: 'author@example.com',
                title: 'Test Submission',
                token: 'test-token-123',
                expires_at: new Date(Date.now() + 86400000) // tomorrow
            };
            const daysRemaining = 1;
            const testError = new Error('Test error');

            // Mock sendEmail to throw error
            jest.spyOn(emailService, 'sendEmail').mockRejectedValue(testError);

            // Execute & Verify
            await expect(emailService.sendExpirationWarning(submission, daysRemaining))
                .rejects.toThrow(testError);

            expect(logger.error).toHaveBeenCalledWith('Failed to send expiration warning', expect.any(Object));
        });
    });

    describe('notifyTokenExpired', () => {
        test('deve notificar sobre token expirado', async () => {
            // Setup
            const submission = {
                id: 'sub123',
                author_name: 'Test Author',
                author_email: 'author@example.com',
                title: 'Test Submission'
            };

            // Mock sendEmail
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });

            // Execute
            const result = await emailService.notifyTokenExpired(submission);

            // Verify
            expect(emailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: submission.author_email,
                subject: expect.stringContaining('Token expirado'),
                html: expect.any(String)
            }));

            expect(result).toEqual({ success: true });
            expect(logger.audit).toHaveBeenCalledWith('Token expired notification sent', expect.any(Object));
        });

        test('deve tratar erros ao notificar token expirado', async () => {
            // Setup
            const submission = {
                id: 'sub123',
                author_name: 'Test Author',
                author_email: 'author@example.com',
                title: 'Test Submission'
            };
            const testError = new Error('Test error');

            // Mock sendEmail to throw error
            jest.spyOn(emailService, 'sendEmail').mockRejectedValue(testError);

            // Execute & Verify
            await expect(emailService.notifyTokenExpired(submission))
                .rejects.toThrow(testError);

            expect(logger.error).toHaveBeenCalledWith('Failed to send token expired notification', expect.any(Object));
        });
    });

    describe('alertAdminSuspiciousActivity', () => {
        test('deve alertar admin sobre atividade suspeita', async () => {
            // Setup
            const activityData = {
                type: 'multiple_failed_logins',
                details: 'Multiple failed login attempts detected',
                ip: '192.168.1.1'
            };
            const adminEmails = ['admin1@example.com', 'admin2@example.com'];

            // Mock sendEmail
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });

            // Execute
            const result = await emailService.alertAdminSuspiciousActivity(activityData, adminEmails);

            // Verify
            expect(emailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: adminEmails,
                subject: expect.stringContaining('Security'),
                html: expect.any(String)
            }));

            expect(result).toEqual({ success: true });
            expect(logger.audit).toHaveBeenCalledWith('Security alert sent to admins', expect.any(Object));
        });

        test('deve tratar erros ao alertar admin', async () => {
            // Setup
            const activityData = {
                type: 'multiple_failed_logins',
                details: 'Multiple failed login attempts detected',
                ip: '192.168.1.1'
            };
            const adminEmails = ['admin1@example.com', 'admin2@example.com'];
            const testError = new Error('Test error');

            // Mock sendEmail to throw error
            jest.spyOn(emailService, 'sendEmail').mockRejectedValue(testError);

            // Execute & Verify
            await expect(emailService.alertAdminSuspiciousActivity(activityData, adminEmails))
                .rejects.toThrow(testError);

            expect(logger.error).toHaveBeenCalledWith('Failed to send security alert', expect.any(Object));
        });
    });

    describe('sendDailySummary', () => {
        test('deve enviar resumo diário para admin', async () => {
            // Setup
            const summaryData = {
                newSubmissions: 5,
                pendingReviews: 10,
                publishedArticles: 3,
                expiringTokens: 2
            };
            const adminEmails = ['admin1@example.com', 'admin2@example.com'];

            // Mock sendEmail
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });

            // Execute
            const result = await emailService.sendDailySummary(summaryData, adminEmails);

            // Verify
            expect(emailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: adminEmails,
                subject: expect.stringContaining('Resumo diário'),
                html: expect.any(String)
            }));

            expect(result).toEqual({ success: true });
            expect(logger.audit).toHaveBeenCalledWith('Daily summary sent to admins', expect.any(Object));
        });

        test('deve tratar erros ao enviar resumo diário', async () => {
            // Setup
            const summaryData = {
                newSubmissions: 5,
                pendingReviews: 10,
                publishedArticles: 3,
                expiringTokens: 2
            };
            const adminEmails = ['admin1@example.com', 'admin2@example.com'];
            const testError = new Error('Test error');

            // Mock sendEmail to throw error
            jest.spyOn(emailService, 'sendEmail').mockRejectedValue(testError);

            // Execute & Verify
            await expect(emailService.sendDailySummary(summaryData, adminEmails))
                .rejects.toThrow(testError);

            expect(logger.error).toHaveBeenCalledWith('Failed to send daily summary', expect.any(Object));
        });
    });

    describe('testEmailConfiguration', () => {
        test('deve testar configuração de email com sucesso', async () => {
            // Setup
            const testEmail = 'test@example.com';

            // Mock sendEmail
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });

            // Execute
            const result = await emailService.testEmailConfiguration(testEmail);

            // Verify
            expect(emailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: testEmail,
                subject: expect.stringContaining('Teste de configuração'),
                html: expect.any(String)
            }));

            expect(result).toEqual({
                success: true,
                message: 'Email de teste enviado com sucesso'
            });
        });

        test('deve tratar erros ao testar configuração', async () => {
            // Setup
            const testEmail = 'test@example.com';
            const testError = new Error('Test error');

            // Mock sendEmail to throw error
            jest.spyOn(emailService, 'sendEmail').mockRejectedValue(testError);

            // Execute & Verify
            await expect(emailService.testEmailConfiguration(testEmail))
                .rejects.toThrow(testError);

            expect(logger.error).toHaveBeenCalledWith('Email configuration test failed', expect.any(Object));
        });
    });
});
