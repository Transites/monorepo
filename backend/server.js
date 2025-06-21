require('dotenv').config();

const config = require('./config/services');
const logger = require('./middleware/logging');
const app = require('./app');

class Server {
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
            if (process.env.NODE_ENV !== 'test') {
                const tokenCleanupJob = require('./jobs/tokenCleanup');
                tokenCleanupJob.start();
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

    async shutdown(signal) {
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

// Start server if this file is run directly
if (require.main === module) {
    const server = new Server();
    server.start();
}

module.exports = Server;
