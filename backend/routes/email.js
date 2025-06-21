const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email');
const authMiddleware = require('../middleware/auth');
const emailValidators = require('../validators/email');
const errorHandler = require('../middleware/errors');

// POST /api/admin/email/test - Testar configuração de email
router.post('/test',
    authMiddleware.requireAuth,
    emailValidators.sanitizeEmailData,
    emailValidators.validateEmailTest,
    authMiddleware.logAdminAction('test_email_config'),
    errorHandler.asyncHandler(emailController.testEmailConfiguration)
);

// POST /api/admin/email/resend-token - Reenviar token por email
router.post('/resend-token',
    authMiddleware.requireAuth,
    emailValidators.validateResendToken,
    authMiddleware.logAdminAction('resend_token_email'),
    errorHandler.asyncHandler(emailController.resendToken)
);

// POST /api/admin/email/send-reminder - Enviar lembrete customizado
router.post('/send-reminder',
    authMiddleware.requireAuth,
    emailValidators.sanitizeEmailData,
    emailValidators.validateCustomReminder,
    authMiddleware.logAdminAction('send_custom_reminder'),
    errorHandler.asyncHandler(emailController.sendCustomReminder)
);

// POST /api/admin/email/bulk-notification - Enviar notificação em massa
router.post('/bulk-notification',
    authMiddleware.requireAuth,
    emailValidators.sanitizeEmailData,
    emailValidators.validateBulkNotification,
    authMiddleware.logAdminAction('send_bulk_notification'),
    errorHandler.asyncHandler(emailController.sendBulkNotification)
);

// GET /api/admin/email/stats - Estatísticas de email
router.get('/stats',
    authMiddleware.requireAuth,
    errorHandler.asyncHandler(emailController.getEmailStats)
);

module.exports = router;
