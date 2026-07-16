// @ts-nocheck

const { validationResult } = require('express-validator');
const submissionController = require('../../controllers/submission').default || require('../../controllers/submission');
const submissionService = require('../../services/submission').default || require('../../services/submission');
const emailService = require('../../services/email').default || require('../../services/email');
const responses = require('../../utils/responses').default || require('../../utils/responses');
const { handleControllerError } = require('../../utils/errorHandler');

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('express-validator', () => ({
    validationResult: jest.fn(),
}));

jest.mock('../../services/submission', () => ({
    createSubmission: jest.fn(),
    getSubmissionById: jest.fn(),
    getSubmissionByToken: jest.fn(),
    updateSubmission: jest.fn(),
    submitForReview: jest.fn(),
    generatePreview: jest.fn(),
    getSubmissionStats: jest.fn(),
    getSubmissionsByAuthor: jest.fn(),
    getInProgressSubmissionsByAuthor: jest.fn(),
    listSubmissions: jest.fn(),
    listSubmissionsWithFuzzy: jest.fn(),
}));

jest.mock('../../services/email', () => ({
    sendSubmissionAccessLinks: jest.fn(),
}));

jest.mock('../../utils/responses', () => ({
    created: jest.fn(),
    success: jest.fn(),
    badRequest: jest.fn(),
    notFound: jest.fn(),
    updated: jest.fn(),
}));

jest.mock('../../utils/errorHandler', () => ({
    handleControllerError: jest.fn(),
}));

jest.mock('../../middleware/logging', () => ({
    audit: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockReq = (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    ip: '127.0.0.1',
    ...overrides,
});

const mockRes = () => ({});
const mockNext = jest.fn();

const noValidationErrors = () =>
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

const withValidationErrors = (errors= [{ msg: 'invalid' }]) =>
    validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });

// ─── createSubmission ─────────────────────────────────────────────────────────

describe('SubmissionController.createSubmission', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.FRONTEND_URL = 'https://example.com';
    });

    it('returns 400 when validation fails', async () => {
        withValidationErrors([{ msg: 'título obrigatório' }]);
        const req = mockReq({ body: { author_email: 'a@b.com', title: 'x' } });
        const res = mockRes();

        await submissionController.createSubmission(req, res, mockNext);

        expect(responses.badRequest).toHaveBeenCalledWith(res, 'Dados inválidos', expect.any(Array));
        expect(submissionService.createSubmission).not.toHaveBeenCalled();
    });

    it('creates submission and returns 201 on success', async () => {
        noValidationErrors();

        const fakeSubmission = {
            id: 'uuid-1',
            token: 'tok-abc',
            title: 'Meu Artigo',
            status: 'DRAFT',
            author_name: 'Ana',
            author_email: 'ana@email.com',
            created_at: new Date(),
            expires_at: new Date(),
        };

        submissionService.createSubmission.mockResolvedValue(fakeSubmission);

        const req = mockReq({ body: { author_name: 'Ana', author_email: 'ana@email.com', title: 'Meu Artigo' } });
        const res = mockRes();

        await submissionController.createSubmission(req, res, mockNext);

        expect(submissionService.createSubmission).toHaveBeenCalledWith(req.body);
        expect(responses.created).toHaveBeenCalledWith(
            res,
            expect.objectContaining({
                submission: expect.objectContaining({ id: 'uuid-1', token: 'tok-abc' }),
                accessUrl: expect.stringContaining('tok-abc'),
            }),
            'Submissão criada com sucesso'
        );
    });

    it('calls handleControllerError on service failure', async () => {
        noValidationErrors();
        const error = new Error('DB down');
        submissionService.createSubmission.mockRejectedValue(error);

        const req = mockReq({ body: { author_email: 'a@b.com', title: 'Título' } });
        const res = mockRes();

        await submissionController.createSubmission(req, res, mockNext);

        expect(handleControllerError).toHaveBeenCalledWith(error, res, mockNext, expect.any(Object));
    });
});

// ─── getSubmissionById ────────────────────────────────────────────────────────

