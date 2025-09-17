const db = require('../database/client');
const authService = require('../services/auth');
const logger = require('./logging');
const responses = require('../utils/responses');

class AuthMiddleware {
    /**
     * Extrai e verifica JWT do header Authorization
     */
    async verifyJWT(req, res, next) {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return responses.unauthorized(res, 'Token de acesso não fornecido');
            }

            const token = authHeader.substring(7); // Remove 'Bearer '

            // Verificar e decodificar token
            const decoded = authService.verifyJWT(token);
            if (!decoded || decoded.type === 'refresh') {
                return responses.unauthorized(res, 'Token inválido');
            }

            // Buscar admin no banco para verificar se ainda existe e está ativo
            const admin = await db.findById('admins', decoded.id);
            if (!admin) {
                logger.security('JWT token used with non-existent admin', {
                    tokenAdminId: decoded.id,
                    ip: req.ip
                });
                return responses.unauthorized(res, 'Usuário não encontrado');
            }

            if (!admin.is_active) {
                logger.security('JWT token used with inactive admin', {
                    adminId: admin.id,
                    ip: req.ip
                });
                return responses.forbidden(res, 'Conta desativada');
            }

            // Adicionar dados do usuário ao request
            req.user = {
                id: admin.id,
                email: admin.email,
                name: admin.name
            };

            next();

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return responses.unauthorized(res, 'Token malformado');
            } else if (error.name === 'TokenExpiredError') {
                return responses.unauthorized(res, 'Token expirado');
            } else {
                logger.error('JWT verification error', {
                    error: error.message,
                    ip: req.ip
                });
                return responses.error(res, 'Erro na verificação do token', 500);
            }
        }
    }

    /**
     * Middleware que exige autenticação
     */
    requireAuth = async (req, res, next) => {
        await this.verifyJWT(req, res, next);
    };

    /**
     * Middleware que torna autenticação opcional
     */
    optionalAuth = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;

            // Se não há token, continua sem autenticação
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return next();
            }

            // Se há token, tenta verificar
            await this.verifyJWT(req, res, next);
        } catch (error) {
            // Em caso de erro, continua sem user
            next();
        }
    };

    /**
     * Middleware para verificar se é admin específico
     */
    requireAdminEmail = (allowedEmails) => {
        return (req, res, next) => {
            if (!req.user) {
                return responses.unauthorized(res, 'Autenticação necessária');
            }

            const isAllowed = Array.isArray(allowedEmails)
                ? allowedEmails.includes(req.user.email)
                : allowedEmails === req.user.email;

            if (!isAllowed) {
                logger.security('Access denied for admin', {
                    adminId: req.user.id,
                    email: req.user.email,
                    allowedEmails,
                    ip: req.ip
                });
                return responses.forbidden(res, 'Acesso negado para este usuário');
            }

            next();
        };
    };

    /**
     * Middleware para verificar se admin é o mesmo ou superadmin
     */
    requireOwnerOrSuperAdmin = (req, res, next) => {
        const targetAdminId = req.params.adminId || req.body.adminId;
        const currentAdminId = req.user.id;

        // Lista de super admins (pode vir de config ou banco)
        const superAdmins = process.env.SUPER_ADMIN_EMAILS?.split(',') || [];
        const isSuperAdmin = superAdmins.includes(req.user.email);

        if (currentAdminId !== targetAdminId && !isSuperAdmin) {
            logger.security('Unauthorized access attempt to admin resource', {
                currentAdminId,
                targetAdminId,
                ip: req.ip
            });
            return responses.forbidden(res, 'Acesso negado');
        }

        next();
    };

    /**
     * Rate limiting específico para autenticação
     */
    createAuthRateLimit() {
        const rateLimit = require('express-rate-limit');

        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 5, // máximo 5 tentativas por IP
            skipSuccessfulRequests: true,
            message: {
                error: 'Muitas tentativas de login, tente novamente em 15 minutos',
                retryAfter: 900
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
    }

    /**
     * Middleware para logging de ações administrativas
     */
    logAdminAction = (action) => {
        return (req, res, next) => {
            const originalSend = res.send;

            res.send = function(data) {
                // Log apenas se a ação foi bem-sucedida (status 2xx)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    logger.audit(`Admin action: ${action}`, {
                        adminId: req.user?.id,
                        email: req.user?.email,
                        action,
                        path: req.path,
                        method: req.method,
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        timestamp: new Date().toISOString()
                    });
                }

                originalSend.call(this, data);
            };

            next();
        };
    };
}

module.exports = new AuthMiddleware();
