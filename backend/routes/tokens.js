const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokens');
const tokenMiddleware = require('../middleware/tokens');
const authMiddleware = require('../middleware/auth');
const tokenValidators = require('../validators/tokens');
const errorHandler = require('../middleware/errors');

// Rate limiting para tokens
const tokenRateLimit = tokenMiddleware.createTokenRateLimit();

// GET /api/tokens/:token/validate
// Validar token e retornar informações básicas
// Public (com rate limiting)
router.get('/:token/validate',
    tokenRateLimit,
    tokenValidators.validateTokenParam,
    errorHandler.asyncHandler(tokenController.validateToken)
);

// POST /api/tokens/:token/verify-email
// Verificar email do autor
// Public (com rate limiting)
router.post('/:token/verify-email',
    tokenRateLimit,
    tokenValidators.sanitizeTokenData,
    tokenValidators.validateTokenParam,
    tokenValidators.validateAuthorEmail,
    errorHandler.asyncHandler(tokenController.verifyAuthorEmail)
);

// POST /api/tokens/:token/renew
// Renovar token (estender expiração)
// Public (requer validação de token + email)
router.post('/:token/renew',
    tokenRateLimit,
    tokenValidators.sanitizeTokenData,
    tokenValidators.validateTokenParam,
    tokenValidators.validateTokenRenewal,
    tokenMiddleware.validateSubmissionToken,
    tokenMiddleware.validateAuthorEmail,
    tokenMiddleware.logSubmissionAction('renew_token'),
    errorHandler.asyncHandler(tokenController.renewToken)
);

// ========== ROTAS ADMINISTRATIVAS ==========

// POST /api/admin/tokens/:submissionId/regenerate
// Regenerar token completamente
// Private (Admin only)
router.post('/admin/:submissionId/regenerate',
    authMiddleware.requireAuth,
    tokenValidators.validateSubmissionId,
    authMiddleware.logAdminAction('regenerate_token'),
    errorHandler.asyncHandler(tokenController.regenerateToken)
);

// POST /api/admin/tokens/:submissionId/reactivate
// Reativar submissão expirada
// Private (Admin only)
router.post('/admin/:submissionId/reactivate',
    authMiddleware.requireAuth,
    tokenValidators.sanitizeTokenData,
    tokenValidators.validateReactivation,
    authMiddleware.logAdminAction('reactivate_submission'),
    errorHandler.asyncHandler(tokenController.reactivateExpired)
);

// GET /api/admin/tokens/expiring
// Listar submissões próximas do vencimento
// Private (Admin only)
router.get('/admin/expiring',
    authMiddleware.requireAuth,
    tokenValidators.validateDaysQuery,
    errorHandler.asyncHandler(tokenController.getExpiringSubmissions)
);

// POST /api/admin/tokens/cleanup
// Executar limpeza de tokens expirados
// Private (Admin only)
router.post('/admin/cleanup',
    authMiddleware.requireAuth,
    authMiddleware.logAdminAction('cleanup_expired_tokens'),
    errorHandler.asyncHandler(tokenController.cleanupExpiredTokens)
);

// GET /api/admin/tokens/stats
// Estatísticas de tokens
// Private (Admin only)
router.get('/admin/stats',
    authMiddleware.requireAuth,
    errorHandler.asyncHandler(tokenController.getTokenStats)
);

module.exports = router;