describe('SubmissionController.getSubmissionById', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 400 for invalid UUID', async () => {
        const req = mockReq({ params: { id: 'not-a-uuid' } });
        const res = mockRes();

        await submissionController.getSubmissionById(req, res, mockNext);

        expect(responses.badRequest).toHaveBeenCalledWith(res, 'ID inválido', expect.any(Array));
        expect(submissionService.getSubmissionById).not.toHaveBeenCalled();
    });

    it('returns submission data for valid UUID', async () => {
        const validId = '550e8400-e29b-41d4-a716-446655440000';
        const fakeResult = {
            submission: {
                id: validId,
                status: 'DRAFT',
                feedback: [],
            },
        };

        submissionService.getSubmissionById.mockResolvedValue(fakeResult);

        const req = mockReq({ params: { id: validId }, query: {} });
        const res = mockRes();

        await submissionController.getSubmissionById(req, res, mockNext);

        expect(submissionService.getSubmissionById).toHaveBeenCalledWith(validId, false);
        expect(responses.success).toHaveBeenCalledWith(
            res,
            expect.objectContaining({
                submission: expect.any(Object),
                canEdit: true,
                canSubmitForReview: true,
            }),
            'Submissão encontrada'
        );
    });

    it('sets canEdit=false when status is UNDER_REVIEW', async () => {
        const validId = '550e8400-e29b-41d4-a716-446655440000';
        submissionService.getSubmissionById.mockResolvedValue({
            submission: { id: validId, status: 'UNDER_REVIEW', feedback: [] },
        });

        const req = mockReq({ params: { id: validId }, query: {} });
        const res = mockRes();

        await submissionController.getSubmissionById(req, res, mockNext);

        expect(responses.success).toHaveBeenCalledWith(
            res,
            expect.objectContaining({ canEdit: false, canSubmitForReview: false }),
            expect.any(String)
        );
    });

    it('passes include_versions=true to service', async () => {
        const validId = '550e8400-e29b-41d4-a716-446655440000';
        submissionService.getSubmissionById.mockResolvedValue({
            submission: { id: validId, status: 'DRAFT', feedback: [] },
        });

        const req = mockReq({ params: { id: validId }, query: { include_versions: 'true' } });
        const res = mockRes();

        await submissionController.getSubmissionById(req, res, mockNext);

        expect(submissionService.getSubmissionById).toHaveBeenCalledWith(validId, true);
    });

    it('calls handleControllerError on service failure', async () => {
        const validId = '550e8400-e29b-41d4-a716-446655440000';
        const error = new Error('not found');
        submissionService.getSubmissionById.mockRejectedValue(error);

        const req = mockReq({ params: { id: validId }, query: {} });
        const res = mockRes();

        await submissionController.getSubmissionById(req, res, mockNext);

        expect(handleControllerError).toHaveBeenCalledWith(error, res, mockNext, expect.any(Object));
    });
});

// ─── submitForReview ──────────────────────────────────────────────────────────

describe('SubmissionController.submitForReview', () => {
    beforeEach(() => jest.clearAllMocks());

    it('calls service and returns success response', async () => {
        const fakeSubmission = { id: 'sub-1', status: 'UNDER_REVIEW', submitted_at: new Date(), title: 'Art.' };
        submissionService.submitForReview.mockResolvedValue(fakeSubmission);

        const req = mockReq({
            submission: { id: 'sub-1' },
            authorEmail: 'a@b.com',
            params: { token: 'tok-abc-123' },
        });
        const res = mockRes();

        await submissionController.submitForReview(req, res, mockNext);

        expect(submissionService.submitForReview).toHaveBeenCalledWith('sub-1', 'a@b.com');
        expect(responses.success).toHaveBeenCalledWith(
            res,
            expect.objectContaining({ submission: expect.objectContaining({ status: 'UNDER_REVIEW' }) }),
            'Submissão enviada para revisão com sucesso'
        );
    });

    it('calls handleControllerError on failure', async () => {
        const error = new Error('incomplete');
        submissionService.submitForReview.mockRejectedValue(error);

        const req = mockReq({ submission: { id: 'sub-1' }, authorEmail: 'a@b.com', params: { token: 'tok-abc' } });
        const res = mockRes();

        await submissionController.submitForReview(req, res, mockNext);

        expect(handleControllerError).toHaveBeenCalledWith(error, res, mockNext, expect.any(Object));
    });
});

// ─── listSubmissions ──────────────────────────────────────────────────────────

