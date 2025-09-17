const db = require('../database/client');
const authService = require('../services/auth');
const logger = require('../middleware/logging');
const responses = require('../utils/responses');
const { validationResult } = require('express-validator');

/**
 * ❌ ALL AUTH CONTROLLER METHODS DEPRECATED
 * Authentication system not used by React frontend
 * See BACKEND_ROUTE_USAGE_ANALYSIS.md for details
 * 
 * @warning DO NOT MODIFY without implementing admin UI first
 */
class AuthController {
    /**
     * POST /api/auth/login
     * Autentica administrador e retorna JWT
     */
    async login(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const { email, password, rememberMe = false } = req.body;

            // Buscar admin no banco
            const admin = await db.findByAdminEmail('admins', email.toLowerCase());
            if (!admin) {
                logger.security('Login attempt with invalid email', {
                    email,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
                return responses.unauthorized(res, 'Credenciais inválidas');
            }

            // Verificar se admin está ativo
            if (!admin.is_active) {
                logger.security('Login attempt with inactive admin', {
                    adminId: admin.id,
                    email,
                    ip: req.ip
                });
                return responses.forbidden(res, 'Conta desativada');
            }

            // Verificar senha
            const isValidPassword = await authService.comparePassword(password, admin.password_hash);
            if (!isValidPassword) {
                logger.security('Login attempt with invalid password', {
                    adminId: admin.id,
                    email,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
                return responses.unauthorized(res, 'Credenciais inválidas');
            }

            // Gerar tokens
            const tokenPayload = {
                id: admin.id,
                email: admin.email,
                name: admin.name
            };

            const accessToken = authService.generateJWT(tokenPayload, rememberMe ? '7d' : '24h');
            const refreshToken = authService.generateJWT(
                { id: admin.id, type: 'refresh' },
                rememberMe ? '30d' : '7d'
            );

            // Atualizar último login
            await db.update('admins', admin.id, {
                last_login: new Date()
            });

            // Log successful login
            logger.audit('Admin login successful', {
                adminId: admin.id,
                email: admin.email,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                rememberMe
            });

            // Set httpOnly cookies para refresh token
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000 // 30d ou 7d
            };
            res.cookie('refreshToken', refreshToken, cookieOptions);

            return responses.success(res, {
                user: {
                    id: admin.id,
                    email: admin.email,
                    name: admin.name,
                    lastLogin: admin.last_login
                },
                accessToken,
                expiresIn: rememberMe ? '7d' : '24h'
            }, 'Login realizado com sucesso');

        } catch (error) {
            logger.error('Login error', { error: error.message, stack: error.stack });
            next(error);
        }
    }

    /**
     * POST /api/auth/refresh
     * Renova token de acesso usando refresh token
     */
    async refresh(req, res, next) {
        try {
            const refreshToken = req.headers?.cookies?.split('refreshToken=')?.[1] ;

            if (!refreshToken) {
                return responses.unauthorized(res, 'Refresh token não fornecido');
            }

            // Verificar refresh token
            const decoded = authService.verifyJWT(refreshToken);
            if (!decoded || decoded.type !== 'refresh') {
                return responses.unauthorized(res, 'Refresh token inválido');
            }

            // Buscar admin
            const admin = await db.findById('admins', decoded.id);
            if (!admin || !admin.is_active) {
                return responses.unauthorized(res, 'Usuário não encontrado ou inativo');
            }

            // Gerar novo access token
            const tokenPayload = {
                id: admin.id,
                email: admin.email,
                name: admin.name
            };
            const newAccessToken = authService.generateJWT(tokenPayload, '24h');

            logger.audit('Token refreshed', {
                adminId: admin.id,
                ip: req.ip
            });

            return responses.success(res, {
                accessToken: newAccessToken,
                expiresIn: '24h'
            }, 'Token renovado com sucesso');

        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return responses.unauthorized(res, 'Refresh token inválido ou expirado');
            }
            logger.error('Refresh token error', { error: error.message });
            next(error);
        }
    }

    /**
     * @deprecated NOT USED by React frontend - admin logout not implemented in UI
     * @status UNTESTED - No admin interface to test this functionality
     * @warning DO NOT MODIFY without implementing admin logout UI first
     * 
     * POST /api/auth/logout
     * Faz logout do usuário
     */
    async logout(req, res, next) {
        try {
            const adminId = req.user?.id;

            // Limpar cookie do refresh token
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            if (adminId) {
                logger.audit('Admin logout', {
                    adminId,
                    ip: req.ip
                });
            }

            return responses.success(res, null, 'Logout realizado com sucesso');

        } catch (error) {
            logger.error('Logout error', { error: error.message });
            next(error);
        }
    }

    /**
     * @deprecated NOT USED by React frontend - user profile not implemented in UI
     * @status UNTESTED - No admin interface to test this functionality
     * @warning DO NOT MODIFY without implementing user profile UI first
     * 
     * GET /api/auth/me
     * Retorna dados do usuário logado
     */
    async me(req, res, next) {
        try {
            const admin = await db.findById('admins', req.user.id);

            if (!admin) {
                return responses.notFound(res, 'Usuário não encontrado');
            }

            return responses.success(res, {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                lastLogin: admin.last_login,
                createdAt: admin.created_at
            }, 'Dados do usuário recuperados');

        } catch (error) {
            logger.error('Get user error', { error: error.message, userId: req.user?.id });
            next(error);
        }
    }

    /**
     * @deprecated NOT USED by React frontend - password change not implemented in UI
     * @status UNTESTED - No admin interface to test this functionality
     * @warning DO NOT MODIFY without implementing password change UI first
     * 
     * PUT /api/auth/change-password
     * Altera senha do usuário logado
     */
    async changePassword(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const { currentPassword, newPassword } = req.body;
            const adminId = req.user.id;

            // Buscar admin atual
            const admin = await db.findById('admins', adminId);
            if (!admin) {
                return responses.notFound(res, 'Usuário não encontrado');
            }

            // Verificar senha atual
            const isValidPassword = await authService.comparePassword(currentPassword, admin.password_hash);
            if (!isValidPassword) {
                logger.security('Invalid current password in change password attempt', {
                    adminId,
                    ip: req.ip
                });
                return responses.unauthorized(res, 'Senha atual incorreta');
            }

            // Hash da nova senha
            const newPasswordHash = await authService.hashPassword(newPassword);

            // Atualizar senha no banco
            await db.update('admins', adminId, {
                password_hash: newPasswordHash,
                updated_at: new Date()
            });

            logger.audit('Password changed', {
                adminId,
                ip: req.ip
            });

            return responses.success(res, null, 'Senha alterada com sucesso');

        } catch (error) {
            logger.error('Change password error', { error: error.message, userId: req.user?.id });
            next(error);
        }
    }
}

module.exports = new AuthController();
