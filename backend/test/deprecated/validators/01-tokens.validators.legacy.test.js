/**
 * Testes para TokenValidators
 */
const request = require('supertest');
const express = require('express');
const tokenValidators = require('../../validators/tokens');

// Helper para criar app de teste
const createTestApp = (validators) => {
    const app = express();
    app.use(express.json());

    app.post('/test', validators, (req, res) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        res.json({success: true});
    });

    // Para testar validadores de parâmetros de URL
    app.get('/test/:token', validators, (req, res) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        res.json({success: true});
    });

    // Para testar validadores de parâmetros de query
    app.get('/test', validators, (req, res) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        res.json({success: true});
    });

    return app;
};

describe('TokenValidators', () => {
    describe('validateTokenParam', () => {
        const app = createTestApp(tokenValidators.validateTokenParam);

        test('deve aceitar token válido', async () => {
            const validToken = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

            const response = request(app)
                .get(`/test/${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar token muito curto', async () => {
            const invalidToken = '1234567890abcdef';

            const response = request(app)
                .get(`/test/${invalidToken}`);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'token', msg: expect.stringContaining('Token deve ter exatamente 64 caracteres')
            })]));
        });

        test('deve rejeitar token muito longo', async () => {
            const invalidToken = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

            const response = request(app)
                .get(`/test/${invalidToken}`);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'token', msg: expect.stringContaining('Token deve ter exatamente 64 caracteres')
            })]));
        });

        test('deve rejeitar token com caracteres não hexadecimais', async () => {
            const invalidToken = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg'; // 'g' no final

            const response = request(app)
                .get(`/test/${invalidToken}`);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'token', msg: expect.stringContaining('Token deve conter apenas caracteres hexadecimais')
            })]));
        });
    });

    describe('validateAuthorEmail', () => {
        const app = createTestApp(tokenValidators.validateAuthorEmail);

        test('deve aceitar email válido', async () => {
            const validData = {
                email: 'author@example.com'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar email inválido', async () => {
            const invalidData = {
                email: 'not-an-email'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'email', msg: expect.stringContaining('Email deve ter formato válido')
            })]));
        });

        test('deve rejeitar email muito longo', async () => {
            // Criar um email com mais de 255 caracteres
            const longPrefix = 'a'.repeat(250);
            const invalidData = {
                email: `${longPrefix}@example.com`
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'email', msg: expect.stringContaining('Email muito longo')
            })]));
        });

        test('deve normalizar email', async () => {
            const validData = {
                email: 'AUTHOR@EXAMPLE.COM'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('validateTokenRenewal', () => {
        const app = createTestApp(tokenValidators.validateTokenRenewal);

        test('deve aceitar dias adicionais válidos', async () => {
            const validData = {
                additionalDays: 30
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve aceitar requisição sem dias adicionais', async () => {
            const validData = {};

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar dias adicionais negativos', async () => {
            const invalidData = {
                additionalDays: -10
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'additionalDays', msg: expect.stringContaining('Dias adicionais deve ser entre 1 e 90')
            })]));
        });

        test('deve rejeitar dias adicionais acima do limite', async () => {
            const invalidData = {
                additionalDays: 100
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'additionalDays', msg: expect.stringContaining('Dias adicionais deve ser entre 1 e 90')
            })]));
        });

        test('deve rejeitar dias adicionais não numéricos', async () => {
            const invalidData = {
                additionalDays: 'trinta'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'additionalDays', msg: expect.stringContaining('Dias adicionais deve ser entre 1 e 90')
            })]));
        });
    });

    describe('validateReactivation', () => {
        // Criar app específico para testar parâmetros de URL e corpo
        const app = express();
        app.use(express.json());
        app.post('/test/:submissionId', tokenValidators.validateReactivation, (req, res) => {
            const errors = require('express-validator').validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array()});
            }
            res.json({success: true});
        });

        test('deve aceitar submissionId e expiryDays válidos', async () => {
            const validSubmissionId = '123e4567-e89b-12d3-a456-426614174000';
            const validData = {
                expiryDays: 30
            };

            const response = await request(app)
                .post(`/test/${validSubmissionId}`)
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve aceitar requisição sem expiryDays', async () => {
            const validSubmissionId = '123e4567-e89b-12d3-a456-426614174000';

            const response = await request(app)
                .post(`/test/${validSubmissionId}`)
                .send({});

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar submissionId inválido', async () => {
            const invalidSubmissionId = 'invalid-id';
            const validData = {
                expiryDays: 30
            };

            const response = await request(app)
                .post(`/test/${invalidSubmissionId}`)
                .send(validData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'submissionId', msg: expect.stringContaining('ID da submissão deve ser um UUID válido')
            })]));
        });

        test('deve rejeitar expiryDays negativos', async () => {
            const validSubmissionId = '123e4567-e89b-12d3-a456-426614174000';
            const invalidData = {
                expiryDays: -10
            };

            const response = await request(app)
                .post(`/test/${validSubmissionId}`)
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'expiryDays', msg: expect.stringContaining('Dias para expiração deve ser entre 1 e 90')
            })]));
        });

        test('deve rejeitar expiryDays acima do limite', async () => {
            const validSubmissionId = '123e4567-e89b-12d3-a456-426614174000';
            const invalidData = {
                expiryDays: 100
            };

            const response = await request(app)
                .post(`/test/${validSubmissionId}`)
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'expiryDays', msg: expect.stringContaining('Dias para expiração deve ser entre 1 e 90')
            })]));
        });
    });

    describe('validateDaysQuery', () => {
        const app = createTestApp(tokenValidators.validateDaysQuery);

        test('deve aceitar dias válidos', async () => {
            const response = await request(app)
                .get('/test?days=7');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve aceitar requisição sem dias', async () => {
            const response = await request(app)
                .get('/test');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar dias negativos', async () => {
            const response = await request(app)
                .get('/test?days=-5');

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'days', msg: expect.stringContaining('Dias deve ser entre 1 e 30')
            })]));
        });

        test('deve rejeitar dias acima do limite', async () => {
            const response = await request(app)
                .get('/test?days=40');

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'days', msg: expect.stringContaining('Dias deve ser entre 1 e 30')
            })]));
        });

        test('deve rejeitar dias não numéricos', async () => {
            const response = await request(app)
                .get('/test?days=abc');

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'days', msg: expect.stringContaining('Dias deve ser entre 1 e 30')
            })]));
        });
    });

    describe('validateSubmissionId', () => {
        // Criar app específico para testar parâmetros de URL
        const app = express();
        app.use(express.json());
        app.get('/test/:submissionId', tokenValidators.validateSubmissionId, (req, res) => {
            const errors = require('express-validator').validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array()});
            }
            res.json({success: true});
        });

        test('deve aceitar submissionId válido', async () => {
            const validSubmissionId = '123e4567-e89b-12d3-a456-426614174000';

            const response = await request(app)
                .get(`/test/${validSubmissionId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar submissionId inválido', async () => {
            const invalidSubmissionId = 'invalid-id';

            const response = await request(app)
                .get(`/test/${invalidSubmissionId}`);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({
                path: 'submissionId', msg: expect.stringContaining('ID da submissão deve ser um UUID válido')
            })]));
        });
    });

    describe('sanitizeTokenData', () => {
        const app = express();
        app.use(express.json());
        app.post('/test', tokenValidators.sanitizeTokenData, (req, res) => {
            res.json({
                email: req.body.email, additionalDays: req.body.additionalDays, expiryDays: req.body.expiryDays
            });
        });
        app.get('/test', tokenValidators.sanitizeTokenData, (req, res) => {
            res.json({
                days: req.query.days
            });
        });

        test('deve converter email para minúsculas e remover espaços', async () => {
            const data = {
                email: ' USER@EXAMPLE.COM '
            };

            const response = await request(app)
                .post('/test')
                .send(data);

            expect(response.status).toBe(200);
            expect(response.body.email).toBe('user@example.com');
        });

        test('deve converter additionalDays para número', async () => {
            const data = {
                additionalDays: '30'
            };

            const response = await request(app)
                .post('/test')
                .send(data);

            expect(response.status).toBe(200);
            expect(response.body.additionalDays).toBe(30);
            expect(typeof response.body.additionalDays).toBe('number');
        });

        test('deve converter expiryDays para número', async () => {
            const data = {
                expiryDays: '45'
            };

            const response = await request(app)
                .post('/test')
                .send(data);

            expect(response.status).toBe(200);
            expect(response.body.expiryDays).toBe(45);
            expect(typeof response.body.expiryDays).toBe('number');
        });

        test('deve converter days query param para número', async () => {
            const response = await request(app)
                .get('/test?days=15');

            expect(response.status).toBe(200);
            expect(response.body.days).toBe(15);
            expect(typeof response.body.days).toBe('number');
        });
    });
});
