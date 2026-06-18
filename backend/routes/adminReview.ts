import { Router } from 'express';
import AdminReviewValidators from '../validators/adminReview';
import { resolve } from '../di';
import AdminReviewController from '../controllers/adminReview';
import { AuthMiddleware } from '../middleware/auth';
import { ErrorHandler } from '../middleware/errors';
import SubmissionSuggestionsController from '../controllers/submissionSuggestions'

const router = Router();

const adminReviewController = resolve<AdminReviewController>('AdminReviewController');
const suggestionsController = resolve<SubmissionSuggestionsController>('SubmissionSuggestionsController');
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

// POST /api/admin/review/submissions/:id/assign - Tornar-se responsável
router.post('/submissions/:id/assign',
    authMiddleware.logAdminAction('assign_submission'),
    errorHandler.asyncHandler(adminReviewController.assignSubmission)
);

// POST /api/admin/review/submissions/:id/unassign - Devolver à fila
router.post('/submissions/:id/unassign',
    authMiddleware.logAdminAction('unassign_submission'),
    errorHandler.asyncHandler(adminReviewController.unassignSubmission)
);

// GET /api/admin/review/submissions/:id/review-detail
// Buscar submissão completa + sugestão pendente para página de revisão
router.get('/submissions/:id/review-detail',
    authMiddleware.logAdminAction('view_submission_detail'),
    errorHandler.asyncHandler(suggestionsController.getSubmissionForReview)
);
 
// GET /api/admin/review/submissions/:id/suggestions
// Listar sugestões de uma submissão
router.get('/submissions/:id/suggestions',
    errorHandler.asyncHandler(suggestionsController.getSuggestions)
);
 
// POST /api/admin/review/submissions/:id/suggestions
// Criar sugestão de revisão
router.post('/submissions/:id/suggestions',
    authMiddleware.logAdminAction('create_suggestion'),
    errorHandler.asyncHandler(suggestionsController.createSuggestion)
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
