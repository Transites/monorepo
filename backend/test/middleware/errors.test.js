const express = require('express');
const request = require('supertest');
const errorHandler = require('../../middleware/errors');

// Mock the logger to avoid actual logging during tests
jest.mock('../../middleware/logging', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

describe('Error Handler Middleware Tests', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    describe('Not Found Handler', () => {
        test('should pass 404 error to next middleware', () => {
            const req = { originalUrl: '/not-found' };
            const res = {};
            const next = jest.fn();

            errorHandler.notFound(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error).toBeInstanceOf(Error);
            expect(error.status).toBe(404);
            expect(error.message).toContain('/not-found');
        });
    });

    describe('General Error Handler', () => {
        test('should handle generic errors', async () => {
            app.get('/error', (req, res, next) => {
                const error = new Error('Test error');
                next(error);
            });
            app.use(errorHandler.general);

            const response = await request(app).get('/error');

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('timestamp');
        });

        test('should handle errors with status code', async () => {
            app.get('/bad-request', (req, res, next) => {
                const error = new Error('Bad request');
                error.status = 400;
                next(error);
            });
            app.use(errorHandler.general);

            const response = await request(app).get('/bad-request');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('should handle validation errors', async () => {
            app.get('/validation-error', (req, res, next) => {
                const error = new Error('Validation failed');
                error.name = 'ValidationError';
                error.errors = {
                    field1: { path: 'field1', message: 'Required', value: null },
                    field2: { path: 'field2', message: 'Invalid', value: 'test' }
                };
                next(error);
            });
            app.use(errorHandler.general);

            const response = await request(app).get('/validation-error');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Dados inválidos');
            expect(response.body).toHaveProperty('details');
        });

        test('should handle Joi validation errors', async () => {
            app.get('/joi-error', (req, res, next) => {
                const error = new Error('Validation failed');
                error.name = 'ValidationError';
                error.details = [
                    { path: ['field1'], message: 'Required', context: { value: null } },
                    { path: ['field2'], message: 'Invalid', context: { value: 'test' } }
                ];
                next(error);
            });
            app.use(errorHandler.general);

            const response = await request(app).get('/joi-error');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Dados inválidos');
            expect(response.body).toHaveProperty('details');
        });

        test('should handle unauthorized errors', async () => {
            app.get('/unauthorized', (req, res, next) => {
                const error = new Error('Unauthorized');
                error.name = 'UnauthorizedError';
                next(error);
            });
            app.use(errorHandler.general);

            const response = await request(app).get('/unauthorized');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Não autorizado');
        });

        test('should handle forbidden errors', async () => {
            app.get('/forbidden', (req, res, next) => {
                const error = new Error('Forbidden');
                error.name = 'ForbiddenError';
                next(error);
            });
            app.use(errorHandler.general);

            const response = await request(app).get('/forbidden');

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error', 'Acesso negado');
        });

        test('should handle PostgreSQL unique violation', async () => {
            app.get('/duplicate', (req, res, next) => {
                const error = new Error('Duplicate key');
                error.code = '23505';
                next(error);
            });
            app.use(errorHandler.general);

            const response = await request(app).get('/duplicate');

            expect(response.status).toBe(409);
            expect(response.body).toHaveProperty('error', 'Recurso já existe');
        });

        test('should handle PostgreSQL foreign key violation', async () => {
            app.get('/foreign-key', (req, res, next) => {
                const error = new Error('Foreign key violation');
                error.code = '23503';
                next(error);
            });
            app.use(errorHandler.general);

            const response = await request(app).get('/foreign-key');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Referência inválida');
        });

        test('should handle connection refused errors', async () => {
            app.get('/connection-refused', (req, res, next) => {
                const error = new Error('Connection refused');
                error.code = 'ECONNREFUSED';
                next(error);
            });
            app.use(errorHandler.general);

            const response = await request(app).get('/connection-refused');

            expect(response.status).toBe(503);
            expect(response.body).toHaveProperty('error', 'Serviço temporariamente indisponível');
        });
    });

    describe('Async Handler', () => {
        test('should catch errors in async functions', async () => {
            const asyncFunction = async (req, res) => {
                throw new Error('Async error');
            };

            app.get('/async-error', errorHandler.asyncHandler(asyncFunction));
            app.use(errorHandler.general);

            const response = await request(app).get('/async-error');

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Custom Error Creators', () => {
        test('should create generic error', () => {
            const error = errorHandler.createError('Test error', 418, { test: true });

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Test error');
            expect(error.status).toBe(418);
            expect(error.details).toEqual({ test: true });
        });

        test('should create validation error', () => {
            const details = [{ field: 'test', message: 'Required' }];
            const error = errorHandler.createValidationError('Validation failed', details);

            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('ValidationError');
            expect(error.status).toBe(400);
            expect(error.details).toEqual(details);
        });

        test('should create unauthorized error', () => {
            const error = errorHandler.createUnauthorizedError('Custom unauthorized message');

            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('UnauthorizedError');
            expect(error.status).toBe(401);
            expect(error.message).toBe('Custom unauthorized message');
        });

        test('should create forbidden error', () => {
            const error = errorHandler.createForbiddenError();

            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('ForbiddenError');
            expect(error.status).toBe(403);
            expect(error.message).toBe('Acesso negado');
        });

        test('should create not found error', () => {
            const error = errorHandler.createNotFoundError('Custom not found message');

            expect(error).toBeInstanceOf(Error);
            expect(error.status).toBe(404);
            expect(error.message).toBe('Custom not found message');
        });
    });
});
