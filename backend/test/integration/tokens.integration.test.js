const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../app');
const db = require('../../database/client');
const logger = require('../../middleware/logging');
const tokenService = require('../../services/tokens');
const constants = require('../../utils/constants');
const uuid = require('uuid').v4;

jest.mock('../../middleware/logging');

describe('Token Routes Integration', () => {
    let testAdmin;
    let testSubmission;
    let testToken;
    let expiredSubmission;
    let expiredToken;
    const testPassword = 'Senha123!';

    beforeAll(async () => {
        // Set test environment
        process.env.NODE_ENV = 'development'
        process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5433/app_test';

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

        // Create test submission with token
        const existingSubmission = await db.findByAuthorEmail("submissions", "author@test.com");
        if (existingSubmission) {
            await db.delete('submissions', existingSubmission.id);
        }

        testSubmission = await db.create('submissions', {
            title: 'Test Submission',
            author_name: 'Test Author',
            author_email: 'author@test.com',
            status: constants.SUBMISSION_STATUS.DRAFT,
            token: uuid()
        });

        // Create token for test submission
        const tokenResult = await tokenService.createSubmissionToken(testSubmission.id);
        testToken = tokenResult.token;

        // Update submission with token
        await db.update('submissions', testSubmission.id, {
            token: testToken,
            expires_at: tokenResult.expiresAt
        });

        // Create expired submission with token
        expiredSubmission = await db.create('submissions', {
            title: 'Expired Submission',
            author_name: 'Expired Author',
            author_email: 'expired@test.com',
            status: constants.SUBMISSION_STATUS.EXPIRED,
            created_at: new Date(),
            updated_at: new Date(),
            token: uuid(),
        });

        // Create token for expired submission
        const expiredTokenResult = await tokenService.createSubmissionToken(expiredSubmission.id);
        expiredToken = expiredTokenResult.token;

        // Set expired date in the past
        const expiredDate = new Date();
        expiredDate.setDate(expiredDate.getDate() - 10);

        // Update expired submission with token and expired date
        await db.update('submissions', expiredSubmission.id, {
            token: expiredToken,
            expires_at: expiredDate
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
        if (expiredSubmission) {
            await db.delete('submissions', expiredSubmission.id);
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

    describe('Public Token Routes', () => {
        test('GET /api/tokens/:token/validate - valid token', async () => {
            const response = await request(app)
                .get(`/api/tokens/${testToken}/validate`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Token válido');
            expect(response.body.data).toHaveProperty('submission');
            expect(response.body.data).toHaveProperty('tokenInfo');
            expect(response.body.data.submission.id).toBe(testSubmission.id);
            expect(response.body.data.submission.title).toBe(testSubmission.title);
        });

        test('GET /api/tokens/:token/validate - expired token', async () => {
            const response = await request(app)
                .get(`/api/tokens/${expiredToken}/validate`);

            expect(response.status).toBe(410);
            expect(response.body.error).toBe('Token expirado');
            expect(response.body.details).toHaveProperty('reason', 'TOKEN_EXPIRED');
            expect(response.body.details).toHaveProperty('canRecover', true);
        });

        test('GET /api/tokens/:token/validate - invalid token', async () => {
            const response = await request(app)
                .get('/api/tokens/invalidtoken123/validate');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Formato de token inválido');
        });

        test('POST /api/tokens/:token/verify-email - valid email', async () => {
            const response = await request(app)
                .post(`/api/tokens/${testToken}/verify-email`)
                .send({
                    email: testSubmission.author_email
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Email verificado com sucesso');
            expect(response.body.data).toHaveProperty('verified', true);
            expect(response.body.data).toHaveProperty('submission');
            expect(response.body.data.submission.id).toBe(testSubmission.id);
        });

        test('POST /api/tokens/:token/verify-email - invalid email', async () => {
            const response = await request(app)
                .post(`/api/tokens/${testToken}/verify-email`)
                .send({
                    email: 'wrong@email.com'
                });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Email não confere com o autor da submissão');
        });

        test('POST /api/tokens/:token/renew - valid token and email', async () => {
            // First verify email to set up session
            await request(app)
                .post(`/api/tokens/${testToken}/verify-email`)
                .send({
                    email: testSubmission.author_email
                });

            // Then renew token
            const response = await request(app)
                .post(`/api/tokens/${testToken}/renew`)
                .send({
                    email: testSubmission.author_email,
                    additionalDays: 30
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Token renovado com sucesso');
            expect(response.body.data).toHaveProperty('renewed', true);
            expect(response.body.data).toHaveProperty('additionalDays', 30);
        });
    });

    describe('Admin Token Routes', () => {
        let adminToken;

        beforeEach(async () => {
            // Login as admin to get token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testAdmin.email,
                    password: testPassword
                });

            adminToken = loginResponse.body.data.accessToken;
        });

        test('POST /api/admin/tokens/:submissionId/regenerate - regenerate token', async () => {
            const response = await request(app)
                .post(`/api/admin/tokens/${testSubmission.id}/regenerate`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Token regenerado com sucesso');
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('expiresAt');
            expect(response.body.data).toHaveProperty('submission');
            expect(response.body.data.submission.id).toBe(testSubmission.id);
        });

        test('POST /api/admin/tokens/:submissionId/reactivate - reactivate expired submission', async () => {
            const response = await request(app)
                .post(`/api/admin/tokens/${expiredSubmission.id}/reactivate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    expiryDays: 30
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Submissão reativada com sucesso');
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('status');
            expect(response.body.data).toHaveProperty('expiresAt');
            expect(response.body.data).toHaveProperty('submission');
            expect(response.body.data.submission.id).toBe(expiredSubmission.id);
        });

        test('GET /api/admin/tokens/expiring - list expiring submissions', async () => {
            const response = await request(app)
                .get('/api/admin/tokens/expiring')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ days: 7 });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Submissões próximas do vencimento');
            expect(response.body.data).toHaveProperty('submissions');
            expect(response.body.data).toHaveProperty('daysAhead', 7);
            expect(response.body.data).toHaveProperty('count');
            expect(Array.isArray(response.body.data.submissions)).toBe(true);
        });

        test('POST /api/admin/tokens/cleanup - cleanup expired tokens', async () => {
            const response = await request(app)
                .post('/api/admin/tokens/cleanup')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('tokens expirados limpos');
            expect(response.body.data).toHaveProperty('expiredCount');
            expect(response.body.data).toHaveProperty('expiredSubmissions');
            expect(Array.isArray(response.body.data.expiredSubmissions)).toBe(true);
        });

        test('GET /api/admin/tokens/stats - get token statistics', async () => {
            const response = await request(app)
                .get('/api/admin/tokens/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Estatísticas de tokens');
            expect(response.body.data).toHaveProperty('stats');
            expect(response.body.data).toHaveProperty('timestamp');
        });

        test('Admin routes - unauthorized access', async () => {
            const routes = [
                { method: 'post', path: `/api/admin/tokens/${testSubmission.id}/regenerate` },
                { method: 'post', path: `/api/admin/tokens/${expiredSubmission.id}/reactivate` },
                { method: 'get', path: '/api/admin/tokens/expiring' },
                { method: 'post', path: '/api/admin/tokens/cleanup' },
                { method: 'get', path: '/api/admin/tokens/stats' }
            ];

            for (const route of routes) {
                const response = await request(app)[route.method](route.path);
                expect(response.status).toBe(401);
                expect(response.body.error).toContain('Token de acesso não fornecido');
            }
        });
    });
});
