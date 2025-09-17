/**
 * ❌ ALL AUTH ROUTES DEPRECATED - Authentication not used by React frontend
 * 
 * No admin interface implemented in React frontend. 
 * All auth routes are legacy from planned admin system.
 * See BACKEND_ROUTE_USAGE_ANALYSIS.md for details
 * 
 * @warning DO NOT MODIFY without implementing admin UI first
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const authMiddleware = require('../middleware/auth');
const authValidators = require('../validators/auth');
const errorHandler = require('../middleware/errors');

// Rate limiting específico para autenticação
const authRateLimit = authMiddleware.createAuthRateLimit();

// Middleware to add deprecation headers for all auth endpoints
const addDeprecationHeader = (req, res, next) => {
    res.set('X-API-Deprecation-Warning', 'Auth endpoints not used by current frontend');
    res.set('X-API-Status', 'DEPRECATED - Admin authentication not implemented in UI');
    next();
};

/**
 * @deprecated NOT USED by React frontend - admin login not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing admin login UI first
 * 
 * @route POST /api/auth/login
 * @desc Login de administrador
 * @access Public
 */
router.post('/login',
    addDeprecationHeader,
    authRateLimit,
    authValidators.sanitizeAuthData,
    authValidators.validateLogin,
    errorHandler.asyncHandler(authController.login)
);

/**
 * @deprecated NOT USED by React frontend - token refresh not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing admin session management first
 * 
 * @route POST /api/auth/refresh
 * @desc Renovar token de acesso
 * @access Public
 */
router.post('/refresh',
    addDeprecationHeader,
    authValidators.validateRefreshToken,
    errorHandler.asyncHandler(authController.refresh)
);

/**
 * @deprecated NOT USED by React frontend - admin logout not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing admin logout UI first
 * 
 * @route POST /api/auth/logout
 * @desc Logout de administrador
 * @access Private
 */
router.post('/logout',
    addDeprecationHeader,
    authMiddleware.optionalAuth,
    errorHandler.asyncHandler(authController.logout)
);

/**
 * @deprecated NOT USED by React frontend - user profile not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing user profile UI first
 * 
 * @route GET /api/auth/me
 * @desc Obter dados do usuário logado
 * @access Private
 */
router.get('/me',
    addDeprecationHeader,
    authMiddleware.requireAuth,
    errorHandler.asyncHandler(authController.me)
);

/**
 * @deprecated NOT USED by React frontend - password change not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing password change UI first
 * 
 * @route PUT /api/auth/change-password
 * @desc Alterar senha do usuário logado
 * @access Private
 */
router.put('/change-password',
    addDeprecationHeader,
    authMiddleware.requireAuth,
    authValidators.sanitizeAuthData,
    authValidators.validateChangePassword,
    authMiddleware.logAdminAction('change_password'),
    errorHandler.asyncHandler(authController.changePassword)
);

/**
 * @deprecated NOT USED by React frontend - token validation not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing admin session validation first
 * 
 * @route GET /api/auth/validate
 * @desc Validar token de acesso (útil para frontend)
 * @access Private
 */
router.get('/validate',
    addDeprecationHeader,
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
 * @deprecated NOT USED by React frontend - password strength check not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing password strength UI first
 * 
 * @route POST /api/auth/check-password-strength
 * @desc Verificar força da senha (útil para UI)
 * @access Public
 */
router.post('/check-password-strength',
    addDeprecationHeader,
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
