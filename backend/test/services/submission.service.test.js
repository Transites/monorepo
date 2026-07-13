// @ts-nocheck
const {
    ValidationException,
    SubmissionNotFoundException,
    InvalidStatusException,
    IncompleteSubmissionException,
    AttachmentLimitException,
    AttachmentNotFoundException,
    TokenExpiredException,
    InvalidTokenException,
    DatabaseException,
} = require('../../utils/exceptions');

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockClient = {
    query: jest.fn(),
};

const mockDb = {
    query: jest.fn(),
    findById: jest.fn(),
    transaction: jest.fn((cb) => cb(mockClient)),
};

jest.mock('../../database/client', () => mockDb);

const mockTokenService = {
    generateSecureToken: jest.fn().mockResolvedValue('secure-token-xyz'),
    validateToken: jest.fn(),
    renewToken: jest.fn().mockResolvedValue(undefined),
};
jest.mock('../../services/tokens', () => mockTokenService);

const mockEmailService = {
    sendSubmissionToken: jest.fn().mockResolvedValue(undefined),
    notifyAdminNewSubmission: jest.fn().mockResolvedValue(undefined),
    sendSubmissionAccessLinks: jest.fn().mockResolvedValue(undefined),
};
jest.mock('../../services/email', () => mockEmailService);

jest.mock('../../utils/constants', () => ({
    ENTITY_CATEGORIES: ['tecnologia', 'ciência', 'cultura'],
    LIMITS: {
        TITLE_MAX: 300,
        SUMMARY_MAX: 1000,
        CONTENT_MAX: 100000,
        KEYWORDS_MAX: 10,
    },
    SUBMISSION_STATUS: {
        DRAFT: 'DRAFT',
        SUBMITTED: 'SUBMITTED',
        UNDER_REVIEW: 'UNDER_REVIEW',
        CHANGES_REQUESTED: 'CHANGES_REQUESTED',
        APPROVED: 'APPROVED',
        PUBLISHED: 'PUBLISHED',
        REJECTED: 'REJECTED',
        EXPIRED: 'EXPIRED',
    },
}));

jest.mock('../../utils/url', () => ({ generateSlug: (t) => t.toLowerCase().replace(/\s+/g, '-') }));

jest.mock('../../middleware/logging', () => ({
    audit: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
}));

// Require AFTER mocks are set up
const submissionService = require('../../services/submission').default;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const validSubmissionData = () => ({
    author_name: 'Maria Silva',
    author_email: 'maria@email.com',
    author_institution: 'UFMG',
    title: 'Título do Artigo Científico',
    summary: 'Um resumo completo e bem elaborado para este artigo com mais de cinquenta caracteres.',
    content: 'Conteúdo extenso do artigo que vai além de cem caracteres de comprimento para satisfazer as validações do sistema.',
    keywords: ['tecnologia', 'ciência'],
    category: 'tecnologia',
});

const completeSubmission = (overrides = {}) => ({
    id: 'sub-uuid',
    title: 'Título Completo',
    summary: 'Um resumo completo e bem elaborado para este artigo com mais de cinquenta caracteres.',
    content: 'Conteúdo extenso do artigo que vai além de cem caracteres de comprimento para satisfazer as validações do sistema.',
    category: 'tecnologia',
    keywords: ['tecnologia'],
    status: 'DRAFT',
    author_email: 'a@b.com',
    author_name: 'Autor',
    ...overrides,
});

// ─── validateSubmissionData ───────────────────────────────────────────────────

