module.exports = {
    // Submission statuses
    SUBMISSION_STATUS: {
        DRAFT: 'DRAFT',
        UNDER_REVIEW: 'UNDER_REVIEW',
        CHANGES_REQUESTED: 'CHANGES_REQUESTED',
        APPROVED: 'APPROVED',
        PUBLISHED: 'PUBLISHED',
        REJECTED: 'REJECTED',
        EXPIRED: 'EXPIRED'
    },

    // Feedback statuses
    FEEDBACK_STATUS: {
        PENDING: 'PENDING',
        ADDRESSED: 'ADDRESSED',
        RESOLVED: 'RESOLVED'
    },

    // Categories
    CATEGORIES: [
        'História',
        'Filosofia',
        'Literatura',
        'Arte',
        'Política',
        'Economia',
        'Sociologia',
        'Antropologia',
        'Relações Internacionais',
        'Educação',
        'Outros'
    ],

    ALLOWED_FILE_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'jpg',
        'jpeg',
        'png',
        'gif',
        'pdf',
        'doc',
        'docx'
    ],

    ALLOWED_IMAGE_TYPES: [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp'
    ],

    ALLOWED_DOCUMENT_TYPES: [
        'pdf',
        'doc',
        'docx',
        'txt',
        'rtf'
    ],

    // Limites específicos de submissão
    SUBMISSION_LIMITS: {
        MAX_ATTACHMENTS: 5,
        AUTO_SAVE_INTERVAL: 30000, // 30 segundos
        PREVIEW_MAX_LENGTH: 2000,
        SLUG_MAX_LENGTH: 100
    },

    // Campos obrigatórios para submissão completa
    REQUIRED_FIELDS: {
        TITLE_MIN: 5,
        SUMMARY_MIN: 50,
        CONTENT_MIN: 100,
        KEYWORDS_MIN: 1
    },

    // Mensagens de status
    STATUS_MESSAGES: {
        DRAFT: 'Rascunho - Continue editando',
        UNDER_REVIEW: 'Em revisão pelos editores',
        CHANGES_REQUESTED: 'Correções solicitadas',
        APPROVED: 'Aprovado para publicação',
        PUBLISHED: 'Publicado na enciclopédia',
        REJECTED: 'Rejeitado',
        EXPIRED: 'Token expirado'
    },

    // Limits
    LIMITS: {
        TITLE_MIN: 5,
        TITLE_MAX: 200,
        SUMMARY_MAX: 500,
        CONTENT_MIN: 100,
        CONTENT_MAX: 50000,
        KEYWORDS_MAX: 10,
        KEYWORD_MAX: 50,
        FILE_SIZE_MAX: 10 * 1024 * 1024, // 10MB
        SUBMISSIONS_PER_DAY: 5,
        TOKEN_ATTEMPTS_PER_HOUR: 10
    },

    // Time constants
    TIME: {
        TOKEN_EXPIRY_DAYS: 30,
        SESSION_EXPIRY_HOURS: 24,
        RATE_LIMIT_WINDOW_MINUTES: 15,
        CLEANUP_INTERVAL_MINUTES: 60
    },

    // HTTP status codes
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        TOO_MANY_REQUESTS: 429,
        INTERNAL_SERVER_ERROR: 500,
        SERVICE_UNAVAILABLE: 503
    }
};
