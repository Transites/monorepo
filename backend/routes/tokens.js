const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokens');
const tokenMiddleware = require('../middleware/tokens');
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

module.exports = router;
