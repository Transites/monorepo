const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../app');
const db = require('../../database/client');
const logger = require('../../middleware/logging');

jest.mock('../../middleware/logging');

describe('Auth Integration', () => {
    let testAdmin;
    const testPassword = 'Senha123!';

    beforeAll(async () => {
        // Set test environment
        process.env.NODE_ENV = 'test';
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
    });

    afterAll(async () => {
        // Clean up test data
        if (testAdmin) {
            await db.delete('admins', testAdmin.id);
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

    describe('Login Flow', () => {
        test('fluxo completo: login → acesso protegido → logout', async () => {
            // 1. Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testAdmin.email,
                    password: testPassword
                });

            // Verificar resposta de login
            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body.data).toHaveProperty('accessToken');
            expect(loginResponse.body.data).toHaveProperty('user');
            expect(loginResponse.body.message).toBe('Login realizado com sucesso');

            // Extrair token de acesso
            const accessToken = loginResponse.body.data.accessToken;

            // Verificar se o cookie de refresh token foi definido
            expect(loginResponse.headers['set-cookie']).toBeDefined();
            expect(loginResponse.headers['set-cookie'][0]).toContain('refreshToken');

            // 2. Acesso a rota protegida
            const meResponse = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`);

            // Verificar resposta da rota protegida
            expect(meResponse.status).toBe(200);
            expect(meResponse.body.data).toHaveProperty('id', testAdmin.id);
            expect(meResponse.body.data).toHaveProperty('email', testAdmin.email);
            expect(meResponse.body.data).toHaveProperty('name', testAdmin.name);

            // 3. Logout
            const logoutResponse = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`);

            // Verificar resposta de logout
            expect(logoutResponse.status).toBe(200);
            expect(logoutResponse.body.message).toBe('Logout realizado com sucesso');

            // Verificar se o cookie de refresh token foi limpo
            expect(logoutResponse.headers['set-cookie']).toBeDefined();
            expect(logoutResponse.headers['set-cookie'][0]).toContain('refreshToken=;');
        });

        test('fluxo de refresh token', async () => {
            // 1. Login para obter refresh token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testAdmin.email,
                    password: testPassword
                });

            // Extrair cookie de refresh token
            const cookies = loginResponse.headers['set-cookie'];
            const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refreshToken='));

            // 2. Renovar token de acesso
            const refreshResponse = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', refreshTokenCookie)

            // Verificar resposta de refresh
            expect(refreshResponse.status).toBe(200);
            expect(refreshResponse.body.data).toHaveProperty('accessToken');
            expect(refreshResponse.body.message).toBe('Token renovado com sucesso');

            // Extrair novo token de acesso
            const newAccessToken = refreshResponse.body.data.accessToken;

            // 3. Acessar rota protegida com novo token
            const meResponse = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${newAccessToken}`);

            // Verificar resposta da rota protegida
            expect(meResponse.status).toBe(200);
            expect(meResponse.body.data).toHaveProperty('id', testAdmin.id);
        });

        test('múltiplas sessões simultâneas', async () => {
            // 1. Primeira sessão (dispositivo 1)
            const loginResponse1 = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testAdmin.email,
                    password: testPassword
                });

            // Extrair token de acesso da primeira sessão
            const accessToken1 = loginResponse1.body.data.accessToken;

            // 2. Segunda sessão (dispositivo 2)
            const loginResponse2 = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testAdmin.email,
                    password: testPassword
                });

            // Extrair token de acesso da segunda sessão
            const accessToken2 = loginResponse2.body.data.accessToken;

            // 3. Verificar que ambos os tokens funcionam
            const meResponse1 = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken1}`);

            const meResponse2 = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken2}`);

            // Verificar respostas
            expect(meResponse1.status).toBe(200);
            expect(meResponse2.status).toBe(200);

            // 4. Logout da primeira sessão
            const logoutResponse = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken1}`);

            expect(logoutResponse.status).toBe(200);

            // 5. Verificar que o segundo token ainda funciona
            const meResponse2After = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken2}`);

            expect(meResponse2After.status).toBe(200);
        });
    });

    describe('Password Management', () => {
        test('alteração de senha end-to-end logado', async () => {
            // 1. Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testAdmin.email,
                    password: testPassword
                });

            // Extrair token de acesso
            const accessToken = loginResponse.body.data.accessToken;

            // 2. Alterar senha
            const changePasswordResponse = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: testPassword,
                    newPassword: 'NovaSenha123!',
                    confirmPassword: 'NovaSenha123!'
                });

            // Verificar resposta de alteração de senha
            expect(changePasswordResponse.status).toBe(200);
            expect(changePasswordResponse.body.message).toBe('Senha alterada com sucesso');

            // 3. Verificar que a senha foi realmente alterada no banco
            const updatedAdmin = await db.findById('admins', testAdmin.id);
            const isNewPasswordValid = await bcrypt.compare('NovaSenha123!', updatedAdmin.password_hash);
            expect(isNewPasswordValid).toBe(true);

            // 4. Tentar login com nova senha
            const newLoginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testAdmin.email,
                    password: 'NovaSenha123!'
                });

            // Verificar resposta de login com nova senha
            expect(newLoginResponse.status).toBe(200);
            expect(newLoginResponse.body.message).toBe('Login realizado com sucesso');

            // 5. Restaurar senha original para outros testes
            await db.update('admins', testAdmin.id, {
                password_hash: await bcrypt.hash(testPassword, 12)
            });
        });

        test('reset de senha (quando implementado)', async () => {
            // TODO: Este teste será implementado quando a funcionalidade de reset de senha for desenvolvida
            // Por enquanto, marcamos como pendente
            pending('Funcionalidade de reset de senha ainda não implementada');
        });
    });

    describe('Security', () => {
        test('tentativas de login com credenciais inválidas', async () => {
            // 1. Tentativa de login com email inexistente
            const invalidEmailResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'inexistente@example.com',
                    password: testPassword
                });

            expect(invalidEmailResponse.status).toBe(401);
            expect(invalidEmailResponse.body.error).toBe('Credenciais inválidas');

            // Verificar se o log de segurança foi registrado
            expect(logger.security).toHaveBeenCalledWith(
                'Login attempt with invalid email',
                expect.objectContaining({
                    email: 'inexistente@example.com'
                })
            );

            // 2. Tentativa de login com senha incorreta
            const invalidPasswordResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testAdmin.email,
                    password: 'senha-incorreta'
                });

            expect(invalidPasswordResponse.status).toBe(401);
            expect(invalidPasswordResponse.body.error).toBe('Credenciais inválidas');

            // Verificar se o log de segurança foi registrado
            expect(logger.security).toHaveBeenCalledWith(
                'Login attempt with invalid password',
                expect.objectContaining({
                    adminId: testAdmin.id,
                    email: testAdmin.email
                })
            );
        });

        test('acesso com conta inativa', async () => {
            // 1. Criar um admin inativo
            const inactivePasswordHash = await bcrypt.hash('senha123', 12);
            const inactiveAdmin = await db.create('admins', {
                email: 'inactive@test.com',
                name: 'Admin Inativo',
                password_hash: inactivePasswordHash,
                is_active: false
            });

            // 2. Tentar fazer login com conta inativa
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: inactiveAdmin.email,
                    password: 'senha123'
                });

            expect(loginResponse.status).toBe(403);
            expect(loginResponse.body.error).toBe('Conta desativada');

            // Verificar se o log de segurança foi registrado
            expect(logger.security).toHaveBeenCalledWith(
                'Login attempt with inactive admin',
                expect.objectContaining({
                    adminId: inactiveAdmin.id,
                    email: inactiveAdmin.email
                })
            );

            // 3. Limpar dados de teste
            await db.delete('admins', inactiveAdmin.id);
        });

        test('tokens inválidos rejeitados', async () => {
            // 1. Acesso com token inválido
            const invalidTokenResponse = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token');

            // Verificar resposta
            expect(invalidTokenResponse.status).toBe(401);
            expect(invalidTokenResponse.body.error).toContain('Token');

            // 2. Acesso sem token
            const noTokenResponse = await request(app)
                .get('/api/auth/me');

            // Verificar resposta
            expect(noTokenResponse.status).toBe(401);
            expect(noTokenResponse.body.error).toContain('Token de acesso não fornecido');
        });

        test('refresh token inválido ou expirado', async () => {
            // 1. Tentar refresh com token inválido
            const invalidRefreshResponse = await request(app)
                .post('/api/auth/refresh')
                .set('Cookies', 'refreshToken=invalid-token');

            expect(invalidRefreshResponse.status).toBe(401);
            expect(invalidRefreshResponse.body.error).toContain('Refresh token inválido');

            // 2. Tentar refresh sem token
            const noRefreshTokenResponse = await request(app)
                .post('/api/auth/refresh');

            expect(noRefreshTokenResponse.status).toBe(401);
            expect(noRefreshTokenResponse.body.error).toBe('Refresh token não fornecido');
        });

        test('múltiplas tentativas de login com senha incorreta', async () => {
            // Fazer múltiplas tentativas de login com senha incorreta
            const attempts = [];
            for (let i = 0; i < 3; i++) {
                const attempt = request(app)
                    .post('/api/auth/login')
                    .send({
                        email: testAdmin.email,
                        password: 'senha-incorreta-' + i
                    });
                attempts.push(attempt);
            }

            const responses = await Promise.all(attempts);

            // Verificar que todas as tentativas falharam
            responses.forEach(response => {
                expect(response.status).toBe(401);
                expect(response.body.error).toBe('Credenciais inválidas');
            });

            // Verificar que os logs de segurança foram registrados
            expect(logger.security).toHaveBeenCalledTimes(3);
        });
    });
});
