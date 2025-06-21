const emailService = require('../services/email');
const emailTemplates = require('../services/emailTemplates');
const logger = require('../middleware/logging');
const responses = require('../utils/responses');
const config = require('../config/services');
const { validationResult } = require('express-validator');

class EmailController {
    /**
     * POST /api/admin/email/test
     * Testar configuração de email (apenas admin)
     */
    async testEmailConfiguration(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const { testEmail } = req.body;

            const result = await emailService.testEmailConfiguration(testEmail);

            logger.audit('Email configuration test executed', {
                adminId: req.user.id,
                testEmail,
                success: result.success
            });

            return responses.success(res, result, 'Email de teste enviado com sucesso');

        } catch (error) {
            logger.error('Email configuration test failed', {
                adminId: req.user?.id,
                testEmail: req.body.testEmail,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * POST /api/admin/email/resend-token
     * Reenviar token por email (apenas admin)
     */
    async resendToken(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const { submissionId } = req.body;
            const db = require('../database/client');

            // Buscar submissão
            const submission = await db.findById('submissions', submissionId);
            if (!submission) {
                return responses.notFound(res, 'Submissão não encontrada');
            }

            // Reenviar token
            await emailService.sendSubmissionToken(
                submission.author_email,
                submission,
                submission.token
            );

            logger.audit('Token email resent by admin', {
                adminId: req.user.id,
                submissionId,
                authorEmail: submission.author_email
            });

            return responses.success(res, {
                sent: true,
                authorEmail: submission.author_email
            }, 'Token reenviado por email');

        } catch (error) {
            logger.error('Failed to resend token email', {
                adminId: req.user?.id,
                submissionId: req.body.submissionId,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * POST /api/admin/email/send-reminder
     * Enviar lembrete customizado (apenas admin)
     */
    async sendCustomReminder(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const { submissionId, message } = req.body;
            const db = require('../database/client');

            // Buscar submissão
            const submission = await db.findById('submissions', submissionId);
            if (!submission) {
                return responses.notFound(res, 'Submissão não encontrada');
            }

            // Enviar lembrete customizado
            const tokenUrl = `${config.app.frontendUrl}/submissao/editar/${submission.token}`;

            const customHtml = emailTemplates.baseTemplate(
                `
                <h2>Lembrete sobre sua submissão</h2>
                <p>Olá <strong>${submission.author_name}</strong>,</p>
                <p>Gostaríamos de fazer um lembrete sobre sua submissão "<strong>${submission.title}</strong>":</p>

                <div class="info-box">
                    <p>${message}</p>
                </div>

                <a href="${tokenUrl}" class="button">Acessar Submissão</a>

                <p>Em caso de dúvidas, responda este email.</p>
                `,
                'Lembrete - Transitos'
            );

            await emailService.sendEmail({
                to: submission.author_email,
                subject: `[Transitos] Lembrete sobre sua submissão - ${submission.title}`,
                html: customHtml
            });

            logger.audit('Custom reminder sent by admin', {
                adminId: req.user.id,
                submissionId,
                authorEmail: submission.author_email,
                messageLength: message.length
            });

            return responses.success(res, {
                sent: true,
                authorEmail: submission.author_email
            }, 'Lembrete enviado com sucesso');

        } catch (error) {
            logger.error('Failed to send custom reminder', {
                adminId: req.user?.id,
                submissionId: req.body.submissionId,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * GET /api/admin/email/stats
     * Estatísticas de email (apenas admin)
     */
    async getEmailStats(req, res, next) {
        try {
            const stats = await emailService.getEmailStats();

            return responses.success(res, {
                stats,
                timestamp: new Date().toISOString()
            }, 'Estatísticas de email recuperadas');

        } catch (error) {
            logger.error('Failed to get email stats', {
                adminId: req.user?.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * POST /api/admin/email/bulk-notification
     * Enviar notificação em massa (apenas admin)
     */
    async sendBulkNotification(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const { submissionIds, subject, message } = req.body;
            const db = require('../database/client');
            const results = [];

            for (const submissionId of submissionIds) {
                try {
                    const submission = await db.findById('submissions', submissionId);
                    if (!submission) {
                        results.push({ submissionId, success: false, error: 'Submissão não encontrada' });
                        continue;
                    }

                    const customHtml = emailTemplates.baseTemplate(
                        `
                        <h2>${subject}</h2>
                        <p>Olá <strong>${submission.author_name}</strong>,</p>
                        <div class="info-box">
                            <p>${message}</p>
                        </div>
                        <p>Esta é uma comunicação da equipe da Enciclopédia Transitos.</p>
                        `,
                        subject
                    );

                    await emailService.sendEmail({
                        to: submission.author_email,
                        subject: `[Transitos] ${subject}`,
                        html: customHtml
                    });

                    results.push({ submissionId, success: true, authorEmail: submission.author_email });

                } catch (error) {
                    results.push({ submissionId, success: false, error: error.message });
                }
            }

            const successCount = results.filter(r => r.success).length;
            const failureCount = results.length - successCount;

            logger.audit('Bulk notification sent by admin', {
                adminId: req.user.id,
                totalSubmissions: submissionIds.length,
                successCount,
                failureCount,
                subject
            });

            return responses.success(res, {
                results,
                summary: {
                    total: submissionIds.length,
                    successful: successCount,
                    failed: failureCount
                }
            }, `Notificação enviada: ${successCount} sucessos, ${failureCount} falhas`);

        } catch (error) {
            logger.error('Failed to send bulk notification', {
                adminId: req.user?.id,
                error: error.message
            });
            next(error);
        }
    }
}

module.exports = new EmailController();
