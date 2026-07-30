import { NextFunction, Request, Response } from 'express';
import {
    handleControllerError,
    getResponseMethodByStatusCode,
    asyncErrorHandler,
    createErrorResponse
} from '../../utils/errorHandler';
import * as exceptions from '../../utils/exceptions';

jest.mock('../../utils/responses', () => ({
    badRequest: jest.fn(),
    notFound: jest.fn(),
    error: jest.fn(),
    unauthorized: jest.fn(),
    forbidden: jest.fn(),
    conflict: jest.fn(),
    unprocessableEntity: jest.fn()
}));

jest.mock('../../middleware/logging', () => ({
    error: jest.fn()
}));

const responses = require('../../utils/responses');

describe('Error Handler', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        } as any;
        next = jest.fn();
        jest.clearAllMocks();
        process.env.NODE_ENV = 'development';
    });

    it('handles ValidationException with badRequest', () => {
        const error = new exceptions.ValidationException('Invalid data', ['field1']);

        handleControllerError(error, res as Response, next, { action: 'test' });

        expect(responses.badRequest).toHaveBeenCalledWith(res, 'Invalid data', error.details);
        expect(next).not.toHaveBeenCalled();
    });

    it('handles SubmissionNotFoundException with notFound', () => {
        const error = new exceptions.SubmissionNotFoundException();

        handleControllerError(error, res as Response, next);

        expect(responses.notFound).toHaveBeenCalledWith(res, error.message);
    });

    it('handles TokenExpiredException with custom error response', () => {
        const error = new exceptions.TokenExpiredException('Expired', false);

        handleControllerError(error, res as Response, next);

        expect(responses.error).toHaveBeenCalledWith(
            res,
            'Expired',
            410,
            expect.objectContaining({ reason: 'TOKEN_EXPIRED', canRecover: false })
        );
    });

    it('handles InvalidTokenException with forbidden response', () => {
        const error = new exceptions.InvalidTokenException('Invalid token');

        handleControllerError(error, res as Response, next);

        expect(responses.error).toHaveBeenCalledWith(res, 'Invalid token', 403);
    });

    it('handles InvalidStatusException with badRequest', () => {
        const error = new exceptions.InvalidStatusException('Invalid status', 'DRAFT', ['PUBLISHED']);

        handleControllerError(error, res as Response, next);

        expect(responses.badRequest).toHaveBeenCalledWith(
            res,
            'Invalid status',
            expect.objectContaining({ currentStatus: 'DRAFT', requiredStatuses: ['PUBLISHED'] })
        );
    });

    it('handles IncompleteSubmissionException with badRequest', () => {
        const error = new exceptions.IncompleteSubmissionException('Missing fields', ['title']);

        handleControllerError(error, res as Response, next);

        expect(responses.badRequest).toHaveBeenCalledWith(res, 'Missing fields', error.details);
    });

    it('handles AttachmentException with badRequest', () => {
        const error = new exceptions.AttachmentLimitException('Too many attachments', 5);

        handleControllerError(error, res as Response, next);

        expect(responses.badRequest).toHaveBeenCalledWith(res, 'Too many attachments', error.details);
    });

    it('handles BaseException with generic error response', () => {
        const error = new exceptions.DatabaseException('DB fail', new Error('boom'));

        handleControllerError(error, res as Response, next);

        expect(responses.error).toHaveBeenCalledWith(res, 'DB fail', 500, error.details);
    });

    it('passes unknown errors to next', () => {
        const error = new Error('unexpected');

        handleControllerError(error, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    it('returns the correct response methods by status code', () => {
        expect(getResponseMethodByStatusCode(200)).toBe(responses.success);
        expect(getResponseMethodByStatusCode(201)).toBe(responses.created);
        expect(getResponseMethodByStatusCode(400)).toBe(responses.badRequest);
        expect(getResponseMethodByStatusCode(401)).toBe(responses.unauthorized);
        expect(getResponseMethodByStatusCode(403)).toBe(responses.forbidden);
        expect(getResponseMethodByStatusCode(404)).toBe(responses.notFound);
        expect(getResponseMethodByStatusCode(409)).toBe(responses.conflict);
        expect(getResponseMethodByStatusCode(422)).toBe(responses.unprocessableEntity);
        expect(getResponseMethodByStatusCode(500)).toBe(responses.error);
        expect(getResponseMethodByStatusCode(999)).toBe(responses.error);
    });

    it('asyncErrorHandler forwards thrown async errors', async () => {
        const asyncFn = async () => {
            throw new Error('async fail');
        };

        const wrapped = asyncErrorHandler(asyncFn);

        await wrapped(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('createErrorResponse returns serialized error details and stack in development', () => {
        const error = new exceptions.DatabaseException('DB fail', new Error('boom'));

        const response = createErrorResponse(error, true);

        expect(response).toHaveProperty('success', false);
        expect(response.error).toMatchObject({ code: 'DATABASE_ERROR', message: 'DB fail', statusCode: 500 });
        expect(response.error).toHaveProperty('stack');
    });
});
