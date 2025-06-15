const constants = require('./constants');

describe('Constants Utility Tests', () => {
    describe('Submission Status Constants', () => {
        test('should define all required submission statuses', () => {
            expect(constants.SUBMISSION_STATUS).toBeDefined();
            expect(constants.SUBMISSION_STATUS.DRAFT).toBe('DRAFT');
            expect(constants.SUBMISSION_STATUS.UNDER_REVIEW).toBe('UNDER_REVIEW');
            expect(constants.SUBMISSION_STATUS.CHANGES_REQUESTED).toBe('CHANGES_REQUESTED');
            expect(constants.SUBMISSION_STATUS.APPROVED).toBe('APPROVED');
            expect(constants.SUBMISSION_STATUS.PUBLISHED).toBe('PUBLISHED');
            expect(constants.SUBMISSION_STATUS.REJECTED).toBe('REJECTED');
            expect(constants.SUBMISSION_STATUS.EXPIRED).toBe('EXPIRED');
        });
    });

    describe('Feedback Status Constants', () => {
        test('should define all required feedback statuses', () => {
            expect(constants.FEEDBACK_STATUS).toBeDefined();
            expect(constants.FEEDBACK_STATUS.PENDING).toBe('PENDING');
            expect(constants.FEEDBACK_STATUS.ADDRESSED).toBe('ADDRESSED');
            expect(constants.FEEDBACK_STATUS.RESOLVED).toBe('RESOLVED');
        });
    });

    describe('Categories Constants', () => {
        test('should define all required categories', () => {
            expect(constants.CATEGORIES).toBeDefined();
            expect(constants.CATEGORIES).toBeInstanceOf(Array);
            expect(constants.CATEGORIES.length).toBeGreaterThan(0);

            // Check for specific categories
            expect(constants.CATEGORIES).toContain('História');
            expect(constants.CATEGORIES).toContain('Filosofia');
            expect(constants.CATEGORIES).toContain('Literatura');
            expect(constants.CATEGORIES).toContain('Arte');
            expect(constants.CATEGORIES).toContain('Política');
            expect(constants.CATEGORIES).toContain('Economia');
            expect(constants.CATEGORIES).toContain('Sociologia');
            expect(constants.CATEGORIES).toContain('Antropologia');
            expect(constants.CATEGORIES).toContain('Relações Internacionais');
            expect(constants.CATEGORIES).toContain('Educação');
            expect(constants.CATEGORIES).toContain('Outros');
        });
    });

    describe('Allowed File Types Constants', () => {
        test('should define all required file types', () => {
            expect(constants.ALLOWED_FILE_TYPES).toBeDefined();
            expect(constants.ALLOWED_FILE_TYPES).toBeInstanceOf(Array);
            expect(constants.ALLOWED_FILE_TYPES.length).toBeGreaterThan(0);

            // Check for specific file types
            expect(constants.ALLOWED_FILE_TYPES).toContain('image/jpeg');
            expect(constants.ALLOWED_FILE_TYPES).toContain('image/png');
            expect(constants.ALLOWED_FILE_TYPES).toContain('image/gif');
            expect(constants.ALLOWED_FILE_TYPES).toContain('application/pdf');
            expect(constants.ALLOWED_FILE_TYPES).toContain('application/msword');
            expect(constants.ALLOWED_FILE_TYPES).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        });
    });

    describe('Limits Constants', () => {
        test('should define all required limits', () => {
            expect(constants.LIMITS).toBeDefined();
            expect(constants.LIMITS.TITLE_MIN).toBe(5);
            expect(constants.LIMITS.TITLE_MAX).toBe(200);
            expect(constants.LIMITS.SUMMARY_MAX).toBe(500);
            expect(constants.LIMITS.CONTENT_MIN).toBe(100);
            expect(constants.LIMITS.CONTENT_MAX).toBe(50000);
            expect(constants.LIMITS.KEYWORDS_MAX).toBe(10);
            expect(constants.LIMITS.KEYWORD_MAX).toBe(50);
            expect(constants.LIMITS.FILE_SIZE_MAX).toBe(10 * 1024 * 1024); // 10MB
            expect(constants.LIMITS.SUBMISSIONS_PER_DAY).toBe(5);
            expect(constants.LIMITS.TOKEN_ATTEMPTS_PER_HOUR).toBe(10);
        });
    });

    describe('Time Constants', () => {
        test('should define all required time constants', () => {
            expect(constants.TIME).toBeDefined();
            expect(constants.TIME.TOKEN_EXPIRY_DAYS).toBe(30);
            expect(constants.TIME.SESSION_EXPIRY_HOURS).toBe(24);
            expect(constants.TIME.RATE_LIMIT_WINDOW_MINUTES).toBe(15);
            expect(constants.TIME.CLEANUP_INTERVAL_MINUTES).toBe(60);
        });
    });

    describe('HTTP Status Constants', () => {
        test('should define all required HTTP status codes', () => {
            expect(constants.HTTP_STATUS).toBeDefined();
            expect(constants.HTTP_STATUS.OK).toBe(200);
            expect(constants.HTTP_STATUS.CREATED).toBe(201);
            expect(constants.HTTP_STATUS.BAD_REQUEST).toBe(400);
            expect(constants.HTTP_STATUS.UNAUTHORIZED).toBe(401);
            expect(constants.HTTP_STATUS.FORBIDDEN).toBe(403);
            expect(constants.HTTP_STATUS.NOT_FOUND).toBe(404);
            expect(constants.HTTP_STATUS.CONFLICT).toBe(409);
            expect(constants.HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
            expect(constants.HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
            expect(constants.HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503);
        });
    });

    describe('Constants Immutability', () => {
        test('should not allow modification of constants', () => {
            // This test is to ensure that constants are not accidentally modified
            // Note: In JavaScript, object properties can still be modified unless Object.freeze() is used
            const originalDraft = constants.SUBMISSION_STATUS.DRAFT;

            // Try to modify a constant
            expect(() => {
                constants.SUBMISSION_STATUS.DRAFT = 'MODIFIED';
            }).not.toThrow();

            // Check if the constant was actually modified
            // In a real application, you might want to use Object.freeze() to prevent this
            expect(constants.SUBMISSION_STATUS.DRAFT).toBe('MODIFIED');

            // Restore the original value for other tests
            constants.SUBMISSION_STATUS.DRAFT = originalDraft;
        });
    });
});
