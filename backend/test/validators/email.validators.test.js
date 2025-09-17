/**
 * Testes para EmailValidators
 */
const request = require('supertest');
const express = require('express');
const emailValidators = require('../../validators/email');

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

    return app;
};

describe('EmailValidators', () => {
    describe('validateEmailTest', () => {
        const app = createTestApp(emailValidators.validateEmailTest);

        test('deve aceitar email válido', async () => {
            const validData = {
                testEmail: 'test@example.com'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar email inválido', async () => {
            const invalidData = {
                testEmail: 'invalid-email'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'testEmail',
                        msg: expect.stringContaining('Email de teste deve ter formato válido')
                    })
                ])
            );
        });

        test('deve normalizar email', async () => {
            const unnormalizedEmail = {
                testEmail: 'TEST@EXAMPLE.COM'
            };

            const response = await request(app)
                .post('/test')
                .send(unnormalizedEmail);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('validateResendToken', () => {
        const app = createTestApp(emailValidators.validateResendToken);

        test('deve aceitar UUID válido', async () => {
            const validData = {
                submissionId: '123e4567-e89b-12d3-a456-426614174000'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar UUID inválido', async () => {
            const invalidData = {
                submissionId: 'invalid-uuid'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

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
    });

    describe('validateCustomReminder', () => {
        const app = createTestApp(emailValidators.validateCustomReminder);

        test('deve aceitar dados válidos', async () => {
            const validData = {
                submissionId: '123e4567-e89b-12d3-a456-426614174000',
                message: 'Esta é uma mensagem de lembrete válida com mais de 10 caracteres.'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar UUID inválido', async () => {
            const invalidData = {
                submissionId: 'invalid-uuid',
                message: 'Esta é uma mensagem de lembrete válida.'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

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

        test('deve rejeitar mensagem muito curta', async () => {
            const invalidData = {
                submissionId: '123e4567-e89b-12d3-a456-426614174000',
                message: 'Curta'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

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

            const invalidData = {
                submissionId: '123e4567-e89b-12d3-a456-426614174000',
                message: longMessage
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

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
    });

    describe('validateBulkNotification', () => {
        const app = createTestApp(emailValidators.validateBulkNotification);

        test('deve aceitar dados válidos', async () => {
            const validData = {
                submissionIds: [
                    '123e4567-e89b-12d3-a456-426614174000',
                    '223e4567-e89b-12d3-a456-426614174001'
                ],
                subject: 'Assunto da notificação',
                message: 'Esta é uma mensagem de notificação válida com mais de 10 caracteres.'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar array vazio de submissionIds', async () => {
            const invalidData = {
                submissionIds: [],
                subject: 'Assunto da notificação',
                message: 'Esta é uma mensagem de notificação válida.'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'submissionIds',
                        msg: expect.stringContaining('Deve conter entre 1 e 50 IDs de submissão')
                    })
                ])
            );
        });

        test('deve rejeitar UUID inválido no array', async () => {
            const invalidData = {
                submissionIds: [
                    '123e4567-e89b-12d3-a456-426614174000',
                    'invalid-uuid'
                ],
                subject: 'Assunto da notificação',
                message: 'Esta é uma mensagem de notificação válida.'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'submissionIds[1]',
                        msg: expect.stringContaining('Cada ID deve ser um UUID válido')
                    })
                ])
            );
        });

        test('deve rejeitar assunto muito curto', async () => {
            const invalidData = {
                submissionIds: ['123e4567-e89b-12d3-a456-426614174000'],
                subject: 'Abc',
                message: 'Esta é uma mensagem de notificação válida.'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'subject',
                        msg: expect.stringContaining('Assunto deve ter entre 5 e 200 caracteres')
                    })
                ])
            );
        });

        test('deve rejeitar assunto muito longo', async () => {
            // Criar um assunto com mais de 200 caracteres
            const longSubject = 'a'.repeat(201);

            const invalidData = {
                submissionIds: ['123e4567-e89b-12d3-a456-426614174000'],
                subject: longSubject,
                message: 'Esta é uma mensagem de notificação válida.'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'subject',
                        msg: expect.stringContaining('Assunto deve ter entre 5 e 200 caracteres')
                    })
                ])
            );
        });

        test('deve rejeitar mensagem muito curta', async () => {
            const invalidData = {
                submissionIds: ['123e4567-e89b-12d3-a456-426614174000'],
                subject: 'Assunto da notificação',
                message: 'Curta'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'message',
                        msg: expect.stringContaining('Mensagem deve ter entre 10 e 2000 caracteres')
                    })
                ])
            );
        });

        test('deve rejeitar mensagem muito longa', async () => {
            // Criar uma mensagem com mais de 2000 caracteres
            const longMessage = 'a'.repeat(2001);

            const invalidData = {
                submissionIds: ['123e4567-e89b-12d3-a456-426614174000'],
                subject: 'Assunto da notificação',
                message: longMessage
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'message',
                        msg: expect.stringContaining('Mensagem deve ter entre 10 e 2000 caracteres')
                    })
                ])
            );
        });
    });

    describe('sanitizeEmailData', () => {
        const app = createTestApp(emailValidators.sanitizeEmailData);

        test('deve sanitizar dados de email', async () => {
            const data = {
                testEmail: ' TEST@EXAMPLE.COM ',
                message: '  Mensagem com espaços extras  ',
                subject: '  Assunto com espaços extras  '
            };

            const response = await request(app)
                .post('/test')
                .send(data);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
