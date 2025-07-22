const communicationService = require('../services/communicationService');
const { validationResult } = require('express-validator');
const responses = require('../utils/responses');
const logger = require('../middleware/logging');

class CommunicationController {
    /**
     * POST /api/admin/communications/resend-token
     * Re-enviar token para autor
     */
    async resendToken(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const { submissionId } = req.params;
            const { customMessage } = req.body;
            const adminId = req.user.id;

            const result = await communicationService.resendTokenToAuthor(
                submissionId,
                adminId,
                customMessage
            );

            if (result.success) {
                logger.audit('Token resent via API', {
                    submissionId,
                    adminId,
                    hasCustomMessage: !!customMessage
                });

                return responses.success(res, {
                    sent: true,
                    message: 'Token reenviado com sucesso'
                });
            } else {
                return responses.error(res, result.error || 'Erro ao reenviar token', 400);
            }

        } catch (error) {
            logger.error('Error in resendToken controller', {
                submissionId: req.params.submissionId,
                adminId: req.user?.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * POST /api/admin/communications/regenerate-token
     * Regenerar e enviar novo token
     */
    async regenerateToken(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const { submissionId } = req.params;
            const { reason } = req.body;
            const adminId = req.user.id;

            const result = await communicationService.regenerateAndSendToken(
                submissionId,
                adminId,
                reason
            );

            if (result.success) {
                logger.audit('Token regenerated via API', {
                    submissionId,
                    adminId,
                    newToken: result.newToken,
                    reason
                });

                return responses.success(res, {
                    regenerated: true,
                    newToken: result.newToken,
                    message: 'Token regenerado e enviado com sucesso'
                });
            } else {
                return responses.error(res, result.error || 'Erro ao regenerar token', 400);
            }

        } catch (error) {
            logger.error('Error in regenerateToken controller', {
                submissionId: req.params.submissionId,
                adminId: req.user?.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * POST /api/admin/communications/reactivate
     * Reativar submissão expirada
     */
    async reactivateSubmission(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const { submissionId } = req.params;
            const { newExpiryDays = 30 } = req.body;
            const adminId = req.user.id;

            const result = await communicationService.reactivateExpiredSubmission(
                submissionId,
                adminId,
                newExpiryDays
            );

            if (result.success) {
                logger.audit('Submission reactivated via API', {
                    submissionId,
                    adminId,
                    newToken: result.token,
                    newExpiryDays
                });

                return responses.success(res, {
                    reactivated: true,
                    newToken: result.token,
                    newExpiresAt: result.expiresAt,
                    message: 'Submissão reativada com sucesso'
                });
            } else {
                return responses.error(res, result.error || 'Erro ao reativar submissão', 400);
            }

        } catch (error) {
            logger.error('Error in reactivateSubmission controller', {
                submissionId: req.params.submissionId,
                adminId: req.user?.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * POST /api/admin/communications/custom-reminder
     * Enviar lembrete personalizado
     */
    async sendCustomReminder(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const { submissionId } = req.params;
            const { message, urgency = 'normal' } = req.body;
            const adminId = req.user.id;

            const result = await communicationService.sendCustomReminder(
                submissionId,
                adminId,
                message,
                urgency
            );

            if (result.success) {
                logger.audit('Custom reminder sent via API', {
                    submissionId,
                    adminId,
                    urgency,
                    messageLength: message.length
                });

                return responses.success(res, {
                    sent: true,
                    message: 'Lembrete enviado com sucesso'
                });
            } else {
                return responses.error(res, result.error || 'Erro ao enviar lembrete', 400);
            }

        } catch (error) {
            logger.error('Error in sendCustomReminder controller', {
                submissionId: req.params.submissionId,
                adminId: req.user?.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * GET /api/admin/communications/history/:submissionId
     * Histórico de comunicações
     */
    async getCommunicationHistory(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }
            const { submissionId } = req.params;
            const limit = parseInt(req.query.limit) || 50;

            const history = await communicationService.getCommunicationHistory(submissionId, limit);

            return responses.success(res, {
                submissionId,
                history,
                count: history.length
            }, 'Histórico de comunicações carregado');

        } catch (error) {
            logger.error('Error in getCommunicationHistory controller', {
                submissionId: req.params.submissionId,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * POST /api/admin/communications/process-alerts
     * Processar alertas de expiração manualmente
     */
    async processExpirationAlerts(req, res, next) {
        try {
            const adminId = req.user.id;

            const result = await communicationService.processExpirationAlerts();

            logger.audit('Expiration alerts processed manually', {
                adminId,
                totalAlertsSent: result.totalAlertsSent
            });

            return responses.success(res, {
                processed: true,
                totalAlertsSent: result.totalAlertsSent,
                message: `${result.totalAlertsSent} alertas de expiração processados`
            });

        } catch (error) {
            logger.error('Error processing expiration alerts manually', {
                adminId: req.user?.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * POST /api/admin/communications/daily-summary
     * Enviar resumo diário manualmente
     */
    async sendDailySummary(req, res, next) {
        try {
            const adminId = req.user.id;

            // todo: Talvez essa funcao devesse ser alterada para aceitar o id do admin. caso seja null, envia para todos os admins.
            // nao parece justo um admin qualquer receber diversas notificacoes porque outro admin, talvez achando que seu email esta com problema, apertou o botao de enviar resumo diario diversas vezes.
            const result = await communicationService.sendDailySummaryToAdmins();

            logger.audit('Daily summary sent manually', {
                adminId,
                sent: result.sent,
                totalAdmins: result.totalAdmins
            });

            return responses.success(res, {
                sent: result.sent,
                totalAdmins: result.totalAdmins,
                stats: result.stats,
                message: `Resumo diário enviado para ${result.sent} administradores`
            });

        } catch (error) {
            logger.error('Error sending daily summary manually', {
                adminId: req.user?.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * GET /api/admin/communications/stats
     * Estatísticas de comunicação
     */
    async getCommunicationStats(req, res, next) {
        try {
            const days = parseInt(req.query.days) || 30;

            const stats = await communicationService.getCommunicationStatsFromDB(days);

            return responses.success(res, {
                period: `${days} dias`,
                stats,
                generatedAt: new Date()
            }, 'Estatísticas de comunicação');

        } catch (error) {
            logger.error('Error getting communication stats', {
                error: error.message
            });
            next(error);
        }
    }
}

module.exports = new CommunicationController();
