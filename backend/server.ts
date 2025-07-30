import dotenv from 'dotenv';
import { Express } from 'express';
import config from './config/services';
import logger from './middleware/logging';
import app from './app';

dotenv.config();

class Server {
    private app: Express;
    private port: number;
    private server: any;

    constructor() {
        this.app = app;
        this.port = config.core.port || 3000;
    }

    async start() {
        try {
            // Test database connection
            const db = require('./database/client');
            const healthCheck = await db.healthCheck();
            if (healthCheck.status !== 'healthy') {
                throw new Error(`Database unhealthy: ${healthCheck.error}`);
            }

            // Iniciar jobs automáticos
            if (process.env.NODE_ENV !== 'development') {
                const tokenCleanupJob = require('./jobs/tokenCleanup');
                const emailNotificationJob = require('./jobs/emailNotifications');

                tokenCleanupJob.start();
                emailNotificationJob.start();

                logger.info('Automated jobs started', {
                    jobs: ['tokenCleanup', 'emailNotifications']
                });
            }

            this.server = this.app.listen(this.port, () => {
                logger.info(`Server running on port ${this.port}`, {
                    port: this.port,
                    environment: process.env.NODE_ENV,
                    pid: process.pid
                });
            });

            // Graceful shutdown handlers
            process.on('SIGTERM', () => this.shutdown('SIGTERM'));
            process.on('SIGINT', () => this.shutdown('SIGINT'));

        } catch (error) {
            logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    async shutdown(signal: string) {
        logger.info(`Received ${signal}, shutting down gracefully`);

        this.server.close(async () => {
            logger.info('HTTP server closed');

            // Close database connections
            try {
                const db = require('./database/client');
                await db.close();
                logger.info('Database connections closed');
            } catch (error) {
                logger.error('Error closing database:', error);
            }

            process.exit(0);
        });

        // Force close after 10 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after 10s');
            process.exit(1);
        }, 10000);
    }
}

if (require.main === module) {
    const server = new Server();
    server.start();
}

module.exports = Server;
