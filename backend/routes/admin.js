/**
 * ❌ ALL ADMIN ROUTES DEPRECATED - Admin interface not implemented in React frontend
 * 
 * Complete admin system built but no UI implemented.
 * Includes email management, review workflow, token management, etc.
 * See BACKEND_ROUTE_USAGE_ANALYSIS.md for details
 * 
 * @warning DO NOT MODIFY without implementing complete admin UI first
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const emailRoutes = require('./email');
const adminReviewRoutes = require('./adminReview');
const communicationsRoutes = require('./communication');
const tokenValidators = require("../validators/tokens");
const errorHandler = require("../middleware/errors");
const tokenController = require("../controllers/tokens");
const uploadController = require("../controllers/upload");

// Middleware to add deprecation headers for all admin endpoints
const addDeprecationHeader = (req, res, next) => {
    res.set('X-API-Deprecation-Warning', 'Admin endpoints not used by current frontend');
    res.set('X-API-Status', 'DEPRECATED - Admin interface not implemented in UI');
    next();
};

/**
 * @deprecated ALL sub-routes deprecated - no admin UI implemented
 * Sub-routes: /email, /review, /communications
 */
router.use('/email', addDeprecationHeader, emailRoutes);
router.use('/review', addDeprecationHeader, adminReviewRoutes);
router.use('/communications', addDeprecationHeader, communicationsRoutes);

/**
 * @deprecated NOT USED by React frontend - admin info not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing admin dashboard first
 */
// Admin info route
// DEPRECATED - Admin dashboard not implemented
router.get('/', addDeprecationHeader, authMiddleware.requireAuth, (req, res) => {
    res.json({
        message: 'Admin API',
        admin: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name
        },
        endpoints: {
            email: '/api/admin/email',
            review: '/api/admin/review'
        }
    });
});

/**
 * @deprecated NOT USED by React frontend - token regeneration not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing token management UI first
 */
// POST /api/admin/tokens/:submissionId/regenerate
// Regenerar token completamente
// DEPRECATED - Token management not implemented
router.post('/tokens/:submissionId/regenerate',
    addDeprecationHeader,
    authMiddleware.requireAuth,
    tokenValidators.validateSubmissionId,
    authMiddleware.logAdminAction('regenerate_token'),
    errorHandler.asyncHandler(tokenController.regenerateToken)
);

/**
 * @deprecated NOT USED by React frontend - token reactivation not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing token management UI first
 */
// POST /api/admin/tokens/:submissionId/reactivate
// Reativar submissão expirada
// DEPRECATED - Token reactivation not implemented
router.post('/tokens/:submissionId/reactivate',
    addDeprecationHeader,
    authMiddleware.requireAuth,
    tokenValidators.sanitizeTokenData,
    tokenValidators.validateReactivation,
    authMiddleware.logAdminAction('reactivate_submission'),
    errorHandler.asyncHandler(tokenController.reactivateExpired)
);

/**
 * @deprecated NOT USED by React frontend - expiring tokens view not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing admin dashboard first
 */
// GET /api/admin/tokens/expiring
// Listar submissões próximas do vencimento
// DEPRECATED - Expiring tokens view not implemented
router.get('/tokens/expiring',
    addDeprecationHeader,
    authMiddleware.requireAuth,
    tokenValidators.validateDaysQuery,
    errorHandler.asyncHandler(tokenController.getExpiringSubmissions)
);

/**
 * @deprecated NOT USED by React frontend - token cleanup not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing admin maintenance UI first
 */
// POST /api/admin/tokens/cleanup
// Executar limpeza de tokens expirados
// DEPRECATED - Token cleanup not implemented
router.post('/tokens/cleanup',
    addDeprecationHeader,
    authMiddleware.requireAuth,
    authMiddleware.logAdminAction('cleanup_expired_tokens'),
    errorHandler.asyncHandler(tokenController.cleanupExpiredTokens)
);

/**
 * @deprecated NOT USED by React frontend - token statistics not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing admin statistics UI first
 */
// GET /api/admin/tokens/stats
// Estatísticas de tokens
// DEPRECATED - Token statistics not implemented
router.get('/tokens/stats',
    addDeprecationHeader,
    authMiddleware.requireAuth,
    errorHandler.asyncHandler(tokenController.getTokenStats)
)

/**
 * @deprecated NOT USED by React frontend - file cleanup not implemented
 * @status UNTESTED - No admin UI to test this endpoint
 * @warning DO NOT MODIFY without implementing file management UI first
 */
// POST /api/admin/upload/cleanup
// Limpeza de arquivos órfãos
// DEPRECATED - File cleanup not implemented
router.post('/upload/cleanup',
    addDeprecationHeader,
    authMiddleware.requireAuth,
    authMiddleware.logAdminAction('cleanup_orphaned_files'),
    errorHandler.asyncHandler(uploadController.cleanupOrphanedFiles)
);

module.exports = router;
