/**
 * Testes para AdminReviewValidators
 */
const { validationResult } = require('express-validator');
const adminReviewModule = require('../../validators/adminReview');
const adminReviewValidators = adminReviewModule.default || adminReviewModule;

async function runValidation(validations, req) {
    await Promise.all(validations.map((validation) => validation.run(req)));
}

function buildReq({ params = {}, body = {}, query = {} } = {}) {
    return { params, body, query };
}

// Uma função para observabilidade: Se houver erros, ela os imprime no console
function assertNoErrors(req) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error('\n🔴 Erros de validação encontrados no cenário de SUCESSO:', JSON.stringify(errors.array(), null, 2));
    }
    expect(errors.isEmpty()).toBe(true);
}

describe('AdminReviewValidators', () => {
    // Um UUID v4 genuíno e aleatório (não reservado)
    const VALID_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    
    describe('validateReviewSubmission', () => {
        test('deve passar com dados válidos', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { status: 'approved', notes: 'Notas', rejectionReason: 'Motivo' }
            });

            await runValidation(adminReviewValidators.validateReviewSubmission, req);
            assertNoErrors(req);
        });

        test('deve falhar quando id não é UUID', async () => {
            const req = buildReq({ params: { id: 'invalido' }, body: { status: 'approved' } });
            await runValidation(adminReviewValidators.validateReviewSubmission, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'ID da submissão deve ser um UUID válido')).toBe(true);
        });

        test('deve falhar quando status é inválido', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { status: 'invalid_status' }
            });
            await runValidation(adminReviewValidators.validateReviewSubmission, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Status de revisão inválido')).toBe(true);
        });

        test('deve falhar quando notes excede o limite', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { status: 'approved', notes: 'a'.repeat(2001) }
            });
            await runValidation(adminReviewValidators.validateReviewSubmission, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg.includes('2000 caracteres'))).toBe(true);
        });

        test('deve falhar quando rejectionReason excede o limite', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { status: 'rejected', rejectionReason: 'a'.repeat(501) }
            });
            await runValidation(adminReviewValidators.validateReviewSubmission, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg.includes('500 caracteres'))).toBe(true);
        });
    });

    describe('validateSendFeedback', () => {
        test('deve passar com dados válidos', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { content: 'Este é um feedback válido', isPublic: true }
            });

            await runValidation(adminReviewValidators.validateSendFeedback, req);
            assertNoErrors(req);
        });

        test('deve falhar quando content é muito curto', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { content: 'curto' }
            });
            await runValidation(adminReviewValidators.validateSendFeedback, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg.includes('entre 10 e 2000 caracteres'))).toBe(true);
        });

        test('deve falhar quando content é muito longo', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { content: 'a'.repeat(2001) }
            });
            await runValidation(adminReviewValidators.validateSendFeedback, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg.includes('entre 10 e 2000 caracteres'))).toBe(true);
        });

        test('deve falhar quando isPublic não é booleano', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { content: 'Feedback válido para o autor', isPublic: 'not-a-boolean' }
            });
            await runValidation(adminReviewValidators.validateSendFeedback, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'isPublic deve ser um valor booleano')).toBe(true);
        });
    });

    describe('validatePublishSubmission', () => {
        test('deve passar com dados válidos', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: {
                    publishNotes: 'Notas',
                    scheduledFor: new Date(Date.now() + 86400000).toISOString(),
                    categoryOverride: 'artigo-especial',
                    keywordsOverride: ['k1', 'k2'],
                    depositToZenodo: true
                }
            });

            await runValidation(adminReviewValidators.validatePublishSubmission, req);
            assertNoErrors(req);
        });

        test('deve falhar quando scheduledFor está no passado', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { scheduledFor: new Date(Date.now() - 86400000).toISOString() }
            });
            await runValidation(adminReviewValidators.validatePublishSubmission, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Data de agendamento deve ser futura')).toBe(true);
        });

        test('deve falhar quando scheduledFor não é uma data válida', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { scheduledFor: 'data-invalida' }
            });
            await runValidation(adminReviewValidators.validatePublishSubmission, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Data de agendamento deve ser uma data válida')).toBe(true);
        });

        test('deve falhar quando keywordsOverride não é array', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { keywordsOverride: 'not-an-array' }
            });
            await runValidation(adminReviewValidators.validatePublishSubmission, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Keywords devem ser um array')).toBe(true);
        });

        test('deve falhar quando keywordsOverride excede 10 itens', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { keywordsOverride: Array(11).fill('k') }
            });
            await runValidation(adminReviewValidators.validatePublishSubmission, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Máximo de 10 keywords permitidas')).toBe(true);
        });

        test('deve falhar quando categoryOverride excede o limite', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { categoryOverride: 'a'.repeat(101) }
            });
            await runValidation(adminReviewValidators.validatePublishSubmission, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg.includes('100 caracteres'))).toBe(true);
        });

        test('deve falhar quando depositToZenodo não é booleano', async () => {
            const req = buildReq({
                params: { id: VALID_UUID },
                body: { depositToZenodo: 'not-a-boolean' }
            });
            await runValidation(adminReviewValidators.validatePublishSubmission, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'depositToZenodo deve ser um valor booleano')).toBe(true);
        });
    });

    describe('validateSearchSubmissions', () => {
        test('deve passar com dados válidos', async () => {
            const req = buildReq({
                query: { q: 'termo de busca', status: 'DRAFT,APPROVED', category: 'article' }
            });

            await runValidation(adminReviewValidators.validateSearchSubmissions, req);
            assertNoErrors(req);
        });

        test('deve falhar quando q é muito curto', async () => {
            const req = buildReq({ query: { q: 'a' } });
            await runValidation(adminReviewValidators.validateSearchSubmissions, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg.includes('entre 2 e 100 caracteres'))).toBe(true);
        });

        test('deve falhar quando status contém valor inválido', async () => {
            const req = buildReq({ query: { q: 'termo válido', status: 'INVALID_STATUS' } });
            await runValidation(adminReviewValidators.validateSearchSubmissions, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Status inválido fornecido')).toBe(true);
        });

        test('deve falhar quando category excede o limite', async () => {
            const req = buildReq({ query: { q: 'termo válido', category: 'a'.repeat(201) } });
            await runValidation(adminReviewValidators.validateSearchSubmissions, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Filtro de categoria muito longo')).toBe(true);
        });
    });

    describe('validateSubmissionFilters', () => {
        test('deve passar com dados válidos', async () => {
            const req = buildReq({
                query: {
                    status: ['PENDING', 'APPROVED'],
                    category: ['article'],
                    authorEmail: 'author@example.com',
                    adminId: VALID_UUID,
                    dateFrom: '2025-01-01',
                    dateTo: '2025-07-01',
                    search: 'termo',
                    expiringDays: '10',
                    hasFiles: 'true',
                    sortBy: 'created_at',
                    sortOrder: 'asc',
                    page: '1',
                    limit: '20'
                }
            });

            await runValidation(adminReviewValidators.validateSubmissionFilters, req);
            assertNoErrors(req);
        });

        test('deve falhar quando status inválido', async () => {
            const req = buildReq({ query: { status: 'INVALID' } });
            await runValidation(adminReviewValidators.validateSubmissionFilters, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Status inválido fornecido')).toBe(true);
        });

        test('deve falhar quando authorEmail é inválido', async () => {
            const req = buildReq({ query: { authorEmail: 'not-an-email' } });
            await runValidation(adminReviewValidators.validateSubmissionFilters, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Email do autor deve ser válido')).toBe(true);
        });

        test('deve falhar quando adminId não é UUID', async () => {
            const req = buildReq({ query: { adminId: 'nao-uuid' } });
            await runValidation(adminReviewValidators.validateSubmissionFilters, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'ID do admin deve ser um UUID válido')).toBe(true);
        });

        test('deve falhar quando dateTo é anterior a dateFrom', async () => {
            const req = buildReq({ query: { dateFrom: '2025-07-01', dateTo: '2025-01-01' } });
            await runValidation(adminReviewValidators.validateSubmissionFilters, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Data final deve ser posterior à data inicial')).toBe(true);
        });

        test('deve falhar quando expiringDays fora do intervalo', async () => {
            const req = buildReq({ query: { expiringDays: '400' } });
            await runValidation(adminReviewValidators.validateSubmissionFilters, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg.includes('entre 1 e 365'))).toBe(true);
        });

        test('deve falhar quando sortBy é inválido', async () => {
            const req = buildReq({ query: { sortBy: 'invalid_field' } });
            await runValidation(adminReviewValidators.validateSubmissionFilters, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Campo de ordenação inválido')).toBe(true);
        });

        test('deve falhar quando sortOrder é inválido', async () => {
            const req = buildReq({ query: { sortOrder: 'invalid_order' } });
            await runValidation(adminReviewValidators.validateSubmissionFilters, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Ordem de classificação deve ser asc ou desc')).toBe(true);
        });

        test('deve falhar quando page não é positivo', async () => {
            const req = buildReq({ query: { page: '0' } });
            await runValidation(adminReviewValidators.validateSubmissionFilters, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Página deve ser um número positivo')).toBe(true);
        });

        test('deve falhar quando limit fora do intervalo', async () => {
            const req = buildReq({ query: { limit: '500' } });
            await runValidation(adminReviewValidators.validateSubmissionFilters, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Limite deve ser entre 1 e 100')).toBe(true);
        });
    });

    describe('validateBulkAction', () => {
        test('deve passar com dados válidos', async () => {
            const req = buildReq({
                body: {
                    submissionIds: [VALID_UUID],
                    action: 'approve',
                    reason: 'Motivo',
                    notes: 'Notas'
                }
            });

            await runValidation(adminReviewValidators.validateBulkAction, req);
            assertNoErrors(req);
        });

        test('deve falhar quando submissionIds está vazio', async () => {
            const req = buildReq({ body: { submissionIds: [], action: 'approve' } });
            await runValidation(adminReviewValidators.validateBulkAction, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Deve fornecer entre 1 e 50 IDs de submissão')).toBe(true);
        });

        test('deve falhar quando submissionIds excede 50 itens', async () => {
            const req = buildReq({
                body: {
                    submissionIds: Array(51).fill(VALID_UUID),
                    action: 'approve'
                }
            });
            await runValidation(adminReviewValidators.validateBulkAction, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Deve fornecer entre 1 e 50 IDs de submissão')).toBe(true);
        });

        test('deve falhar quando algum ID não é UUID', async () => {
            const req = buildReq({ body: { submissionIds: ['nao-uuid'], action: 'approve' } });
            await runValidation(adminReviewValidators.validateBulkAction, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Cada ID deve ser um UUID válido')).toBe(true);
        });

        test('deve falhar quando action é inválida', async () => {
            const req = buildReq({
                body: { submissionIds: [VALID_UUID], action: 'invalid_action' }
            });
            await runValidation(adminReviewValidators.validateBulkAction, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Ação inválida')).toBe(true);
        });

        test('deve falhar quando reason excede o limite', async () => {
            const req = buildReq({
                body: {
                    submissionIds: [VALID_UUID],
                    action: 'reject',
                    reason: 'a'.repeat(501)
                }
            });
            await runValidation(adminReviewValidators.validateBulkAction, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg.includes('500 caracteres'))).toBe(true);
        });

        test('deve falhar quando notes excede o limite', async () => {
            const req = buildReq({
                body: {
                    submissionIds: [VALID_UUID],
                    action: 'approve',
                    notes: 'a'.repeat(1001)
                }
            });
            await runValidation(adminReviewValidators.validateBulkAction, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg.includes('1000 caracteres'))).toBe(true);
        });
    });

    describe('validateActivityLog', () => {
        test('deve passar com dados válidos', async () => {
            const req = buildReq({
                query: {
                    action: 'review',
                    targetType: 'submission',
                    dateFrom: '2025-01-01',
                    dateTo: '2025-07-01',
                    page: '1',
                    limit: '20'
                }
            });

            await runValidation(adminReviewValidators.validateActivityLog, req);
            assertNoErrors(req);
        });

        test('deve falhar quando action é muito longa', async () => {
            const req = buildReq({ query: { action: 'a'.repeat(51) } });
            await runValidation(adminReviewValidators.validateActivityLog, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Ação muito longa')).toBe(true);
        });

        test('deve falhar quando targetType é inválido', async () => {
            const req = buildReq({ query: { targetType: 'invalid_type' } });
            await runValidation(adminReviewValidators.validateActivityLog, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Tipo de alvo inválido')).toBe(true);
        });

        test('deve falhar quando dateFrom é inválida', async () => {
            const req = buildReq({ query: { dateFrom: 'data-invalida' } });
            await runValidation(adminReviewValidators.validateActivityLog, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Data inicial deve ser uma data válida')).toBe(true);
        });

        test('deve falhar quando page ou limit são inválidos', async () => {
            const req = buildReq({ query: { page: '0', limit: '500' } });
            await runValidation(adminReviewValidators.validateActivityLog, req);
            const errors = validationResult(req);
            expect(errors.array().some((e) => e.msg === 'Página deve ser um número positivo')).toBe(true);
            expect(errors.array().some((e) => e.msg === 'Limite deve ser entre 1 e 100')).toBe(true);
        });
    });

    describe('sanitizers', () => {
        test('sanitizeReviewData deve remover espaços de status e notes', async () => {
            const req = buildReq({ body: { status: '  approved  ', notes: '  notas  ', rejectionReason: '  motivo  ' } });
            await runValidation(adminReviewValidators.sanitizeReviewData, req);
            expect(req.body.status).toBe('approved');
            expect(req.body.notes).toBe('notas');
            expect(req.body.rejectionReason).toBe('motivo');
        });

        test('sanitizeFeedbackData deve limpar content e converter isPublic', async () => {
            const req = buildReq({ body: { content: '  feedback  ', isPublic: 'true' } });
            await runValidation(adminReviewValidators.sanitizeFeedbackData, req);
            expect(req.body.content).toBe('feedback');
            expect(req.body.isPublic).toBe(true);
        });

        test('sanitizePublishData deve limpar campos de texto e converter booleano', async () => {
            const req = buildReq({
                body: {
                    publishNotes: '  notas  ',
                    categoryOverride: '  categoria  ',
                    depositToZenodo: 'false'
                }
            });
            await runValidation(adminReviewValidators.sanitizePublishData, req);
            expect(req.body.publishNotes).toBe('notas');
            expect(req.body.categoryOverride).toBe('categoria');
            expect(req.body.depositToZenodo).toBe(false);
        });

        test('sanitizeSearchData deve limpar query q', async () => {
            const req = buildReq({ query: { q: '  termo  ', status: '  DRAFT  ', category: '  article  ' } });
            await runValidation(adminReviewValidators.sanitizeSearchData, req);
            expect(req.query.q).toBe('termo');
            expect(req.query.status).toBe('DRAFT');
            expect(req.query.category).toBe('article');
        });

        test('sanitizeFilterData deve limpar e normalizar campos de filtro', async () => {
            const req = buildReq({
                query: {
                    status: '  PENDING  ',
                    category: '  article  ',
                    authorEmail: '  Author@Example.com  ',
                    search: '  termo  ',
                    sortBy: '  created_at  ',
                    sortOrder: '  DESC  '
                }
            });
            await runValidation(adminReviewValidators.sanitizeFilterData, req);
            expect(req.query.authorEmail).toBe('author@example.com');
            expect(req.query.sortOrder).toBe('desc');
            expect(req.query.status).toBe('PENDING');
            expect(req.query.category).toBe('article');
            expect(req.query.search).toBe('termo');
            expect(req.query.sortBy).toBe('created_at');
        });
    });
});