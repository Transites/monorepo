const tokenMiddleware = require('../../middleware/tokens');
const tokenService = require('../../services/tokens');
const responses = require('../../utils/responses');
const logger = require('../../middleware/logging');

jest.mock('../../services/tokens');
jest.mock('../../utils/responses');
jest.mock('../../middleware/logging');

describe('TokenMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {},
            body: {},
            query: {},
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('test-user-agent'),
            submission: null,
            tokenInfo: null
        };

        res = {
            set: jest.fn(),
            json: jest.fn(),
            send: jest.fn()
        };

        next = jest.fn();

        responses.badRequest = jest.fn().mockReturnValue('badRequest');
        responses.unauthorized = jest.fn().mockReturnValue('unauthorized');
        responses.forbidden = jest.fn().mockReturnValue('forbidden');
        responses.error = jest.fn().mockReturnValue('error');
    });

    describe('validateSubmissionToken', () => {
        test('deve aceitar token válido', async () => {
            req.params.token = 'valid-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

            const mockValidation = {
                isValid: true,
                submission: {
                    id: 'submission-id',
                    author_email: 'author@example.com',
                    status: 'DRAFT'
                },
                tokenInfo: {
                    expiresAt: new Date(),
                    daysToExpiry: 15,
                    isNearExpiry: false,
                    needsRenewal: false
                }
            };

            tokenService.validateToken.mockResolvedValue(mockValidation);

            await tokenMiddleware.validateSubmissionToken(req, res, next);

            expect(tokenService.validateToken).toHaveBeenCalledWith(req.params.token);
            expect(req.submission).toEqual(mockValidation.submission);
            expect(req.tokenInfo).toEqual(mockValidation.tokenInfo);
            expect(logger.audit).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
            expect(responses.unauthorized).not.toHaveBeenCalled();
        });

        test('deve rejeitar token inválido', async () => {
            req.params.token = 'invalid-token';

            tokenService.validateToken.mockResolvedValue({
                isValid: false,
                reason: 'TOKEN_INVALID_FORMAT'
            });

            await tokenMiddleware.validateSubmissionToken(req, res, next);

            expect(tokenService.validateToken).toHaveBeenCalledWith(req.params.token);
            expect(responses.unauthorized).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        test('deve lidar com token expirado', async () => {
            req.params.token = 'expired-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd';

            tokenService.validateToken.mockResolvedValue({
                isValid: false,
                reason: 'TOKEN_EXPIRED',
                submission: {
                    id: 'submission-id',
                    title: 'Test Submission',
                    author_email: 'author@example.com',
                    expires_at: new Date()
                }
            });

            await tokenMiddleware.validateSubmissionToken(req, res, next);

            expect(tokenService.validateToken).toHaveBeenCalledWith(req.params.token);
            expect(responses.error).toHaveBeenCalledWith(
                res,
                'Token expirado',
                410,
                expect.objectContaining({
                    reason: 'TOKEN_EXPIRED',
                    canRecover: true
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        test('deve aplicar rate limiting', () => {
            const rateLimiter = tokenMiddleware.createTokenRateLimit();
            expect(rateLimiter).toBeDefined();
            expect(typeof rateLimiter).toBe('function');
        });
    });

    describe('validateAuthorEmail', () => {
        test('deve aceitar email correto', async () => {
            req.body.email = 'author@example.com';
            req.submission = { id: 'submission-id' };

            tokenService.validateAuthorEmail.mockResolvedValue({
                isValid: true,
                reason: 'EMAIL_VALID',
                submission: { id: 'submission-id', author_email: 'author@example.com' }
            });

            await tokenMiddleware.validateAuthorEmail(req, res, next);

            expect(tokenService.validateAuthorEmail).toHaveBeenCalledWith('submission-id', 'author@example.com');
            expect(req.authorEmail).toBe('author@example.com');
            expect(next).toHaveBeenCalled();
            expect(responses.forbidden).not.toHaveBeenCalled();
        });

        test('deve rejeitar email incorreto', async () => {
            req.body.email = 'wrong@example.com';
            req.submission = {
                id: 'submission-id',
                author_email: 'author@example.com'
            };

            tokenService.validateAuthorEmail.mockResolvedValue({
                isValid: false,
                reason: 'EMAIL_MISMATCH'
            });

            await tokenMiddleware.validateAuthorEmail(req, res, next);

            expect(tokenService.validateAuthorEmail).toHaveBeenCalledWith('submission-id', 'wrong@example.com');
            expect(logger.security).toHaveBeenCalled();
            expect(responses.forbidden).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        test('deve logar tentativas suspeitas', async () => {
            req.body.email = 'hacker@example.com';
            req.submission = {
                id: 'submission-id',
                author_email: 'author@example.com'
            };

            tokenService.validateAuthorEmail.mockResolvedValue({
                isValid: false,
                reason: 'EMAIL_MISMATCH'
            });

            await tokenMiddleware.validateAuthorEmail(req, res, next);

            expect(logger.security).toHaveBeenCalledWith('Author email mismatch', expect.objectContaining({
                submissionId: 'submission-id',
                providedEmail: 'hacker@example.com',
                expectedEmail: 'author@example.com'
            }));
        });
    });

    describe('checkEditableStatus', () => {
        test('deve permitir edição para status editáveis', () => {
            req.submission = {
                id: 'submission-id',
                status: 'DRAFT'
            };

            tokenMiddleware.checkEditableStatus(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(responses.forbidden).not.toHaveBeenCalled();
        });

        test('deve bloquear edição para status não editáveis', () => {
            req.submission = {
                id: 'submission-id',
                status: 'UNDER_REVIEW'
            };

            tokenMiddleware.checkEditableStatus(req, res, next);

            expect(responses.forbidden).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('checkTokenExpiry', () => {
        test('deve adicionar aviso de expiração quando próximo do vencimento', () => {
            req.submission = { id: 'submission-id' };
            req.tokenInfo = {
                daysToExpiry: 3,
                needsRenewal: true
            };

            tokenMiddleware.checkTokenExpiry(req, res, next);

            expect(res.set).toHaveBeenCalledWith('X-Token-Expiry-Warning', 'true');
            expect(res.set).toHaveBeenCalledWith('X-Token-Days-Remaining', '3');
            expect(logger.audit).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });

        test('não deve adicionar aviso quando longe do vencimento', () => {
            req.submission = { id: 'submission-id' };
            req.tokenInfo = {
                daysToExpiry: 20,
                needsRenewal: false
            };

            tokenMiddleware.checkTokenExpiry(req, res, next);

            expect(res.set).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    });

    describe('logSubmissionAction', () => {
        test('deve logar ações bem-sucedidas', () => {
            const action = 'test_action';
            const middleware = tokenMiddleware.logSubmissionAction(action);

            req.submission = { id: 'submission-id' };
            req.authorEmail = 'author@example.com';

            const originalSend = res.send;

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.send).not.toBe(originalSend);

            // Simular resposta bem-sucedida
            res.statusCode = 200;
            res.send('test data');

            expect(logger.audit).toHaveBeenCalledWith(`Submission action: ${action}`, expect.objectContaining({
                submissionId: 'submission-id',
                authorEmail: 'author@example.com',
                action
            }));
        });

        test('não deve logar ações com erro', () => {
            const action = 'test_action';
            const middleware = tokenMiddleware.logSubmissionAction(action);

            req.submission = { id: 'submission-id' };

            middleware(req, res, next);

            // Simular resposta com erro
            res.statusCode = 400;
            res.send('error data');

            expect(logger.audit).not.toHaveBeenCalled();
        });
    });

});
