const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const emailService = require('./email');
const tokenService = require('./tokens');
const logger = require('../middleware/logging');
const db = require('../database/client');
const constants = require('../utils/constants');
const {SubmissionNotFoundException} = require("../utils/exceptions");

class CommunicationService {
    constructor() {
        this.emailService = emailService;
        this.tokenService = tokenService;
        this.logger = logger;

        // Configurações de alertas
        this.alertSettings = {
            expiryWarningDays: [5, 2, 1], // Avisos de expiração
            reminderIntervalDays: 7,      // Intervalo para lembretes
            maxReminderCount: 3,          // Máximo de lembretes
            dailySummaryTime: '08:00',    // Hora do resumo diário
            cleanupTime: '02:00'          // Hora da limpeza automática
        };
    }

    /**
     * Re-enviar token para autor
     */
    async resendTokenToAuthor(submissionId, adminId, customMessage = null) {
        try {
            // Buscar submissão
            const submissionResult = await db.query(
                'SELECT * FROM submissions WHERE id = $1',
                [submissionId]
            );

            if (submissionResult.rows.length === 0) {
                throw new SubmissionNotFoundException('Submissão não encontrada');
            }

            const submission = submissionResult.rows[0];

            // Verificar se token não expirou
            if (submission.expires_at < new Date()) {
                throw new Error('Token expirado - use reativar ao invés de re-enviar');
            }

            // Preparar dados do template
            const templateData = {
                authorName: submission.author_name,
                submissionTitle: submission.title,
                tokenUrl: `${process.env.FRONTEND_URL}/submissao/editar/${submission.token}`,
                customMessage: customMessage,
                submissionStatus: this.getStatusDisplayName(submission.status),
                lastUpdate: submission.updated_at,
                expiresAt: submission.expires_at,
                supportEmail: process.env.FROM_EMAIL,
                adminNote: customMessage ? 'Mensagem do administrador:' : null
            };

            // Enviar email
            const emailResult = await this.emailService.sendTokenResend(templateData);

            if (emailResult.success) {
                // Registrar re-envio
                await this.recordCommunication({
                    submissionId: submission.id,
                    type: 'token_resend',
                    direction: 'admin_to_author',
                    recipientEmail: submission.author_email,
                    adminId: adminId,
                    data: {
                        hasCustomMessage: !!customMessage,
                        customMessage: customMessage,
                        tokenStatus: 'active'
                    }
                });

                this.logger.audit('Token resent to author', {
                    submissionId,
                    adminId,
                    authorEmail: submission.author_email,
                    hasCustomMessage: !!customMessage
                });
            }

            return emailResult;

        } catch (error) {
            this.logger.error('Error resending token to author', {
                submissionId,
                adminId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Regenerar e enviar novo token
     */
    async regenerateAndSendToken(submissionId, adminId, reason = null) {
        try {
            // Regenerar token usando TokenService
            const newToken = await this.tokenService.regenerateToken(submissionId);

            // Buscar submissão atualizada
            const submissionResult = await db.query(
                'SELECT * FROM submissions WHERE id = $1',
                [submissionId]
            );

            const submission = submissionResult.rows[0];

            // Preparar dados do template
            const templateData = {
                authorName: submission.author_name,
                submissionTitle: submission.title,
                tokenUrl: `${process.env.FRONTEND_URL}/submissao/editar/${newToken}`,
                reason: reason,
                oldTokenInvalidated: true,
                newExpiryDate: submission.expires_at,
                supportEmail: process.env.FROM_EMAIL,
                securityNote: 'Por segurança, o link anterior foi invalidado.'
            };

            // Enviar email com novo token
            const emailResult = await this.emailService.sendTokenRegenerated(templateData);

            if (emailResult.success) {
                // Registrar regeneração
                await this.recordCommunication({
                    submissionId: submission.id,
                    type: 'token_regenerated',
                    direction: 'admin_to_author',
                    recipientEmail: submission.author_email,
                    adminId: adminId,
                    data: {
                        reason: reason,
                        newToken: newToken,
                        regeneratedBy: adminId
                    }
                });
            }

            this.logger.audit('Token regenerated and sent', {
                submissionId,
                adminId,
                authorEmail: submission.author_email,
                reason,
                newToken
            });

            return { ...emailResult, newToken };

        } catch (error) {
            this.logger.error('Error regenerating and sending token', {
                submissionId,
                adminId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Reativar submissão expirada
     */
    async reactivateExpiredSubmission(submissionId, adminId, newExpiryDays = 30) {
        try {
            // Usar TokenService para reativar
            const result = await this.tokenService.reactivateExpired(submissionId, newExpiryDays);

            // Buscar submissão atualizada
            const submissionResult = await db.query(
                'SELECT * FROM submissions WHERE id = $1',
                [submissionId]
            );

            const submission = submissionResult.rows[0];

            // Preparar dados do template
            const templateData = {
                authorName: submission.author_name,
                submissionTitle: submission.title,
                tokenUrl: `${process.env.FRONTEND_URL}/submissao/editar/${result.token}`,
                reactivatedBy: await this.getAdminName(adminId),
                newExpiryDate: result.expiresAt,
                previousStatus: 'expirada',
                currentStatus: this.getStatusDisplayName(submission.status),
                supportEmail: process.env.FROM_EMAIL,
                welcomeBackMessage: 'Sua submissão foi reativada e agora você pode continuar editando.'
            };

            // Enviar email de reativação
            const emailResult = await this.emailService.sendSubmissionReactivated(templateData);

            if (emailResult.success) {
                // Registrar reativação
                await this.recordCommunication({
                    submissionId: submission.id,
                    type: 'reactivated',
                    direction: 'admin_to_author',
                    recipientEmail: submission.author_email,
                    adminId: adminId,
                    data: {
                        newExpiryDays,
                        newToken: result.token,
                        reactivatedBy: adminId,
                        previousStatus: 'expired'
                    }
                });
            }

            this.logger.audit('Expired submission reactivated', {
                submissionId,
                adminId,
                authorEmail: submission.author_email,
                newExpiryDays,
                newToken: result.token
            });

            return { ...emailResult, ...result };

        } catch (error) {
            this.logger.error('Error reactivating expired submission', {
                submissionId,
                adminId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Enviar lembrete personalizado para autor
     */
    async sendCustomReminder(submissionId, adminId, message, urgency = 'normal') {
        try {
            // Buscar submissão
            const submissionResult = await db.query(
                'SELECT * FROM submissions WHERE id = $1',
                [submissionId]
            );

            if (submissionResult.rows.length === 0) {
                throw new Error('Submissão não encontrada');
            }

            const submission = submissionResult.rows[0];
            const adminName = await this.getAdminName(adminId);

            // Preparar dados do template
            const templateData = {
                authorName: submission.author_name,
                submissionTitle: submission.title,
                customMessage: message,
                adminName: adminName,
                urgency: urgency,
                tokenUrl: `${process.env.FRONTEND_URL}/submissao/editar/${submission.token}`,
                submissionStatus: this.getStatusDisplayName(submission.status),
                lastUpdate: submission.updated_at,
                expiresAt: submission.expires_at,
                supportEmail: process.env.FROM_EMAIL,
                urgencyColors: {
                    low: '#28a745',
                    normal: '#17a2b8',
                    high: '#ffc107',
                    urgent: '#dc3545'
                }
            };

            // Enviar email
            const emailResult = await this.emailService.sendCustomReminder(templateData);

            if (emailResult.success) {
                // Registrar lembrete
                await this.recordCommunication({
                    submissionId: submission.id,
                    type: 'custom_reminder',
                    direction: 'admin_to_author',
                    recipientEmail: submission.author_email,
                    adminId: adminId,
                    data: {
                        message: message,
                        urgency: urgency,
                        adminName: adminName,
                        reminderType: 'manual'
                    }
                });
            }

            this.logger.audit('Custom reminder sent', {
                submissionId,
                adminId,
                authorEmail: submission.author_email,
                urgency,
                messageLength: message.length
            });

            return emailResult;

        } catch (error) {
            this.logger.error('Error sending custom reminder', {
                submissionId,
                adminId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Processar alertas de expiração automáticos
     */
    async processExpirationAlerts() {
        try {
            this.logger.info('Processing expiration alerts');

            let totalAlertsSent = 0;

            for (const days of this.alertSettings.expiryWarningDays) {
                const submissions = await this.getSubmissionsExpiringIn(days);

                for (const submission of submissions) {
                    // Verificar se já enviou alerta para este número de dias
                    const alertSent = await this.hasExpirationAlertBeenSent(submission.id, days);

                    if (!alertSent) {
                        await this.sendExpirationAlert(submission, days);
                        totalAlertsSent++;
                    }
                }
            }

            this.logger.audit('Expiration alerts processing completed', {
                totalAlertsSent,
                processedDays: this.alertSettings.expiryWarningDays
            });

            return { totalAlertsSent };

        } catch (error) {
            this.logger.error('Error processing expiration alerts', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Marcar submissões expiradas automaticamente
     */
    async markExpiredSubmissions() {
        try {
            const result = await db.query(`
                UPDATE submissions
                SET status = $1, updated_at = NOW()
                WHERE expires_at < NOW()
                  AND status NOT IN ($2, $3, $4)
                RETURNING id, author_email, title, author_name
            `, [
                constants.SUBMISSION_STATUS.EXPIRED,
                constants.SUBMISSION_STATUS.PUBLISHED,
                constants.SUBMISSION_STATUS.REJECTED,
                constants.SUBMISSION_STATUS.EXPIRED
            ]);

            const expiredSubmissions = result.rows;

            // Enviar notificação de expiração para cada autor
            for (const submission of expiredSubmissions) {
                await this.sendExpirationNotification(submission);
            }

            // Notificar admins se houver muitas expirações
            if (expiredSubmissions.length > 5) {
                await this.notifyAdminsOfMassExpiration(expiredSubmissions);
            }

            this.logger.audit('Expired submissions marked', {
                count: expiredSubmissions.length,
                submissionIds: expiredSubmissions.map(s => s.id)
            });

            return { expiredCount: expiredSubmissions.length };

        } catch (error) {
            this.logger.error('Error marking expired submissions', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Enviar resumo diário para admins
     */
    async sendDailySummaryToAdmins() {
        try {
            // Buscar estatísticas do dia
            const stats = await this.getDailyStats();

            // Buscar admins que querem resumo diário
            const adminsResult = await db.query(`
                SELECT a.*, ns.daily_summary
                FROM admins a
                LEFT JOIN notification_settings ns ON a.id = ns.admin_id
                WHERE a.is_active = true
                  AND (ns.daily_summary IS NULL OR ns.daily_summary = true)
            `);

            const admins = adminsResult.rows;

            if (admins.length === 0) {
                return { sent: 0, reason: 'No admins want daily summary' };
            }

            const templateData = {
                date: new Date(),
                ...stats,
                adminUrl: `${process.env.FRONTEND_URL}/admin/dashboard`
            };

            // Enviar para cada admin
            let sent = 0;
            for (const admin of admins) {
                try {
                    const result = await this.emailService.sendDailySummary(templateData, admin.email);
                    if (result.success) sent++;
                } catch (error) {
                    this.logger.error('Error sending daily summary to admin', {
                        adminId: admin.id,
                        adminEmail: admin.email,
                        error: error.message
                    });
                }
            }

            this.logger.audit('Daily summary sent to admins', {
                totalAdmins: admins.length,
                sent,
                stats
            });

            return { sent, totalAdmins: admins.length, stats };

        } catch (error) {
            this.logger.error('Error sending daily summary', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obter histórico de comunicações
     */
    async getCommunicationHistory(submissionId, limit = 50) {
        try {
            const result = await db.query(`
                SELECT
                    c.*,
                    a.name as admin_name,
                    s.title as submission_title,
                    s.author_name
                FROM communications c
                LEFT JOIN admins a ON c.admin_id = a.id
                LEFT JOIN submissions s ON c.submission_id = s.id
                WHERE c.submission_id = $1
                ORDER BY c.created_at DESC
                LIMIT $2
            `, [submissionId, limit]);

            return result.rows.map(row => ({
                id: row.id,
                submissionId: row.submission_id,
                type: row.type,
                direction: row.direction,
                recipientEmail: row.recipient_email,
                adminId: row.admin_id,
                adminName: row.admin_name,
                status: row.status,
                data: row.data,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));

        } catch (error) {
            this.logger.error('Error getting communication history', {
                submissionId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Inicializar tarefas CRON automáticas
     */
    initializeCronJobs() {
        // Alertas de expiração (diário às 09:00)
        cron.schedule('0 9 * * *', async () => {
            try {
                await this.processExpirationAlerts();
            } catch (error) {
                this.logger.error('Error in expiration alerts cron job', { error: error.message });
            }
        });

        // Marcar expirados (diário às 00:30)
        cron.schedule('30 0 * * *', async () => {
            try {
                await this.markExpiredSubmissions();
            } catch (error) {
                this.logger.error('Error in mark expired cron job', { error: error.message });
            }
        });

        // Resumo diário (diário às 08:00)
        cron.schedule('0 8 * * *', async () => {
            try {
                await this.sendDailySummaryToAdmins();
            } catch (error) {
                this.logger.error('Error in daily summary cron job', { error: error.message });
            }
        });

        // Limpeza de logs antigos (semanal - domingo às 02:00)
        cron.schedule('0 2 * * 0', async () => {
            try {
                await this.cleanupOldCommunications();
            } catch (error) {
                this.logger.error('Error in cleanup cron job', { error: error.message });
            }
        });

        this.logger.info('Communication service cron jobs initialized');
    }

    // =============================================================================
    // MÉTODOS PRIVADOS E UTILIDADES
    // =============================================================================

    async recordNotification(notificationData) {
        try {
            await db.query(`
                INSERT INTO notifications (
                    id, type, submission_id, recipient_type, recipient_count, data, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [
                uuidv4(),
                notificationData.type,
                notificationData.submissionId,
                notificationData.recipientType,
                notificationData.recipientCount,
                JSON.stringify(notificationData.data)
            ]);
        } catch (error) {
            this.logger.error('Error recording notification', {
                notificationData,
                error: error.message
            });
        }
    }

    async recordCommunication(commData) {
        try {
            await db.query(`
                INSERT INTO communications (
                    id, submission_id, type, direction, recipient_email, admin_id,
                    feedback_id, status, data, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', $8, NOW())
            `, [
                uuidv4(),
                commData.submissionId,
                commData.type,
                commData.direction,
                commData.recipientEmail,
                commData.adminId || null,
                commData.feedbackId || null,
                JSON.stringify(commData.data || {})
            ]);
        } catch (error) {
            this.logger.error('Error recording communication', {
                commData,
                error: error.message
            });
        }
    }

    async getSubmissionsExpiringIn(days) {
        const result = await db.query(`
            SELECT s.*, COUNT(f.id) as feedback_count
            FROM submissions s
            LEFT JOIN feedback f ON s.id = f.submission_id
            WHERE DATE_PART('day', expires_at - NOW()) <= $1
              AND DATE_PART('day', expires_at - NOW()) > $2
              AND s.status NOT IN ($3, $4, $5)
            GROUP BY s.id
        `, [days, days - 1, constants.SUBMISSION_STATUS.PUBLISHED,
            constants.SUBMISSION_STATUS.REJECTED, constants.SUBMISSION_STATUS.EXPIRED]);

        return result.rows;
    }

    async hasExpirationAlertBeenSent(submissionId, days) {
        const result = await db.query(`
            SELECT id FROM communications
            WHERE submission_id = $1
              AND type = 'expiration_alert'
              AND data->>'daysToExpiry' = $2
              AND created_at > NOW() - INTERVAL '2 days'
        `, [submissionId, days.toString()]);

        return result.rows.length > 0;
    }

    async sendExpirationAlert(submission, daysToExpiry) {
        const urgency = daysToExpiry === 1 ? 'urgent' : (daysToExpiry === 2 ? 'high' : 'normal');

        const templateData = {
            authorName: submission.author_name,
            submissionTitle: submission.title,
            daysToExpiry,
            urgency,
            tokenUrl: `${process.env.FRONTEND_URL}/submissao/editar/${submission.token}`,
            expiresAt: submission.expires_at,
            supportEmail: process.env.FROM_EMAIL,
            lastUpdate: submission.updated_at,
            feedbackCount: submission.feedback_count || 0
        };

        const emailResult = await this.emailService.sendExpirationAlert(templateData);

        if (emailResult.success) {
            await this.recordCommunication({
                submissionId: submission.id,
                type: 'expiration_alert',
                direction: 'system_to_author',
                recipientEmail: submission.author_email,
                data: {
                    daysToExpiry,
                    urgency,
                    alertType: 'automatic'
                }
            });
        }

        return emailResult;
    }

    async sendExpirationNotification(submission) {
        const templateData = {
            authorName: submission.author_name,
            submissionTitle: submission.title,
            expiredAt: new Date(),
            supportEmail: process.env.FROM_EMAIL,
            recoveryInstructions: 'Entre em contato conosco para reativar sua submissão.'
        };

        const emailResult = await this.emailService.sendSubmissionExpired(templateData);

        if (emailResult.success) {
            await this.recordCommunication({
                submissionId: submission.id,
                type: 'expired_notification',
                direction: 'system_to_author',
                recipientEmail: submission.author_email,
                data: {
                    expiredAt: new Date(),
                    notificationType: 'automatic'
                }
            });
        }

        return emailResult;
    }

    async getDailyStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const result = await db.query(`
            SELECT
                COUNT(CASE WHEN created_at >= $1 AND created_at < $2 THEN 1 END) as new_submissions,
                COUNT(CASE WHEN status = 'UNDER_REVIEW' THEN 1 END) as pending_reviews,
                COUNT(CASE WHEN status = 'PUBLISHED' AND updated_at >= $1 THEN 1 END) as published_articles,
                COUNT(CASE WHEN expires_at <= NOW() + INTERVAL '5 days'
                           AND status NOT IN ('PUBLISHED', 'REJECTED', 'EXPIRED') THEN 1 END) as expiring_tokens
            FROM submissions
        `, [today, tomorrow]);

        return result.rows[0];
    }

    async cleanupOldCommunications() {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6 meses atrás

        const result = await db.query(`
            DELETE FROM communications
            WHERE created_at < $1
              AND type NOT IN ('token_regenerated', 'reactivated')
            RETURNING count(*)
        `, [cutoffDate]);

        this.logger.audit('Old communications cleaned up', {
            cutoffDate,
            deletedCount: result.rowCount
        });

        return result.rowCount;
    }

    getStatusDisplayName(status) {
        const statusMap = {
            [constants.SUBMISSION_STATUS.DRAFT]: 'Rascunho',
            [constants.SUBMISSION_STATUS.UNDER_REVIEW]: 'Em Revisão',
            [constants.SUBMISSION_STATUS.CHANGES_REQUESTED]: 'Correções Solicitadas',
            [constants.SUBMISSION_STATUS.APPROVED]: 'Aprovado',
            [constants.SUBMISSION_STATUS.PUBLISHED]: 'Publicado',
            [constants.SUBMISSION_STATUS.REJECTED]: 'Rejeitado',
            [constants.SUBMISSION_STATUS.EXPIRED]: 'Expirado'
        };

        return statusMap[status] || status;
    }

    async getAdminName(adminId) {
        if (!adminId) return 'Sistema';

        const result = await db.query('SELECT name FROM admins WHERE id = $1', [adminId]);
        return result.rows[0]?.name || 'Admin';
    }

    async notifyAdminsOfMassExpiration(expiredSubmissions) {
        const templateData = {
            count: expiredSubmissions.length,
            submissions: expiredSubmissions.slice(0, 10), // Top 10
            adminUrl: `${process.env.FRONTEND_URL}/admin/submissions?status=expired`,
            date: new Date()
        };

        const adminsResult = await db.query(`
            SELECT email FROM admins WHERE is_active = true
        `);

        for (const admin of adminsResult.rows) {
            await this.emailService.sendMassExpirationAlert(templateData, admin.email);
        }
    }
    /**
     * Get communication statistics from database
     * @param {number} days - Number of days to look back
     * @returns {Promise<Object>} Statistics object
     */
    async getCommunicationStatsFromDB(days) {
        const result = await db.query(`
            SELECT
                type,
                direction,
                COUNT(*) as count,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
            FROM communications
            WHERE created_at >= NOW() - INTERVAL '${days} days'
            GROUP BY type, direction
            ORDER BY count DESC
        `);

        const totalResult = await db.query(`
            SELECT COUNT(*) as total_communications
            FROM communications
            WHERE created_at >= NOW() - INTERVAL '${days} days'
        `);

        return {
            byType: result.rows,
            total: parseInt(totalResult.rows[0].total_communications),
            period: days
        };
    }
}

module.exports = new CommunicationService();
