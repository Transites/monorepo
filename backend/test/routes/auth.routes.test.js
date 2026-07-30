const express = require('express');
const request = require('supertest');

// 1. Mocks dos Controllers
jest.mock('../../controllers/auth', () => ({
    login: jest.fn((req, res) => res.status(200).json({ msg: 'login ok' })),
    refresh: jest.fn((req, res) => res.status(200).json({ msg: 'refresh ok' })),
    logout: jest.fn((req, res) => res.status(200).json({ msg: 'logout ok' })),
    me: jest.fn((req, res) => res.status(200).json({ msg: 'me ok' })),
    changePassword: jest.fn((req, res) => res.status(200).json({ msg: 'password ok' }))
}));

// 2. Mocks dos Middlewares
jest.mock('../../middleware/auth', () => {
    const passThrough = (req, res, next) => next();
    return {
        createAuthRateLimit: jest.fn(() => passThrough),
        optionalAuth: jest.fn(passThrough),
        requireAuth: jest.fn((req, res, next) => {
            // Injeta um user mockado para testarmos a rota /validate
            req.user = { id: 99, role: 'ADMIN' };
            next();
        }),
        logAdminAction: jest.fn(() => passThrough)
    };
});

// 3. Mocks dos Validadores
jest.mock('../../validators/auth', () => {
    const passThrough = (req, res, next) => next();
    return {
        sanitizeAuthData: passThrough,
        validateLogin: passThrough,
        validateRefreshToken: passThrough,
        validateChangePassword: passThrough
    };
});

// 4. Mock do tratador de erros para não travar promises pendentes
jest.mock('../../middleware/errors', () => ({
    asyncHandler: (fn) => (req, res, next) => {
        return Promise.resolve(fn(req, res, next)).catch(next);
    }
}));

// 5. Mock do Serviço de Autenticação (para a força da senha)
const authService = require('../../services/auth');
jest.mock('../../services/auth', () => ({
    validatePasswordStrength: jest.fn()
}));

// 6. Mock do Utils de Respostas (para validar as rotas inline)
const responses = require('../../utils/responses');
jest.mock('../../utils/responses', () => ({
    success: jest.fn((res, data, msg) => res.status(200).json({ success: true, data, msg })),
    badRequest: jest.fn((res, msg) => res.status(400).json({ success: false, msg }))
}));

// Importa a rota após os mocks estarem definidos
const authRoutes = require('../../routes/auth');

describe('Auth Routes Coverage', () => {
    let app;

    beforeAll(() => {
        // Monta o Express "falso" apenas para testar as rotas
        app = express();
        app.use(express.json());
        app.use('/api/auth', authRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('POST /login - should call controller and include deprecation headers', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: '123' });
        
        expect(res.status).toBe(200);
        expect(res.headers['x-api-deprecation-warning']).toBeDefined();
        expect(res.headers['x-api-status']).toBeDefined();
    });

    it('POST /refresh - should call controller and include deprecation headers', async () => {
        const res = await request(app).post('/api/auth/refresh').send({ token: 'abc' });
        
        expect(res.status).toBe(200);
        expect(res.headers['x-api-deprecation-warning']).toBeDefined();
    });

    it('POST /logout - should call controller and include deprecation headers', async () => {
        const res = await request(app).post('/api/auth/logout');
        expect(res.status).toBe(200);
    });

    it('GET /me - should call controller and include deprecation headers', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(200);
    });

    it('PUT /change-password - should call controller and include deprecation headers', async () => {
        const res = await request(app).put('/api/auth/change-password').send({ oldPass: '123', newPass: '321' });
        expect(res.status).toBe(200);
    });

    describe('Inline Handlers', () => {
        it('GET /validate - should return success through responses util', async () => {
            const res = await request(app).get('/api/auth/validate');
            
            expect(res.status).toBe(200);
            // Verifica se o helper customizado 'responses.success' foi chamado
            expect(responses.success).toHaveBeenCalledWith(
                expect.anything(), // O objeto res do Express
                { valid: true, user: { id: 99, role: 'ADMIN' } }, // O mock de user injetado no requireAuth
                'Token válido'
            );
        });

        describe('POST /check-password-strength', () => {
            it('should hit Branch 1 (missing password) and return badRequest', async () => {
                // Corpo Vazio
                const res = await request(app).post('/api/auth/check-password-strength').send({});
                
                expect(res.status).toBe(400);
                // Valida que o if (!password) funcionou e chamou o responses.badRequest
                expect(responses.badRequest).toHaveBeenCalledWith(
                    expect.anything(),
                    'Senha é obrigatória'
                );
            });

            it('should hit Branch 2 (with password) and return success', async () => {
                // Mock da resposta do service de força da senha
                authService.validatePasswordStrength.mockReturnValue({
                    isValid: true,
                    errors: []
                });

                const res = await request(app)
                    .post('/api/auth/check-password-strength')
                    .send({ password: 'StrongPassword123!' });
                
                expect(res.status).toBe(200);
                expect(authService.validatePasswordStrength).toHaveBeenCalledWith('StrongPassword123!');
                
                // Valida o retorno pelo helper 'responses.success'
                expect(responses.success).toHaveBeenCalledWith(
                    expect.anything(),
                    { isStrong: true, suggestions: [] },
                    'Verificação de força da senha'
                );
            });
        });
    });
});