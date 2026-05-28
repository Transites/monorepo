const authMiddleware = require('../../middleware/auth');
const authService = require('../../services/auth');
const db = require('../../database/client');
const logger = require('../../middleware/logging');
const responses = require('../../utils/responses');

jest.mock('../../services/auth');
jest.mock('../../database/client');
jest.mock('../../middleware/logging');
jest.mock('../../utils/responses');
jest.mock('express-rate-limit', () => jest.fn().mockImplementation((options) => {
    return (req, res, next) => {
        if (req.ip === '192.168.1.100' && options.onLimitReached) {
            options.onLimitReached(req);
            return res.status(429).json(options.message);
        }
        next();
    };
}));

describe('AuthMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            headers: {},
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('test-user-agent')
        };
        res = {
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
        test('deve verificar JWT válido', async () => {
            req.headers.authorization = 'Bearer valid-token';

            const decodedToken = { id: 'user-id', email: 'admin@iea.usp.br', name: 'Admin' };
            authService.verifyJWT.mockReturnValue(decodedToken);

            const admin = {
                id: 'user-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                is_active: true
            };
            db.findById.mockResolvedValue(admin);

            await authMiddleware.verifyJWT(req, res, next);

            expect(authService.verifyJWT).toHaveBeenCalledWith('valid-token');
            expect(db.findById).toHaveBeenCalledWith('admins', 'user-id');
            expect(req.user).toEqual({
                id: 'user-id',
                email: 'admin@iea.usp.br',
                name: 'Admin'
            });
            expect(next).toHaveBeenCalled();
        });

        test('deve rejeitar JWT inválido', async () => {
            req.headers.authorization = 'Bearer invalid-token';

            authService.verifyJWT.mockImplementation(() => {
                const error = new Error('Token inválido');
                error.name = 'JsonWebTokenError';
                throw error;
            });

            await authMiddleware.verifyJWT(req, res, next);

            expect(authService.verifyJWT).toHaveBeenCalledWith('invalid-token');
            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Token malformado');
            expect(next).not.toHaveBeenCalled();
        });

        test('deve rejeitar JWT expirado', async () => {
            req.headers.authorization = 'Bearer expired-token';

            authService.verifyJWT.mockImplementation(() => {
                const error = new Error('Token expirado');
                error.name = 'TokenExpiredError';
                throw error;
            });

            await authMiddleware.verifyJWT(req, res, next);

            expect(authService.verifyJWT).toHaveBeenCalledWith('expired-token');
            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Token expirado');
            expect(next).not.toHaveBeenCalled();
        });

        test('deve rejeitar se admin não existe', async () => {
            req.headers.authorization = 'Bearer valid-token';

            const decodedToken = { id: 'non-existent-id', email: 'admin@iea.usp.br', name: 'Admin' };
            authService.verifyJWT.mockReturnValue(decodedToken);

            db.findById.mockResolvedValue(null);

            await authMiddleware.verifyJWT(req, res, next);

            expect(authService.verifyJWT).toHaveBeenCalledWith('valid-token');
            expect(db.findById).toHaveBeenCalledWith('admins', 'non-existent-id');
            expect(logger.security).toHaveBeenCalledWith('JWT token used with non-existent admin', expect.any(Object));
            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Usuário não encontrado');
            expect(next).not.toHaveBeenCalled();
        });

        test('deve rejeitar se admin inativo', async () => {
            req.headers.authorization = 'Bearer valid-token';

            const decodedToken = { id: 'inactive-user-id', email: 'admin@iea.usp.br', name: 'Admin' };
            authService.verifyJWT.mockReturnValue(decodedToken);

            const admin = {
                id: 'inactive-user-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                is_active: false
            };
            db.findById.mockResolvedValue(admin);

            await authMiddleware.verifyJWT(req, res, next);

            expect(authService.verifyJWT).toHaveBeenCalledWith('valid-token');
            expect(db.findById).toHaveBeenCalledWith('admins', 'inactive-user-id');
            expect(logger.security).toHaveBeenCalledWith('JWT token used with inactive admin', expect.any(Object));
            expect(responses.forbidden).toHaveBeenCalledWith(res, 'Conta desativada');
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('requireAuth', () => {
        test('deve passar com autenticação válida', async () => {
            req.headers.authorization = 'Bearer valid-token';

            const decodedToken = { id: 'user-id', email: 'admin@iea.usp.br', name: 'Admin' };
            authService.verifyJWT.mockReturnValue(decodedToken);

            const admin = {
                id: 'user-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                is_active: true
            };
            db.findById.mockResolvedValue(admin);

            await authMiddleware.requireAuth(req, res, next);

            expect(authService.verifyJWT).toHaveBeenCalledWith('valid-token');
            expect(db.findById).toHaveBeenCalledWith('admins', 'user-id');
            expect(req.user).toEqual({
                id: 'user-id',
                email: 'admin@iea.usp.br',
                name: 'Admin'
            });
            expect(next).toHaveBeenCalled();
        });

        test('deve bloquear sem autenticação', async () => {
            req.headers.authorization = undefined;

            await authMiddleware.requireAuth(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Token de acesso não fornecido');
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('optionalAuth', () => {
        test('deve passar com ou sem autenticação', async () => {
            req.headers.authorization = 'Bearer valid-token';

            const decodedToken = { id: 'user-id', email: 'admin@iea.usp.br', name: 'Admin' };
            authService.verifyJWT.mockReturnValue(decodedToken);

            const admin = {
                id: 'user-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                is_active: true
            };
            db.findById.mockResolvedValue(admin);

            await authMiddleware.optionalAuth(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toEqual({
                id: 'user-id',
                email: 'admin@iea.usp.br',
                name: 'Admin'
            });

            jest.clearAllMocks();
            req.user = undefined;

            req.headers.authorization = undefined;

            await authMiddleware.optionalAuth(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeUndefined();
        });
    });

    describe('rate limiting', () => {
        test('deve aplicar limite correto', () => {
            const rateLimiter = authMiddleware.createAuthRateLimit();

            expect(rateLimiter).toBeDefined();

            const req = { ip: '127.0.0.1' };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            rateLimiter(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('deve logar tentativas excessivas', () => {
            const rateLimiter = authMiddleware.createAuthRateLimit();

            const req = {
                ip: '192.168.1.100',
                get: jest.fn().mockReturnValue('test-user-agent'),
                path: '/api/auth/login'
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            rateLimiter(req, res, next);

            expect(logger.security).toHaveBeenCalledWith('Auth rate limit reached', {
                ip: '192.168.1.100',
                userAgent: 'test-user-agent',
                path: '/api/auth/login'
            });

            expect(next).not.toHaveBeenCalled();
        });
    });
});
