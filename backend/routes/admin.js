const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const emailRoutes = require('./email');
const adminReviewRoutes = require('./adminReview');
const tokenValidators = require("../validators/tokens");
const errorHandler = require("../middleware/errors");
const tokenController = require("../controllers/tokens");
const uploadController = require("../controllers/upload");

router.use('/email', emailRoutes);
router.use('/review', adminReviewRoutes);

// Admin info route
router.get('/', authMiddleware.requireAuth, (req, res) => {
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

// POST /api/admin/tokens/:submissionId/regenerate
// Regenerar token completamente
// Private (Admin only)
router.post('/tokens/:submissionId/regenerate',
    authMiddleware.requireAuth,
    tokenValidators.validateSubmissionId,
    authMiddleware.logAdminAction('regenerate_token'),
    errorHandler.asyncHandler(tokenController.regenerateToken)
);

// POST /api/admin/tokens/:submissionId/reactivate
// Reativar submissão expirada
// Private (Admin only)
router.post('/tokens/:submissionId/reactivate',
    authMiddleware.requireAuth,
    tokenValidators.sanitizeTokenData,
    tokenValidators.validateReactivation,
    authMiddleware.logAdminAction('reactivate_submission'),
    errorHandler.asyncHandler(tokenController.reactivateExpired)
);

// GET /api/admin/tokens/expiring
// Listar submissões próximas do vencimento
// Private (Admin only)
router.get('/tokens/expiring',
    authMiddleware.requireAuth,
    tokenValidators.validateDaysQuery,
    errorHandler.asyncHandler(tokenController.getExpiringSubmissions)
);

// POST /api/admin/tokens/cleanup
// Executar limpeza de tokens expirados
// Private (Admin only)
router.post('/tokens/cleanup',
    authMiddleware.requireAuth,
    authMiddleware.logAdminAction('cleanup_expired_tokens'),
    errorHandler.asyncHandler(tokenController.cleanupExpiredTokens)
);

// GET /api/admin/tokens/stats
// Estatísticas de tokens
// Private (Admin only)
router.get('/tokens/stats',
    authMiddleware.requireAuth,
    errorHandler.asyncHandler(tokenController.getTokenStats)
)

// POST /api/admin/upload/cleanup
// Limpeza de arquivos órfãos
// Private (Admin only)
router.post('/upload/cleanup',
    authMiddleware.requireAuth,
    authMiddleware.logAdminAction('cleanup_orphaned_files'),
    errorHandler.asyncHandler(uploadController.cleanupOrphanedFiles)
);

module.exports = router;