describe('SubmissionService.validateSubmissionData', () => {
    it('returns valid for correct data', () => {
        const result = submissionService.validateSubmissionData(validSubmissionData());
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('returns error when author_name is too short', () => {
        const data = { ...validSubmissionData(), author_name: 'A' };
        const result = submissionService.validateSubmissionData(data);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Nome do autor deve ter pelo menos 2 caracteres');
    });

    it('returns error when author_email is invalid', () => {
        const data = { ...validSubmissionData(), author_email: 'not-an-email' };
        const result = submissionService.validateSubmissionData(data);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Email do autor é obrigatório e deve ser válido');
    });

    it('returns error when title is too short', () => {
        const data = { ...validSubmissionData(), title: 'abc' };
        const result = submissionService.validateSubmissionData(data);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Título deve ter pelo menos 5 caracteres');
    });

    it('returns error when category is invalid', () => {
        const data = { ...validSubmissionData(), category: 'ficção-científica' };
        const result = submissionService.validateSubmissionData(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Categoria inválida'))).toBe(true);
    });

    it('returns error when keywords exceed max limit', () => {
        const data = { ...validSubmissionData(), keywords: Array(11).fill('keyword') };
        const result = submissionService.validateSubmissionData(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('palavras-chave'))).toBe(true);
    });

    it('skips required-field checks when requireAll=false', () => {
        const result = submissionService.validateSubmissionData({}, false);
        expect(result.isValid).toBe(true);
    });

    it('still validates optional field limits when requireAll=false', () => {
        const data = { category: 'ficção-inválida' };
        const result = submissionService.validateSubmissionData(data, false);
        expect(result.isValid).toBe(false);
    });
});

// ─── validateCompleteness ─────────────────────────────────────────────────────

describe('SubmissionService.validateCompleteness', () => {
    it('returns complete for a full submission', () => {
        const result = submissionService.validateCompleteness(completeSubmission());
        expect(result.isComplete).toBe(true);
        expect(result.missingFields).toHaveLength(0);
        expect(result.completenessPercentage).toBe(100);
    });

    it('identifies missing summary', () => {
        const result = submissionService.validateCompleteness(completeSubmission({ summary: null }));
        expect(result.isComplete).toBe(false);
        expect(result.missingFields).toContain('summary');
    });

    it('identifies missing keywords', () => {
        const result = submissionService.validateCompleteness(completeSubmission({ keywords: [] }));
        expect(result.isComplete).toBe(false);
        expect(result.missingFields).toContain('keywords');
    });

    it('identifies missing category', () => {
        const result = submissionService.validateCompleteness(completeSubmission({ category: null }));
        expect(result.isComplete).toBe(false);
        expect(result.missingFields).toContain('category');
    });

    it('identifies content too short', () => {
        const result = submissionService.validateCompleteness(completeSubmission({ content: 'curto' }));
        expect(result.isComplete).toBe(false);
        expect(result.missingFields).toContain('content');
    });

    it('calculates correct percentage', () => {
        // missing 2 out of 5 fields
        const result = submissionService.validateCompleteness(completeSubmission({ summary: null, keywords: [] }));
        expect(result.completenessPercentage).toBe(60);
        expect(result.completedFields).toBe(3);
        expect(result.totalFields).toBe(5);
    });
});

// ─── hasSignificantChanges ────────────────────────────────────────────────────

describe('SubmissionService.hasSignificantChanges', () => {
    const current = completeSubmission({ title: 'Original', summary: 'Resumo original', content: 'Conteúdo', category: 'tecnologia' });

    it('returns true when title changes', () => {
        expect(submissionService.hasSignificantChanges(current, { title: 'Novo Título' })).toBe(true);
    });

    it('returns true when category changes', () => {
        expect(submissionService.hasSignificantChanges(current, { category: 'ciência' })).toBe(true);
    });

    it('returns false when only keywords change', () => {
        expect(submissionService.hasSignificantChanges(current, { keywords: ['a', 'b'] })).toBe(false);
    });

    it('returns false when no significant field is present in updates', () => {
        expect(submissionService.hasSignificantChanges(current, { author_institution: 'USP' })).toBe(false);
    });

    it('returns false when update value matches current', () => {
        expect(submissionService.hasSignificantChanges(current, { title: 'Original' })).toBe(false);
    });
});

// ─── isValidEmail ─────────────────────────────────────────────────────────────

describe('SubmissionService.isValidEmail', () => {
    it.each([
        ['user@example.com', true],
        ['user+tag@sub.domain.org', true],
        ['notanemail', false],
        ['missing@tld', false],   // passes the regex used
        ['@nodomain.com', false],
        ['spaces @email.com', false],
    ])('isValidEmail(%s) → %s', (email, expected) => {
        expect(submissionService.isValidEmail(email)).toBe(expected);
    });
});

// ─── processContentForPreview ─────────────────────────────────────────────────

describe('SubmissionService.processContentForPreview', () => {
    it('returns empty string for falsy content', () => {
        expect(submissionService.processContentForPreview('')).toBe('');
        expect(submissionService.processContentForPreview(null)).toBe('');
    });

    it('converts bold markdown', () => {
        const result = submissionService.processContentForPreview('**negrito**');
        expect(result).toContain('<strong>negrito</strong>');
    });

    it('converts italic markdown', () => {
        const result = submissionService.processContentForPreview('*itálico*');
        expect(result).toContain('<em>itálico</em>');
    });

    it('wraps content in paragraph tags', () => {
        const result = submissionService.processContentForPreview('texto');
        expect(result).toMatch(/^<p>.*<\/p>$/);
    });

    it('truncates content longer than 2000 chars', () => {
        const longContent = 'a'.repeat(3000);
        const result = submissionService.processContentForPreview(longContent);
        expect(result.length).toBeLessThanOrEqual(2010); // 2000 + "..."
        expect(result).toContain('...');
    });
});

// ─── createSubmission ─────────────────────────────────────────────────────────

describe('SubmissionService.createSubmission', () => {
    beforeEach(() => jest.clearAllMocks());

    it('creates submission and returns row from DB', async () => {
        const newRow = { id: 'new-id', title: 'Artigo', author_email: 'a@b.com', token: 'tok' };
        mockClient.query
            .mockResolvedValueOnce({ rows: [newRow] })      // INSERT submission
            .mockResolvedValueOnce({ rows: [{ next_version: 1 }] }) // version count
            .mockResolvedValueOnce({ rows: [newRow] });     // INSERT version

        const result = await submissionService.createSubmission(validSubmissionData());

        expect(mockDb.transaction).toHaveBeenCalled();
        expect(result).toMatchObject({ id: 'new-id' });
    });

    it('throws ValidationException for invalid data', async () => {
        await expect(
            submissionService.createSubmission({ author_name: 'X', author_email: 'invalid', title: 'ok' })
        ).rejects.toThrow(ValidationException);
    });

    it('wraps unknown DB errors in DatabaseException', async () => {
        mockClient.query.mockRejectedValueOnce(new Error('connection refused'));

        await expect(
            submissionService.createSubmission(validSubmissionData())
        ).rejects.toThrow(DatabaseException);
    });
});

// ─── getSubmissionById ────────────────────────────────────────────────────────

describe('SubmissionService.getSubmissionById', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns submission when found', async () => {
        const row = completeSubmission();
        mockDb.query.mockResolvedValueOnce({ rows: [row] });

        const result = await submissionService.getSubmissionById('sub-uuid');

        expect(result.found).toBe(true);
        expect(result.submission.id).toBe('sub-uuid');
    });

    it('throws SubmissionNotFoundException when not found', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        await expect(submissionService.getSubmissionById('ghost-id')).rejects.toThrow(SubmissionNotFoundException);
    });

    it('wraps unexpected errors in DatabaseException', async () => {
        mockDb.query.mockRejectedValueOnce(new Error('timeout'));

        await expect(submissionService.getSubmissionById('sub-uuid')).rejects.toThrow(DatabaseException);
    });
});

