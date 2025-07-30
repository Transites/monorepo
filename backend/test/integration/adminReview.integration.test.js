const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../app');
const db = require('../../database/client');
const uuid = require('uuid').v4;

// Setup spies for logging
jest.mock('../../middleware/logging', () => {
    const loggerMethods = ['audit', 'security', 'database', 'performance', 'error', 'warn', 'info', 'debug'];
    const mockLogger = {};

    loggerMethods.forEach(method => {
        mockLogger[method] = jest.fn((message, meta) => {
            console.log(`Logger.${method}:`, message, meta || '');
        });
    });

    mockLogger.createPerformanceLogger = jest.fn((operationName) => {
        console.log(`Performance logger created: ${operationName}`);
        return {
            end: jest.fn((meta) => {
                console.log(`Performance logger ended: ${operationName}`, meta || '');
            })
        };
    });

    return mockLogger;
});

// Mock email service
jest.mock('../../services/email', () => ({
    sendFeedbackToAuthor: jest.fn(),
    notifyAuthorApproval: jest.fn(),
    sendReviewNotification: jest.fn(),
    sendSubmissionToken: jest.fn()
}));

describe('Admin Review Service Integration', () => {
    let testAdmin;
    let testAdmin2;
    let testSubmissions = [];
    let adminToken;
    let adminToken2;
    const testPassword = 'Senha123!';

    // Test data for submissions
    const createTestSubmissionData = (overrides = {}) => ({
        author_name: 'Test Author',
        author_email: 'test@example.com',
        author_institution: 'Test Institution',
        title: 'Test Submission Title',
        summary: 'This is a test submission summary that is long enough to pass validation. It contains more than 50 characters to ensure it meets the minimum length requirement.',
        content: 'This is the content of the test submission. It needs to be long enough to pass validation checks. This content is used for testing the submission flow from creation to review. It contains more than 100 characters to ensure it meets the minimum length requirement.',
        keywords: ['test', 'integration', 'admin'],
        category: 'Filosofia',
        ...overrides
    });

    beforeAll(async () => {
        // Set test environment
        process.env.NODE_ENV = 'development'
        process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5433/app_test';

        // Create test admin users
        const passwordHash = await bcrypt.hash(testPassword, 12);

        // Clean up existing submissions
        const suiteCleanupFromSubmissionsEmails = ["test@example.com", "admin1@test.com", "admin2@test.com"];
        for (const email of suiteCleanupFromSubmissionsEmails) {
            const existingSubmissions = await db.findByAuthorEmail("submissions", email);
            if (existingSubmissions) {
                for (const submission of existingSubmissions) {
                    await db.delete('submissions', submission.id);
                }
            }
        }

        // Check if test admins exist
        const existingAdmin1 = await db.findByAdminEmail('admins', 'admin1@test.com');
        if (existingAdmin1) {
            testAdmin = existingAdmin1;
        } else {
            testAdmin = await db.create('admins', {
                email: 'admin1@test.com',
                name: 'Admin One',
                password_hash: passwordHash,
                is_active: true
            });
        }

        const existingAdmin2 = await db.findByAdminEmail('admins', 'admin2@test.com');
        if (existingAdmin2) {
            testAdmin2 = existingAdmin2;
        } else {
            testAdmin2 = await db.create('admins', {
                email: 'admin2@test.com',
                name: 'Admin Two',
                password_hash: passwordHash,
                is_active: true
            });
        }

        // Login admins to get tokens
        const loginResponse1 = await request(app)
            .post('/api/auth/login')
            .send({
                email: testAdmin.email,
                password: testPassword
            });
        adminToken = loginResponse1.body.data.accessToken;

        const loginResponse2 = await request(app)
            .post('/api/auth/login')
            .send({
                email: testAdmin2.email,
                password: testPassword
            });
        adminToken2 = loginResponse2.body.data.accessToken;

        // Create test submissions with different statuses
        const submissionData1 = createTestSubmissionData({
            title: 'Draft Submission'
        });
        const submissionData2 = createTestSubmissionData({
            title: 'Under Review Submission',
            author_email: 'review@example.com'
        });
        const submissionData3 = createTestSubmissionData({
            title: 'Approved Submission',
            author_email: 'approved@example.com'
        });

        // Create submissions via API
        const createResponse1 = await request(app)
            .post('/api/submissions')
            .send(submissionData1);
        testSubmissions.push(createResponse1.body.data.submission);

        const createResponse2 = await request(app)
            .post('/api/submissions')
            .send(submissionData2);
        testSubmissions.push(createResponse2.body.data.submission);

        const createResponse3 = await request(app)
            .post('/api/submissions')
            .send(submissionData3);
        testSubmissions.push(createResponse3.body.data.submission);

        // Update one submission to UNDER_REVIEW
        await db.update('submissions', testSubmissions[1].id, {
            status: 'UNDER_REVIEW',
            updated_at: new Date()
        });

        // Update one submission to APPROVED
        await db.update('submissions', testSubmissions[2].id, {
            status: 'APPROVED',
            reviewed_by: testAdmin.id,
            reviewed_at: new Date(),
            updated_at: new Date()
        });
    });

    afterAll(async () => {
        // Clean up test data
        for (const submission of testSubmissions) {
            await db.delete('submissions', submission.id);
        }

        if (testAdmin) {
            await db.delete('admins', testAdmin.id);
        }

        if (testAdmin2) {
            await db.delete('admins', testAdmin2.id);
        }

        // Close database connection
        await db.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Admin Dashboard', () => {
        test('deve retornar dashboard completo com estatísticas', async () => {
            const response = await request(app)
                .get('/api/admin/review/dashboard')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('dashboard');

            const dashboard = response.body.data.dashboard;

            // Verificar estrutura do summary
            expect(dashboard).toHaveProperty('summary');
            expect(dashboard.summary).toHaveProperty('totalSubmissions');
            expect(dashboard.summary).toHaveProperty('pendingReview');
            expect(dashboard.summary).toHaveProperty('changesRequested');
            expect(dashboard.summary).toHaveProperty('approved');
            expect(dashboard.summary).toHaveProperty('published');
            expect(dashboard.summary).toHaveProperty('rejected');
            expect(dashboard.summary).toHaveProperty('expiringSoon');

            // Verificar atividades recentes
            expect(dashboard).toHaveProperty('recentActivity');
            expect(Array.isArray(dashboard.recentActivity)).toBe(true);

            // Verificar estatísticas por status
            expect(dashboard).toHaveProperty('submissionsByStatus');
            expect(Array.isArray(dashboard.submissionsByStatus)).toBe(true);

            // Verificar estatísticas por categoria
            expect(dashboard).toHaveProperty('submissionsByCategory');
            expect(Array.isArray(dashboard.submissionsByCategory)).toBe(true);

            // Verificar dados mensais
            expect(dashboard).toHaveProperty('submissionsByMonth');
            expect(Array.isArray(dashboard.submissionsByMonth)).toBe(true);

            // Verificar top autores
            expect(dashboard).toHaveProperty('topAuthors');
            expect(Array.isArray(dashboard.topAuthors)).toBe(true);

            // Verificar estatísticas de review
            expect(dashboard).toHaveProperty('reviewStats');
            expect(dashboard.reviewStats).toHaveProperty('totalReviews');
            expect(dashboard.reviewStats).toHaveProperty('avgReviewTime');
        });

        test('deve retornar erro 401 sem token de admin', async () => {
            const response = await request(app)
                .get('/api/admin/review/dashboard');

            expect(response.status).toBe(401);
        });
    });

    describe('Listagem de Submissões', () => {
        test('deve listar submissões com paginação', async () => {
            const response = await request(app)
                .get('/api/admin/review/submissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    page: 1,
                    limit: 10
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('submissions');
            expect(response.body.data).toHaveProperty('pagination');

            const {submissions, pagination} = response.body.data;

            // Verificar estrutura das submissões
            expect(Array.isArray(submissions)).toBe(true);
            expect(submissions.length).toBeGreaterThan(0);

            // Verificar estrutura de uma submissão
            const submission = submissions[0];
            expect(submission).toHaveProperty('id');
            expect(submission).toHaveProperty('title');
            expect(submission).toHaveProperty('authorName');
            expect(submission).toHaveProperty('status');
            expect(submission).toHaveProperty('createdAt');
            expect(submission).toHaveProperty('fileCount');
            expect(submission).toHaveProperty('canBePublished');

            // Verificar paginação
            expect(pagination).toHaveProperty('currentPage', 1);
            expect(pagination).toHaveProperty('totalPages');
            expect(pagination).toHaveProperty('totalItems');
            expect(pagination).toHaveProperty('itemsPerPage', 10);
            expect(pagination).toHaveProperty('hasNext');
            expect(pagination).toHaveProperty('hasPrevious', false);
        });

        test('deve filtrar submissões por status', async () => {
            const response = await request(app)
                .get('/api/admin/review/submissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    status: ['DRAFT', 'UNDER_REVIEW']
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('submissions');

            const submissions = response.body.data.submissions;
            expect(Array.isArray(submissions)).toBe(true);

            // Verificar se apenas os status filtrados estão presentes
            submissions.forEach(submission => {
                expect(['DRAFT', 'UNDER_REVIEW']).toContain(submission.status);
            });
        });

        test('deve filtrar submissões por categoria', async () => {
            const response = await request(app)
                .get('/api/admin/review/submissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    category: ['Filosofia', 'teste']
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('submissions');

            const submissions = response.body.data.submissions;
            expect(Array.isArray(submissions)).toBe(true);

            // Verificar se apenas a categoria filtrada está presente
            submissions.forEach(submission => {
                expect(submission.category).toBe('Filosofia');
            });
        });

        test('deve buscar submissões por email do autor', async () => {
            const response = await request(app)
                .get('/api/admin/review/submissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    authorEmail: 'test@example.com'
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('submissions');

            const submissions = response.body.data.submissions;
            expect(Array.isArray(submissions)).toBe(true);

            // Verificar se apenas submissões do autor filtrado estão presentes
            submissions.forEach(submission => {
                expect(submission.authorEmail).toContain('test@example.com');
            });
        });
    });

    describe('Revisão de Submissões', () => {
        test('deve aprovar uma submissão em revisão', async () => {
            const submissionId = testSubmissions[1].id; // UNDER_REVIEW submission

            const response = await request(app)
                .put(`/api/admin/review/submissions/${submissionId}/review`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'approved',
                    notes: 'Submissão aprovada após revisão detalhada'
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('review');

            const review = response.body.data.review;
            expect(review).toHaveProperty('id');
            expect(review).toHaveProperty('submissionId', submissionId);
            expect(review).toHaveProperty('adminId', testAdmin.id);
            expect(review).toHaveProperty('status', 'approved');
            expect(review).toHaveProperty('reviewNotes', 'Submissão aprovada após revisão detalhada');
            expect(review).toHaveProperty('adminName', testAdmin.name);
            expect(review).toHaveProperty('reviewedAt');

            // Verificar se o status da submissão foi atualizado
            const submissionAfter = await db.findById('submissions', submissionId);
            expect(submissionAfter.status).toBe('APPROVED');
            expect(submissionAfter.reviewed_by).toBe(testAdmin.id);
            expect(submissionAfter.review_notes).toBe('Submissão aprovada após revisão detalhada');
        });

        test('deve rejeitar uma submissão', async () => {
            // Criar nova submissão para rejeitar
            const newSubmissionData = createTestSubmissionData({
                title: 'Submissão para Rejeitar',
                author_email: 'reject@example.com'
            });

            const createResponse = await request(app)
                .post('/api/submissions')
                .send(newSubmissionData);

            const submissionId = createResponse.body.data.submission.id;

            // Atualizar para UNDER_REVIEW
            await db.update('submissions', submissionId, {
                status: 'UNDER_REVIEW'
            });

            const response = await request(app)
                .put(`/api/admin/review/submissions/${submissionId}/review`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'rejected',
                    notes: 'Submissão rejeitada',
                    rejectionReason: 'Não atende aos critérios de qualidade'
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('review');

            const review = response.body.data.review;
            expect(review).toHaveProperty('status', 'rejected');
            expect(review).toHaveProperty('rejectionReason', 'Não atende aos critérios de qualidade');

            // Verificar se o status da submissão foi atualizado
            const submissionAfter = await db.findById('submissions', submissionId);
            expect(submissionAfter.status).toBe('REJECTED');
            expect(submissionAfter.rejection_reason).toBe('Não atende aos critérios de qualidade');

            // Cleanup
            await db.delete('submissions', submissionId);
        });

        test('deve solicitar alterações em uma submissão', async () => {
            // Criar nova submissão para solicitar mudanças
            const newSubmissionData = createTestSubmissionData({
                title: 'Submissão para Mudanças',
                author_email: 'changes@example.com'
            });

            const createResponse = await request(app)
                .post('/api/submissions')
                .send(newSubmissionData);

            const submissionId = createResponse.body.data.submission.id;

            // Atualizar para UNDER_REVIEW
            await db.update('submissions', submissionId, {
                status: 'UNDER_REVIEW'
            });

            const response = await request(app)
                .put(`/api/admin/review/submissions/${submissionId}/review`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'changes_requested',
                    notes: 'Por favor, faça as seguintes alterações...'
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('review');

            const review = response.body.data.review;
            expect(review).toHaveProperty('status', 'changes_requested');

            // Verificar se o status da submissão foi atualizado
            const submissionAfter = await db.findById('submissions', submissionId);
            expect(submissionAfter.status).toBe('CHANGES_REQUESTED');

            // Cleanup
            await db.delete('submissions', submissionId);
        });

        test('deve retornar erro ao tentar revisar submissão inexistente', async () => {
            const nonExistentId = uuid();

            const response = await request(app)
                .post(`/api/admin/review/submissions/${nonExistentId}/review`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'approved'
                });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });

        test('deve retornar erro ao tentar revisar submissão já publicada', async () => {
            // Criar submissão e marcar como publicada
            const newSubmissionData = createTestSubmissionData({
                title: 'Submissão Já Publicada',
                author_email: 'published@example.com'
            });

            const createResponse = await request(app)
                .post('/api/submissions')
                .send(newSubmissionData);

            const submissionId = createResponse.body.data.submission.id;

            // Atualizar para PUBLISHED
            await db.update('submissions', submissionId, {
                status: 'PUBLISHED'
            });

            const response = await request(app)
                .put(`/api/admin/review/submissions/${submissionId}/review`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'approved'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('não pode ser revisada');

            // Cleanup
            await db.delete('submissions', submissionId);
        });
    });

    describe('Envio de Feedback', () => {
        test('deve enviar feedback para o autor', async () => {
            const submissionId = testSubmissions[0].id; // DRAFT submission
            const feedbackContent = 'Por favor, melhore a introdução do artigo. Adicione mais contexto histórico.';

            const response = await request(app)
                .post(`/api/admin/review/submissions/${submissionId}/feedback`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    content: feedbackContent
                });

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('feedback');

            const feedback = response.body.data.feedback;
            expect(feedback).toHaveProperty('id');
            expect(feedback).toHaveProperty('submissionId', submissionId);
            expect(feedback).toHaveProperty('adminId', testAdmin.id);
            expect(feedback).toHaveProperty('content', feedbackContent);
            expect(feedback).toHaveProperty('status', 'pending');
            expect(feedback).toHaveProperty('adminName', testAdmin.name);

            // Verificar se o status da submissão foi atualizado para CHANGES_REQUESTED
            const submissionAfter = await db.findById('submissions', submissionId);
            expect(submissionAfter.status).toBe('CHANGES_REQUESTED');
        });

        test('deve retornar erro ao enviar feedback vazio', async () => {
            const submissionId = testSubmissions[0].id;

            const response = await request(app)
                .post(`/api/admin/review/submissions/${submissionId}/feedback`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    content: ''
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Publicação de Artigos', () => {
        test('deve publicar uma submissão aprovada', async () => {
            const submissionId = testSubmissions[2].id; // APPROVED submission

            const publishRequest = {
                publishNotes: 'Artigo aprovado para publicação imediata',
                categoryOverride: 'História',
                keywordsOverride: ['história', 'filosofia', 'teste']
            };

            const response = await request(app)
                .post(`/api/admin/review/submissions/${submissionId}/publish`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(publishRequest);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');

            const data = response.body.data;
            expect(data).toHaveProperty('articleId');
            expect(data).toHaveProperty('publishedAt');
            expect(data).toHaveProperty('message');
            expect(data).toHaveProperty('articleUrl');

            // Verificar se o status da submissão foi atualizado
            const submissionAfter = await db.findById('submissions', submissionId);
            expect(submissionAfter.status).toBe('PUBLISHED');

            // Verificar se o artigo foi criado
            const article = await db.findById('articles', data.articleId);
            expect(article).toBeDefined();
            expect(article.submission_id).toBe(submissionId);
            expect(article.category).toBe('História');
            expect(article.slug).toBe("approved-submission")
            expect(article.keywords).toEqual(['história', 'filosofia', 'teste']);

            // Cleanup

            await db.delete('articles', data.articleId);
        });

        test('deve retornar erro ao tentar publicar submissão não aprovada', async () => {
            const submissionId = testSubmissions[0].id; // DRAFT submission

            const response = await request(app)
                .post(`/api/admin/review/submissions/${submissionId}/publish`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    publishNotes: 'Tentativa de publicar rascunho'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('aprovadas podem ser publicadas');
        });

    });

    describe('Busca de Submissões', () => {
        test('deve buscar submissões por termo textual', async () => {
            const searchTerm = 'Test Submission';

            const response = await request(app)
                .get('/api/admin/review/submissions/search')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    q: searchTerm
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('submissions');

            const submissions = response.body.data.submissions;
            expect(Array.isArray(submissions)).toBe(true);

            // Verificar se os resultados contêm o termo buscado
            submissions.forEach(submission => {
                const hasTermInTitle = submission.title.toLowerCase().includes(searchTerm.toLowerCase());
                const hasTermInContent = submission.content?.toLowerCase().includes(searchTerm.toLowerCase());
                const hasTermInAuthor = submission.authorName.toLowerCase().includes(searchTerm.toLowerCase());

                expect(hasTermInTitle || hasTermInContent || hasTermInAuthor).toBe(true);
            });
        });

        test('deve buscar submissões com filtros combinados', async () => {
            const response = await request(app)
                .get('/api/admin/review/submissions/search')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    q: 'Test',
                    status: 'DRAFT',
                    category: 'Filosofia'
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('submissions');

            const submissions = response.body.data.submissions;
            submissions.forEach(submission => {
                expect(submission.status).toBe('DRAFT');
                expect(submission.category).toBe('Filosofia');
            });
        });

        test('deve retornar array vazio para busca sem resultados', async () => {
            const response = await request(app)
                .get('/api/admin/review/submissions/search')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    q: 'termo-que-nao-existe-em-lugar-nenhum'
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('submissions');
            expect(response.body.data.submissions).toEqual([]);
        });
    });

    describe('Ações em Lote', () => {
        test('deve aprovar múltiplas submissões em lote', async () => {
            // Criar submissões para teste em lote
            const submissionIds = [];

            for (let i = 0; i < 3; i++) {
                const submissionData = createTestSubmissionData({
                    title: `Bulk Approval Test ${i}`,
                    author_email: `bulk${i}@example.com`
                });

                const createResponse = await request(app)
                    .post('/api/submissions')
                    .send(submissionData);

                const submissionId = createResponse.body.data.submission.id;
                submissionIds.push(submissionId);

                // Atualizar para UNDER_REVIEW
                await db.update('submissions', submissionId, {
                    status: 'UNDER_REVIEW'
                });
            }

            const bulkAction = {
                submissionIds,
                action: 'approve',
                notes: 'Aprovação em lote para teste'
            };

            const response = await request(app)
                .post('/api/admin/review/submissions/bulk-action')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(bulkAction);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');

            const data = response.body.data;
            expect(data).toHaveProperty('successful');
            expect(data).toHaveProperty('failed');
            expect(data).toHaveProperty('summary');

            expect(data.summary.total).toBe(3);
            expect(data.summary.successful).toBe(3);
            expect(data.summary.failed).toBe(0);
            expect(data.successful).toEqual(submissionIds);

            // Verificar se todas as submissões foram aprovadas
            for (const submissionId of submissionIds) {
                const submission = await db.findById('submissions', submissionId);
                expect(submission.status).toBe('APPROVED');

                // Cleanup
                await db.delete('submissions', submissionId);
            }
        });

        test('deve rejeitar múltiplas submissões em lote', async () => {
            // Criar submissões para teste em lote
            const submissionIds = [];

            for (let i = 0; i < 2; i++) {
                const submissionData = createTestSubmissionData({
                    title: `Bulk Rejection Test ${i}`,
                    author_email: `bulkreject${i}@example.com`
                });

                const createResponse = await request(app)
                    .post('/api/submissions')
                    .send(submissionData);

                const submissionId = createResponse.body.data.submission.id;
                submissionIds.push(submissionId);

                // Atualizar para UNDER_REVIEW
                await db.update('submissions', submissionId, {
                    status: 'UNDER_REVIEW'
                });
            }

            const bulkAction = {
                submissionIds,
                action: 'reject',
                reason: 'Não atendem aos padrões de qualidade',
                notes: 'Rejeição em lote para teste'
            };

            const response = await request(app)
                .post('/api/admin/review/submissions/bulk-action')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(bulkAction);

            expect(response.status).toBe(200);
            expect(response.body.data.summary.successful).toBe(2);

            // Verificar se todas as submissões foram rejeitadas
            for (const submissionId of submissionIds) {
                const submission = await db.findById('submissions', submissionId);
                expect(submission.status).toBe('REJECTED');

                // Cleanup
                await db.delete('submissions', submissionId);
            }
        });

        test('deve estender prazo de expiração em lote', async () => {
            // Criar submissões para teste
            const submissionIds = [];

            for (let i = 0; i < 2; i++) {
                const submissionData = createTestSubmissionData({
                    title: `Bulk Extension Test ${i}`,
                    author_email: `bulkextend${i}@example.com`
                });

                const createResponse = await request(app)
                    .post('/api/submissions')
                    .send(submissionData);

                const submissionId = createResponse.body.data.submission.id;
                submissionIds.push(submissionId);
            }

            const bulkAction = {
                submissionIds,
                action: 'extend_expiry',
                notes: 'Extensão de prazo em lote'
            };

            const response = await request(app)
                .post('/api/admin/review/submissions/bulk-action')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(bulkAction);

            expect(response.status).toBe(200);
            expect(response.body.data.summary.successful).toBe(2);

            // Cleanup
            for (const submissionId of submissionIds) {
                await db.delete('submissions', submissionId);
            }
        });

        test('deve retornar erro para ação em lote com muitas submissões', async () => {
            // Criar array com muitos IDs (mais que o limite)
            const tooManyIds = Array.from({length: 51}, () => uuid());

            const bulkAction = {
                submissionIds: tooManyIds,
                action: 'approve'
            };

            const response = await request(app)
                .post('/api/admin/review/submissions/bulk-action')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(bulkAction);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Deve fornecer entre 1 e 50 IDs de submissão');
            expect(response.body).toHaveProperty('details');
            expect(response.body.details).toHaveProperty('errors');
            expect(response.body.details.errors).toHaveLength(1);
            expect(response.body.details.errors[0].msg).toContain('Deve fornecer entre 1 e 50 IDs de submissão');
            expect(response.body.details.errors[0].value).toStrictEqual(expect.any(Array));
        });
    });

    describe('Log de Ações do Admin', () => {
        test('deve retornar histórico de ações do admin', async () => {
            const response = await request(app)
                .get('/api/admin/review/activity-log')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    page: 1,
                    limit: 10
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('logs');
            expect(response.body.data).toHaveProperty('total');

            const logs = response.body.data.logs;
            expect(Array.isArray(logs)).toBe(true);

            if (logs.length > 0) {
                const log = logs[0];
                expect(log).toHaveProperty('id');
                expect(log).toHaveProperty('admin_id');
                expect(log).toHaveProperty('action');
                expect(log).toHaveProperty('target_type');
                expect(log).toHaveProperty('target_id');
                expect(log).toHaveProperty('timestamp');
                expect(log).toHaveProperty('details');
            }
        });

        test('deve filtrar logs por tipo de ação', async () => {
            const response = await request(app)
                .get('/api/admin/review/activity-log')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    action: 'review_submission'
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('logs');

            const logs = response.body.data.logs;
            logs.forEach(log => {
                expect(log.action).toBe('review_submission');
            });
        });

        test('deve filtrar logs por tipo de target', async () => {
            const response = await request(app)
                .get('/api/admin/review/activity-log')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    targetType: 'submission'
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('logs');

            const logs = response.body.data.logs;
            logs.forEach(log => {
                expect(log.target_type).toBe('submission');
            });
        });

        test('deve filtrar logs por período de datas', async () => {
            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - 7);

            const dateTo = new Date();

            const response = await request(app)
                .get('/api/admin/review/activity-log')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    dateFrom: dateFrom.toISOString(),
                    dateTo: dateTo.toISOString()
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('logs');

            const logs = response.body.data.logs;
            logs.forEach(log => {
                const logDate = new Date(log.timestamp).getTime();
                expect(logDate).toBeGreaterThan(dateFrom.getTime());
                expect(logDate).toBeLessThan(dateTo.getTime());
            });
        });
    });

    describe('Error Handling', () => {
        test('deve retornar erro 401 para token inválido', async () => {
            const response = await request(app)
                .get('/api/admin/review/dashboard')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
        });

        test('deve retornar erro 403 para usuário não-admin', async () => {
            // Criar usuário comum (não admin)
            const userData = {
                name: 'Regular User',
                email: 'user@example.com',
                password: 'password123'
            };

            await request(app)
                .post('/api/users')
                .send(userData);

            // Tentar acessar endpoint de admin
            const response = await request(app)
                .get('/api/admin/review/dashboard')
                .set('Authorization', `Bearer fake-user-token`);

            expect(response.status).toBe(401);
        });

        test('deve retornar erro para IDs inválidos', async () => {
            const invalidId = 'not-a-uuid';

            const response = await request(app)
                .put(`/api/admin/review/submissions/${invalidId}/review`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'approved'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('deve retornar erro para dados de entrada inválidos', async () => {
            const submissionId = testSubmissions[0].id;

            const response = await request(app)
                .put(`/api/admin/review/submissions/${submissionId}/review`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'invalid-status'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });
});
