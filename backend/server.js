const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const config = require('./config/services');
const logger = require('./middleware/logging');
const errorHandler = require('./middleware/errors');
const securityMiddleware = require('./middleware/security');
const routes = require('./routes');

class Server {
    constructor() {
        this.app = express();
        this.port = config.core.port || 3000;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security headers
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
                    scriptSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: [],
                },
            },
            crossOriginEmbedderPolicy: false
        }));

        // CORS configuration
        const corsOptions = {
            origin: config.core.corsOrigin || 'https://enciclopedia.iea.usp.br',
            credentials: true,
            optionsSuccessStatus: 200,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        };
        this.app.use(cors(corsOptions));

        // General middleware
        this.app.use(compression());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // HTTP request logging
        this.app.use(morgan('combined', {
            stream: { write: message => logger.info(message.trim()) }
        }));

        // General rate limiting
        const generalLimiter = rateLimit({
            windowMs: config.core.rateLimitWindow || 15 * 60 * 1000, // 15 minutes
            max: config.core.rateLimitMax || 100,
            message: {
                error: 'Muitas tentativas, tente novamente em 15 minutos',
                retryAfter: Math.ceil((config.core.rateLimitWindow || 900000) / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(generalLimiter);

        // Custom security middleware
        this.app.use(securityMiddleware.requestLogger);
        this.app.use(securityMiddleware.sanitizeInput);
    }

    setupRoutes() {
        // Health check (antes de outros middlewares)
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            });
        });

        // Main routes
        this.app.use('/api', routes);

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint não encontrado',
                path: req.originalUrl,
                method: req.method
            });
        });
    }

    setupErrorHandling() {
        this.app.use(errorHandler.notFound);
        this.app.use(errorHandler.general);
    }

    async start() {
        try {
            // Test database connection
            const db = require('./database/client');
            const healthCheck = await db.healthCheck();
            if (healthCheck.status !== 'healthy') {
                throw new Error(`Database unhealthy: ${healthCheck.error}`);
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
