/**
 * Testes para SubmissionValidators
 */
import request from 'supertest';
import express from 'express';
import submissionValidators from '../../validators/submission';
import constants from '../../utils/constants';

// Mock dependencies
jest.mock('../../utils/responses');

// Helper para criar app de teste
const createTestApp = (validators: any) => {
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

describe('SubmissionValidators', () => {
    // Para testes que precisam de mocks diretos
    let mockRequest;
    let mockResponse;
    let mockNext;

    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
            query: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();

        jest.clearAllMocks();
    });

    describe('validateCreateSubmission', () => {
        const app = createTestApp(submissionValidators.validateCreateSubmission);

        test('deve aceitar dados válidos', async () => {
            const validData = {
                author_name: 'Test Author',
                author_email: 'test@example.com',
                title: 'Test Submission Title',
                summary: 'This is a test summary',
                content: 'This is test content',
                keywords: ['test', 'submission'],
                category: 'Outros'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar campos obrigatórios vazios', async () => {
            const invalidData = {
                author_name: '',  // Empty
                author_email: '', // Empty
                title: ''         // Empty
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'author_name',
                        msg: expect.stringContaining('Nome do autor deve ter entre 2 e 255 caracteres')
                    }),
                    expect.objectContaining({
                        path: 'author_email',
                        msg: expect.stringContaining('Email deve ter formato válido')
                    }),
                    expect.objectContaining({
                        path: 'title',
                        msg: expect.stringContaining('Título deve ter entre 5 e')
                    })
                ])
            );
        });

        test('deve validar limites de tamanho', async () => {
            const invalidData = {
                author_name: 'Test Author',
                author_email: 'test@example.com',
                title: 'A'.repeat(constants.LIMITS.TITLE_MAX + 1), // Too long
                summary: 'A'.repeat(constants.LIMITS.SUMMARY_MAX + 1), // Too long
                content: 'A'.repeat(constants.LIMITS.CONTENT_MAX + 1) // Too long
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'title',
                        msg: expect.stringContaining(`Título deve ter entre 5 e ${constants.LIMITS.TITLE_MAX} caracteres`)
                    }),
                    expect.objectContaining({
                        path: 'summary',
                        msg: expect.stringContaining(`Resumo muito longo`)
                    }),
                    expect.objectContaining({
                        path: 'content',
                        msg: expect.stringContaining(`Conteúdo muito longo`)
                    })
                ])
            );
        });

        test('deve validar formato de email', async () => {
            const invalidData = {
                author_name: 'Test Author',
                author_email: 'invalid-email', // Invalid email
                title: 'Test Submission'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'author_email',
                        msg: expect.stringContaining('Email deve ter formato válido')
                    })
                ])
            );
        });
    });

    describe('validateCompleteness', () => {
        const app = createTestApp(submissionValidators.validateCompleteness);

        test('deve permitir submissão completa', async () => {
            const validData = {
                title: 'Test Title',
                summary: 'This is a summary that is long enough to pass validation. It needs to be at least 50 characters.',
                content: 'This is the content of the submission. It needs to be at least 100 characters long to pass validation. So I am adding more text to make sure it passes.',
                keywords: ['test', 'submission'],
                category: 'Outros'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve bloquear submissão incompleta', async () => {
            const invalidData = {
                title: 'Test', // Too short
                summary: 'Short summary', // Too short
                content: 'Short content', // Too short
                keywords: [], // Empty
                category: null // Missing
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'title',
                        msg: 'Título deve ter pelo menos 5 caracteres'
                    }),
                    expect.objectContaining({
                        path: 'summary',
                        msg: 'Resumo deve ter pelo menos 50 caracteres'
                    }),
                    expect.objectContaining({
                        path: 'content',
                        msg: 'Conteúdo deve ter pelo menos 100 caracteres'
                    }),
                    expect.objectContaining({
                        path: 'keywords',
                        msg: 'Pelo menos 1 palavra-chave é obrigatória'
                    }),
                    expect.objectContaining({
                        path: 'category',
                        msg: 'Categoria é obrigatória'
                    })
                ])
            );
        });

        test('deve listar campos faltantes', async () => {
            const invalidData = {
                title: 'Test Title', // OK
                summary: 'Short', // Too short
                content: 'Short', // Too short
                keywords: [], // Empty
                category: null // Missing
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'summary',
                        msg: 'Resumo deve ter pelo menos 50 caracteres'
                    }),
                    expect.objectContaining({
                        path: 'content',
                        msg: 'Conteúdo deve ter pelo menos 100 caracteres'
                    }),
                    expect.objectContaining({
                        path: 'keywords',
                        msg: 'Pelo menos 1 palavra-chave é obrigatória'
                    }),
                    expect.objectContaining({
                        path: 'category',
                        msg: 'Categoria é obrigatória'
                    })
                ])
            );
        });
    });

    describe('validateTokenParam', () => {
        // Para validadores de parâmetros, precisamos de uma rota com parâmetros
        const createParamTestApp = (validators: any) => {
            const app = express();
            app.use(express.json());

            app.get('/test/:token', validators, (req, res) => {
                const errors = require('express-validator').validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                res.json({ success: true });
            });

            return app;
        };

        const app = createParamTestApp(submissionValidators.validateTokenParam);

        test('deve aceitar token válido', async () => {
            const validToken = 'a'.repeat(64); // Valid token (64 hex chars)

            const response = await request(app)
                .get(`/test/${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar token inválido', async () => {
            const invalidToken = 'invalid-token'; // Invalid token

            const response = await request(app)
                .get(`/test/${invalidToken}`);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'token',
                        msg: expect.stringContaining('Token deve ter exatamente 64 caracteres')
                    })
                ])
            );
        });
    });

    describe('validateAttachment', () => {
        const app = createTestApp(submissionValidators.validateAttachment);

        test('deve aceitar anexo válido', async () => {
            const validData = {
                filename: 'test.pdf',
                url: 'https://example.com/test.pdf',
                file_type: 'application/pdf',
                size: 1024 // 1KB
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar anexo inválido', async () => {
            const invalidData = {
                filename: '', // Empty
                url: 'not-a-url', // Invalid URL
                file_type: 'invalid/type', // Invalid type
                size: 0 // Invalid size
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'filename',
                        msg: expect.stringContaining('Nome do arquivo deve ter entre 1 e 255 caracteres')
                    }),
                    expect.objectContaining({
                        path: 'url',
                        msg: expect.stringContaining('URL do arquivo deve ser válida')
                    }),
                    expect.objectContaining({
                        path: 'file_type',
                        msg: expect.stringContaining('Tipo de arquivo deve ser um dos')
                    }),
                    expect.objectContaining({
                        path: 'size',
                        msg: expect.stringContaining('Tamanho do arquivo deve ser entre 1 byte e')
                    })
                ])
            );
        });
    });
});
