const tokenMiddleware = require('../../middleware/tokens');
const tokenService = require('../../services/tokens');
const responses = require('../../utils/responses');
const logger = require('../../middleware/logging');

jest.mock('../../services/tokens');
jest.mock('../../utils/responses');
jest.mock('../../middleware/logging');

describe('Token Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {},
            body: {},
            query: {},
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('User-Agent'),
            submission: null,
            tokenInfo: null,
            path: '/test',
            method: 'GET'
        };

        res = {
            set: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };

        next = jest.fn();

        responses.badRequest = jest.fn();
        responses.unauthorized = jest.fn();
        responses.forbidden = jest.fn();
        responses.error = jest.fn();
    });

    describe('validateSubmissionToken', () => {
        it('should call next when token is valid', async () => {
            req.params.token = 'valid-token';
            tokenService.validateToken.mockResolvedValue({
                isValid: true,
                submission: { id: 'submission-id', author_email: 'author@example.com' },
                tokenInfo: { expiresAt: new Date(), daysToExpiry: 12, isNearExpiry: false, needsRenewal: false }
            });

            await tokenMiddleware.validateSubmissionToken(req, res, next);

            expect(tokenService.validateToken).toHaveBeenCalledWith('valid-token');
            expect(req.submission).toEqual(expect.objectContaining({ id: 'submission-id' }));
            expect(req.tokenInfo).toEqual(expect.objectContaining({ daysToExpiry: 12 }));
            expect(logger.audit).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });

        it('should return unauthorized for invalid token format', async () => {
            req.params.token = 'invalid-token';
            tokenService.validateToken.mockResolvedValue({ isValid: false, reason: 'TOKEN_INVALID_FORMAT' });

            await tokenMiddleware.validateSubmissionToken(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Formato de token inválido');
            expect(next).not.toHaveBeenCalled();
        });

        it('should return expired token for TOKEN_EXPIRED', async () => {
            req.params.token = 'expired-token';
            tokenService.validateToken.mockResolvedValue({ isValid: false, reason: 'TOKEN_EXPIRED', submission: { id: 'submission-id' } });

            await tokenMiddleware.validateSubmissionToken(req, res, next);

            expect(responses.error).toHaveBeenCalledWith(
                res,
                'Token expirado',
                410,
                expect.objectContaining({ reason: 'TOKEN_EXPIRED', canRecover: true })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('validateAuthorEmail', () => {
        it('should add authorEmail and call next for valid email', async () => {
            req.body.author_email = 'author@example.com';
            req.submission = { id: 'submission-id', author_email: 'author@example.com' };
            tokenService.validateAuthorEmail.mockResolvedValue({ isValid: true, reason: 'EMAIL_VALID' });

            await tokenMiddleware.validateAuthorEmail(req, res, next);

            expect(tokenService.validateAuthorEmail).toHaveBeenCalledWith('submission-id', 'author@example.com');
            expect(req.authorEmail).toBe('author@example.com');
            expect(next).toHaveBeenCalled();
        });

        it('should return badRequest when author email missing', async () => {
            await tokenMiddleware.validateAuthorEmail(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Email do autor é obrigatório');
            expect(next).not.toHaveBeenCalled();
        });

        it('should return forbidden when email mismatch', async () => {
            req.body.author_email = 'wrong@example.com';
            req.submission = { id: 'submission-id', author_email: 'author@example.com' };
            tokenService.validateAuthorEmail.mockResolvedValue({ isValid: false, reason: 'EMAIL_MISMATCH' });

            await tokenMiddleware.validateAuthorEmail(req, res, next);

            expect(logger.security).toHaveBeenCalledWith('Author email mismatch', expect.any(Object));
            expect(responses.forbidden).toHaveBeenCalledWith(res, 'Email não confere com o autor da submissão');
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('checkEditableStatus', () => {
        it('should call next when status is editable', () => {
            req.submission = { status: 'DRAFT' };

            tokenMiddleware.checkEditableStatus(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(responses.forbidden).not.toHaveBeenCalled();
        });

        it('should forbid when status is not editable', () => {
            req.submission = { status: 'UNDER_REVIEW' };

            tokenMiddleware.checkEditableStatus(req, res, next);

            expect(responses.forbidden).toHaveBeenCalledWith(
                res,
                'Submissão em revisão, aguarde feedback',
                expect.any(Object)
            );
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('checkTokenExpiry', () => {
        it('should set token expiry headers when near expiry', () => {
            req.submission = { id: 'submission-id' };
            req.tokenInfo = { needsRenewal: true, daysToExpiry: 5 };

            tokenMiddleware.checkTokenExpiry(req, res, next);

            expect(res.set).toHaveBeenCalledWith('X-Token-Expiry-Warning', 'true');
            expect(res.set).toHaveBeenCalledWith('X-Token-Days-Remaining', '5');
            expect(logger.audit).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });

        it('should not set headers when not near expiry', () => {
            req.submission = { id: 'submission-id' };
            req.tokenInfo = { needsRenewal: false, daysToExpiry: 20 };

            tokenMiddleware.checkTokenExpiry(req, res, next);

            expect(res.set).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    });

    describe('logSubmissionAction', () => {
        it('should audit successful submission actions', () => {
            req.submission = { id: 'submission-id' };
            req.authorEmail = 'author@example.com';
            const middleware = tokenMiddleware.logSubmissionAction('test_action');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.send).not.toBeUndefined();
            res.statusCode = 200;
            res.send('ok');
            expect(logger.audit).toHaveBeenCalledWith('Submission action: test_action', expect.objectContaining({ submissionId: 'submission-id' }));
        });

        it('should not audit when status code is not successful', () => {
            req.submission = { id: 'submission-id' };
            const middleware = tokenMiddleware.logSubmissionAction('test_action');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            res.statusCode = 400;
            res.send('error');
            expect(logger.audit).not.toHaveBeenCalled();
        });
    });
});
