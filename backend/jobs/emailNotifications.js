const cron = require('node-cron');
const emailService = require('../services/email');
const tokenService = require('../services/tokens');
const db = require('../database/client');
const logger = require('../middleware/logging');
const constants = require('../utils/constants');

class EmailNotificationJob {
    constructor() {
        this.isRunning = false;
        this.adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@enciclopedia.iea.usp.br'];
    }

    /**
     * Iniciar jobs de notificação
     */
    start() {
        // Verificar tokens expirando - diário às 9:00 AM
        cron.schedule('0 9 * * *', () => {
            this.checkExpiringTokens();
        }, {
            timezone: 'America/Sao_Paulo'
        });

        // Enviar resumo diário - diário às 8:00 AM
        cron.schedule('0 8 * * *', () => {
            this.sendDailySummary();
        }, {
            timezone: 'America/Sao_Paulo'
        });

        // Limpeza e notificações - a cada 6 horas
        cron.schedule('0 */6 * * *', () => {
            this.processExpiredTokens();
        }, {
            timezone: 'America/Sao_Paulo'
        });

        logger.info('Email notification jobs scheduled');
    }

    /**
     * Verificar e notificar sobre tokens expirando
     */
    async checkExpiringTokens() {
        if (this.isRunning) return;
        this.isRunning = true;

        try {
            logger.info('Starting expiring tokens check');

            // Buscar tokens expirando em 5, 3 e 1 dia
            const expiringIn5Days = await tokenService.findExpiringSubmissions(5);
            const expiringIn3Days = await tokenService.findExpiringSubmissions(3);
            const expiringIn1Day = await tokenService.findExpiringSubmissions(1);

            // Enviar avisos de 5 dias
            for (const submission of expiringIn5Days) {
                if (Math.ceil(submission.days_to_expiry) === 5) {
                    await emailService.sendExpirationWarning(submission, 5);
                }
            }

            // Enviar avisos de 3 dias
            for (const submission of expiringIn3Days) {
                if (Math.ceil(submission.days_to_expiry) === 3) {
                    await emailService.sendExpirationWarning(submission, 3);
                }
            }

            // Enviar avisos de 1 dia
            for (const submission of expiringIn1Day) {
                if (Math.ceil(submission.days_to_expiry) === 1) {
                    await emailService.sendExpirationWarning(submission, 1);
                }
            }

            logger.audit('Expiring tokens check completed', {
                expiring5Days: expiringIn5Days.length,
                expiring3Days: expiringIn3Days.length,
                expiring1Day: expiringIn1Day.length
            });

        } catch (error) {
            logger.error('Error in expiring tokens check', {
                error: error.message
            });
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Processar tokens expirados
     */
    async processExpiredTokens() {
        try {
            logger.info('Processing expired tokens');

            // Buscar submissões que acabaram de expirar
            const result = await db.query(`
                SELECT id, token, author_name, author_email, title, expires_at
                FROM submissions
                WHERE status IN ($1, $2)
                AND expires_at < NOW()
                AND expires_at > NOW() - INTERVAL '6 hours'
            `, [
                constants.SUBMISSION_STATUS.DRAFT,
                constants.SUBMISSION_STATUS.CHANGES_REQUESTED
            ]);

            // Notificar autores sobre expiração
            for (const submission of result.rows) {
                await emailService.notifyTokenExpired(submission);

                logger.audit('Token expired notification sent', {
                    submissionId: submission.id,
                    authorEmail: submission.author_email
                });
            }

            // Executar limpeza automática
            await tokenService.cleanupExpiredTokens();

        } catch (error) {
            logger.error('Error processing expired tokens', {
                error: error.message
            });
        }
    }

    /**
     * Enviar resumo diário
     */
    async sendDailySummary() {
        try {
            logger.info('Generating daily summary');

            // Coletar estatísticas do dia
            const today = new Date();
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

            const stats = await db.query(`
                SELECT
                    COUNT(*) FILTER (WHERE created_at >= $1 AND status = $2) as new_submissions,
                    COUNT(*) FILTER (WHERE status = $3) as pending_reviews,
                    COUNT(*) FILTER (WHERE created_at >= $1 AND status = $4) as published_today,
                    COUNT(*) FILTER (WHERE expires_at <= NOW() + INTERVAL '5 days' AND status IN ($2, $5)) as expiring_tokens
                FROM submissions
            `, [
                yesterday,
                constants.SUBMISSION_STATUS.DRAFT,
                constants.SUBMISSION_STATUS.UNDER_REVIEW,
                constants.SUBMISSION_STATUS.PUBLISHED,
                constants.SUBMISSION_STATUS.CHANGES_REQUESTED
            ]);

            const summaryData = {
                newSubmissions: parseInt(stats.rows[0].new_submissions),
                pendingReviews: parseInt(stats.rows[0].pending_reviews),
                publishedArticles: parseInt(stats.rows[0].published_today),
                expiringTokens: parseInt(stats.rows[0].expiring_tokens)
            };

            // Enviar apenas se houver atividade
            if (summaryData.newSubmissions > 0 || summaryData.pendingReviews > 0 || summaryData.publishedArticles > 0) {
                await emailService.sendDailySummary(summaryData, this.adminEmails);

                logger.audit('Daily summary sent', {
                    summaryData,
                    adminEmails: this.adminEmails
                });
            }

        } catch (error) {
            logger.error('Error generating daily summary', {
                error: error.message
            });
        }
    }

    /**
     * Executar notificação manual
     */
    async runManualNotification(type) {
        try {
            switch (type) {
                case 'expiring_tokens':
                    await this.checkExpiringTokens();
                    break;
                case 'daily_summary':
                    await this.sendDailySummary();
                    break;
                case 'expired_tokens':
                    await this.processExpiredTokens();
                    break;
                default:
                    throw new Error(`Unknown notification type: ${type}`);
            }

            return { success: true, type };

        } catch (error) {
            logger.error('Manual notification failed', {
                type,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Status do job
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            adminEmails: this.adminEmails,
            scheduledJobs: [
                'Expiring tokens check: Daily at 9:00 AM',
                'Daily summary: Daily at 8:00 AM',
                'Expired tokens processing: Every 6 hours'
            ]
        };
    }
}

module.exports = new EmailNotificationJob();
