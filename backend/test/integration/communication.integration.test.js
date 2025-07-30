const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../app');
const db = require('../../database/client');
const uuid = require('uuid').v4;

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
    sendTokenResend: jest.fn(() => Promise.resolve({ success: true, messageId: 'msg-123' })),
    sendTokenRegenerated: jest.fn(() => Promise.resolve({ success: true, messageId: 'msg-124' })),
    sendCustomReminder: jest.fn(() => Promise.resolve({ success: true, messageId: 'msg-126' })),
    sendExpirationAlert: jest.fn(() => Promise.resolve({ success: true, messageId: 'msg-127' })),
    sendSubmissionExpired: jest.fn(() => Promise.resolve({ success: true, messageId: 'msg-128' })),
    sendDailySummary: jest.fn(() => Promise.resolve({ success: true, messageId: 'msg-129' })),
    sendMassExpirationAlert: jest.fn(() => Promise.resolve({ success: true, messageId: 'msg-130' }))
}));


describe('Communication Service Integration', () => {
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
        keywords: ['test', 'integration', 'communication'],
        category: 'Filosofia',
        ...overrides
    });

    beforeAll(async () => {
        // Set test environment
        process.env.NODE_ENV = 'development'
        process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5433/app_test';
        process.env.FRONTEND_URL = 'http://localhost:3000';
        process.env.FROM_EMAIL = 'test@example.com';

        // Create test admin users
        const passwordHash = await bcrypt.hash(testPassword, 12);

        // Clean up existing submissions
        const suiteCleanupFromSubmissionsEmails = [
            "test@example.com", "comm1@test.com", "comm2@test.com", "reminder@test.com"
        ];
        for (const email of suiteCleanupFromSubmissionsEmails) {
            const existingSubmissions = await db.findByAuthorEmail("submissions", email);
            if (existingSubmissions) {
                for (const submission of existingSubmissions) {
                    await db.delete('submissions', submission.id);
                }
            }
        }

        // Check if test admins exist
        const existingAdmin1 = await db.findByAdminEmail('admins', 'comm_admin1@test.com');
        if (existingAdmin1) {
            testAdmin = existingAdmin1;
        } else {
            testAdmin = await db.create('admins', {
                email: 'comm_admin1@test.com',
                name: 'Communication Admin One',
                password_hash: passwordHash,
                is_active: true
            });
        }

        const existingAdmin2 = await db.findByAdminEmail('admins', 'comm_admin2@test.com');
        if (existingAdmin2) {
            testAdmin2 = existingAdmin2;
        } else {
            testAdmin2 = await db.create('admins', {
                email: 'comm_admin2@test.com',
                name: 'Communication Admin Two',
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

        // Create test submissions with different scenarios
        const submissionData1 = createTestSubmissionData({
            title: 'Active Communication Test',
            author_email: 'comm1@test.com'
        });
        const submissionData2 = createTestSubmissionData({
            title: 'Expiring Communication Test',
            author_email: 'comm2@test.com'
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

        // Update one submission to be expiring soon (2 days) - ainda respeitando a constraint
        const expiringDate = new Date();
        expiringDate.setDate(expiringDate.getDate() + 2);
        await db.update('submissions', testSubmissions[1].id, {
            expires_at: expiringDate,
            updated_at: new Date()
        });
    });

    afterAll(async () => {
        // Clean up test data
        for (const submission of testSubmissions) {
            await db.delete('submissions', submission.id);
        }

        // Clean up communications
        await db.query('DELETE FROM communications WHERE admin_id IN ($1, $2)',
            [testAdmin.id, testAdmin2.id]);

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

    describe('Re-enviar Token', () => {
        test('deve re-enviar token para submissão ativa', async () => {
            const submissionId = testSubmissions[0].id; // Active submission
            const customMessage = 'Por favor, complete sua submissão o mais breve possível.';

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/resend-token`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    customMessage: customMessage
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('sent', true);
            expect(response.body.data).toHaveProperty('message', 'Token reenviado com sucesso');

            // Verificar se comunicação foi registrada
            const commResult = await db.query(
                'SELECT * FROM communications WHERE submission_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT 1',
                [submissionId, 'token_resend']
            );

            expect(commResult.rows.length).toBe(1);
            const communication = commResult.rows[0];
            expect(communication.admin_id).toBe(testAdmin.id);
            expect(communication.recipient_email).toBe('comm1@test.com');
            expect(communication.data).toHaveProperty('hasCustomMessage', true);
            expect(communication.data).toHaveProperty('customMessage', customMessage);
        });

        test('deve re-enviar token sem mensagem personalizada', async () => {
            const submissionId = testSubmissions[0].id;

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/resend-token`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('sent', true);

            // Verificar se comunicação foi registrada sem mensagem
            const commResult = await db.query(
                'SELECT * FROM communications WHERE submission_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT 1',
                [submissionId, 'token_resend']
            );

            const communication = commResult.rows[0];
            expect(communication.data).toHaveProperty('hasCustomMessage', false);
        });

        test('deve retornar erro para submissão inexistente', async () => {
            const nonExistentId = uuid();

            const response = await request(app)
                .post(`/api/admin/communications/${nonExistentId}/resend-token`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    customMessage: 'Test message'
                });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });

        test('deve validar tamanho da mensagem personalizada', async () => {
            const submissionId = testSubmissions[0].id;
            const longMessage = 'a'.repeat(501); // Excede limite de 500 caracteres

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/resend-token`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    customMessage: longMessage
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Dados inválidos');
        });

        test('deve retornar erro sem token de admin', async () => {
            const submissionId = testSubmissions[0].id;

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/resend-token`)
                .send({
                    customMessage: 'Test message'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('Regenerar Token', () => {
        test('deve regenerar e enviar novo token', async () => {
            const submissionId = testSubmissions[0].id;
            const reason = 'Token comprometido por motivos de segurança';

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/regenerate-token`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    reason: reason
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('regenerated', true);
            expect(response.body.data).toHaveProperty('newToken');
            expect(response.body.data).toHaveProperty('message', 'Token regenerado e enviado com sucesso');

            // Verificar se comunicação foi registrada
            const commResult = await db.query(
                'SELECT * FROM communications WHERE submission_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT 1',
                [submissionId, 'token_regenerated']
            );

            expect(commResult.rows.length).toBe(1);
            const communication = commResult.rows[0];
            expect(communication.admin_id).toBe(testAdmin.id);
            expect(communication.data).toHaveProperty('reason', reason);
            expect(communication.data).toHaveProperty('newToken');
        });

        test('deve regenerar token sem motivo específico', async () => {
            const submissionId = testSubmissions[0].id;

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/regenerate-token`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('regenerated', true);
            expect(response.body.data).toHaveProperty('newToken');
        });

        test('deve validar tamanho do motivo', async () => {
            const submissionId = testSubmissions[0].id;
            const longReason = 'a'.repeat(201); // Excede limite de 200 caracteres

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/regenerate-token`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    reason: longReason
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Lembrete Personalizado', () => {
        test('deve enviar lembrete personalizado', async () => {
            const submissionId = testSubmissions[0].id;
            const message = 'Lembre-se de revisar a seção de conclusão do seu artigo.';
            const urgency = 'high';

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/custom-reminder`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    message: message,
                    urgency: urgency
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('sent', true);
            expect(response.body.data).toHaveProperty('message', 'Lembrete enviado com sucesso');

            // Verificar se comunicação foi registrada
            const commResult = await db.query(
                'SELECT * FROM communications WHERE submission_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT 1',
                [submissionId, 'custom_reminder']
            );

            expect(commResult.rows.length).toBe(1);
            const communication = commResult.rows[0];
            expect(communication.admin_id).toBe(testAdmin.id);
            expect(communication.data).toHaveProperty('message', message);
            expect(communication.data).toHaveProperty('urgency', urgency);
            expect(communication.data).toHaveProperty('reminderType', 'manual');
        });

        test('deve usar urgência padrão quando não especificada', async () => {
            const submissionId = testSubmissions[0].id;
            const message = 'Lembrete padrão para o autor.';

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/custom-reminder`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    message: message
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('sent', true);

            // Verificar urgência padrão
            const commResult = await db.query(
                'SELECT * FROM communications WHERE submission_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT 1',
                [submissionId, 'custom_reminder']
            );

            const communication = commResult.rows[0];
            expect(communication.data).toHaveProperty('urgency', 'normal');
        });

        test('deve validar tamanho da mensagem', async () => {
            const submissionId = testSubmissions[0].id;

            // Mensagem muito curta
            let response = await request(app)
                .post(`/api/admin/communications/${submissionId}/custom-reminder`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    message: 'curta' // Menos de 10 caracteres
                });

            expect(response.status).toBe(400);

            // Mensagem muito longa
            response = await request(app)
                .post(`/api/admin/communications/${submissionId}/custom-reminder`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    message: 'a'.repeat(1001) // Mais de 1000 caracteres
                });

            expect(response.status).toBe(400);
        });

        test('deve validar nível de urgência', async () => {
            const submissionId = testSubmissions[0].id;

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/custom-reminder`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    message: 'Mensagem de teste para urgência inválida.',
                    urgency: 'invalid-urgency'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('deve exigir mensagem obrigatória', async () => {
            const submissionId = testSubmissions[0].id;

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/custom-reminder`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    urgency: 'normal'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Histórico de Comunicações', () => {
        test('deve retornar histórico de comunicações', async () => {
            const submissionId = testSubmissions[0].id;

            // Primeiro, criar algumas comunicações
            await request(app)
                .post(`/api/admin/communications/${submissionId}/resend-token`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            await request(app)
                .post(`/api/admin/communications/${submissionId}/custom-reminder`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    message: 'Lembrete para histórico'
                });

            const response = await request(app)
                .get(`/api/admin/communications/history/${submissionId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('submissionId', submissionId);
            expect(response.body.data).toHaveProperty('history');
            expect(response.body.data).toHaveProperty('count');

            const history = response.body.data.history;
            expect(Array.isArray(history)).toBe(true);
            expect(history.length).toBeGreaterThan(0);

            // Verificar estrutura do primeiro item
            const historyItem = history[0];
            expect(historyItem).toHaveProperty('id');
            expect(historyItem).toHaveProperty('submissionId');
            expect(historyItem).toHaveProperty('type');
            expect(historyItem).toHaveProperty('direction');
            expect(historyItem).toHaveProperty('adminId');
            expect(historyItem).toHaveProperty('adminName');
            expect(historyItem).toHaveProperty('createdAt');
        });

        test('deve limitar número de resultados', async () => {
            const submissionId = testSubmissions[0].id;

            const response = await request(app)
                .get(`/api/admin/communications/history/${submissionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ limit: 2 });

            expect(response.status).toBe(200);
            expect(response.body.data.history.length).toBeLessThanOrEqual(2);
        });

        test('deve validar UUID da submissão', async () => {
            const invalidId = 'not-a-uuid';

            const response = await request(app)
                .get(`/api/admin/communications/history/${invalidId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
        });

        test('deve validar limite de resultados', async () => {
            const submissionId = testSubmissions[0].id;

            const response = await request(app)
                .get(`/api/admin/communications/history/${submissionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ limit: 101 }); // Excede limite máximo

            expect(response.status).toBe(400);
        });
    });

    describe('Processar Alertas de Expiração', () => {
        test('deve processar alertas de expiração manualmente', async () => {
            const response = await request(app)
                .post('/api/admin/communications/process-alerts')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('processed', true);
            expect(response.body.data).toHaveProperty('totalAlertsSent');
            expect(response.body.data).toHaveProperty('message');
            expect(response.body.data.message).toContain('alertas de expiração processados');

            expect(typeof response.body.data.totalAlertsSent).toBe('number');
        });

        test('deve registrar ação do admin no log', async () => {
            const response = await request(app)
                .post('/api/admin/communications/process-alerts')
                .set('Authorization', `Bearer ${adminToken2}`);

            expect(response.status).toBe(200);
            // O middleware de logging deve ter registrado a ação
        });
    });

    describe('Resumo Diário', () => {
        test('deve enviar resumo diário manualmente', async () => {
            const response = await request(app)
                .post('/api/admin/communications/daily-summary')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('sent');
            expect(response.body.data).toHaveProperty('totalAdmins');
            expect(response.body.data).toHaveProperty('stats');
            expect(response.body.data).toHaveProperty('message');

            expect(typeof response.body.data.sent).toBe('number');
            expect(typeof response.body.data.totalAdmins).toBe('number');
        });
    });

    describe('Estatísticas de Comunicação', () => {
        test('deve retornar estatísticas de comunicação', async () => {
            const response = await request(app)
                .get('/api/admin/communications/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('period');
            expect(response.body.data).toHaveProperty('stats');
            expect(response.body.data).toHaveProperty('generatedAt');

            const stats = response.body.data.stats;
            expect(stats).toHaveProperty('byType');
            expect(stats).toHaveProperty('total');
            expect(stats).toHaveProperty('period');

            expect(Array.isArray(stats.byType)).toBe(true);
            expect(typeof stats.total).toBe('number');
        });

        test('deve aceitar parâmetro de período personalizado', async () => {
            const customDays = 7;

            const response = await request(app)
                .get('/api/admin/communications/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ days: customDays });

            expect(response.status).toBe(200);
            expect(response.body.data.period).toBe(`${customDays} dias`);
            expect(response.body.data.stats.period).toBe(customDays);
        });

    });

    describe('Error Handling e Validações', () => {
        test('deve retornar erro 401 para token inválido', async () => {
            const submissionId = testSubmissions[0].id;

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/resend-token`)
                .set('Authorization', 'Bearer invalid-token')
                .send({});

            expect(response.status).toBe(401);
        });

        test('deve retornar erro para UUID inválido', async () => {
            const invalidId = 'not-a-uuid';

            const response = await request(app)
                .post(`/api/admin/communications/${invalidId}/resend-token`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('deve tratar erro de serviço de email', async () => {
            // Mock para simular falha no envio de email
            const emailService = require('../../services/email');
            const originalMethod = emailService.sendTokenResend;
            emailService.sendTokenResend = jest.fn(() =>
                Promise.resolve({ success: false, error: 'Email service error' })
            );

            const submissionId = testSubmissions[0].id;

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/resend-token`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');

            // Restaurar método original
            emailService.sendTokenResend = originalMethod;
        });

        test('deve tratar erro de token service', async () => {
            // Mock para simular falha na regeneração de token
            const tokenService = require('../../services/tokens');
            const originalMethod = tokenService.regenerateToken;
            tokenService.regenerateToken = jest.fn(() =>
                Promise.reject(new Error('Token service error'))
            );

            const submissionId = testSubmissions[0].id;

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/regenerate-token`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(response.status).toBe(500);

            // Restaurar método original
            tokenService.regenerateToken = originalMethod;
        });

        test('deve validar dados de entrada obrigatórios', async () => {
            const submissionId = testSubmissions[0].id;

            // Teste com dados vazios para custom reminder
            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/custom-reminder`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Permissões e Segurança', () => {
        test('deve permitir acesso apenas para admins autenticados', async () => {
            const submissionId = testSubmissions[0].id;

            const response = await request(app)
                .post(`/api/admin/communications/${submissionId}/resend-token`)
                .send({});

            expect(response.status).toBe(401);
        });

        test('deve registrar todas as ações nos logs de auditoria', async () => {
            const submissionId = testSubmissions[0].id;

            await request(app)
                .post(`/api/admin/communications/${submissionId}/resend-token`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            // Verificar se a ação foi registrada no log de auditoria
            // (isso dependeria da implementação específica do sistema de auditoria)
        });

    });
});
