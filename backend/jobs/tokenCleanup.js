const cron = require('node-cron');
const tokenService = require('../services/tokens');
const logger = require('../middleware/logging');

class TokenCleanupJob {
    constructor() {
        this.isRunning = false;
    }

    /**
     * Iniciar job de limpeza automática
     * Executa diariamente às 3:00 AM
     */
    start() {
        // Executar diariamente às 3:00 AM
        cron.schedule('0 3 * * *', async () => {
            if (this.isRunning) {
                logger.warn('Token cleanup job already running, skipping');
                return;
            }

            this.isRunning = true;

            try {
                logger.info('Starting automated token cleanup');

                const result = await tokenService.cleanupExpiredTokens();

                logger.audit('Automated token cleanup completed', {
                    expiredCount: result.expiredCount,
                    timestamp: new Date().toISOString()
                });

                // Se houver tokens expirados, buscar os próximos a expirar para alerta
                if (result.expiredCount > 0) {
                    const expiring = await tokenService.findExpiringSubmissions(5);
                    if (expiring.length > 0) {
                        logger.info('Submissions expiring soon found', {
                            count: expiring.length,
                            submissions: expiring.map(sub => ({
                                id: sub.id,
                                title: sub.title,
                                author_email: sub.author_email,
                                days_to_expiry: sub.days_to_expiry
                            }))
                        });
                    }
                }

            } catch (error) {
                logger.error('Error in automated token cleanup', {
                    error: error.message,
                    stack: error.stack
                });
            } finally {
                this.isRunning = false;
            }
        }, {
            timezone: 'America/Sao_Paulo'
        });

        logger.info('Token cleanup job scheduled (daily at 3:00 AM)');
    }

    /**
     * Executar limpeza manual
     */
    async runManual() {
        if (this.isRunning) {
            throw new Error('Cleanup job already running');
        }

        this.isRunning = true;

        try {
            logger.info('Starting manual token cleanup');

            const result = await tokenService.cleanupExpiredTokens();

            logger.audit('Manual token cleanup completed', {
                expiredCount: result.expiredCount,
                timestamp: new Date().toISOString()
            });

            return result;

        } catch (error) {
            logger.error('Error in manual token cleanup', {
                error: error.message
            });
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Verificar status do job
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastRun: this.lastRun || null,
            nextRun: '3:00 AM daily'
        };
    }
}

module.exports = new TokenCleanupJob();
