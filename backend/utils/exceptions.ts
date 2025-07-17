// exceptions file for services and controllers

export abstract class BaseException extends Error {
    abstract readonly statusCode: number;
    abstract readonly errorCode: string;
    public readonly timestamp: Date;

    constructor(message: string, public readonly details?: any) {
        super(message);
        this.name = this.constructor.name;
        this.timestamp = new Date();
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            errorCode: this.errorCode,
            timestamp: this.timestamp,
            details: this.details
        };
    }
}

// 400 Bad Request errors
export class ValidationException extends BaseException {
    readonly statusCode = 400;
    readonly errorCode = 'VALIDATION_ERROR';

    constructor(message: string, public readonly validationErrors: string[]) {
        super(message, { validationErrors });
    }
}

export class InvalidStatusException extends BaseException {
    readonly statusCode = 400;
    readonly errorCode = 'INVALID_STATUS';

    constructor(message: string, public readonly currentStatus: string, public readonly requiredStatuses: string[]) {
        super(message, { currentStatus, requiredStatuses });
    }
}

export class IncompleteSubmissionException extends BaseException {
    readonly statusCode = 400;
    readonly errorCode = 'INCOMPLETE_SUBMISSION';

    constructor(message: string, public readonly missingFields: string[]) {
        super(message, { missingFields });
    }
}

export class AttachmentLimitException extends BaseException {
    readonly statusCode = 400;
    readonly errorCode = 'ATTACHMENT_LIMIT_EXCEEDED';

    constructor(message: string, public readonly maxAttachments: number) {
        super(message, { maxAttachments });
    }
}

export class InvalidFileTypeException extends BaseException {
    readonly statusCode = 400;
    readonly errorCode = 'INVALID_FILE_TYPE';

    constructor(message: string, public readonly allowedTypes: string[]) {
        super(message, { allowedTypes });
    }
}

// 401 Unauthorized errors

export class UnauthorizedException extends BaseException {
    readonly statusCode = 401;
    readonly errorCode = 'UNAUTHORIZED';

    constructor(message: string = 'Acesso não autorizado') {
        super(message);
    }
}

// 404 Not Found errors
export class SubmissionNotFoundException extends BaseException {
    readonly statusCode = 404;
    readonly errorCode = 'SUBMISSION_NOT_FOUND';

    constructor(message: string = 'Submissão não encontrada') {
        super(message);
    }
}

export class AttachmentNotFoundException extends BaseException {
    readonly statusCode = 404;
    readonly errorCode = 'ATTACHMENT_NOT_FOUND';

    constructor(message: string = 'Anexo não encontrado') {
        super(message);
    }
}

// 410 Gone errors
export class TokenExpiredException extends BaseException {
    readonly statusCode = 410;
    readonly errorCode = 'TOKEN_EXPIRED';

    constructor(message: string = 'Token expirado', public readonly canRecover: boolean = true) {
        super(message, { canRecover });
    }
}

// 403 Forbidden errors
export class InvalidTokenException extends BaseException {
    readonly statusCode = 403;
    readonly errorCode = 'INVALID_TOKEN';

    constructor(message: string = 'Token inválido') {
        super(message);
    }
}

export class OperationNotAllowedException extends BaseException {
    readonly statusCode = 403;
    readonly errorCode = 'OPERATION_NOT_ALLOWED';

    constructor(message: string, public readonly reason: string) {
        super(message, { reason });
    }
}

// 500 Internal Server Error
export class DatabaseException extends BaseException {
    readonly statusCode = 500;
    readonly errorCode = 'DATABASE_ERROR';

    constructor(message: string = 'Erro interno do servidor', originalError?: Error) {
        super(message, { originalError: originalError?.message });
    }
}

export class EmailException extends BaseException {
    readonly statusCode = 500;
    readonly errorCode = 'EMAIL_ERROR';

    constructor(message: string = 'Erro ao enviar email', public readonly emailType: string) {
        super(message, { emailType });
    }
}

// Type guards for exception handling
export function isValidationException(error: any): error is ValidationException {
    return error instanceof ValidationException;
}

export function isSubmissionNotFoundException(error: any): error is SubmissionNotFoundException {
    return error instanceof SubmissionNotFoundException;
}

export function isTokenExpiredException(error: any): error is TokenExpiredException {
    return error instanceof TokenExpiredException;
}

export function isInvalidTokenException(error: any): error is InvalidTokenException {
    return error instanceof InvalidTokenException;
}

export function isInvalidStatusException(error: any): error is InvalidStatusException {
    return error instanceof InvalidStatusException;
}

export function isIncompleteSubmissionException(error: any): error is IncompleteSubmissionException {
    return error instanceof IncompleteSubmissionException;
}

export function isAttachmentException(error: any): error is AttachmentNotFoundException | AttachmentLimitException {
    return error instanceof AttachmentNotFoundException || error instanceof AttachmentLimitException;
}

export function isDatabaseException(error: any): error is DatabaseException {
    return error instanceof DatabaseException;
}

export function isEmailException(error: any): error is EmailException {
    return error instanceof EmailException;
}

export function isBaseException(error: any): error is BaseException {
    return error instanceof BaseException;
}