describe('SubmissionController.listSubmissions', () => {
    beforeEach(() => jest.clearAllMocks());

    const fakeResult = {
        submissions: [{ id: '1', title: 'A' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    };

    it('calls service with default params and returns success', async () => {
        submissionService.listSubmissions.mockResolvedValue(fakeResult);

        const req = mockReq({ query: {} });
        const res = mockRes();

        await submissionController.listSubmissions(req, res, mockNext);

        expect(submissionService.listSubmissions).toHaveBeenCalledWith(undefined, undefined, { top: 10, skip: 0 });
        expect(responses.success).toHaveBeenCalledWith(res, expect.objectContaining({ submissions: expect.any(Array) }), expect.any(String));
    });

    it('passes search term and state filter', async () => {
        submissionService.listSubmissions.mockResolvedValue(fakeResult);

        const req = mockReq({ query: { search: 'clima', requestedState: 'DRAFT', top: '5', skip: '10' } });
        const res = mockRes();

        await submissionController.listSubmissions(req, res, mockNext);

        expect(submissionService.listSubmissions).toHaveBeenCalledWith('clima', 'DRAFT', { top: 5, skip: 10 });
    });

    it('ignores invalid requestedState', async () => {
        submissionService.listSubmissions.mockResolvedValue(fakeResult);

        const req = mockReq({ query: { requestedState: 'INVALID' } });
        const res = mockRes();

        await submissionController.listSubmissions(req, res, mockNext);

        expect(submissionService.listSubmissions).toHaveBeenCalledWith(undefined, undefined, expect.any(Object));
    });

    it('accepts BOTH as a valid state', async () => {
        submissionService.listSubmissions.mockResolvedValue(fakeResult);

        const req = mockReq({ query: { requestedState: 'BOTH' } });
        const res = mockRes();

        await submissionController.listSubmissions(req, res, mockNext);

        expect(submissionService.listSubmissions).toHaveBeenCalledWith(undefined, 'BOTH', expect.any(Object));
    });
});

// ─── searchSubmissionsFuzzy ───────────────────────────────────────────────────

describe('SubmissionController.searchSubmissionsFuzzy', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 400 when search term is missing', async () => {
        const req = mockReq({ query: {} });
        const res = mockRes();

        await submissionController.searchSubmissionsFuzzy(req, res, mockNext);

        expect(responses.badRequest).toHaveBeenCalledWith(res, expect.stringContaining('obrigatório'), expect.any(Array));
        expect(submissionService.listSubmissionsWithFuzzy).not.toHaveBeenCalled();
    });

    it('returns 400 when search term is only whitespace', async () => {
        const req = mockReq({ query: { search: '   ' } });
        const res = mockRes();

        await submissionController.searchSubmissionsFuzzy(req, res, mockNext);

        expect(responses.badRequest).toHaveBeenCalled();
    });

    it('returns 400 when threshold is out of range', async () => {
        const req = mockReq({ query: { search: 'clima', threshold: '1.5' } });
        const res = mockRes();

        await submissionController.searchSubmissionsFuzzy(req, res, mockNext);

        expect(responses.badRequest).toHaveBeenCalledWith(res, expect.stringContaining('similaridade'), expect.any(Array));
    });

    it('returns 400 when threshold is below minimum', async () => {
        const req = mockReq({ query: { search: 'clima', threshold: '0.01' } });
        const res = mockRes();

        await submissionController.searchSubmissionsFuzzy(req, res, mockNext);

        expect(responses.badRequest).toHaveBeenCalled();
    });

    it('calls service with correct params and returns results', async () => {
        const fakeResult = {
            submissions: [{ id: '1', title: 'Clima Global' }],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
            metadata: { exactCount: 1, fuzzyCount: 0, avgRelevance: 1.0, searchType: 'fuzzy' },
        };
        submissionService.listSubmissionsWithFuzzy.mockResolvedValue(fakeResult);

        const req = mockReq({ query: { search: 'clima', threshold: '0.2', top: '5', skip: '0' } });
        const res = mockRes();

        await submissionController.searchSubmissionsFuzzy(req, res, mockNext);

        expect(submissionService.listSubmissionsWithFuzzy).toHaveBeenCalledWith('clima', 0.2, { top: 5, skip: 0 });
        expect(responses.success).toHaveBeenCalledWith(
            res,
            expect.objectContaining({
                searchMetadata: expect.objectContaining({ searchTerm: 'clima', searchType: 'fuzzy' }),
            }),
            expect.stringContaining('resultado')
        );
    });

    it('includes tips when only fuzzy matches are found', async () => {
        const fakeResult = {
            submissions: [{ id: '2', title: 'Klima' }],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
            metadata: { exactCount: 0, fuzzyCount: 1, avgRelevance: 0.6, searchType: 'fuzzy' },
        };
        submissionService.listSubmissionsWithFuzzy.mockResolvedValue(fakeResult);

        const req = mockReq({ query: { search: 'klima' } });
        const res = mockRes();

        await submissionController.searchSubmissionsFuzzy(req, res, mockNext);

        expect(responses.success).toHaveBeenCalledWith(
            res,
            expect.objectContaining({ tips: expect.any(Array) }),
            expect.any(String)
        );
    });

    it('does not include tips when exact matches exist', async () => {
        const fakeResult = {
            submissions: [{ id: '1', title: 'Clima' }],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
            metadata: { exactCount: 1, fuzzyCount: 0, avgRelevance: 1.0, searchType: 'fuzzy' },
        };
        submissionService.listSubmissionsWithFuzzy.mockResolvedValue(fakeResult);

        const req = mockReq({ query: { search: 'clima' } });
        const res = mockRes();

        await submissionController.searchSubmissionsFuzzy(req, res, mockNext);

        expect(responses.success).toHaveBeenCalledWith(
            res,
            expect.objectContaining({ tips: undefined }),
            expect.any(String)
        );
    });
});

