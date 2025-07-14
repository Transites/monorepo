import express from 'express';
import submissionController from '../controllers/submission';
import tokenMiddleware from '../middleware/tokens';
import submissionValidators from '../validators/submission';
import errorHandler from '../middleware/errors';

const router = express.Router();

// Rate limiting para submissões
const submissionRateLimit = require('../middleware/security').createSubmissionLimiter();

// POST /api/submissions
// Criar nova submissão
// Public (com rate limiting)
router.post('/',
    submissionRateLimit,
    submissionValidators.sanitizeSubmissionData,
    submissionValidators.validateCreateSubmission,
    errorHandler.asyncHandler(submissionController.createSubmission)
);

// GET /api/submissions/:token
// Buscar submissão por token
// Public (requer token válido)
router.get('/:token',
    tokenMiddleware.createTokenRateLimit(),
    submissionValidators.validateTokenParam,
    tokenMiddleware.validateSubmissionToken,
    tokenMiddleware.addTokenInfoToResponse,
    errorHandler.asyncHandler(submissionController.getSubmissionByToken)
);

// PUT /api/submissions/:token
// Atualizar submissão
// Public (requer token válido + email autor)
router.put('/:token',
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

// POST /api/submissions/:token/submit
// Enviar submissão para revisão
// Public (requer token válido + email autor + submissão completa)
router.post('/:token/submit',
    tokenMiddleware.createTokenRateLimit(),
    submissionValidators.validateTokenParam,
    tokenMiddleware.validateSubmissionToken,
    tokenMiddleware.validateAuthorEmail,
    tokenMiddleware.checkEditableStatus,
    submissionValidators.validateCompleteness,
    tokenMiddleware.logSubmissionAction('submit_for_review'),
    errorHandler.asyncHandler(submissionController.submitForReview)
);

// GET /api/submissions/:token/preview
// Gerar preview da submissão
// Public (requer token válido)
router.get('/:token/preview',
    submissionValidators.validateTokenParam,
    tokenMiddleware.validateSubmissionToken,
    errorHandler.asyncHandler(submissionController.getSubmissionPreview)
);

// GET /api/submissions/:token/stats
// Obter estatísticas da submissão
// Public (requer token válido)
router.get('/:token/stats',
    submissionValidators.validateTokenParam,
    tokenMiddleware.validateSubmissionToken,
    errorHandler.asyncHandler(submissionController.getSubmissionStats)
);

// POST /api/submissions/:token/auto-save
// Salvamento automático
// Public (requer token válido + email autor)
router.post('/:token/auto-save',
    submissionValidators.validateTokenParam,
    submissionValidators.validateAutoSave,
    tokenMiddleware.validateSubmissionToken,
    tokenMiddleware.validateAuthorEmail,
    tokenMiddleware.checkEditableStatus,
    errorHandler.asyncHandler(submissionController.autoSave)
);

// POST /api/submissions/:token/attachments
// Adicionar anexo
// Public (requer token válido + email autor)
router.post('/:token/attachments',
    submissionValidators.validateTokenParam,
    submissionValidators.validateAttachment,
    tokenMiddleware.validateSubmissionToken,
    tokenMiddleware.validateAuthorEmail,
    tokenMiddleware.checkEditableStatus,
    tokenMiddleware.logSubmissionAction('add_attachment'),
    errorHandler.asyncHandler(submissionController.addAttachment)
);

// DELETE /api/submissions/:token/attachments/:attachmentId
// Remover anexo
// Public (requer token válido + email autor)
router.delete('/:token/attachments/:attachmentId',
    submissionValidators.validateTokenParam,
    submissionValidators.validateAttachmentParam,
    tokenMiddleware.validateSubmissionToken,
    tokenMiddleware.validateAuthorEmail,
    tokenMiddleware.checkEditableStatus,
    tokenMiddleware.logSubmissionAction('remove_attachment'),
    errorHandler.asyncHandler(submissionController.removeAttachment)
);

module.exports = router;
