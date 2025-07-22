const request = require('supertest');
const express = require('express');
const communicationValidators = require('../../validators/communication');

// Helper para criar app de teste
const createTestApp = (validators) => {
    const app = express();
    app.use(express.json());

    app.post('/test', validators, (req, res) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        res.json({ success: true });
    });

    // Para testes com parâmetros de rota
    app.post('/test/:submissionId', validators, (req, res) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        res.json({ success: true });
    });

    // Para testes com parâmetros de query
    app.get('/test', validators, (req, res) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        res.json({ success: true });
    });

    // Para testes com parâmetros de rota e query
    app.get('/test/:submissionId', validators, (req, res) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        res.json({ success: true });
    });

    return app;
};

describe('CommunicationValidators', () => {
    describe('validateResendToken', () => {
        const app = createTestApp(communicationValidators.validateResendToken());

        test('deve aceitar UUID válido e mensagem personalizada opcional', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    customMessage: 'Esta é uma mensagem personalizada válida'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve aceitar UUID válido sem mensagem personalizada', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({});

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar UUID inválido', async () => {
            const response = await request(app)
                .post('/test/invalid-uuid')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'submissionId',
                        msg: expect.stringContaining('ID da submissão deve ser um UUID válido')
                    })
                ])
            );
        });

        test('deve rejeitar mensagem personalizada muito longa', async () => {
            // Criar uma mensagem com mais de 500 caracteres
            const longMessage = 'a'.repeat(501);

            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    customMessage: longMessage
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'customMessage',
                        msg: expect.stringContaining('Mensagem personalizada deve ter no máximo 500 caracteres')
                    })
                ])
            );
        });

        test('deve rejeitar mensagem personalizada não string', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    customMessage: 123
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'customMessage'
                    })
                ])
            );
        });
    });

    describe('validateRegenerateToken', () => {
        const app = createTestApp(communicationValidators.validateRegenerateToken());

        test('deve aceitar UUID válido e motivo opcional', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    reason: 'Motivo para regenerar o token'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve aceitar UUID válido sem motivo', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({});

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar UUID inválido', async () => {
            const response = await request(app)
                .post('/test/invalid-uuid')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'submissionId',
                        msg: expect.stringContaining('ID da submissão deve ser um UUID válido')
                    })
                ])
            );
        });

        test('deve rejeitar motivo muito longo', async () => {
            // Criar um motivo com mais de 200 caracteres
            const longReason = 'a'.repeat(201);

            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    reason: longReason
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'reason',
                        msg: expect.stringContaining('Motivo deve ter no máximo 200 caracteres')
                    })
                ])
            );
        });

        test('deve rejeitar motivo não string', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    reason: 123
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'reason'
                    })
                ])
            );
        });
    });

    describe('validateReactivateSubmission', () => {
        const app = createTestApp(communicationValidators.validateReactivateSubmission());

        test('deve aceitar UUID válido e dias de expiração opcionais', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    newExpiryDays: 30
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve aceitar UUID válido sem dias de expiração', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({});

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar UUID inválido', async () => {
            const response = await request(app)
                .post('/test/invalid-uuid')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'submissionId',
                        msg: expect.stringContaining('ID da submissão deve ser um UUID válido')
                    })
                ])
            );
        });

        test('deve rejeitar dias de expiração menores que 1', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    newExpiryDays: 0
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'newExpiryDays',
                        msg: expect.stringContaining('Dias de expiração deve ser entre 1 e 365')
                    })
                ])
            );
        });

        test('deve rejeitar dias de expiração maiores que 365', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    newExpiryDays: 366
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'newExpiryDays',
                        msg: expect.stringContaining('Dias de expiração deve ser entre 1 e 365')
                    })
                ])
            );
        });

        test('deve rejeitar dias de expiração não numéricos', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    newExpiryDays: 'trinta'
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'newExpiryDays'
                    })
                ])
            );
        });
    });

    describe('validateCustomReminder', () => {
        const app = createTestApp(communicationValidators.validateCustomReminder());

        test('deve aceitar dados válidos com urgência opcional', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    message: 'Esta é uma mensagem de lembrete válida com mais de 10 caracteres.',
                    urgency: 'high'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve aceitar dados válidos sem urgência', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    message: 'Esta é uma mensagem de lembrete válida com mais de 10 caracteres.'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar UUID inválido', async () => {
            const response = await request(app)
                .post('/test/invalid-uuid')
                .send({
                    message: 'Esta é uma mensagem de lembrete válida com mais de 10 caracteres.'
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'submissionId',
                        msg: expect.stringContaining('ID da submissão deve ser um UUID válido')
                    })
                ])
            );
        });

        test('deve rejeitar mensagem ausente', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'message'
                    })
                ])
            );
        });

        test('deve rejeitar mensagem muito curta', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    message: 'Curta'
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'message',
                        msg: expect.stringContaining('Mensagem deve ter entre 10 e 1000 caracteres')
                    })
                ])
            );
        });

        test('deve rejeitar mensagem muito longa', async () => {
            // Criar uma mensagem com mais de 1000 caracteres
            const longMessage = 'a'.repeat(1001);

            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    message: longMessage
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'message',
                        msg: expect.stringContaining('Mensagem deve ter entre 10 e 1000 caracteres')
                    })
                ])
            );
        });

        test('deve rejeitar urgência inválida', async () => {
            const response = await request(app)
                .post('/test/123e4567-e89b-12d3-a456-426614174000')
                .send({
                    message: 'Esta é uma mensagem de lembrete válida com mais de 10 caracteres.',
                    urgency: 'invalid'
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'urgency',
                        msg: expect.stringContaining('Urgência deve ser: low, normal, high ou urgent')
                    })
                ])
            );
        });
    });

    describe('validateCommunicationHistory', () => {
        const app = createTestApp(communicationValidators.validateCommunicationHistory());

        test('deve aceitar UUID válido e limite opcional', async () => {
            const response = await request(app)
                .get('/test/123e4567-e89b-12d3-a456-426614174000?limit=50');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve aceitar UUID válido sem limite', async () => {
            const response = await request(app)
                .get('/test/123e4567-e89b-12d3-a456-426614174000');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar UUID inválido', async () => {
            const response = await request(app)
                .get('/test/invalid-uuid');

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'submissionId',
                        msg: expect.stringContaining('ID da submissão deve ser um UUID válido')
                    })
                ])
            );
        });

        test('deve rejeitar limite menor que 1', async () => {
            const response = await request(app)
                .get('/test/123e4567-e89b-12d3-a456-426614174000?limit=0');

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'limit',
                        msg: expect.stringContaining('Limite deve ser entre 1 e 100')
                    })
                ])
            );
        });

        test('deve rejeitar limite maior que 100', async () => {
            const response = await request(app)
                .get('/test/123e4567-e89b-12d3-a456-426614174000?limit=101');

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'limit',
                        msg: expect.stringContaining('Limite deve ser entre 1 e 100')
                    })
                ])
            );
        });

        test('deve rejeitar limite não numérico', async () => {
            const response = await request(app)
                .get('/test/123e4567-e89b-12d3-a456-426614174000?limit=abc');

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'limit'
                    })
                ])
            );
        });
    });

    describe('validateCommunicationStats', () => {
        const app = createTestApp(communicationValidators.validateCommunicationStats());

        test('deve aceitar dias opcionais', async () => {
            const response = await request(app)
                .get('/test?days=30');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve aceitar sem parâmetro de dias', async () => {
            const response = await request(app)
                .get('/test');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar dias menor que 1', async () => {
            const response = await request(app)
                .get('/test?days=0');

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'days',
                        msg: expect.stringContaining('Período deve ser entre 1 e 365 dias')
                    })
                ])
            );
        });

        test('deve rejeitar dias maior que 365', async () => {
            const response = await request(app)
                .get('/test?days=366');

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'days',
                        msg: expect.stringContaining('Período deve ser entre 1 e 365 dias')
                    })
                ])
            );
        });

        test('deve rejeitar dias não numérico', async () => {
            const response = await request(app)
                .get('/test?days=abc');

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'days'
                    })
                ])
            );
        });
    });
});
