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
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            cookies: {},
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('test-user-agent'),
            user: { id: 'user-id', email: 'admin@iea.usp.br', name: 'Admin' }
        };

        res = {
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn()
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
        test('deve autenticar admin com credenciais válidas', async () => {
            req.body = {
                email: 'admin@iea.usp.br',
                password: 'senha123',
                rememberMe: true
            };

            const admin = {
                id: 'admin-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                password_hash: 'hashed-password',
                is_active: true,
                last_login: new Date('2023-01-01')
            };
            db.findByAdminEmail.mockResolvedValue(admin);

            authService.comparePassword.mockResolvedValue(true);

            authService.generateJWT
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');

            db.update.mockResolvedValue({ ...admin, last_login: new Date() });

            await authController.login(req, res, next);

            expect(db.findByAdminEmail).toHaveBeenCalledWith('admins', 'admin@iea.usp.br');

            expect(authService.comparePassword).toHaveBeenCalledWith('senha123', 'hashed-password');

            expect(authService.generateJWT).toHaveBeenCalledTimes(2);

            expect(db.update).toHaveBeenCalledWith('admins', 'admin-id', expect.objectContaining({
                last_login: expect.any(Date)
            }));

            expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', expect.any(Object));

            expect(responses.success).toHaveBeenCalledWith(res, expect.objectContaining({
                user: expect.objectContaining({
                    id: 'admin-id',
                    email: 'admin@iea.usp.br',
                    name: 'Admin'
                }),
                accessToken: 'access-token',
                expiresIn: '7d'
            }), 'Login realizado com sucesso');
        });

        test('deve rejeitar credenciais inválidas', async () => {
            req.body = {
                email: 'invalid@example.com',
                password: 'senha123'
            };

            db.findByAdminEmail.mockResolvedValue(null);

            await authController.login(req, res, next);

            expect(db.findByAdminEmail).toHaveBeenCalledWith('admins', 'invalid@example.com');

            expect(logger.security).toHaveBeenCalledWith('Login attempt with invalid email', expect.any(Object));

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Credenciais inválidas');

            jest.clearAllMocks();

            req.body = {
                email: 'admin@iea.usp.br',
                password: 'senha-errada'
            };

            const admin = {
                id: 'admin-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                password_hash: 'hashed-password',
                is_active: true
            };
            db.findByAdminEmail.mockResolvedValue(admin);

            authService.comparePassword.mockResolvedValue(false);

            await authController.login(req, res, next);

            expect(authService.comparePassword).toHaveBeenCalledWith('senha-errada', 'hashed-password');

            expect(logger.security).toHaveBeenCalledWith('Login attempt with invalid password', expect.any(Object));

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Credenciais inválidas');
        });

        test('deve rejeitar admin inativo', async () => {
            req.body = {
                email: 'inactive@iea.usp.br',
                password: 'senha123'
            };

            const admin = {
                id: 'inactive-id',
                email: 'inactive@iea.usp.br',
                name: 'Inactive Admin',
                password_hash: 'hashed-password',
                is_active: false
            };
            db.findByAdminEmail.mockResolvedValue(admin);

            await authController.login(req, res, next);

            expect(db.findByAdminEmail).toHaveBeenCalledWith('admins', 'inactive@iea.usp.br');

            expect(logger.security).toHaveBeenCalledWith('Login attempt with inactive admin', expect.any(Object));

            expect(responses.forbidden).toHaveBeenCalledWith(res, 'Conta desativada');
        });

        test('deve gerar tokens corretos', async () => {
            req.body = {
                email: 'admin@iea.usp.br',
                password: 'senha123',
                rememberMe: false
            };

            const admin = {
                id: 'admin-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                password_hash: 'hashed-password',
                is_active: true
            };
            db.findByAdminEmail.mockResolvedValue(admin);

            authService.comparePassword.mockResolvedValue(true);

            authService.generateJWT
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');

            await authController.login(req, res, next);

            expect(authService.generateJWT).toHaveBeenNthCalledWith(1,
                expect.objectContaining({
                    id: 'admin-id',
                    email: 'admin@iea.usp.br',
                    name: 'Admin'
                }),
                '24h'
            );

            expect(authService.generateJWT).toHaveBeenNthCalledWith(2,
                expect.objectContaining({
                    id: 'admin-id',
                    type: 'refresh'
                }),
                '7d'
            );

            expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', expect.objectContaining({
                httpOnly: true,
                secure: expect.any(Boolean),
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            }));

            expect(responses.success).toHaveBeenCalledWith(res, expect.objectContaining({
                accessToken: 'access-token',
                expiresIn: '24h'
            }), 'Login realizado com sucesso');
        });

        test('deve logar tentativas suspeitas', async () => {
            req.body = {
                email: 'suspicious@example.com',
                password: 'senha123'
            };

            db.findByAdminEmail.mockResolvedValue(null);

            await authController.login(req, res, next);

            expect(logger.security).toHaveBeenCalledWith('Login attempt with invalid email', expect.objectContaining({
                email: 'suspicious@example.com',
                ip: '127.0.0.1',
                userAgent: 'test-user-agent'
            }));
        });
    });

    describe('refresh', () => {
        test('deve renovar token com refresh token válido', async () => {
            req.cookies.refreshToken = 'valid-refresh-token';

            const decodedToken = { id: 'admin-id', type: 'refresh' };
            authService.verifyJWT.mockReturnValue(decodedToken);

            const admin = {
                id: 'admin-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                is_active: true
            };
            db.findById.mockResolvedValue(admin);

            authService.generateJWT.mockReturnValue('new-access-token');

            await authController.refresh(req, res, next);

            expect(authService.verifyJWT).toHaveBeenCalledWith('valid-refresh-token');

            expect(db.findById).toHaveBeenCalledWith('admins', 'admin-id');

            expect(authService.generateJWT).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'admin-id',
                    email: 'admin@iea.usp.br',
                    name: 'Admin'
                }),
                '24h'
            );

            expect(logger.audit).toHaveBeenCalledWith('Token refreshed', expect.any(Object));

            expect(responses.success).toHaveBeenCalledWith(res, expect.objectContaining({
                accessToken: 'new-access-token',
                expiresIn: '24h'
            }), 'Token renovado com sucesso');
        });

        test('deve rejeitar refresh token inválido', async () => {
            req.cookies.refreshToken = undefined;
            req.body.refreshToken = undefined;

            await authController.refresh(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Refresh token não fornecido');

            jest.clearAllMocks();

            req.cookies.refreshToken = 'invalid-refresh-token';

            authService.verifyJWT.mockImplementation(() => {
                const error = new Error('Token inválido');
                error.name = 'JsonWebTokenError';
                throw error;
            });

            await authController.refresh(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Refresh token inválido ou expirado');
        });

        test('deve rejeitar refresh token expirado', async () => {
            req.cookies.refreshToken = 'expired-refresh-token';

            authService.verifyJWT.mockImplementation(() => {
                const error = new Error('Token expirado');
                error.name = 'TokenExpiredError';
                throw error;
            });

            await authController.refresh(req, res, next);

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Refresh token inválido ou expirado');
        });
    });

    describe('logout', () => {
        test('deve limpar cookies de refresh token', async () => {
            req.user = { id: 'admin-id', email: 'admin@iea.usp.br' };

            await authController.logout(req, res, next);

            expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({
                httpOnly: true,
                secure: expect.any(Boolean),
                sameSite: 'strict'
            }));

            expect(logger.audit).toHaveBeenCalledWith('Admin logout', expect.objectContaining({
                adminId: 'admin-id',
                ip: '127.0.0.1'
            }));

            expect(responses.success).toHaveBeenCalledWith(res, null, 'Logout realizado com sucesso');
        });

        test('deve funcionar sem autenticação', async () => {
            req.user = undefined;

            await authController.logout(req, res, next);

            expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));

            expect(logger.audit).not.toHaveBeenCalled();

            expect(responses.success).toHaveBeenCalledWith(res, null, 'Logout realizado com sucesso');
        });
    });

    describe('me', () => {
        test('deve retornar dados do usuário logado', async () => {
            req.user = { id: 'admin-id', email: 'admin@iea.usp.br' };

            const admin = {
                id: 'admin-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                last_login: new Date('2023-01-01'),
                created_at: new Date('2022-01-01')
            };
            db.findById.mockResolvedValue(admin);

            await authController.me(req, res, next);

            expect(db.findById).toHaveBeenCalledWith('admins', 'admin-id');

            expect(responses.success).toHaveBeenCalledWith(res, expect.objectContaining({
                id: 'admin-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                lastLogin: expect.any(Date),
                createdAt: expect.any(Date)
            }), 'Dados do usuário recuperados');
        });

        test('deve rejeitar se usuário não encontrado', async () => {
            req.user = { id: 'non-existent-id', email: 'admin@iea.usp.br' };

            db.findById.mockResolvedValue(null);

            await authController.me(req, res, next);

            expect(db.findById).toHaveBeenCalledWith('admins', 'non-existent-id');

            expect(responses.notFound).toHaveBeenCalledWith(res, 'Usuário não encontrado');
        });
    });

    describe('changePassword', () => {
        test('deve alterar senha com dados válidos', async () => {
            validationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(true),
                array: jest.fn().mockReturnValue([])
            });

            req.body = {
                currentPassword: 'senha-atual',
                newPassword: 'Nova-Senha123!'
            };
            req.user = { id: 'admin-id', email: 'admin@iea.usp.br' };

            const admin = {
                id: 'admin-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                password_hash: 'current-password-hash',
                is_active: true
            };
            db.findById.mockResolvedValue(admin);

            authService.comparePassword.mockResolvedValue(true);

            authService.hashPassword.mockResolvedValue('new-password-hash');

            db.update.mockResolvedValue({ ...admin, password_hash: 'new-password-hash' });

            await authController.changePassword(req, res, next);

            expect(db.findById).toHaveBeenCalledWith('admins', 'admin-id');

            expect(authService.comparePassword).toHaveBeenCalledWith('senha-atual', 'current-password-hash');

            expect(authService.hashPassword).toHaveBeenCalledWith('Nova-Senha123!');

            expect(db.update).toHaveBeenCalledWith('admins', 'admin-id', expect.objectContaining({
                password_hash: 'new-password-hash',
                updated_at: expect.any(Date)
            }));

            expect(logger.audit).toHaveBeenCalledWith('Password changed', expect.any(Object));

            expect(responses.success).toHaveBeenCalledWith(res, null, 'Senha alterada com sucesso');
        });

        test('deve rejeitar senha atual incorreta', async () => {
            validationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(true),
                array: jest.fn().mockReturnValue([])
            });

            req.body = {
                currentPassword: 'senha-incorreta',
                newPassword: 'Nova-Senha123!'
            };
            req.user = { id: 'admin-id', email: 'admin@iea.usp.br' };

            const admin = {
                id: 'admin-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                password_hash: 'current-password-hash',
                is_active: true
            };
            db.findById.mockResolvedValue(admin);

            authService.comparePassword.mockResolvedValue(false);

            await authController.changePassword(req, res, next);

            expect(authService.comparePassword).toHaveBeenCalledWith('senha-incorreta', 'current-password-hash');

            expect(logger.security).toHaveBeenCalledWith('Invalid current password in change password attempt', expect.any(Object));

            expect(responses.unauthorized).toHaveBeenCalledWith(res, 'Senha atual incorreta');
        });

        test('deve validar força da nova senha', async () => {
            validationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue([
                    { msg: 'Nova senha deve ter pelo menos 8 caracteres', param: 'newPassword' }
                ])
            });

            req.body = {
                currentPassword: 'senha-atual',
                newPassword: 'fraca'
            };
            req.user = { id: 'admin-id', email: 'admin@iea.usp.br' };

            await authController.changePassword(req, res, next);

            expect(responses.badRequest).toHaveBeenCalledWith(res, 'Dados inválidos', expect.any(Array));
        });
    });
});
