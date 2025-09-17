import { Router } from 'express';
import AdminReviewValidators from '../validators/adminReview';
import { resolve } from '../di';
import AdminReviewController from '../controllers/adminReview';
import { AuthMiddleware } from '../middleware/auth';
import { ErrorHandler } from '../middleware/errors';

const router = Router();

const adminReviewController = resolve<AdminReviewController>('AdminReviewController');
const authMiddleware = resolve<AuthMiddleware>('AuthMiddleware');
const errorHandler = resolve<ErrorHandler>('ErrorHandler');

// Middleware de autenticação admin para todas as rotas
router.use(authMiddleware.requireAuth);

// GET /api/admin/dashboard - Dashboard completo para administradores
router.get('/dashboard',
    authMiddleware.logAdminAction('view_dashboard'),
    errorHandler.asyncHandler(adminReviewController.getDashboard)
);

// GET /api/admin/submissions - Listar submissões com filtros e paginação
router.get('/submissions',
    AdminReviewValidators.sanitizeFilterData,
    AdminReviewValidators.validateSubmissionFilters,
    authMiddleware.logAdminAction('list_submissions'),
    errorHandler.asyncHandler(adminReviewController.getSubmissions)
);

// GET /api/admin/submissions/search - Buscar submissões por termo
router.get('/submissions/search',
    AdminReviewValidators.sanitizeSearchData,
    AdminReviewValidators.validateSearchSubmissions,
    authMiddleware.logAdminAction('search_submissions'),
    errorHandler.asyncHandler(adminReviewController.searchSubmissions)
);

// PUT /api/admin/submissions/:id/review - Revisar submissão
router.put('/submissions/:id/review',
    AdminReviewValidators.sanitizeReviewData,
    AdminReviewValidators.validateReviewSubmission,
    authMiddleware.logAdminAction('review_submission'),
    errorHandler.asyncHandler(adminReviewController.reviewSubmission)
);

// POST /api/admin/submissions/:id/feedback - Enviar feedback para autor
router.post('/submissions/:id/feedback',
    AdminReviewValidators.sanitizeFeedbackData,
    AdminReviewValidators.validateSendFeedback,
    authMiddleware.logAdminAction('send_feedback'),
    errorHandler.asyncHandler(adminReviewController.sendFeedback)
);

// PUT /api/admin/submissions/:id/publish - Publicar submissão aprovada como artigo
router.post('/submissions/:id/publish',
    AdminReviewValidators.sanitizePublishData,
    AdminReviewValidators.validatePublishSubmission,
    authMiddleware.logAdminAction('publish_article'),
    errorHandler.asyncHandler(adminReviewController.publishSubmission)
);

// POST /api/admin/submissions/bulk-action - Realizar ações em lote nas submissões
router.post('/submissions/bulk-action',
    AdminReviewValidators.validateBulkAction,
    authMiddleware.logAdminAction('bulk_action'),
    errorHandler.asyncHandler(adminReviewController.performBulkAction)
);

// GET /api/admin/activity-log - Histórico de ações administrativas
router.get('/activity-log',
    AdminReviewValidators.validateActivityLog,
    authMiddleware.logAdminAction('view_activity_log'),
    errorHandler.asyncHandler(adminReviewController.getActivityLog)
);

module.exports = router; // For CommonJS compatibility
