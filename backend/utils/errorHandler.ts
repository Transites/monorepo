import { Response, NextFunction } from 'express';
import responses from './responses';
import logger from '../middleware/logging';
import {
    BaseException,
    isValidationException,
    isSubmissionNotFoundException,
    isTokenExpiredException,
    isInvalidTokenException,
    isInvalidStatusException,
    isIncompleteSubmissionException,
    isAttachmentException,
    isBaseException
} from './exceptions';

interface ErrorContext {
    [key: string]: any;
}

/**
 * Centralized error handler that maps exceptions to appropriate HTTP responses
 */
export function handleControllerError(
    error: any,
    res: Response,
    next: NextFunction,
    context: ErrorContext = {}
): any {
    logger.error('Controller error', {
        ...context,
        error: error?.message,
        errorType: error?.constructor?.name
    });

    if (isValidationException(error)) {
        return responses.badRequest(res, error.message, error.details);
    }

    if (isSubmissionNotFoundException(error)) {
        return responses.notFound(res, error.message);
    }

    if (isTokenExpiredException(error)) {
        return responses.error(res, error.message, 410, {
            reason: error.errorCode,
            canRecover: error.canRecover
        });
    }

    if (isInvalidTokenException(error)) {
        return responses.error(res, error.message, 403);
    }

    if (isInvalidStatusException(error)) {
        return responses.badRequest(res, error.message, {
            currentStatus: error.currentStatus,
            requiredStatuses: error.requiredStatuses
        });
    }

    if (isIncompleteSubmissionException(error)) {
        return responses.badRequest(res, error.message, {
            missingFields: error.missingFields
        });
    }

    if (isAttachmentException(error)) {
        return responses.badRequest(res, error.message, error.details);
    }

    if (isBaseException(error)) {
        return responses.error(res, error.message, error.statusCode, error.details);
    }

    // Unknown error - pass to global error handler
    next(error);
}

/**
 * Get appropriate response method based on status code
 */
export function getResponseMethodByStatusCode(statusCode: number) {
    switch (statusCode) {
        case 200:
            return responses.success;
        case 201:
            return responses.created;
        case 400:
            return responses.badRequest;
        case 401:
            return responses.unauthorized;
        case 403:
            return responses.forbidden;
        case 404:
            return responses.notFound;
        case 409:
            return responses.conflict;
        case 422:
            return responses.unprocessableEntity;
        case 500:
        default:
            return responses.error;
    }
}


/**
 * Async error wrapper for controllers
 */
export function asyncErrorHandler(fn: Function) {
    return (req: any, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Create standardized error response for API endpoints
 */
export function createErrorResponse(error: BaseException, includeStack = false) {
    const response = {
        success: false,
        error: {
            code: error.errorCode,
            message: error.message,
            statusCode: error.statusCode,
            timestamp: error.timestamp,
            details: error.details
        }
    };

    if (includeStack && process.env.NODE_ENV !== 'production') {
        (response.error as any).stack = error.stack;
    }

    return response;
}

export default {
    handleControllerError,
    getResponseMethodByStatusCode,
    asyncErrorHandler,
    createErrorResponse
};

