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

// Create Express app
const app = express();

// Security headers
app.use(helmet({
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
    origin: process.env.NODE_ENV === 'test'
        ? '*' // Accept any origin in test environment
        : (config.core.corsOrigin || 'https://enciclopedia.iea.usp.br'),
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging - disabled in test environment
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', {
        stream: { write: message => logger.info(message.trim()) }
    }));
}

// General rate limiting - disabled in test environment
if (process.env.NODE_ENV !== 'test') {
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
    app.use(generalLimiter);
}

// Custom security middleware
app.use(securityMiddleware.requestLogger);
app.use(securityMiddleware.sanitizeInput);

// Health check (antes de outros middlewares)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Main routes
app.use('/api', routes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handling
app.use(errorHandler.notFound);
app.use(errorHandler.general);

if (process.env.NODE_ENV !== 'development') {
    try {
        const communicationService = require('./services/communicationService');
        const tokenCleanupJob = require('./jobs/tokenCleanup'); // assumindo que existe

        communicationService.initializeCronJobs();
        tokenCleanupJob.start();

        logger.info('Background jobs initialized successfully', {
            environment: process.env.NODE_ENV,
            jobs: ['communicationService', 'tokenCleanupJob']
        });

    } catch (error) {
        logger.error('Failed to initialize background jobs', {
            error: error.message,
            stack: error.stack
        });
        // process.exit(1); // Descomentar se quiser forçar a parada da aplicação caso os jobs falhem na inicialização
    }
}

module.exports = app;
