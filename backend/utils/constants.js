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

    // File types
    ALLOWED_FILE_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],

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
