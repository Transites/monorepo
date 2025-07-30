const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const logger = require('./logging');

class SecurityMiddleware {
    constructor() {
        this.suspiciousIPs = new Map(); // IP -> { attempts, lastAttempt }
        this.cleanupInterval = setInterval(() => this.cleanupSuspiciousIPs(), 60000); // 1 minute
    }

    // Rate limiters específicos
    createAuthLimiter() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // máximo 5 tentativas de login por IP
            skipSuccessfulRequests: true,
            message: {
                error: 'Muitas tentativas de login, tente novamente em 15 minutos',
                retryAfter: 900
            }
        });
    }

    createSubmissionLimiter() {
        if (process.env.NODE_ENV === 'development') {
            // No rate limiting in development for easier testing
            return (req, res, next) => next();
        }
        return rateLimit({
            windowMs: 24 * 60 * 60 * 1000, // 24 hours
            max: 5, // máximo 5 submissões por IP por dia
            message: {
                error: 'Limite de submissões diárias atingido, tente novamente amanhã',
                retryAfter: 86400
            },
            keyGenerator: (req) => {
                // Consider user's email if available for better limiting
                return req.body?.author_email || req.ip;
            }
        });
    }

    createTokenLimiter() {
        return rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 10, // máximo 10 tentativas de token por IP por hora
            message: {
                error: 'Muitas tentativas de acesso por token, tente novamente em 1 hora',
                retryAfter: 3600
            }
        });
    }

    // Middleware para log de requests
    requestLogger = (req, res, next) => {
        const requestId = crypto.randomUUID();
        req.requestId = requestId;

        const startTime = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - startTime;

            logger.info('HTTP Request', {
                requestId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                contentLength: res.get('Content-Length')
            });

            // Track suspicious activity
            if (res.statusCode >= 400) {
                this.trackSuspiciousActivity(req.ip, req.path, res.statusCode);
            }
        });

        next();
    };

    // Sanitização de inputs
    sanitizeInput = (req, res, next) => {
        const sanitizeString = (str) => {
            if (typeof str !== 'string') return str;

            // Remove caracteres perigosos
            return str
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '')
                .trim();
        };

        const sanitizeObject = (obj) => {
            if (obj === null || typeof obj !== 'object') return obj;

            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = sanitizeString(obj[key]);
                } else if (typeof obj[key] === 'object') {
                    sanitizeObject(obj[key]);
                }
            }
            return obj;
        };

        if (req.body) {
            req.body = sanitizeObject({ ...req.body });
        }

        if (req.query) {
            req.query = sanitizeObject({ ...req.query });
        }

        next();
    };

    // Validações comuns
    validateEmail = body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido');

    validatePassword = body('password')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número');

    validateRequired = (field) =>
        body(field)
            .notEmpty()
            .withMessage(`${field} é obrigatório`)
            .trim()
            .escape();

    validateToken = body('token')
        .isLength({ min: 64, max: 64 })
        .withMessage('Token inválido')
        .matches(/^[a-f0-9]+$/)
        .withMessage('Token deve conter apenas caracteres hexadecimais');

    // Middleware para verificar validações
    checkValidation = (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Validation errors', {
                requestId: req.requestId,
                errors: errors.array(),
                ip: req.ip
            });

            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }
        next();
    };

    // Track suspicious activity
    trackSuspiciousActivity(ip, path, statusCode) {
        if (!this.suspiciousIPs.has(ip)) {
            this.suspiciousIPs.set(ip, { attempts: 0, lastAttempt: Date.now() });
        }

        const activity = this.suspiciousIPs.get(ip);
        activity.attempts++;
        activity.lastAttempt = Date.now();

        // Alert after 10 failed attempts in 5 minutes
        if (activity.attempts >= 10) {
            logger.error('Suspicious activity detected', {
                ip,
                attempts: activity.attempts,
                lastPath: path,
                statusCode
            });
        }
    }

    // Cleanup old suspicious IPs
    cleanupSuspiciousIPs() {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

        for (const [ip, activity] of this.suspiciousIPs.entries()) {
            if (activity.lastAttempt < fiveMinutesAgo) {
                this.suspiciousIPs.delete(ip);
            }
        }
    }

    // Content Security Policy para uploads
    uploadCSP = (req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    };
}

module.exports = new SecurityMiddleware();