// ─── getSubmissionByToken ─────────────────────────────────────────────────────
 
describe('SubmissionService.getSubmissionByToken', () => {
    beforeEach(() => jest.clearAllMocks());
 
    it('throws InvalidTokenException when token is invalid', async () => {
        mockTokenService.validateToken.mockResolvedValueOnce({ isValid: false, reason: 'INVALID' });
 
        await expect(submissionService.getSubmissionByToken('bad-token')).rejects.toThrow(InvalidTokenException);
    });
 
    it('throws TokenExpiredException when token is expired', async () => {
        mockTokenService.validateToken.mockResolvedValueOnce({ isValid: false, reason: 'TOKEN_EXPIRED' });
 
        await expect(submissionService.getSubmissionByToken('expired')).rejects.toThrow(TokenExpiredException);
    });
 
    it('wraps SubmissionNotFoundException in DatabaseException when submission missing', async () => {
        // The catch block in getSubmissionByToken only re-throws TokenExpiredException and
        // InvalidTokenException directly — SubmissionNotFoundException gets wrapped in DatabaseException
        mockTokenService.validateToken.mockResolvedValueOnce({ isValid: true, submission: null, tokenInfo: {} });
 
        await expect(submissionService.getSubmissionByToken('tok')).rejects.toThrow(DatabaseException);
    });
 
    it('returns submission and tokenInfo on success', async () => {
        const sub = completeSubmission();
        mockTokenService.validateToken.mockResolvedValueOnce({ isValid: true, submission: sub, tokenInfo: { expires: new Date() } });
        mockDb.query
            .mockResolvedValueOnce({ rows: [] })   // attachments
            .mockResolvedValueOnce({ rows: [] });  // feedback
 
        const result = await submissionService.getSubmissionByToken('valid-token');
 
        expect(result.found).toBe(true);
        expect(result.submission.id).toBe('sub-uuid');
        expect(result.tokenInfo).toBeDefined();
    });
 
    it('fetches versions when includeVersions=true', async () => {
        const sub = completeSubmission();
        mockTokenService.validateToken.mockResolvedValueOnce({ isValid: true, submission: sub, tokenInfo: {} });
        mockDb.query
            .mockResolvedValueOnce({ rows: [] })     // attachments
            .mockResolvedValueOnce({ rows: [{ version_number: 1 }] }) // versions
            .mockResolvedValueOnce({ rows: [] });    // feedback
 
        const result = await submissionService.getSubmissionByToken('valid-token', true);
 
        expect(result.submission.versions).toHaveLength(1);
    });
});


