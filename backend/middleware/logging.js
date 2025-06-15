const winston = require('winston');
const path = require('path');

// Custom format for structured logging
const customFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta
        });
    })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
require('fs').mkdirSync(logsDir, { recursive: true });

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: {
        service: 'transitos-backend',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Error log - only errors
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),

        // Combined log - all levels
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),

        // Console output for development
        ...(process.env.NODE_ENV !== 'production' ? [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple(),
                    winston.format.printf(({ timestamp, level, message, ...meta }) => {
                        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                        return `${timestamp} [${level}]: ${message} ${metaStr}`;
                    })
                )
            })
        ] : [])
    ],

    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            maxsize: 5242880,
            maxFiles: 3
        })
    ],

    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            maxsize: 5242880,
            maxFiles: 3
        })
    ]
});

// Custom methods for specific log types
logger.security = (message, meta = {}) => {
    logger.warn(message, { ...meta, type: 'security' });
};

logger.database = (message, meta = {}) => {
    logger.info(message, { ...meta, type: 'database' });
};

logger.performance = (message, meta = {}) => {
    logger.info(message, { ...meta, type: 'performance' });
};

logger.audit = (message, meta = {}) => {
    logger.info(message, { ...meta, type: 'audit' });
};

// Performance monitoring middleware
logger.createPerformanceLogger = (operationName) => {
    const start = Date.now();

    return {
        end: (meta = {}) => {
            const duration = Date.now() - start;
            logger.performance(`${operationName} completed`, {
                duration,
                operation: operationName,
                ...meta
            });
        }
    };
};

module.exports = logger;
