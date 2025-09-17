/**
 * ❌ ALL TOKEN ROUTES DEPRECATED - Token system not used by React frontend
 * 
 * Token-based workflows were part of unused submission system.
 * See BACKEND_ROUTE_USAGE_ANALYSIS.md for details
 * 
 * @warning DO NOT MODIFY without implementing token-based features first
 */

const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokens');
const tokenMiddleware = require('../middleware/tokens');
const tokenValidators = require('../validators/tokens');
const errorHandler = require('../middleware/errors');

// Rate limiting para tokens
const tokenRateLimit = tokenMiddleware.createTokenRateLimit();

// Middleware to add deprecation headers for all token endpoints
const addDeprecationHeader = (req, res, next) => {
    res.set('X-API-Deprecation-Warning', 'Token endpoints not used by current frontend');
    res.set('X-API-Status', 'DEPRECATED - Token system not implemented in UI');
    next();
};

/**
 * @deprecated NOT USED by React frontend - token validation not implemented
 * @status UNTESTED - No token-based UI to test this endpoint
 * @warning DO NOT MODIFY without implementing token workflow UI first
 */
// GET /api/tokens/:token/validate
// Validar token e retornar informações básicas
// DEPRECATED - Token validation not used
router.get('/:token/validate',
    addDeprecationHeader,
    tokenRateLimit,
    tokenValidators.validateTokenParam,
    errorHandler.asyncHandler(tokenController.validateToken)
);

/**
 * @deprecated NOT USED by React frontend - email verification not implemented
 * @status UNTESTED - No token-based UI to test this endpoint
 * @warning DO NOT MODIFY without implementing email verification UI first
 */
// POST /api/tokens/:token/verify-email
// Verificar email do autor
// DEPRECATED - Email verification not used
router.post('/:token/verify-email',
    addDeprecationHeader,
    tokenRateLimit,
    tokenValidators.sanitizeTokenData,
    tokenValidators.validateTokenParam,
    tokenValidators.validateAuthorEmail,
    errorHandler.asyncHandler(tokenController.verifyAuthorEmail)
);

/**
 * @deprecated NOT USED by React frontend - token renewal not implemented
 * @status UNTESTED - No token-based UI to test this endpoint
 * @warning DO NOT MODIFY without implementing token management UI first
 */
// POST /api/tokens/:token/renew
// Renovar token (estender expiração)
// DEPRECATED - Token renewal not used
router.post('/:token/renew',
    addDeprecationHeader,
    tokenRateLimit,
    tokenValidators.sanitizeTokenData,
    tokenValidators.validateTokenParam,
    tokenValidators.validateTokenRenewal,
    tokenMiddleware.validateSubmissionToken,
    tokenMiddleware.validateAuthorEmail,
    tokenMiddleware.logSubmissionAction('renew_token'),
    errorHandler.asyncHandler(tokenController.renewToken)
);

module.exports = router;
