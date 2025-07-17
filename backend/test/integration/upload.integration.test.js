const request = require('supertest');
const app = require('../../app');
const db = require('../../database/client');
const fs = require('fs');
const path = require('path');

// Setup spies instead of mocks
jest.mock('../../middleware/logging', () => {
  // Create a mock object with all the methods from the original logger
  const loggerMethods = ['audit', 'security', 'database', 'performance', 'error', 'warn', 'info', 'debug'];
  const mockLogger = {};

  // Add each method as a jest function that also logs to console
  loggerMethods.forEach(method => {
    mockLogger[method] = jest.fn((message, meta) => {
      console.log(`Logger.${method}:`, message, meta || '');
    });
  });

  // Add createPerformanceLogger method
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

describe('Upload Integration', () => {
    let testSubmission;
    const testSubmissionData = {
        author_name: 'Test Author',
        author_email: 'test@example.com',
        author_institution: 'Test Institution',
        title: 'Test Submission Title',
        summary: 'This is a test submission summary that is long enough to pass validation. It contains more than 50 characters to ensure it meets the minimum length requirement.',
        content: 'This is the content of the test submission. It needs to be long enough to pass validation checks. This content is used for testing the submission flow from creation to review. It contains more than 100 characters to ensure it meets the minimum length requirement.',
        keywords: ['test', 'integration', 'upload'],
        category: 'Filosofia'
    };

    const createTestImageBuffer = (filename = 'test-image.jpg') => {
        const imagePath = path.join(__dirname, '../fixtures/images', filename);
        return fs.readFileSync(imagePath);
    };

    const createTestPdfBuffer = (filename = 'test-document.pdf') => {
        const pdfPath = path.join(__dirname, '../fixtures/documents', filename);
        return fs.readFileSync(pdfPath);
    };

    beforeAll(async () => {
        // Set test environment
        process.env.NODE_ENV = 'test';
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
        // No need to set up spies again as they're already set up in the mock
    });

    describe('Upload Flow', () => {
        test('fluxo completo: criar submissão → fazer upload de imagem → fazer upload de documento → deletar arquivo', async () => {
            // 1. Criar submissão
            const createResponse = await request(app)
                .post('/api/submissions')
                .send(testSubmissionData);

            // Verificar resposta de criação
            expect(createResponse.status).toBe(201);
            expect(createResponse.body.data).toHaveProperty('submission');

            // Extrair dados da submissão
            const submission = createResponse.body.data.submission;
            testSubmission = submission; // Salvar para limpeza no afterAll

            // 2. Fazer upload de imagem
            const imageBuffer = createTestImageBuffer();
            const imageUploadResponse = await request(app)
                .post('/api/upload/image')
                .field('submissionId', submission.id)
                .field('authorEmail', testSubmissionData.author_email)
                .attach('file', imageBuffer, 'test-image.jpg');

            // Verificar resposta de upload de imagem
            expect(imageUploadResponse.status).toBe(201);
            expect(imageUploadResponse.body.data).toHaveProperty('file');
            expect(imageUploadResponse.body.data.file).toHaveProperty('id');
            expect(imageUploadResponse.body.data.file).toHaveProperty('originalName', 'test-image.jpg');
            expect(imageUploadResponse.body.data.file).toHaveProperty('resourceType', 'image');
            expect(imageUploadResponse.body.data).toHaveProperty('optimizations');
            expect(imageUploadResponse.body.message).toBe('Imagem enviada com sucesso');

            // Salvar ID do arquivo para teste de exclusão
            const imageFileId = imageUploadResponse.body.data.file.id;

            // 3. Fazer upload de documento
            const pdfBuffer = createTestPdfBuffer();
            const documentUploadResponse = await request(app)
                .post('/api/upload/document')
                .field('submissionId', submission.id)
                .field('authorEmail', testSubmissionData.author_email)
                .attach('file', pdfBuffer, 'test-document.pdf');

            // Verificar resposta de upload de documento
            expect(documentUploadResponse.status).toBe(201);
            expect(documentUploadResponse.body.data).toHaveProperty('file');
            expect(documentUploadResponse.body.data.file).toHaveProperty('id');
            expect(documentUploadResponse.body.data.file).toHaveProperty('originalName', 'test-document.pdf');
            expect(documentUploadResponse.body.data.file).toHaveProperty('resourceType', 'document');
            expect(documentUploadResponse.body.message).toBe('Documento enviado com sucesso');

            // 4. Verificar estatísticas de upload
            const statsResponse = await request(app)
                .get(`/api/upload/stats?submissionId=${submission.id}`);

            // Verificar resposta de estatísticas
            expect(statsResponse.status).toBe(200);
            expect(statsResponse.body.data).toHaveProperty('stats');
            expect(statsResponse.body.data.stats).toHaveProperty('totalUploads', 2);
            expect(statsResponse.body.data.stats.byType).toHaveProperty('image', 1);
            expect(statsResponse.body.data.stats.byType).toHaveProperty('document', 1);

            // 5. Gerar URL de download para o arquivo
            const downloadUrlResponse = await request(app)
                .get(`/api/upload/${imageFileId}/download`);

            // Verificar resposta de URL de download
            expect(downloadUrlResponse.status).toBe(200);
            expect(downloadUrlResponse.body.data).toHaveProperty('downloadUrl');
            expect(downloadUrlResponse.body.data).toHaveProperty('file');
            expect(downloadUrlResponse.body.data.file).toHaveProperty('id', imageFileId);

            // 6. Deletar arquivo
            const deleteResponse = await request(app)
                .delete(`/api/upload/${imageFileId}`)
                .send({ authorEmail: testSubmissionData.author_email });

            // Verificar resposta de exclusão
            expect(deleteResponse.status).toBe(200);
            expect(deleteResponse.body.data).toHaveProperty('deleted', true);
            expect(deleteResponse.body.message).toBe('Arquivo deletado com sucesso');

            // 7. Verificar que o arquivo foi removido das estatísticas
            const statsAfterDeleteResponse = await request(app)
                .get(`/api/upload/stats?submissionId=${submission.id}`);

            // Verificar resposta de estatísticas após exclusão
            expect(statsAfterDeleteResponse.status).toBe(200);
            expect(statsAfterDeleteResponse.body.data.stats).toHaveProperty('totalUploads', 1);
            expect(statsAfterDeleteResponse.body.data.stats.byType).toHaveProperty('document', 1);
        });
    });

    describe('Multiple Upload Flow', () => {
        test('upload múltiplo de arquivos', async () => {
            // 1. Criar submissão
            const createResponse = await request(app)
                .post('/api/submissions')
                .send({
                    author_name: 'Multiple Upload Author',
                    author_email: 'multiple@example.com',
                    title: 'Multiple Upload Test'
                });

            const submission = createResponse.body.data.submission;

            // 2. Fazer upload múltiplo
            const imageBuffer = createTestImageBuffer();
            const pdfBuffer = createTestPdfBuffer();

            const multipleUploadResponse = await request(app)
                .post('/api/upload/multiple')
                .field('submissionId', submission.id)
                .field('authorEmail', 'multiple@example.com')
                .attach('files', imageBuffer, 'multi-image.jpg')
                .attach('files', pdfBuffer, 'multi-document.pdf');

            // Verificar resposta de upload múltiplo
            expect(multipleUploadResponse.status).toBe(201);
            expect(multipleUploadResponse.body.data).toHaveProperty('successful');
            expect(multipleUploadResponse.body.data).toHaveProperty('summary');
            expect(multipleUploadResponse.body.data.successful).toHaveLength(2);
            expect(multipleUploadResponse.body.data.summary).toHaveProperty('total', 2);
            expect(multipleUploadResponse.body.data.summary).toHaveProperty('successful', 2);
            expect(multipleUploadResponse.body.data.summary).toHaveProperty('failed', 0);

            // Limpar dados de teste
            await db.delete('submissions', submission.id);
        });
    });

    describe('Error Handling', () => {
        test('tentativa de upload sem arquivo', async () => {
            // 1. Criar submissão
            const createResponse = await request(app)
                .post('/api/submissions')
                .send({
                    author_name: 'Error Test Author',
                    author_email: 'error@example.com',
                    title: 'Error Test Submission'
                });

            const submission = createResponse.body.data.submission;

            // 2. Tentar fazer upload sem arquivo
            const errorResponse = await request(app)
                .post('/api/upload/image')
                .field('submissionId', submission.id)
                .field('authorEmail', 'error@example.com');

            // Verificar resposta de erro
            expect(errorResponse.status).toBe(400);
            expect(errorResponse.body).toHaveProperty('error');
            expect(errorResponse.body.error).toContain('Nenhum arquivo enviado');

            // Limpar dados de teste
            await db.delete('submissions', submission.id);
        });

        test('tentativa de upload com formato inválido', async () => {
            // 1. Criar submissão
            const createResponse = await request(app)
                .post('/api/submissions')
                .send({
                    author_name: 'Format Error Author',
                    author_email: 'format@example.com',
                    title: 'Format Error Test'
                });

            const submission = createResponse.body.data.submission;

            // 2. Tentar fazer upload com formato inválido (texto como imagem)
            const textBuffer = Buffer.from('This is not an image file', 'utf-8');
            const errorResponse = await request(app)
                .post('/api/upload/image')
                .field('submissionId', submission.id)
                .field('authorEmail', 'format@example.com')
                .attach('file', textBuffer, 'not-an-image.txt');

            // Verificar resposta de erro
            expect(errorResponse.status).toBe(400);
            expect(errorResponse.body).toHaveProperty('error');

            // Limpar dados de teste
            await db.delete('submissions', submission.id);
        });

        test('tentativa de acesso a arquivo inexistente', async () => {
            const randomUUID = require('uuid').v4();
            const nonExistentResponse = await request(app)
                .get(`/api/upload/${randomUUID}/download`);

            expect(nonExistentResponse.status).toBe(404);
            expect(nonExistentResponse.body).toHaveProperty('error', 'Arquivo não encontrado');
        });

        test('tentativa de exclusão sem autorização', async () => {
            // 1. Criar submissão
            const createResponse = await request(app)
                .post('/api/submissions')
                .send({
                    author_name: 'Auth Error Author',
                    author_email: 'auth@example.com',
                    title: 'Auth Error Test'
                });

            const submission = createResponse.body.data.submission;

            // 2. Fazer upload de arquivo
            const imageBuffer = createTestImageBuffer();
            const uploadResponse = await request(app)
                .post('/api/upload/image')
                .field('submissionId', submission.id)
                .field('authorEmail', 'auth@example.com')
                .attach('file', imageBuffer, 'auth-test.jpg');

            const fileId = uploadResponse.body.data.file.id;

            // 3. Tentar excluir com email diferente
            const unauthorizedResponse = await request(app)
                .delete(`/api/upload/${fileId}`)
                .send({ authorEmail: 'different@example.com' });

            // Verificar resposta de erro
            expect(unauthorizedResponse.status).toBe(401);
            expect(unauthorizedResponse.body).toHaveProperty('error');
            expect(unauthorizedResponse.body.error).toContain('permissão');

            // Limpar dados de teste
            await db.delete('submissions', submission.id);
        });
    });

    describe('getUploadStats Integration Tests', () => {
        let testSubmissionId;

        beforeAll(async () => {
            // Criar uma submissão para testes
            const createResponse = await request(app)
                .post('/api/submissions')
                .send({
                    author_name: 'Stats Test Author',
                    author_email: 'stats@example.com',
                    title: 'Stats Test Submission',
                    summary: 'This is a test submission summary for stats testing. It is long enough to pass validation requirements.',
                    content: 'This is the content of the test submission for stats testing. It is long enough to pass validation requirements and ensure we can properly test the stats functionality.',
                    category: 'Filosofia'
                });

            testSubmissionId = createResponse.body.data.submission.id;

            // Fazer upload de alguns arquivos para testes
            const imageBuffer = createTestImageBuffer();
            const pdfBuffer = createTestPdfBuffer();

            // Fazer upload de uma imagem
            await request(app)
                .post('/api/upload/image')
                .field('submissionId', testSubmissionId)
                .field('authorEmail', 'stats@example.com')
                .attach('file', imageBuffer, 'stats-test-image.jpg');

            // Fazer upload de um documento
            await request(app)
                .post('/api/upload/document')
                .field('submissionId', testSubmissionId)
                .field('authorEmail', 'stats@example.com')
                .attach('file', pdfBuffer, 'stats-test-document.pdf');
        });

        afterAll(async () => {
            // Limpar dados de teste
            if (testSubmissionId) {
                await db.delete('submissions', testSubmissionId);
            }
        });

        test('deve retornar estatísticas gerais sem filtro', async () => {
            // Obter estatísticas gerais sem filtro
            const response = await request(app)
                .get('/api/upload/stats');

            // Verificar resposta
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('stats');
            expect(response.body.data.stats).toHaveProperty('totalUploads');
            expect(response.body.data.stats).toHaveProperty('totalSize');
            expect(response.body.data.stats).toHaveProperty('byType');
            expect(response.body.data.stats).toHaveProperty('byFormat');
            expect(response.body.data.stats).toHaveProperty('recentUploads');
            expect(response.body.data.stats).toHaveProperty('storageUsed');

            // Verificar que temos estatísticas de pelo menos um tipo de arquivo
            expect(Object.keys(response.body.data.stats.byType).length).toBeGreaterThan(0);

            // Verificar que temos estatísticas de pelo menos um formato
            expect(Object.keys(response.body.data.stats.byFormat).length).toBeGreaterThan(0);

            // Verificar que temos uploads recentes
            expect(response.body.data.stats.recentUploads.length).toBeGreaterThan(0);
        });

        test('deve retornar estatísticas filtradas por submissionId', async () => {
            // Obter estatísticas filtradas pela submissão de teste
            const response = await request(app)
                .get(`/api/upload/stats?submissionId=${testSubmissionId}`);

            // Verificar resposta
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('stats');
            expect(response.body.data.stats).toHaveProperty('totalUploads', 2); // 1 imagem + 1 documento

            // Verificar tipos de arquivo
            expect(response.body.data.stats.byType).toHaveProperty('image', 1);
            expect(response.body.data.stats.byType).toHaveProperty('document', 1);

            // Verificar formatos
            expect(response.body.data.stats.byFormat).toHaveProperty('jpg', 1);
            expect(response.body.data.stats.byFormat).toHaveProperty('pdf', 1);

            // Verificar uploads recentes (devem ser apenas da submissão específica)
            expect(response.body.data.stats.recentUploads.length).toBe(2);
            expect(response.body.data.stats.recentUploads[0].submissionId).toBe(testSubmissionId);
            expect(response.body.data.stats.recentUploads[1].submissionId).toBe(testSubmissionId);
        });

        test('deve retornar estatísticas vazias para uma submissão inexistente', async () => {
            const randomId = require('uuid').v4();

            // Obter estatísticas para uma submissão que não existe
            const response = await request(app)
                .get(`/api/upload/stats?submissionId=${randomId}`);

            // Verificar resposta
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('stats');
            expect(response.body.data.stats).toHaveProperty('totalUploads', 0);
            expect(response.body.data.stats.byType).toEqual({});
            expect(response.body.data.stats.byFormat).toEqual({});
            expect(response.body.data.stats.recentUploads).toEqual([]);
            expect(response.body.data.stats.storageUsed.total).toBe(0);
        });
    });

    describe('generateDownloadUrl Integration Tests', () => {
        let testSubmissionId;
        let uploadedFileId;

        beforeAll(async () => {
            // Criar uma submissão para testes
            const createResponse = await request(app)
                .post('/api/submissions')
                .send({
                    author_name: 'Download Test Author',
                    author_email: 'download@example.com',
                    title: 'Download Test Submission',
                    summary: 'This is a test submission summary for download URL testing. It is long enough to pass validation requirements.',
                    content: 'This is the content of the test submission for download URL testing. It is long enough to pass validation requirements and ensure we can properly test the download URL functionality.',
                    category: 'Filosofia'
                });

            testSubmissionId = createResponse.body.data.submission.id;

            // Fazer upload de um arquivo para testes
            const imageBuffer = createTestImageBuffer();

            // Fazer upload de uma imagem
            const uploadResponse = await request(app)
                .post('/api/upload/image')
                .field('submissionId', testSubmissionId)
                .field('authorEmail', 'download@example.com')
                .attach('file', imageBuffer, 'download-test-image.jpg');

            uploadedFileId = uploadResponse.body.data.file.id;
        });

        afterAll(async () => {
            // Limpar dados de teste
            if (testSubmissionId) {
                await db.delete('submissions', testSubmissionId);
            }
        });

        test('deve gerar URL de download válida para um arquivo existente', async () => {
            // Gerar URL de download
            const response = await request(app)
                .get(`/api/upload/${uploadedFileId}/download`);

            // Verificar resposta
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('downloadUrl');
            expect(response.body.data.downloadUrl).toMatch(/^https:\/\/api\.cloudinary\.com/);
            expect(response.body.data).toHaveProperty('expiresIn', 60); // Valor padrão
            expect(response.body.data).toHaveProperty('file');
            expect(response.body.data.file).toHaveProperty('id', uploadedFileId);
            expect(response.body.data.file).toHaveProperty('originalName', 'download-test-image.jpg');
        });

        test('deve aceitar parâmetro de expiração personalizado', async () => {
            const customExpiration = 120; // 2 horas

            // Gerar URL de download com expiração personalizada
            const response = await request(app)
                .get(`/api/upload/${uploadedFileId}/download?expires=${customExpiration}`);

            // Verificar resposta
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('downloadUrl');
            expect(response.body.data).toHaveProperty('expiresIn', customExpiration);
        });

        test('deve retornar erro para ID de arquivo inválido', async () => {
            const invalidId = 'not-a-valid-uuid';

            // Tentar gerar URL de download com ID inválido
            const response = await request(app)
                .get(`/api/upload/${invalidId}/download`);

            // Verificar resposta de erro
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'ID do arquivo inválido');
        });

        test('deve retornar erro para arquivo inexistente', async () => {
            const randomUUID = require('uuid').v4();

            // Tentar gerar URL de download para arquivo que não existe
            const response = await request(app)
                .get(`/api/upload/${randomUUID}/download`);

            // Verificar resposta de erro
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Arquivo não encontrado');
        });
    });
});