// ─── submitForReview ──────────────────────────────────────────────────────────

describe('SubmissionService.submitForReview', () => {
    beforeEach(() => jest.clearAllMocks());

    it('throws SubmissionNotFoundException when submission missing', async () => {
        mockDb.findById.mockResolvedValueOnce(null);

        await expect(submissionService.submitForReview('ghost', 'a@b.com')).rejects.toThrow(SubmissionNotFoundException);
    });

    it('throws InvalidStatusException when status is UNDER_REVIEW', async () => {
        mockDb.findById.mockResolvedValueOnce(completeSubmission({ status: 'UNDER_REVIEW' }));

        await expect(submissionService.submitForReview('sub-1', 'a@b.com')).rejects.toThrow(InvalidStatusException);
    });

    it('throws IncompleteSubmissionException when submission is incomplete', async () => {
        mockDb.findById.mockResolvedValueOnce(completeSubmission({ summary: null }));

        await expect(submissionService.submitForReview('sub-1', 'a@b.com')).rejects.toThrow(IncompleteSubmissionException);
    });

    it('updates status to SUBMITTED for valid complete submission', async () => {
        const sub = completeSubmission();
        mockDb.findById.mockResolvedValueOnce(sub);

        const updatedRow = { ...sub, status: 'SUBMITTED', submitted_at: new Date() };
        mockClient.query
            .mockResolvedValueOnce({ rows: [updatedRow] })              // UPDATE status
            .mockResolvedValueOnce({ rows: [{ next_version: 2 }] })    // version count
            .mockResolvedValueOnce({ rows: [updatedRow] })              // INSERT version
            .mockResolvedValueOnce({ rows: [{ email: 'admin@enc.com' }] }); // admins

        const result = await submissionService.submitForReview('sub-uuid', 'a@b.com');

        expect(result.status).toBe('SUBMITTED');
    });
});

// ─── addAttachment ────────────────────────────────────────────────────────────

describe('SubmissionService.addAttachment', () => {
    beforeEach(() => jest.clearAllMocks());

    const attachmentData = {
        filename: 'doc.pdf',
        url: 'https://storage/doc.pdf',
        file_type: 'application/pdf',
        size: 1024,
    };

    it('throws AttachmentLimitException when limit reached', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [{ count: '5' }] }); // already at 5

        await expect(submissionService.addAttachment('sub-1', attachmentData)).rejects.toThrow(AttachmentLimitException);
    });

    it('inserts attachment and returns row', async () => {
        const row = { id: 'att-1', ...attachmentData, submission_id: 'sub-1' };
        mockDb.query
            .mockResolvedValueOnce({ rows: [{ count: '2' }] })  // current count
            .mockResolvedValueOnce({ rows: [row] });             // INSERT

        const result = await submissionService.addAttachment('sub-1', attachmentData);
        expect(result.id).toBe('att-1');
    });
});

// ─── removeAttachment ─────────────────────────────────────────────────────────

describe('SubmissionService.removeAttachment', () => {
    beforeEach(() => jest.clearAllMocks());

    it('throws AttachmentNotFoundException when attachment not found', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        await expect(submissionService.removeAttachment('sub-1', 'att-ghost')).rejects.toThrow(AttachmentNotFoundException);
    });

    it('removes attachment and returns success', async () => {
        const att = { id: 'att-1', filename: 'doc.pdf' };
        mockDb.query
            .mockResolvedValueOnce({ rows: [att] })   // SELECT
            .mockResolvedValueOnce({ rows: [] });      // DELETE

        const result = await submissionService.removeAttachment('sub-1', 'att-1');
        expect(result.success).toBe(true);
        expect(result.removedAttachment.id).toBe('att-1');
    });
});

