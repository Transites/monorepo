const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communication');
const communicationValidators = require('../validators/communication');
const authMiddleware = require('../middleware/auth');
const errorHandler = require('../middleware/errors');

// Middleware de autenticação admin para todas as rotas
router.use(authMiddleware.requireAuth);

// POST /api/admin/communications/:submissionId/resend-token
// Re-enviar token para autor
router.post('/:submissionId/resend-token',
    communicationValidators.validateResendToken(),
    authMiddleware.logAdminAction('resend_token'),
    errorHandler.asyncHandler(communicationController.resendToken)
);

// POST /api/admin/communications/:submissionId/regenerate-token
// Regenerar e enviar novo token
router.post('/:submissionId/regenerate-token',
    communicationValidators.validateRegenerateToken(),
    authMiddleware.logAdminAction('regenerate_token'),
    errorHandler.asyncHandler(communicationController.regenerateToken)
);

// POST /api/admin/communications/:submissionId/reactivate
// Reativar submissão expirada
router.post('/:submissionId/reactivate',
    communicationValidators.validateReactivateSubmission(),
    authMiddleware.logAdminAction('reactivate_submission'),
    errorHandler.asyncHandler(communicationController.reactivateSubmission)
);

// POST /api/admin/communications/:submissionId/custom-reminder
// Enviar lembrete personalizado para autor
router.post('/:submissionId/custom-reminder',
    communicationValidators.validateCustomReminder(),
    authMiddleware.logAdminAction('send_custom_reminder'),
    errorHandler.asyncHandler(communicationController.sendCustomReminder)
);

// GET /api/admin/communications/history/:submissionId
// Histórico de comunicações de uma submissão
router.get('/history/:submissionId',
    communicationValidators.validateCommunicationHistory(),
    errorHandler.asyncHandler(communicationController.getCommunicationHistory)
);

// POST /api/admin/communications/process-alerts
// Processar alertas de expiração manualmente
router.post('/process-alerts',
    authMiddleware.logAdminAction('process_expiration_alerts'),
    errorHandler.asyncHandler(communicationController.processExpirationAlerts)
);

// POST /api/admin/communications/daily-summary
// Enviar resumo diário manualmente
// TODO: criar rate limit para evitar spam.
router.post('/daily-summary',
    authMiddleware.logAdminAction('send_daily_summary'),
    errorHandler.asyncHandler(communicationController.sendDailySummary)
);

// GET /api/admin/communications/stats
// Estatísticas de comunicação
router.get('/stats',
    communicationValidators.validateCommunicationStats(),
    errorHandler.asyncHandler(communicationController.getCommunicationStats)
);

module.exports = router;
