const request = require('supertest');
const app = require('../../app');
const db = require('../../database/client');
const logger = require('../../middleware/logging');

jest.mock('../../middleware/logging');

describe('Submission Integration', () => {
    // Test data
    let testSubmission;
    const testSubmissionData = {
        author_name: 'Test Author',
        author_email: 'test@example.com',
        author_institution: 'Test Institution',
        title: 'Test Submission Title',
        summary: 'This is a test submission summary that is long enough to pass validation. It contains more than 50 characters to ensure it meets the minimum length requirement.',
        content: 'This is the content of the test submission. It needs to be long enough to pass validation checks. This content is used for testing the submission flow from creation to review. It contains more than 100 characters to ensure it meets the minimum length requirement.',
        keywords: ['test', 'integration', 'submission'],
        category: 'Filosofia'
    };

    beforeAll(async () => {
        // Set test environment
        process.env.NODE_ENV = 'development'
        process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5433/app_test';
    });

    afterAll(async () => {
        // Clean up test data
        if (testSubmission) {
            await db.delete('submissions', testSubmission.id);
        }
        // Close database connection
        await db.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        logger.audit = jest.fn();
        logger.security = jest.fn();
        logger.error = jest.fn();
    });

    describe('Submission Creation Flow', () => {
        test('fluxo completo: criar submissão → acessar → atualizar → enviar para revisão', async () => {
            // 1. Criar submissão
            const createResponse = await request(app)
                .post('/api/submissions')
                .send(testSubmissionData);

            // Verificar resposta de criação
            expect(createResponse.status).toBe(201);
            expect(createResponse.body.data).toHaveProperty('submission');
            expect(createResponse.body.data).toHaveProperty('accessUrl');
            expect(createResponse.body.message).toBe('Submissão criada com sucesso');

            // Extrair dados da submissão
            const submission = createResponse.body.data.submission;
            testSubmission = submission; // Salvar para limpeza no afterAll
            const token = submission.token;

            // 2. Acessar submissão com token
            const getResponse = await request(app)
                .get(`/api/submissions/${token}`);

            // Verificar resposta de acesso
            expect(getResponse.status).toBe(200);
            expect(getResponse.body.data).toHaveProperty('submission');
            expect(getResponse.body.data.submission).toHaveProperty('id', submission.id);
            expect(getResponse.body.data.submission).toHaveProperty('title', testSubmissionData.title);
            expect(getResponse.body.data.canEdit).toBe(true);

            // 3. Atualizar submissão
            const updateData = {
                ...testSubmissionData,
                title: 'Updated Title',
                summary: 'This is an updated summary that is long enough to pass validation. It contains more than 50 characters to ensure it meets the minimum length requirement.',
                author_email: testSubmissionData.author_email
            };

            const updateResponse = await request(app)
                .put(`/api/submissions/${token}`)
                .send(updateData);

            // Verificar resposta de atualização
            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.data).toHaveProperty('submission');
            expect(updateResponse.body.data.submission).toHaveProperty('title', updateData.title);
            expect(updateResponse.body.message).toBe('Submissão atualizada com sucesso');

            // 4. Enviar para revisão
            const submitResponse = await request(app)
                .post(`/api/submissions/${token}/submit`)
                .send({ author_email: testSubmissionData.author_email });

            // Verificar resposta de envio para revisão
            expect(submitResponse.status).toBe(200);
            expect(submitResponse.body.data).toHaveProperty('submission');
            expect(submitResponse.body.data.submission).toHaveProperty('status', 'UNDER_REVIEW');
            expect(submitResponse.body.message).toBe('Submissão enviada para revisão com sucesso');

            // 5. Verificar que não é mais possível editar após envio para revisão
            const getAfterSubmitResponse = await request(app)
                .get(`/api/submissions/${token}`);

            expect(getAfterSubmitResponse.status).toBe(200);
            expect(getAfterSubmitResponse.body.data.canEdit).toBe(false);
        });
    });

    describe('Submission Auto-Save Flow', () => {
        test('auto-save de rascunho', async () => {
            // 1. Criar submissão para teste
            const createResponse = await request(app)
                .post('/api/submissions')
                .send({
                    author_name: 'Auto Save Author',
                    author_email: 'autosave@example.com',
                    title: 'Auto Save Test'
                });

            const submission = createResponse.body.data.submission;
            const token = submission.token;

            // 2. Auto-save de conteúdo
            const autoSaveData = {
                content: 'This is auto-saved content that will be saved without strict validation.',
                author_email: 'autosave@example.com'
            };

            const autoSaveResponse = await request(app)
                .post(`/api/submissions/${token}/auto-save`)
                .send(autoSaveData);

            // Verificar resposta de auto-save
            expect(autoSaveResponse.status).toBe(200);
            expect(autoSaveResponse.body.data).toHaveProperty('autoSaved', true);
            expect(autoSaveResponse.body.data.message).toBe('Rascunho salvo automaticamente');

            // 3. Verificar se o conteúdo foi salvo
            const getResponse = await request(app)
                .get(`/api/submissions/${token}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.data.submission).toHaveProperty('content', autoSaveData.content);

            // Limpar dados de teste
            await db.delete('submissions', submission.id);
        });
    });

    describe('Submission Attachments Flow', () => {
        test('adicionar e remover anexos', async () => {
            // 1. Criar submissão para teste
            const createResponse = await request(app)
                .post('/api/submissions')
                .send({
                    author_name: 'Attachment Author',
                    author_email: 'attachment@example.com',
                    title: 'Attachment Test'
                });

            const submission = createResponse.body.data.submission;
            const token = submission.token;

            // 2. Adicionar anexo
            const attachmentData = {
                filename: 'test-file.pdf',
                url: 'https://example.com/test-file.pdf',
                file_type: 'application/pdf',
                size: 1024,
                author_email: 'attachment@example.com'
            };

            const addAttachmentResponse = await request(app)
                .post(`/api/submissions/${token}/attachments`)
                .send(attachmentData);

            // Verificar resposta de adição de anexo
            expect(addAttachmentResponse.status).toBe(201);
            expect(addAttachmentResponse.body.data).toHaveProperty('attachment');
            expect(addAttachmentResponse.body.data.attachment).toHaveProperty('filename', attachmentData.filename);

            const attachmentId = addAttachmentResponse.body.data.attachment.id;

            // 3. Verificar se o anexo foi adicionado
            const getResponse = await request(app)
                .get(`/api/submissions/${token}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.data.submission.attachments).toHaveLength(1);
            expect(getResponse.body.data.submission.attachments[0]).toHaveProperty('id', attachmentId);

            // 4. Remover anexo
            const removeAttachmentResponse = await request(app)
                .delete(`/api/submissions/${token}/attachments/${attachmentId}`)
                .send({ author_email: 'attachment@example.com' });

            // Verificar resposta de remoção de anexo
            expect(removeAttachmentResponse.status).toBe(200);
            expect(removeAttachmentResponse.body.data).toHaveProperty('removed', true);

            // 5. Verificar se o anexo foi removido
            const getAfterRemoveResponse = await request(app)
                .get(`/api/submissions/${token}`);

            expect(getAfterRemoveResponse.status).toBe(200);
            expect(getAfterRemoveResponse.body.data.submission.attachments).toHaveLength(0);

            // Limpar dados de teste
            await db.delete('submissions', submission.id);
        });
    });

    describe('Submission Preview and Stats', () => {
        test('gerar preview e obter estatísticas', async () => {
            // 1. Criar submissão para teste
            const createResponse = await request(app)
                .post('/api/submissions')
                .send(testSubmissionData);

            const submission = createResponse.body.data.submission;
            const token = submission.token;

            // 2. Gerar preview
            const previewResponse = await request(app)
                .get(`/api/submissions/${token}/preview`);

            // Verificar resposta de preview
            expect(previewResponse.status).toBe(200);
            expect(previewResponse.body.data).toHaveProperty('preview');
            expect(previewResponse.body.data.preview).toHaveProperty('title', testSubmissionData.title);
            expect(previewResponse.body.data.preview).toHaveProperty('content');
            expect(previewResponse.body.data.preview).toHaveProperty('author');

            // 3. Obter estatísticas
            const statsResponse = await request(app)
                .get(`/api/submissions/${token}/stats`);

            // Verificar resposta de estatísticas
            expect(statsResponse.status).toBe(200);
            expect(statsResponse.body.data).toHaveProperty('stats');
            expect(statsResponse.body.data.stats).toHaveProperty('completeness');
            expect(statsResponse.body.data.stats).toHaveProperty('content');
            expect(statsResponse.body.data.stats).toHaveProperty('timeline');

            // Limpar dados de teste
            await db.delete('submissions', submission.id);
        });
    });

    describe('Author Submissions Listing', () => {
        test('listar submissões do autor', async () => {
            // 1. Criar múltiplas submissões para o mesmo autor
            const authorEmail = 'author-list@example.com';
            const submissions = [];

            for (let i = 0; i < 3; i++) {
                const createResponse = await request(app)
                    .post('/api/submissions')
                    .send({
                        author_name: 'List Test Author',
                        author_email: authorEmail,
                        title: `Test Submission ${i + 1}`
                    });

                submissions.push(createResponse.body.data.submission);
            }

            // 2. Listar submissões do autor
            const listResponse = await request(app)
                .get('/api/author/submissions')
                .query({ email: authorEmail });

            // Verificar resposta de listagem
            expect(listResponse.status).toBe(200);
            expect(listResponse.body.data).toHaveProperty('submissions');
            expect(listResponse.body.data).toHaveProperty('pagination');
            expect(listResponse.body.data.submissions).toHaveLength(3);

            // Verificar se as submissões estão na lista
            const submissionIds = submissions.map(s => s.id);
            const listedIds = listResponse.body.data.submissions.map(s => s.id);

            submissionIds.forEach(id => {
                expect(listedIds).toContain(id);
            });

            // Limpar dados de teste
            for (const submission of submissions) {
                await db.delete('submissions', submission.id);
            }
        });
    });

    describe('Error Handling', () => {
        test('tentativa de acesso com token inválido', async () => {
            const invalidTokenResponse = await request(app)
                .get('/api/submissions/invalid-token');

            expect(invalidTokenResponse.status).toBe(401);
            expect(invalidTokenResponse.body).toHaveProperty('error', 'Formato de token inválido');
        });

        test('tentativa de atualização sem email do autor', async () => {
            // 1. Criar submissão para teste
            const createResponse = await request(app)
                .post('/api/submissions')
                .send({
                    author_name: 'Error Test Author',
                    author_email: 'error@example.com',
                    title: 'Error Test Submission'
                });

            const token = createResponse.body.data.submission.token;

            // 2. Tentar atualizar sem email do autor
            const updateResponse = await request(app)
                .put(`/api/submissions/${token}`)
                .send({
                    title: 'Updated Title'
                    // Faltando author_email
                });

            expect(updateResponse.status).toBe(400);
            expect(updateResponse.body).toHaveProperty('error');

            // Limpar dados de teste
            await db.delete('submissions', createResponse.body.data.submission.id);
        });

        test('tentativa de envio para revisão com dados incompletos', async () => {
            // 1. Criar submissão para teste (sem todos os campos obrigatórios)
            const createResponse = await request(app)
                .post('/api/submissions')
                .send({
                    author_name: 'Incomplete Author',
                    author_email: 'incomplete@example.com',
                    title: 'Incomplete Submission'
                    // Faltando summary, content, keywords, category
                });

            const token = createResponse.body.data.submission.token;

            // 2. Tentar enviar para revisão
            const submitResponse = await request(app)
                .post(`/api/submissions/${token}/submit`)
                .send({ author_email: 'incomplete@example.com' });

            expect(submitResponse.status).toBe(400);
            expect(submitResponse.body).toHaveProperty('error');
            expect(submitResponse.body.error).toContain('incompleta');

            // Limpar dados de teste
            await db.delete('submissions', createResponse.body.data.submission.id);
        });
    });
});