// ─── listSubmissions ──────────────────────────────────────────────────────────

describe('SubmissionService.listSubmissions', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns paginated submissions without filters', async () => {
        mockDb.query
            .mockResolvedValueOnce({ rows: [{ count: '2' }] })
            .mockResolvedValueOnce({ rows: [{ id: '1' }, { id: '2' }] });

        const result = await submissionService.listSubmissions();

        expect(result.submissions).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
    });

    it('applies DRAFT filter correctly', async () => {
        mockDb.query
            .mockResolvedValueOnce({ rows: [{ count: '1' }] })
            .mockResolvedValueOnce({ rows: [{ id: '1', status: 'DRAFT' }] });

        const result = await submissionService.listSubmissions(undefined, 'DRAFT');
        expect(result.submissions[0].status).toBe('DRAFT');
    });

    it('calculates pagination correctly', async () => {
        mockDb.query
            .mockResolvedValueOnce({ rows: [{ count: '25' }] })
            .mockResolvedValueOnce({ rows: Array(10).fill({ id: '1' }) });

        const result = await submissionService.listSubmissions(undefined, undefined, { top: 10, skip: 10 });

        expect(result.pagination.totalPages).toBe(3);
        expect(result.pagination.hasPrev).toBe(true);
        expect(result.pagination.hasNext).toBe(true);
        expect(result.pagination.page).toBe(2);
    });

    it('wraps errors in DatabaseException', async () => {
        mockDb.query.mockRejectedValueOnce(new Error('DB error'));

        await expect(submissionService.listSubmissions()).rejects.toThrow(DatabaseException);
    });
});

// ─── listSubmissionsWithFuzzy ─────────────────────────────────────────────────

describe('SubmissionService.listSubmissionsWithFuzzy', () => {
    beforeEach(() => jest.clearAllMocks());

    it('throws ValidationException for empty search term', async () => {
        await expect(submissionService.listSubmissionsWithFuzzy('')).rejects.toThrow(ValidationException);
    });

    it('returns results with metadata', async () => {
        const rows = [{ id: '1', title: 'Clima', relevance_score: 1.0, match_type: 'exact', result_source: 'exact', status: 'PUBLISHED', category: 'ciência', created_at: new Date(), updated_at: new Date(), expires_at: new Date(), feedback_count: '0' }];
        mockDb.query
            .mockResolvedValueOnce({ rows })
            .mockResolvedValueOnce({ rows: [{ exact_count: '1', fuzzy_count: '0', total_count: '1' }] });

        const result = await submissionService.listSubmissionsWithFuzzy('clima');

        expect(result.submissions).toHaveLength(1);
        expect(result.metadata.exactCount).toBe(1);
        expect(result.metadata.fuzzyCount).toBe(0);
        expect(result.metadata.searchType).toBe('fuzzy');
    });

    it('wraps DB errors in DatabaseException', async () => {
        mockDb.query.mockRejectedValueOnce(new Error('pg error'));

        await expect(submissionService.listSubmissionsWithFuzzy('busca')).rejects.toThrow(DatabaseException);
    });
});

// ─── getSubmissionsByAuthor ───────────────────────────────────────────────────

describe('SubmissionService.getSubmissionsByAuthor', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns submissions and pagination', async () => {
        mockDb.query
            .mockResolvedValueOnce({ rows: [{ id: '1' }] })
            .mockResolvedValueOnce({ rows: [{ count: '1' }] });

        const result = await submissionService.getSubmissionsByAuthor('a@b.com');

        expect(result.submissions).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
    });
});

// ─── getInProgressSubmissionsByAuthor ────────────────────────────────────────

describe('SubmissionService.getInProgressSubmissionsByAuthor', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns only DRAFT and CHANGES_REQUESTED submissions', async () => {
        const rows = [{ id: '1', status: 'DRAFT' }, { id: '2', status: 'CHANGES_REQUESTED' }];
        mockDb.query.mockResolvedValueOnce({ rows });

        const result = await submissionService.getInProgressSubmissionsByAuthor('a@b.com');

        expect(result.submissions).toHaveLength(2);
        expect(result.pagination.hasNext).toBe(false);
        expect(result.pagination.hasPrev).toBe(false);
    });
});