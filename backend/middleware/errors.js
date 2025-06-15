const logger = require('./logging');

class ErrorHandler {
    // 404 handler
    notFound = (req, res, next) => {
        const error = new Error(`Endpoint não encontrado: ${req.originalUrl}`);
        error.status = 404;
        next(error);
    };

    // General error handler
    general = (err, req, res, next) => {
        const requestId = req.requestId || 'unknown';

        // Default error response
        const errorResponse = {
            error: 'Erro interno do servidor',
            requestId,
            timestamp: new Date().toISOString()
        };

        // Determine error type and status
        let statusCode = err.status || err.statusCode || 500;
        let message = err.message || 'Erro interno do servidor';

        // Handle specific error types
        if (err.name === 'ValidationError') {
            statusCode = 400;
            message = 'Dados inválidos';
            errorResponse.details = this.extractValidationErrors(err);
        } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
            statusCode = 401;
            message = 'Não autorizado';
        } else if (err.name === 'ForbiddenError') {
            statusCode = 403;
            message = 'Acesso negado';
        } else if (err.code === '23505') { // PostgreSQL unique violation
            statusCode = 409;
            message = 'Recurso já existe';
        } else if (err.code === '23503') { // PostgreSQL foreign key violation
            statusCode = 400;
            message = 'Referência inválida';
        } else if (err.code === 'ECONNREFUSED') {
            statusCode = 503;
            message = 'Serviço temporariamente indisponível';
        }

        // Log error details
        const logLevel = statusCode >= 500 ? 'error' : 'warn';
        logger[logLevel]('Request error', {
            requestId,
            error: {
                name: err.name,
                message: err.message,
                stack: err.stack,
                code: err.code
            },
            request: {
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            },
            statusCode
        });

        // Security: don't expose sensitive error details in production
        if (process.env.NODE_ENV === 'production') {
            if (statusCode >= 500) {
                errorResponse.error = 'Erro interno do servidor';
            } else {
                errorResponse.error = message;
            }
        } else {
            // Development: include more details
            errorResponse.error = message;
            errorResponse.stack = err.stack;
            errorResponse.details = err.details;
        }

        res.status(statusCode).json(errorResponse);
    };

    // Extract validation errors from different sources
    extractValidationErrors(err) {
        if (err.errors) {
            // Mongoose-style validation errors
            return Object.values(err.errors).map(e => ({
                field: e.path,
                message: e.message,
                value: e.value
            }));
        } else if (err.details) {
            // Joi-style validation errors
            return err.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));
        }
        return null;
    }

    // Async error wrapper
    asyncHandler = (fn) => {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    };

    // Custom error classes
    createError(message, statusCode = 500, details = null) {
        const error = new Error(message);
        error.status = statusCode;
        error.details = details;
        return error;
    }

    createValidationError(message, details) {
        const error = new Error(message);
        error.name = 'ValidationError';
        error.status = 400;
        error.details = details;
        return error;
    }

    createUnauthorizedError(message = 'Não autorizado') {
        const error = new Error(message);
        error.name = 'UnauthorizedError';
        error.status = 401;
        return error;
    }

    createForbiddenError(message = 'Acesso negado') {
        const error = new Error(message);
        error.name = 'ForbiddenError';
        error.status = 403;
        return error;
    }

    createNotFoundError(message = 'Recurso não encontrado') {
        const error = new Error(message);
        error.status = 404;
        return error;
    }
}

module.exports = new ErrorHandler();
