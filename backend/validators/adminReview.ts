import { body, param, query } from 'express-validator';

class AdminReviewValidators {
    public validateReviewSubmission = [
        param('id')
            .isUUID()
            .withMessage('ID da submissão deve ser um UUID válido'),

        body('status')
            .isIn(['pending', 'approved', 'rejected', 'changes_requested'])
            .withMessage('Status de revisão inválido'),

        body('notes')
            .optional()
            .isString()
            .isLength({ max: 2000 })
            .withMessage('Notas de revisão devem ter no máximo 2000 caracteres'),

        body('rejectionReason')
            .optional()
            .isString()
            .isLength({ max: 500 })
            .withMessage('Motivo da rejeição deve ter no máximo 500 caracteres')
    ];

    public validateSendFeedback = [
        param('id')
            .isUUID()
            .withMessage('ID da submissão deve ser um UUID válido'),

        body('content')
            .isString()
            .isLength({ min: 10, max: 2000 })
            .withMessage('Feedback deve ter entre 10 e 2000 caracteres'),

        body('isPublic')
            .optional()
            .isBoolean()
            .withMessage('isPublic deve ser um valor booleano')
    ];

    public validatePublishSubmission = [
        param('id')
            .isUUID()
            .withMessage('ID da submissão deve ser um UUID válido'),

        body('publishNotes')
            .optional()
            .isString()
            .isLength({ max: 500 })
            .withMessage('Notas de publicação devem ter no máximo 500 caracteres'),

        body('scheduledFor')
            .optional()
            .isISO8601()
            .withMessage('Data de agendamento deve ser uma data válida')
            .custom((value) => {
                if (new Date(value) <= new Date()) {
                    throw new Error('Data de agendamento deve ser futura');
                }
                return true;
            }),

        body('categoryOverride')
            .optional()
            .isString()
            .isLength({ max: 100 })
            .withMessage('Categoria deve ter no máximo 100 caracteres'),

        body('keywordsOverride')
            .optional()
            .isArray()
            .withMessage('Keywords devem ser um array')
            .custom((keywords) => {
                if (keywords.length > 10) {
                    throw new Error('Máximo de 10 keywords permitidas');
                }
                return keywords.every((keyword: any) =>
                    typeof keyword === 'string' && keyword.length <= 50
                );
            })
            .withMessage('Cada keyword deve ser uma string com no máximo 50 caracteres')
    ];

    public validateSearchSubmissions = [
        query('q')
            .isString()
            .isLength({ min: 2, max: 100 })
            .withMessage('Query de busca deve ter entre 2 e 100 caracteres'),

        query('status')
            .optional()
            .custom((value) => {
                const validStatuses = ['DRAFT', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'REJECTED'];
                const statusArray = value.split(',');
                return statusArray.every((status: string) => validStatuses.includes(status));
            })
            .withMessage('Status inválido fornecido'),

        query('category')
            .optional()
            .isString()
            .isLength({ max: 200 })
            .withMessage('Filtro de categoria muito longo')
    ];

    public validateSubmissionFilters = [
        query('status')
            .optional()
            .custom((value) => {
                const validStatuses = ['DRAFT', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'REJECTED'];
                const statusArray = Array.isArray(value) ? value : value.split(',');
                return statusArray.every((status: string) => validStatuses.includes(status));
            })
            .isArray()
            .withMessage('Status inválido fornecido'),

        query('category')
            .optional()
            .isArray()
            // Validar cada categoria internamente para um maximo de 48 caracteres por categoria.
            .custom((value) => {
                const asArray = Array.isArray(value) ? value : [value];
                return asArray.every((category: string) => typeof category === 'string' && category.length <= 48);
            })
            .withMessage('Categoria deve ser um array de strings e cada categoria deve ter no máximo 48 caracteres'),

        query('authorEmail')
            .optional()
            .isEmail()
            .withMessage('Email do autor deve ser válido'),

        query('adminId')
            .optional()
            .isUUID()
            .withMessage('ID do admin deve ser um UUID válido'),

        query('dateFrom')
            .optional()
            .isISO8601()
            .withMessage('Data inicial deve ser uma data válida'),

        query('dateTo')
            .optional()
            .isISO8601()
            .withMessage('Data final deve ser uma data válida')
            .custom((value, { req }) => {
                if (req.query?.dateFrom && new Date(value) <= new Date(req.query.dateFrom)) {
                    throw new Error('Data final deve ser posterior à data inicial');
                }
                return true;
            }),

        query('search')
            .optional()
            .isString()
            .isLength({ max: 100 })
            .withMessage('Termo de busca muito longo'),

        query('expiringDays')
            .optional()
            .isInt({ min: 1, max: 365 })
            .withMessage('Dias para expiração deve ser entre 1 e 365'),

        query('hasFiles')
            .optional()
            .isBoolean()
            .withMessage('hasFiles deve ser um valor booleano'),

        query('sortBy')
            .optional()
            .isIn(['created_at', 'updated_at', 'title', 'author_name', 'expires_at'])
            .withMessage('Campo de ordenação inválido'),

        query('sortOrder')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Ordem de classificação deve ser asc ou desc'),

        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Página deve ser um número positivo'),

        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limite deve ser entre 1 e 100')
    ];

    public validateBulkAction = [
        body('submissionIds')
            .isArray({ min: 1, max: 50 })
            .withMessage('Deve fornecer entre 1 e 50 IDs de submissão'),

        body('submissionIds.*')
            .isUUID()
            .withMessage('Cada ID deve ser um UUID válido'),

        body('action')
            .isIn(['approve', 'reject', 'request_changes', 'extend_expiry'])
            .withMessage('Ação inválida'),

        body('reason')
            .optional()
            .isString()
            .isLength({ max: 500 })
            .withMessage('Motivo deve ter no máximo 500 caracteres'),

        body('notes')
            .optional()
            .isString()
            .isLength({ max: 1000 })
            .withMessage('Notas devem ter no máximo 1000 caracteres')
    ];

    public validateActivityLog = [
        query('action')
            .optional()
            .isString()
            .isLength({ max: 50 })
            .withMessage('Ação muito longa'),

        query('targetType')
            .optional()
            .isIn(['submission', 'feedback', 'article', 'admin'])
            .withMessage('Tipo de alvo inválido'),

        query('dateFrom')
            .optional()
            .isISO8601()
            .withMessage('Data inicial deve ser uma data válida'),

        query('dateTo')
            .optional()
            .isISO8601()
            .withMessage('Data final deve ser uma data válida'),

        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Página deve ser um número positivo'),

        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limite deve ser entre 1 e 100')
    ];

    public sanitizeReviewData = [
        body('status').trim(),
        body('notes').optional().trim(),
        body('rejectionReason').optional().trim()
    ];

    public sanitizeFeedbackData = [
        body('content').trim(),
        body('isPublic').optional().toBoolean()
    ];

    public sanitizePublishData = [
        body('publishNotes').optional().trim(),
        body('categoryOverride').optional().trim(),
        body('keywordsOverride.*').optional().trim()
    ];

    public sanitizeSearchData = [
        query('q').trim(),
        query('status').optional().trim(),
        query('category').optional().trim()
    ];

    public sanitizeFilterData = [
        query('status').optional().trim(),
        query('category').optional().trim(),
        query('authorEmail').optional().trim().toLowerCase(),
        query('search').optional().trim(),
        query('sortBy').optional().trim(),
        query('sortOrder').optional().trim().toLowerCase()
    ];
}

export default new AdminReviewValidators();
