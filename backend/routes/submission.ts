/**
 * ROUTE USAGE STATUS:
 * ✅ ACTIVE: GET /api/submissions, GET /api/submissions/id/:id
 * ❌ DEPRECATED: All token-based endpoints (POST, PUT, auto-save, etc.)
 * 
 * See BACKEND_ROUTE_USAGE_ANALYSIS.md for details
 */

import express from 'express';
import submissionController from '../controllers/submission';
import tokenMiddleware from '../middleware/tokens';
import submissionValidators from '../validators/submission';
const errorHandler = require('../middleware/errors');

const router = express.Router();

// Rate limiting para submissões
const submissionRateLimit = require('../middleware/security').createSubmissionLimiter();

// Middleware to add deprecation headers for unused endpoints
const addDeprecationHeader = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.set('X-API-Deprecation-Warning', 'This endpoint is not used by current frontend');
    res.set('X-API-Status', 'DEPRECATED - Legacy submission system not implemented in UI');
    next();
};

/**
 * @deprecated NOT USED by React frontend - submission workflow not implemented in UI
 * @status UNTESTED - May not work as expected
 * @warning DO NOT MODIFY without thorough testing and frontend implementation
 */
// POST /api/submissions
// Criar nova submissão
// DEPRECATED - Legacy submission system
router.post('/',
    addDeprecationHeader,
    submissionRateLimit,
    submissionValidators.sanitizeSubmissionData,
    submissionValidators.validateCreateSubmission,
    errorHandler.asyncHandler(submissionController.createSubmission)
);

// GET /api/submissions/id/:id
// Buscar submissão por ID
// Public
router.get('/id/:id',
    errorHandler.asyncHandler(submissionController.getSubmissionById)
);

/**
 * @deprecated NOT USED by React frontend - token-based retrieval not implemented
 * @status UNTESTED - May not work as expected  
 * @warning DO NOT MODIFY without thorough testing and frontend implementation
 */
// GET /api/submissions/:token
// Buscar submissão por token
// DEPRECATED - Token system not used
router.get('/:token',
    addDeprecationHeader,
    tokenMiddleware.createTokenRateLimit(),
    submissionValidators.validateTokenParam,
    tokenMiddleware.validateSubmissionToken,
    tokenMiddleware.addTokenInfoToResponse,
    errorHandler.asyncHandler(submissionController.getSubmissionByToken)
);

/**
 * @deprecated NOT USED by React frontend - submission editing not implemented
 * @status UNTESTED - May not work as expected
 * @warning DO NOT MODIFY without thorough testing and frontend implementation
 */
// PUT /api/submissions/:token
// Atualizar submissão  
// DEPRECATED - Submission editing not used
router.put('/:token',
    addDeprecationHeader,
    tokenMiddleware.createTokenRateLimit(),
    submissionValidators.sanitizeSubmissionData,
    submissionValidators.validateTokenParam,
    submissionValidators.validateUpdateSubmission,
    tokenMiddleware.validateSubmissionToken,
    tokenMiddleware.validateAuthorEmail,
    tokenMiddleware.checkEditableStatus,
    tokenMiddleware.checkTokenExpiry,
    tokenMiddleware.logSubmissionAction('update'),
    errorHandler.asyncHandler(submissionController.updateSubmission)
);

/**
 * @deprecated NOT USED by React frontend - submission review workflow not implemented
 * @status UNTESTED - May not work as expected
 * @warning DO NOT MODIFY without thorough testing and frontend implementation
 */
// POST /api/submissions/:token/submit
// Enviar submissão para revisão
// DEPRECATED - Review workflow not used
router.post('/:token/submit',
    addDeprecationHeader,
    tokenMiddleware.createTokenRateLimit(),
    submissionValidators.validateTokenParam,
    tokenMiddleware.validateSubmissionToken,
    tokenMiddleware.validateAuthorEmail,
    tokenMiddleware.checkEditableStatus,
    submissionValidators.validateCompleteness,
    tokenMiddleware.logSubmissionAction('submit_for_review'),
    errorHandler.asyncHandler(submissionController.submitForReview)
);

/**
 * @deprecated NOT USED by React frontend - preview functionality not implemented
 * @status UNTESTED - May not work as expected
 * @warning DO NOT MODIFY without thorough testing and frontend implementation
 */
// GET /api/submissions/:token/preview
// Gerar preview da submissão
// DEPRECATED - Preview not used
router.get('/:token/preview',
    addDeprecationHeader,
    submissionValidators.validateTokenParam,
    tokenMiddleware.validateSubmissionToken,
    errorHandler.asyncHandler(submissionController.getSubmissionPreview)
);

/**
 * @deprecated NOT USED by React frontend - statistics not implemented
 * @status UNTESTED - May not work as expected
 * @warning DO NOT MODIFY without thorough testing and frontend implementation
 */
// GET /api/submissions/:token/stats
// Obter estatísticas da submissão
// DEPRECATED - Statistics not used
router.get('/:token/stats',
    addDeprecationHeader,
    submissionValidators.validateTokenParam,
    tokenMiddleware.validateSubmissionToken,
    errorHandler.asyncHandler(submissionController.getSubmissionStats)
);

/**
 * @deprecated NOT USED by React frontend - auto-save not implemented
 * @status UNTESTED - May not work as expected
 * @warning DO NOT MODIFY without thorough testing and frontend implementation
 */
// POST /api/submissions/:token/auto-save
// Salvamento automático
// DEPRECATED - Auto-save not used
router.post('/:token/auto-save',
    addDeprecationHeader,
    submissionValidators.validateTokenParam,
    submissionValidators.validateAutoSave,
    tokenMiddleware.validateSubmissionToken,
    tokenMiddleware.validateAuthorEmail,
    tokenMiddleware.checkEditableStatus,
    errorHandler.asyncHandler(submissionController.autoSave)
);

/**
 * @deprecated NOT USED by React frontend - in-progress check not implemented
 * @status UNTESTED - May not work as expected
 * @warning DO NOT MODIFY without thorough testing and frontend implementation
 */
// POST /api/submissions/edit
// Verificar artigos em progresso por email
// DEPRECATED - Progress check not used
router.post('/edit',
    addDeprecationHeader,
    submissionValidators.validateEmailParam,
    errorHandler.asyncHandler(submissionController.checkInProgressArticles)
);

// GET /api/submissions
// Listar todas as submissões com suporte a busca e paginação
// Public
router.get('/',
    errorHandler.asyncHandler(submissionController.listSubmissions)
);

module.exports = router;
