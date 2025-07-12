const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../app');
const db = require('../../database/client');
const logger = require('../../middleware/logging');

// Only mock the logger, not the email service
jest.mock('../../middleware/logging');

describe('Email Controller Integration', () => {
    let testAdmin;
    let testSubmission;
    const testPassword = 'Senha123!';
    let adminToken;

    process.env.NODE_ENV = 'test';
    // TODO: THIS DATABASE URL OVERRIDE IS NOT WORKING. FIX IT IMMEDIATELY !!!!
    process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5433/app_test';

    beforeAll(async () => {
        // Set test environment

        // Create test admin user
        const passwordHash = await bcrypt.hash(testPassword, 12);
        const existingAdmin = await db.findByAdminEmail("admins", "admin@iea.usp.br");
        if (existingAdmin) {
            // If admin already exists, delete it to ensure a clean state
            await db.delete('admins', existingAdmin.id);
        }
        testAdmin = await db.create('admins', {
            email: 'admin@iea.usp.br',
            name: 'Admin Teste',
            password_hash: passwordHash,
            is_active: true
        });

        // Create test submission
        const existingSubmission = await db.findByAuthorEmail("submissions", "gus.araujo@outlook.com");
        if (existingSubmission) {
            for (const submission of existingSubmission) {
                await db.delete('submissions', submission.id);
            }
        }

        testSubmission = await db.create('submissions', {
            title: 'Test Submission',
            author_name: 'Test Author',
            author_email: 'gus.araujo@outlook.com',
            status: 'DRAFT',
            created_at: new Date(),
            updated_at: new Date(),
            token: 'test-token-123'
        });
    });

    afterAll(async () => {
        // Clean up test data
        if (testAdmin) {
            await db.delete('admins', testAdmin.id);
        }
        if (testSubmission) {
            await db.delete('submissions', testSubmission.id);
        }
        // Close database connection
        await db.close();
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        logger.audit = jest.fn();
        logger.security = jest.fn();
        logger.error = jest.fn();

        // Login as admin to get token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: testAdmin.email,
                password: testPassword
            });

        adminToken = loginResponse.body.data.accessToken;
    });

    describe('Test Email Configuration', () => {
        test('POST /api/admin/email/test - successful test', async () => {
            const response = await request(app)
                .post('/api/admin/email/test')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    testEmail: 'gus.araujo@outlook.com'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Email de teste enviado com sucesso');
            expect(response.body.data).toHaveProperty('success', true);
            expect(logger.audit).toHaveBeenCalledWith('Email configuration test executed', expect.any(Object));
        });

        test('POST /api/admin/email/test - invalid data', async () => {
            const response = await request(app)
                .post('/api/admin/email/test')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    testEmail: 'invalid-email'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Dados inválidos');
        });
    });

    describe('Resend Token', () => {
        test('POST /api/admin/email/resend-token - successful resend', async () => {
            const response = await request(app)
                .post('/api/admin/email/resend-token')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    submissionId: testSubmission.id
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Token reenviado por email');
            expect(response.body.data).toHaveProperty('sent', true);
            expect(response.body.data).toHaveProperty('authorEmail', 'gus.araujo@outlook.com');
            expect(logger.audit).toHaveBeenCalledWith('Token email resent by admin', expect.any(Object));
        });

        test('POST /api/admin/email/resend-token - submission not found', async () => {
            const response = await request(app)
                .post('/api/admin/email/resend-token')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    submissionId: 'non-existent-id'
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Submissão não encontrada');
        });

        test('POST /api/admin/email/resend-token - invalid data', async () => {
            const response = await request(app)
                .post('/api/admin/email/resend-token')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    // Missing submissionId
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Dados inválidos');
        });
    });

    describe('Send Custom Reminder', () => {
        test('POST /api/admin/email/send-reminder - successful reminder', async () => {
            const response = await request(app)
                .post('/api/admin/email/send-reminder')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    submissionId: testSubmission.id,
                    message: 'This is a test reminder message.'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Lembrete enviado com sucesso');
            expect(response.body.data).toHaveProperty('sent', true);
            expect(response.body.data).toHaveProperty('authorEmail', 'gus.araujo@outlook.com');
            expect(logger.audit).toHaveBeenCalledWith('Custom reminder sent by admin', expect.any(Object));
        });

        test('POST /api/admin/email/send-reminder - submission not found', async () => {
            const response = await request(app)
                .post('/api/admin/email/send-reminder')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    submissionId: 'non-existent-id',
                    message: 'This is a test reminder message.'
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Submissão não encontrada');
        });

        test('POST /api/admin/email/send-reminder - invalid data', async () => {
            const response = await request(app)
                .post('/api/admin/email/send-reminder')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    submissionId: testSubmission.id
                    // Missing message
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Dados inválidos');
        });
    });

    describe('Get Email Stats', () => {
        test('GET /api/admin/email/stats - successful stats retrieval', async () => {
            const response = await request(app)
                .get('/api/admin/email/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Estatísticas de email recuperadas');
            expect(response.body.data).toHaveProperty('stats');
            expect(response.body.data).toHaveProperty('timestamp');
        });
    });

    describe('Send Bulk Notification', () => {
        test('POST /api/admin/email/bulk-notification - successful bulk notification', async () => {
            const response = await request(app)
                .post('/api/admin/email/bulk-notification')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    submissionIds: [testSubmission.id],
                    subject: 'Test Bulk Notification',
                    message: 'This is a test bulk notification message.'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('Notificação enviada');
            expect(response.body.data).toHaveProperty('results');
            expect(response.body.data).toHaveProperty('summary');
            expect(response.body.data.summary).toHaveProperty('total', 1);
            expect(response.body.data.summary).toHaveProperty('successful', 1);
            expect(response.body.data.summary).toHaveProperty('failed', 0);
            expect(logger.audit).toHaveBeenCalledWith('Bulk notification sent by admin', expect.any(Object));
        });

        test('POST /api/admin/email/bulk-notification - some submissions not found', async () => {
            const response = await request(app)
                .post('/api/admin/email/bulk-notification')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    submissionIds: [testSubmission.id, 'non-existent-id'],
                    subject: 'Test Bulk Notification',
                    message: 'This is a test bulk notification message.'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.summary).toHaveProperty('total', 2);
            expect(response.body.data.summary).toHaveProperty('successful', 1);
            expect(response.body.data.summary).toHaveProperty('failed', 1);
            expect(response.body.data.results).toContainEqual(
                expect.objectContaining({
                    submissionId: 'non-existent-id',
                    success: false,
                    error: 'Submissão não encontrada'
                })
            );
        });

        test('POST /api/admin/email/bulk-notification - invalid data', async () => {
            const response = await request(app)
                .post('/api/admin/email/bulk-notification')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    // Missing required fields
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Dados inválidos');
        });
    });

    describe('Unauthorized Access', () => {
        test('All admin routes - unauthorized access', async () => {
            const routes = [
                { method: 'post', path: '/api/admin/email/test', body: { testEmail: 'gus.araujo@outlook.com' } },
                { method: 'post', path: '/api/admin/email/resend-token', body: { submissionId: testSubmission.id } },
                { method: 'post', path: '/api/admin/email/send-reminder', body: { submissionId: testSubmission.id, message: 'Test' } },
                { method: 'get', path: '/api/admin/email/stats' },
                { method: 'post', path: '/api/admin/email/bulk-notification', body: { submissionIds: [testSubmission.id], subject: 'Test', message: 'Test' } }
            ];

            for (const route of routes) {
                const response = await request(app)[route.method](route.path)
                    .send(route.body || {});

                expect(response.status).toBe(401);
                expect(response.body.error).toContain('Token de acesso não fornecido');
            }
        });
    });
});
