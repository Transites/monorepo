/**
 * Testes para EmailController
 */
const emailController = require('../../controllers/email');
const emailService = require('../../services/email');
const emailTemplates = require('../../services/emailTemplates');
const db = require('../../database/client');
const logger = require('../../middleware/logging');
const { validationResult } = require('express-validator');

// Mock dependencies
jest.mock('../../services/email');
jest.mock('../../services/emailTemplates');
jest.mock('../../database/client');
jest.mock('../../middleware/logging');
jest.mock('express-validator', () => ({
    validationResult: jest.fn()
}));

describe('EmailController', () => {
    let req, res, next;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup request, response, next
        req = {
            body: {},
            user: { id: 'admin-123', email: 'admin@example.com', name: 'Admin User' }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();

        // Mock validation result
        validationResult.mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(true),
            array: jest.fn().mockReturnValue([])
        });
    });

    describe('testEmailConfiguration', () => {
        test('deve enviar email de teste com sucesso', async () => {
            // Setup
            req.body.testEmail = 'test@example.com';

            emailService.testEmailConfiguration.mockResolvedValue({
                success: true,
                message: 'Email de teste enviado com sucesso'
            });

            const mockResponses = require('../../utils/responses');
            jest.spyOn(mockResponses, 'success').mockImplementation((res, data, message) => {
                res.json({ success: true, data, message });
                return res;
            });

            // Execute
            await emailController.testEmailConfiguration(req, res, next);

            // Verify
            expect(emailService.testEmailConfiguration).toHaveBeenCalledWith('test@example.com');
            expect(logger.audit).toHaveBeenCalledWith('Email configuration test executed', expect.any(Object));
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    success: true
                })
            }));
            expect(next).not.toHaveBeenCalled();
        });

        test('deve validar dados de entrada', async () => {
            // Setup
            validationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue([{ msg: 'Email inválido' }])
            });

            const mockResponses = require('../../utils/responses');
            jest.spyOn(mockResponses, 'badRequest').mockImplementation((res, message, details) => {
                res.status(400).json({ success: false, error: message, details });
                return res;
            });

            // Execute
            await emailController.testEmailConfiguration(req, res, next);

            // Verify
            expect(emailService.testEmailConfiguration).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Dados inválidos'
            }));
        });

        test('deve tratar erros corretamente', async () => {
            // Setup
            req.body.testEmail = 'test@example.com';

            const testError = new Error('Test error');
            emailService.testEmailConfiguration.mockRejectedValue(testError);

            // Execute
            await emailController.testEmailConfiguration(req, res, next);

            // Verify
            expect(logger.error).toHaveBeenCalledWith('Email configuration test failed', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('sendBulkNotification', () => {
        test('deve enviar para múltiplas submissões', async () => {
            // Setup
            req.body = {
                submissionIds: ['sub1', 'sub2', 'sub3'],
                subject: 'Test Subject',
                message: 'Test message content'
            };

            const mockSubmissions = [
                { id: 'sub1', author_email: 'author1@example.com', author_name: 'Author 1', title: 'Submission 1' },
                { id: 'sub2', author_email: 'author2@example.com', author_name: 'Author 2', title: 'Submission 2' },
                null // Simular submissão não encontrada
            ];

            db.findById
                .mockResolvedValueOnce(mockSubmissions[0])
                .mockResolvedValueOnce(mockSubmissions[1])
                .mockResolvedValueOnce(mockSubmissions[2]);

            emailTemplates.baseTemplate.mockReturnValue('<html>Test template</html>');
            emailService.sendEmail
                .mockResolvedValueOnce({ success: true })
                .mockResolvedValueOnce({ success: true });

            const mockResponses = require('../../utils/responses');
            jest.spyOn(mockResponses, 'success').mockImplementation((res, data, message) => {
                res.json({ success: true, data, message });
                return res;
            });

            // Execute
            await emailController.sendBulkNotification(req, res, next);

            // Verify
            expect(db.findById).toHaveBeenCalledTimes(3);
            expect(emailService.sendEmail).toHaveBeenCalledTimes(2); // Apenas para submissões encontradas

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    summary: {
                        total: 3,
                        successful: 2,
                        failed: 1
                    }
                })
            }));

            expect(logger.audit).toHaveBeenCalledWith('Bulk notification sent by admin', expect.any(Object));
        });

        test('deve tratar falhas individuais', async () => {
            // Setup
            req.body = {
                submissionIds: ['sub1', 'sub2'],
                subject: 'Test Subject',
                message: 'Test message content'
            };

            const mockSubmissions = [
                { id: 'sub1', author_email: 'author1@example.com', author_name: 'Author 1', title: 'Submission 1' },
                { id: 'sub2', author_email: 'author2@example.com', author_name: 'Author 2', title: 'Submission 2' }
            ];

            db.findById
                .mockResolvedValueOnce(mockSubmissions[0])
                .mockResolvedValueOnce(mockSubmissions[1]);

            emailTemplates.baseTemplate.mockReturnValue('<html>Test template</html>');

            // First email succeeds, second fails
            emailService.sendEmail
                .mockResolvedValueOnce({ success: true })
                .mockRejectedValueOnce(new Error('Failed to send'));

            const mockResponses = require('../../utils/responses');
            jest.spyOn(mockResponses, 'success').mockImplementation((res, data, message) => {
                res.json({ success: true, data, message });
                return res;
            });

            // Execute
            await emailController.sendBulkNotification(req, res, next);

            // Verify
            expect(emailService.sendEmail).toHaveBeenCalledTimes(2);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    summary: {
                        total: 2,
                        successful: 1,
                        failed: 1
                    }
                })
            }));

            // Should have one success and one failure in results
            expect(res.json.mock.calls[0][0].data.results).toEqual(expect.arrayContaining([
                expect.objectContaining({ success: true }),
                expect.objectContaining({ success: false, error: expect.any(String) })
            ]));
        });
    });

    describe('resendToken', () => {
        test('deve reenviar token existente', async () => {
            // Setup
            req.body.submissionId = 'sub1';

            const mockSubmission = {
                id: 'sub1',
                author_email: 'author@example.com',
                token: 'existing-token-123',
                title: 'Test Submission'
            };

            db.findById.mockResolvedValue(mockSubmission);
            emailService.sendSubmissionToken.mockResolvedValue({ success: true });

            const mockResponses = require('../../utils/responses');
            jest.spyOn(mockResponses, 'success').mockImplementation((res, data, message) => {
                res.json({ success: true, data, message });
                return res;
            });

            // Execute
            await emailController.resendToken(req, res, next);

            // Verify
            expect(db.findById).toHaveBeenCalledWith('submissions', 'sub1');
            expect(emailService.sendSubmissionToken).toHaveBeenCalledWith(
                mockSubmission.author_email,
                mockSubmission,
                mockSubmission.token
            );

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    sent: true,
                    authorEmail: mockSubmission.author_email
                })
            }));

            expect(logger.audit).toHaveBeenCalledWith('Token email resent by admin', expect.any(Object));
        });
    });

    describe('getEmailStats', () => {
        test('deve retornar estatísticas de email com sucesso', async () => {
            // Setup
            const mockStats = {
                emailsSentToday: 150,
                failureRate: 0.05,
                lastSuccessfulEmail: '2023-01-01T12:00:00Z',
                lastFailedEmail: '2023-01-01T11:45:00Z'
            };

            emailService.getEmailStats.mockResolvedValue(mockStats);

            const mockResponses = require('../../utils/responses');
            jest.spyOn(mockResponses, 'success').mockImplementation((res, data, message) => {
                res.json({ success: true, data, message });
                return res;
            });

            // Execute
            await emailController.getEmailStats(req, res, next);

            // Verify
            expect(emailService.getEmailStats).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    stats: mockStats,
                    timestamp: expect.any(String)
                })
            }));
        });

        test('deve tratar erros corretamente', async () => {
            // Setup
            const testError = new Error('Failed to get email stats');
            emailService.getEmailStats.mockRejectedValue(testError);

            // Execute
            await emailController.getEmailStats(req, res, next);

            // Verify
            expect(logger.error).toHaveBeenCalledWith('Failed to get email stats', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('sendCustomReminder', () => {
        test('deve enviar lembrete customizado com sucesso', async () => {
            // Setup
            req.body = {
                submissionId: 'sub1',
                message: 'Este é um lembrete personalizado para sua submissão.'
            };

            const mockSubmission = {
                id: 'sub1',
                author_email: 'author@example.com',
                author_name: 'Test Author',
                token: 'submission-token-123',
                title: 'Test Submission'
            };

            db.findById.mockResolvedValue(mockSubmission);
            emailTemplates.baseTemplate.mockReturnValue('<html>Test template</html>');
            emailService.sendEmail.mockResolvedValue({ success: true });

            const mockResponses = require('../../utils/responses');
            jest.spyOn(mockResponses, 'success').mockImplementation((res, data, message) => {
                res.json({ success: true, data, message });
                return res;
            });

            // Execute
            await emailController.sendCustomReminder(req, res, next);

            // Verify
            expect(db.findById).toHaveBeenCalledWith('submissions', 'sub1');
            expect(emailTemplates.baseTemplate).toHaveBeenCalled();
            expect(emailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: mockSubmission.author_email,
                subject: expect.stringContaining(mockSubmission.title),
                html: expect.any(String)
            }));

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    sent: true,
                    authorEmail: mockSubmission.author_email
                })
            }));

            expect(logger.audit).toHaveBeenCalledWith('Custom reminder sent by admin', expect.any(Object));
        });

        test('deve retornar erro quando submissão não for encontrada', async () => {
            // Setup
            req.body = {
                submissionId: 'non-existent-id',
                message: 'Este é um lembrete personalizado.'
            };

            db.findById.mockResolvedValue(null);

            const mockResponses = require('../../utils/responses');
            jest.spyOn(mockResponses, 'notFound').mockImplementation((res, message) => {
                res.status(404).json({ success: false, error: message });
                return res;
            });

            // Execute
            await emailController.sendCustomReminder(req, res, next);

            // Verify
            expect(db.findById).toHaveBeenCalledWith('submissions', 'non-existent-id');
            expect(emailService.sendEmail).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Submissão não encontrada'
            }));
        });

        test('deve tratar erros de validação', async () => {
            // Setup
            req.body = {
                // Missing required fields
            };

            validationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue([{ msg: 'Campo obrigatório' }])
            });

            const mockResponses = require('../../utils/responses');
            jest.spyOn(mockResponses, 'badRequest').mockImplementation((res, message, errors) => {
                res.status(400).json({ success: false, error: message, errors });
                return res;
            });

            // Execute
            await emailController.sendCustomReminder(req, res, next);

            // Verify
            expect(validationResult).toHaveBeenCalled();
            expect(db.findById).not.toHaveBeenCalled();
            expect(emailService.sendEmail).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Dados inválidos'
            }));
        });

        test('deve tratar erros ao enviar email', async () => {
            // Setup
            req.body = {
                submissionId: 'sub1',
                message: 'Este é um lembrete personalizado.'
            };

            const mockSubmission = {
                id: 'sub1',
                author_email: 'author@example.com',
                author_name: 'Test Author',
                token: 'submission-token-123',
                title: 'Test Submission'
            };

            db.findById.mockResolvedValue(mockSubmission);
            emailTemplates.baseTemplate.mockReturnValue('<html>Test template</html>');

            const testError = new Error('Failed to send email');
            emailService.sendEmail.mockRejectedValue(testError);

            // Execute
            await emailController.sendCustomReminder(req, res, next);

            // Verify
            expect(logger.error).toHaveBeenCalledWith('Failed to send custom reminder', expect.any(Object));
            expect(next).toHaveBeenCalledWith(testError);
        });
    });
});
