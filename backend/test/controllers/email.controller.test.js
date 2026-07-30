const emailService = require('../../services/email');
const emailTemplates = require('../../services/emailTemplates');
const dbClient = require('../../database/client');
const responses = require('../../utils/responses');
const logger = require('../../middleware/logging');
const { validationResult } = require('express-validator');
const EmailController = require('../../controllers/email');

jest.mock('../../services/email');
jest.mock('../../services/emailTemplates');
jest.mock('../../database/client');
jest.mock('../../utils/responses');
jest.mock('../../middleware/logging');
jest.mock('express-validator', () => ({ validationResult: jest.fn() }));

describe('EmailController', () => {
    let req;
    let res;
    let next;
    const controller = require('../../controllers/email');

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            user: { id: 'admin-id' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();

        validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
        responses.success = jest.fn();
        responses.badRequest = jest.fn();
        responses.notFound = jest.fn();
        responses.error = jest.fn();
    });

    it('resendToken returns notFound when submission missing', async () => {
        req.body.submissionId = 'sub-missing';
        dbClient.findById.mockResolvedValue(null);

        await controller.resendToken(req, res, next);

        expect(responses.notFound).toHaveBeenCalledWith(res, 'Submissão não encontrada');
    });

    it('resendToken returns error when send fails', async () => {
        req.body.submissionId = 'sub-1';
        const submission = { author_email: 'author@example.com', token: 'tok', title: 'Title' };
        dbClient.findById.mockResolvedValue(submission);
        emailService.sendSubmissionToken.mockResolvedValue({ success: false, errorMessage: 'fail' });

        await controller.resendToken(req, res, next);

        expect(responses.error).toHaveBeenCalledWith(res, 'Falha ao enviar email', expect.objectContaining({ success: false }));
    });

    it('resendToken returns success when email sent', async () => {
        req.body.submissionId = 'sub-2';
        const submission = { author_email: 'author@example.com', token: 'tok', title: 'Title' };
        dbClient.findById.mockResolvedValue(submission);
        emailService.sendSubmissionToken.mockResolvedValue({ success: true });

        await controller.resendToken(req, res, next);

        expect(responses.success).toHaveBeenCalledWith(res, { sent: true, authorEmail: 'author@example.com' }, 'Token reenviado por email');
    });

    it('getEmailStats returns statistics successfully', async () => {
        emailService.getEmailStats.mockResolvedValue({ sent: 2, failed: 0 });

        await controller.getEmailStats(req, res, next);

        expect(responses.success).toHaveBeenCalledWith(res, expect.objectContaining({ stats: { sent: 2, failed: 0 } }), 'Estatísticas de email recuperadas');
    });

    it('sendCustomReminder returns notFound when submission missing', async () => {
        req.body = { submissionId: 'sub-missing', message: 'Hello' };
        dbClient.findById.mockResolvedValue(null);

        await controller.sendCustomReminder(req, res, next);

        expect(responses.notFound).toHaveBeenCalledWith(res, 'Submissão não encontrada');
    });

    it('sendCustomReminder returns error when email service fails', async () => {
        req.body = { submissionId: 'sub-3', message: 'Hello' };
        const submission = { author_email: 'author@example.com', token: 'tok', title: 'Title', author_name: 'Author' };
        dbClient.findById.mockResolvedValue(submission);
        emailTemplates.baseTemplate.mockReturnValue('html');
        emailService.sendEmail.mockResolvedValue({ success: false, errorMessage: 'fail' });

        await controller.sendCustomReminder(req, res, next);

        expect(responses.error).toHaveBeenCalledWith(res, 'Falha ao enviar email', expect.objectContaining({ success: false }));
    });

    it('sendCustomReminder returns success when email sent', async () => {
        req.body = { submissionId: 'sub-4', message: 'Hello', subject: 'Hi' };
        const submission = { author_email: 'author@example.com', token: 'tok', title: 'Title', author_name: 'Author' };
        dbClient.findById.mockResolvedValue(submission);
        emailTemplates.baseTemplate.mockReturnValue('html');
        emailService.sendEmail.mockResolvedValue({ success: true });

        await controller.sendCustomReminder(req, res, next);

        expect(responses.success).toHaveBeenCalledWith(res, { sent: true, authorEmail: 'author@example.com' }, 'Lembrete enviado com sucesso');
    });

    it('sendBulkNotification handles missing submission and sends success for found', async () => {
        req.body = { submissionIds: ['missing', 'found'], subject: 'Hi', message: 'Msg' };
        const foundSubmission = { author_email: 'author@example.com', token: 'tok', title: 'Title', author_name: 'Author' };
        dbClient.findById.mockImplementation(async (table, id) => id === 'found' ? foundSubmission : null);
        emailTemplates.baseTemplate.mockReturnValue('html');
        emailService.sendEmail.mockResolvedValue({ success: true });

        await controller.sendBulkNotification(req, res, next);

        expect(responses.success).toHaveBeenCalledWith(
            res,
            expect.objectContaining({
                results: [
                    { submissionId: 'missing', success: false, error: 'Submissão não encontrada' },
                    { submissionId: 'found', success: true, authorEmail: 'author@example.com' }
                ],
                summary: { total: 2, successful: 1, failed: 1 }
            }),
            'Notificação enviada: 1 sucessos, 1 falhas'
        );
    });
});
