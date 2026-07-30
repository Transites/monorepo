const jwt = require('jsonwebtoken');
const db = require('../../database/client');
const logger = require('../../middleware/logging');
const responses = require('../../utils/responses');
const authMiddleware = require('../../middleware/auth');

jest.mock('jsonwebtoken');
jest.mock('../../database/client');
jest.mock('../../middleware/logging');
jest.mock('../../utils/responses');

describe('AuthMiddleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            headers: {},
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('test-agent'),
            params: {},
            body: {}
        };

        res = {
            statusCode: 200,
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn()
        };

        next = jest.fn();

        responses.unauthorized = jest.fn().mockReturnValue('unauthorized');
        responses.forbidden = jest.fn().mockReturnValue('forbidden');
        responses.error = jest.fn().mockReturnValue('error');
    });

    describe('verifyJWT', () => {
        test('returns unauthorized when header is missing', async () => {
            await authMiddleware.verifyJWT(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Token de acesso não fornecido');
            expect(next).not.toHaveBeenCalled();
        });

        test('returns unauthorized for malformed token', async () => {
            req.headers.authorization = 'Bearer invalid-token';
            jwt.verify.mockImplementation(() => { const err = new Error('malformed'); err.name = 'JsonWebTokenError'; throw err; });

            await authMiddleware.verifyJWT(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Token malformado');
            expect(next).not.toHaveBeenCalled();
        });

        test('returns unauthorized for expired token', async () => {
            req.headers.authorization = 'Bearer expired-token';
            jwt.verify.mockImplementation(() => { const err = new Error('expired'); err.name = 'TokenExpiredError'; throw err; });

            await authMiddleware.verifyJWT(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Token expirado');
            expect(next).not.toHaveBeenCalled();
        });

        test('returns unauthorized when decoded token has no email', async () => {
            req.headers.authorization = 'Bearer token';
            jwt.verify.mockReturnValue({});

            await authMiddleware.verifyJWT(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Token inválido');
            expect(next).not.toHaveBeenCalled();
        });

        test('returns unauthorized when admin does not exist', async () => {
            req.headers.authorization = 'Bearer token';
            jwt.verify.mockReturnValue({ email: 'admin@iea.usp.br' });
            db.query.mockResolvedValue({ rows: [] });

            await authMiddleware.verifyJWT(req, res, next);

            expect(logger.security).toHaveBeenCalledWith('JWT token used with non-existent admin', expect.any(Object));
            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Usuário não é um administrador');
            expect(next).not.toHaveBeenCalled();
        });

        test('returns forbidden when admin is inactive', async () => {
            req.headers.authorization = 'Bearer token';
            jwt.verify.mockReturnValue({ email: 'admin@iea.usp.br' });
            db.query.mockResolvedValue({ rows: [{ id: 'admin-1', email: 'admin@iea.usp.br', name: 'Admin', is_active: false }] });

            await authMiddleware.verifyJWT(req, res, next);

            expect(logger.security).toHaveBeenCalledWith('JWT token used with inactive admin', expect.any(Object));
            expect(responses.forbidden).toHaveBeenCalledWith(res, 'Conta desativada');
            expect(next).not.toHaveBeenCalled();
        });

        test('sets req.user and calls next for valid admin token', async () => {
            req.headers.authorization = 'Bearer token';
            jwt.verify.mockReturnValue({ email: 'admin@iea.usp.br' });
            db.query.mockResolvedValue({ rows: [{ id: 'admin-1', email: 'admin@iea.usp.br', name: 'Admin', is_active: true }] });

            await authMiddleware.verifyJWT(req, res, next);

            expect(req.user).toEqual({ id: 'admin-1', email: 'admin@iea.usp.br', name: 'Admin' });
            expect(next).toHaveBeenCalled();
        });

        test('returns error on unexpected failure', async () => {
            req.headers.authorization = 'Bearer token';
            jwt.verify.mockImplementation(() => { throw new Error('boom'); });

            await authMiddleware.verifyJWT(req, res, next);

            expect(responses.error).toHaveBeenCalledWith(res, 'Erro na verificação do token', 500);
        });
    });

    describe('requireAuthAsAuthor', () => {
        test('rejects missing token', async () => {
            await authMiddleware.requireAuthAsAuthor(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Token de acesso não fornecido');
            expect(next).not.toHaveBeenCalled();
        });

        test('rejects invalid token', async () => {
            req.headers.authorization = 'Bearer invalid';
            jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

            await authMiddleware.requireAuthAsAuthor(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Token inválido ou expirado');
        });

        test('authenticates author token', async () => {
            req.headers.authorization = 'Bearer valid';
            jwt.verify.mockReturnValue({ email: 'author@example.com', sub: 'author-1' });

            await authMiddleware.requireAuthAsAuthor(req, res, next);

            expect(req.user).toEqual({ id: 'author-1', email: 'author@example.com' });
            expect(next).toHaveBeenCalled();
        });
    });

    describe('optionalAuth', () => {
        test('skips auth when no header provided', async () => {
            await authMiddleware.optionalAuth(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeUndefined();
        });

        test('uses verifyJWT when header is present', async () => {
            req.headers.authorization = 'Bearer token';
            jwt.verify.mockReturnValue({ email: 'admin@iea.usp.br' });
            db.query.mockResolvedValue({ rows: [{ id: 'admin-1', email: 'admin@iea.usp.br', name: 'Admin', is_active: true }] });

            await authMiddleware.optionalAuth(req, res, next);

            expect(req.user).toBeDefined();
            expect(next).toHaveBeenCalled();
        });
    });

    describe('requireAdminEmail', () => {
        test('rejects when unauthenticated', () => {
            const middleware = authMiddleware.requireAdminEmail('admin@iea.usp.br');

            middleware(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Autenticação necessária');
            expect(next).not.toHaveBeenCalled();
        });

        test('allows matching single email', () => {
            req.user = { email: 'admin@iea.usp.br' };
            const middleware = authMiddleware.requireAdminEmail('admin@iea.usp.br');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('allows matching email in array', () => {
            req.user = { email: 'admin@iea.usp.br' };
            const middleware = authMiddleware.requireAdminEmail(['other@iea.usp.br', 'admin@iea.usp.br']);

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('forbids non-authorized admin email', () => {
            req.user = { id: 'admin-1', email: 'user@iea.usp.br' };
            const middleware = authMiddleware.requireAdminEmail('admin@iea.usp.br');

            middleware(req, res, next);

            expect(logger.security).toHaveBeenCalledWith('Access denied for admin', expect.any(Object));
            expect(responses.forbidden).toHaveBeenCalledWith(res, 'Acesso negado para este usuário');
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('requireOwnerOrSuperAdmin', () => {
        test('allows owner access when ids match', () => {
            req.user = { id: 'admin-1', email: 'admin@iea.usp.br' };
            req.params.adminId = 'admin-1';

            authMiddleware.requireOwnerOrSuperAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('forbids non-owner without superadmin', () => {
            req.user = { id: 'admin-2', email: 'user@iea.usp.br' };
            req.params.adminId = 'admin-1';

            authMiddleware.requireOwnerOrSuperAdmin(req, res, next);

            expect(logger.security).toHaveBeenCalledWith('Unauthorized access attempt to admin resource', expect.any(Object));
            expect(responses.forbidden).toHaveBeenCalledWith(res, 'Acesso negado');
        });

        test('allows superadmin access', () => {
            process.env.SUPER_ADMIN_EMAILS = 'super@iea.usp.br';
            req.user = { id: 'admin-2', email: 'super@iea.usp.br' };
            req.params.adminId = 'admin-1';

            authMiddleware.requireOwnerOrSuperAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
            delete process.env.SUPER_ADMIN_EMAILS;
        });
    });

    describe('logAdminAction', () => {
        test('logs audit on successful 2xx response', () => {
            req.user = { id: 'admin-1', email: 'admin@iea.usp.br' };
            req.path = '/api/test';
            req.method = 'POST';
            req.ip = '127.0.0.1';

            const middleware = authMiddleware.logAdminAction('test_action');
            middleware(req, res, next);
            res.statusCode = 200;
            res.send('ok');

            expect(logger.audit).toHaveBeenCalledWith('Admin action: test_action', expect.objectContaining({ adminId: 'admin-1', action: 'test_action' }));
            expect(next).toHaveBeenCalled();
        });
    });
});
