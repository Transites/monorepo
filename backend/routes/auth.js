const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const authMiddleware = require('../middleware/auth');
const authValidators = require('../validators/auth');
const errorHandler = require('../middleware/errors');

// Rate limiting específico para autenticação
const authRateLimit = authMiddleware.createAuthRateLimit();

/**
 * @route POST /api/auth/login
 * @desc Login de administrador
 * @access Public
 */
router.post('/login',
    authRateLimit,
    authValidators.sanitizeAuthData,
    authValidators.validateLogin,
    errorHandler.asyncHandler(authController.login)
);

/**
 * @route POST /api/auth/refresh
 * @desc Renovar token de acesso
 * @access Public
 */
router.post('/refresh',
    authValidators.validateRefreshToken,
    errorHandler.asyncHandler(authController.refresh)
);

/**
 * @route POST /api/auth/logout
 * @desc Logout de administrador
 * @access Private
 */
router.post('/logout',
    authMiddleware.optionalAuth,
    errorHandler.asyncHandler(authController.logout)
);

/**
 * @route GET /api/auth/me
 * @desc Obter dados do usuário logado
 * @access Private
 */
router.get('/me',
    authMiddleware.requireAuth,
    errorHandler.asyncHandler(authController.me)
);

/**
 * @route PUT /api/auth/change-password
 * @desc Alterar senha do usuário logado
 * @access Private
 */
router.put('/change-password',
    authMiddleware.requireAuth,
    authValidators.sanitizeAuthData,
    authValidators.validateChangePassword,
    authMiddleware.logAdminAction('change_password'),
    errorHandler.asyncHandler(authController.changePassword)
);

/**
 * @route GET /api/auth/validate
 * @desc Validar token de acesso (útil para frontend)
 * @access Private
 */
router.get('/validate',
    authMiddleware.requireAuth,
    (req, res) => {
        const responses = require('../utils/responses');
        responses.success(res, {
            valid: true,
            user: req.user
        }, 'Token válido');
    }
);

/**
 * @route POST /api/auth/check-password-strength
 * @desc Verificar força da senha (útil para UI)
 * @access Public
 */
router.post('/check-password-strength',
    (req, res) => {
        const { password } = req.body;
        const authService = require('../services/auth');
        const responses = require('../utils/responses');

        if (!password) {
            return responses.badRequest(res, 'Senha é obrigatória');
        }

        const validation = authService.validatePasswordStrength(password);

        responses.success(res, {
            isStrong: validation.isValid,
            suggestions: validation.errors
        }, 'Verificação de força da senha');
    }
);

module.exports = router;
