const { validationResult } = require('express-validator');
const db = require('../../database/client');
const authService = require('../../services/auth');
const logger = require('../../middleware/logging');
const responses = require('../../utils/responses');
const authController = require('../../controllers/auth');

jest.mock('express-validator', () => ({
    validationResult: jest.fn()
}));

jest.mock('../../database/client');
jest.mock('../../services/auth');
jest.mock('../../middleware/logging');
jest.mock('../../utils/responses');

describe('AuthController', () => {
    let req; let res; let next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            headers: {},
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('test-user-agent'),
            params: {},
            cookies: {},
            user: undefined
        };

        res = {
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };

        next = jest.fn();

        responses.success = jest.fn().mockReturnValue('success');
        responses.badRequest = jest.fn().mockReturnValue('badRequest');
        responses.unauthorized = jest.fn().mockReturnValue('unauthorized');
        responses.forbidden = jest.fn().mockReturnValue('forbidden');
        responses.notFound = jest.fn().mockReturnValue('notFound');
        responses.error = jest.fn().mockReturnValue('error');

        validationResult.mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(true),
            array: jest.fn().mockReturnValue([])
        });
    });

    describe('login', () => {
        test('success path with rememberMe true', async () => {
            req.body = { email: 'admin@iea.usp.br', password: 'senha123', rememberMe: true };
            const admin = { id: 'admin-id', email: 'admin@iea.usp.br', name: 'Admin', password_hash: 'hash', is_active: true, last_login: new Date() };
            db.findByAdminEmail.mockResolvedValue(admin);
            authService.comparePassword.mockResolvedValue(true);
            authService.generateJWT.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
            db.update.mockResolvedValue({ ...admin, last_login: new Date() });

            await authController.login(req, res, next);

            expect(db.findByAdminEmail).toHaveBeenCalledWith('admins', 'admin@iea.usp.br');
            expect(authService.comparePassword).toHaveBeenCalledWith('senha123', 'hash');
            expect(authService.generateJWT).toHaveBeenCalledTimes(2);
            expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', expect.objectContaining({ httpOnly: true }));
            expect(responses.success).toHaveBeenCalledWith(res, expect.objectContaining({ accessToken: 'access-token', expiresIn: '7d' }), 'Login realizado com sucesso');
        });

        test('rejects invalid email', async () => {
            req.body = { email: 'invalid@example.com', password: 'senha123' };
            db.findByAdminEmail.mockResolvedValue(null);

            await authController.login(req, res, next);

            expect(logger.security).toHaveBeenCalledWith('Login attempt with invalid email', expect.objectContaining({ email: 'invalid@example.com' }));
            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Credenciais inválidas');
        });

        test('rejects inactive admin', async () => {
            req.body = { email: 'admin@iea.usp.br', password: 'senha123' };
            db.findByAdminEmail.mockResolvedValue({ id: 'admin-id', email: 'admin@iea.usp.br', name: 'Admin', password_hash: 'hash', is_active: false });

            await authController.login(req, res, next);

            expect(logger.security).toHaveBeenCalledWith('Login attempt with inactive admin', expect.any(Object));
            expect(responses.forbidden).toHaveBeenCalledWith(res, 'Conta desativada');
        });

        test('rejects wrong password', async () => {
            req.body = { email: 'admin@iea.usp.br', password: 'senha123' };
            db.findByAdminEmail.mockResolvedValue({ id: 'admin-id', email: 'admin@iea.usp.br', name: 'Admin', password_hash: 'hash', is_active: true });
            authService.comparePassword.mockResolvedValue(false);

            await authController.login(req, res, next);

            expect(logger.security).toHaveBeenCalledWith('Login attempt with invalid password', expect.any(Object));
            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Credenciais inválidas');
        });

        test('rejects validation errors', async () => {
            validationResult.mockReturnValue({ isEmpty: jest.fn().mockReturnValue(false), array: jest.fn().mockReturnValue([{ msg: 'Erro', param: 'email' }]) });
            req.body = { email: 'invalid', password: 'senha123' };

            await authController.login(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Dados inválidos', expect.any(Array));
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('refresh', () => {
        test('success path', async () => {
            req.headers.cookies = 'refreshToken=valid-refresh-token';
            req.ip = '127.0.0.1';
            const decoded = { id: 'admin-id', type: 'refresh' };
            authService.verifyJWT.mockReturnValue(decoded);
            db.findById.mockResolvedValue({ id: 'admin-id', email: 'admin@iea.usp.br', name: 'Admin', is_active: true });
            authService.generateJWT.mockReturnValue('new-access-token');

            await authController.refresh(req, res, next);

            expect(authService.verifyJWT).toHaveBeenCalledWith('valid-refresh-token');
            expect(db.findById).toHaveBeenCalledWith('admins', 'admin-id');
            expect(responses.success).toHaveBeenCalledWith(res, expect.objectContaining({ accessToken: 'new-access-token' }), 'Token renovado com sucesso');
        });

        test('rejects missing refresh token', async () => {
            req.headers.cookies = ''; 
            await authController.refresh(req, res, next);
            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Refresh token não fornecido');
        });

        test('rejects invalid refresh token', async () => {
            req.headers.cookies = 'refreshToken=invalid';
            authService.verifyJWT.mockImplementation(() => { const err = new Error('bad'); err.name = 'JsonWebTokenError'; throw err; });

            await authController.refresh(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Refresh token inválido ou expirado');
        });

        test('rejects expired token', async () => {
            req.headers.cookies = 'refreshToken=expired';
            authService.verifyJWT.mockImplementation(() => { const err = new Error('expired'); err.name = 'TokenExpiredError'; throw err; });

            await authController.refresh(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Refresh token inválido ou expirado');
        });

        test('rejects inactive admin', async () => {
            req.headers.cookies = 'refreshToken=valid-refresh-token';
            authService.verifyJWT.mockReturnValue({ id: 'admin-id', type: 'refresh' });
            db.findById.mockResolvedValue({ id: 'admin-id', is_active: false });

            await authController.refresh(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Usuário não encontrado ou inativo');
        });

        test('passes unexpected errors to next', async () => {
            req.headers.cookies = 'refreshToken=valid-refresh-token';
            authService.verifyJWT.mockImplementation(() => { throw new Error('unexpected'); });

            await authController.refresh(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('logout', () => {
        test('clears refresh cookie and logs audit', async () => {
            req.user = { id: 'admin-id', email: 'admin@iea.usp.br' };

            await authController.logout(req, res, next);

            expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({ httpOnly: true }));
            expect(logger.audit).toHaveBeenCalledWith('Admin logout', expect.any(Object));
            expect(responses.success).toHaveBeenCalledWith(res, null, 'Logout realizado com sucesso');
        });

        test('still succeeds when no user in request', async () => {
            req.user = undefined;
            await authController.logout(req, res, next);
            expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
            expect(logger.audit).not.toHaveBeenCalled();
            expect(responses.success).toHaveBeenCalledWith(res, null, 'Logout realizado com sucesso');
        });

        test('passes errors to next when clearCookie fails', async () => {
            req.user = { id: 'admin-id', email: 'admin@iea.usp.br' };
            res.clearCookie.mockImplementation(() => { throw new Error('cookie fail'); });

            await authController.logout(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('me', () => {
        test('returns user data when found', async () => {
            req.user = { id: 'admin-id' };
            db.findById.mockResolvedValue({ id: 'admin-id', email: 'admin@iea.usp.br', name: 'Admin', last_login: new Date('2024-01-01'), created_at: new Date('2023-01-01') });

            await authController.me(req, res, next);

            expect(responses.success).toHaveBeenCalledWith(res, expect.objectContaining({ id: 'admin-id', email: 'admin@iea.usp.br' }), 'Dados do usuário recuperados');
        });

        test('returns not found when missing', async () => {
            req.user = { id: 'missing-id' };
            db.findById.mockResolvedValue(null);

            await authController.me(req, res, next);

            expect(responses.notFound).toHaveBeenCalledWith(res, 'Usuário não encontrado');
        });

        test('passes errors to next on database failure', async () => {
            req.user = { id: 'admin-id' };
            db.findById.mockRejectedValue(new Error('db fail'));

            await authController.me(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('changePassword', () => {
        test('changes password successfully', async () => {
            validationResult.mockReturnValue({ isEmpty: jest.fn().mockReturnValue(true), array: jest.fn().mockReturnValue([]) });
            req.user = { id: 'admin-id' };
            req.body = { currentPassword: 'old1234', newPassword: 'NewPass123!' };
            db.findById.mockResolvedValue({ id: 'admin-id', password_hash: 'old-hash', is_active: true });
            authService.comparePassword.mockResolvedValue(true);
            authService.hashPassword.mockResolvedValue('new-hash');
            db.update.mockResolvedValue({});

            await authController.changePassword(req, res, next);

            expect(authService.comparePassword).toHaveBeenCalledWith('old1234', 'old-hash');
            expect(authService.hashPassword).toHaveBeenCalledWith('NewPass123!');
            expect(db.update).toHaveBeenCalledWith('admins', 'admin-id', expect.objectContaining({ password_hash: 'new-hash' }));
            expect(logger.audit).toHaveBeenCalledWith('Password changed', expect.any(Object));
            expect(responses.success).toHaveBeenCalledWith(res, null, 'Senha alterada com sucesso');
        });

        test('rejects current password mismatch', async () => {
            validationResult.mockReturnValue({ isEmpty: jest.fn().mockReturnValue(true), array: jest.fn().mockReturnValue([]) });
            req.user = { id: 'admin-id' };
            req.body = { currentPassword: 'wrong', newPassword: 'NewPass123!' };
            db.findById.mockResolvedValue({ id: 'admin-id', password_hash: 'old-hash', is_active: true });
            authService.comparePassword.mockResolvedValue(false);

            await authController.changePassword(req, res, next);

            expect(logger.security).toHaveBeenCalledWith('Invalid current password in change password attempt', expect.any(Object));
            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Senha atual incorreta');
        });

        test('rejects validation errors', async () => {
            validationResult.mockReturnValue({ isEmpty: jest.fn().mockReturnValue(false), array: jest.fn().mockReturnValue([{ msg: 'Erro', param: 'newPassword' }]) });
            req.user = { id: 'admin-id' };
            req.body = { currentPassword: 'old', newPassword: 'short' };

            await authController.changePassword(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Dados inválidos', expect.any(Array));
        });

        test('returns not found when admin is missing', async () => {
            validationResult.mockReturnValue({ isEmpty: jest.fn().mockReturnValue(true), array: jest.fn().mockReturnValue([]) });
            req.user = { id: 'admin-id' };
            req.body = { currentPassword: 'old1234', newPassword: 'NewPass123!' };
            db.findById.mockResolvedValue(null);

            await authController.changePassword(req, res, next);

            expect(responses.notFound).toHaveBeenCalledWith(res, 'Usuário não encontrado');
        });

        test('passes errors to next when update fails', async () => {
            validationResult.mockReturnValue({ isEmpty: jest.fn().mockReturnValue(true), array: jest.fn().mockReturnValue([]) });
            req.user = { id: 'admin-id' };
            req.body = { currentPassword: 'old1234', newPassword: 'NewPass123!' };
            db.findById.mockResolvedValue({ id: 'admin-id', password_hash: 'old-hash', is_active: true });
            authService.comparePassword.mockResolvedValue(true);
            authService.hashPassword.mockResolvedValue('new-hash');
            db.update.mockRejectedValue(new Error('update fail'));

            await authController.changePassword(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});