// ─── checkInProgressArticles ──────────────────────────────────────────────────

describe('SubmissionController.checkInProgressArticles', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 400 on validation errors', async () => {
        withValidationErrors();
        const req = mockReq({ body: {} });
        const res = mockRes();

        await submissionController.checkInProgressArticles(req, res, mockNext);

        expect(responses.badRequest).toHaveBeenCalled();
        expect(submissionService.getInProgressSubmissionsByAuthor).not.toHaveBeenCalled();
    });

    it('returns 404 when no in-progress articles found', async () => {
        noValidationErrors();
        submissionService.getInProgressSubmissionsByAuthor.mockResolvedValue({
            submissions: [],
        });

        const req = mockReq({ body: { email: 'a@b.com' } });
        const res = mockRes();

        await submissionController.checkInProgressArticles(req, res, mockNext);

        expect(responses.notFound).toHaveBeenCalledWith(res, expect.any(String));
    });

    it('returns success and triggers async email when articles found', async () => {
        noValidationErrors();
        jest.useFakeTimers();

        submissionService.getInProgressSubmissionsByAuthor.mockResolvedValue({
            submissions: [{ id: 'sub-1', title: 'Draft 1' }],
        });
        emailService.sendSubmissionAccessLinks.mockResolvedValue(undefined);

        const req = mockReq({ body: { email: 'a@b.com' } });
        const res = mockRes();

        await submissionController.checkInProgressArticles(req, res, mockNext);

        expect(responses.success).toHaveBeenCalledWith(
            res,
            expect.objectContaining({ count: 1, message: expect.stringContaining('a@b.com') })
        );

        jest.runAllTimers();
        jest.useRealTimers();
    });
});

// ─── autoSave ─────────────────────────────────────────────────────────────────

describe('SubmissionController.autoSave', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns autoSaved=true on success', async () => {
        const updated = { updated_at: new Date() };
        submissionService.updateSubmission.mockResolvedValue(updated);

        const req = mockReq({
            body: { title: 'Draft' },
            submission: { id: 'sub-1', author_email: 'a@b.com' },
        });
        const res = mockRes();

        await submissionController.autoSave(req, res, mockNext);

        expect(responses.success).toHaveBeenCalledWith(
            res,
            expect.objectContaining({ autoSaved: true, message: expect.any(String) })
        );
    });

    it('returns autoSaved=false without throwing when service fails', async () => {
        submissionService.updateSubmission.mockRejectedValue(new Error('timeout'));

        const req = mockReq({
            body: {},
            submission: { id: 'sub-1', author_email: 'a@b.com' },
        });
        const res = mockRes();

        await submissionController.autoSave(req, res, mockNext);

        expect(responses.success).toHaveBeenCalledWith(
            res,
            expect.objectContaining({ autoSaved: false, message: expect.any(String) })
        );
        expect(handleControllerError).not.toHaveBeenCalled();
    });
});