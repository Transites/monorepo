import request from 'supertest';
import express from 'express';
import uploadValidators from '../../validators/upload';
import constants from '../../utils/constants';

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

// Helper para criar app de teste com parâmetros
const createParamTestApp = (validators: any) => {
    const app = express();
    app.use(express.json());

    app.get('/test/:fileId', validators, (req, res) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        res.json({ success: true });
    });

    return app;
};

// Helper para criar app de teste com query params
const createQueryTestApp = (validators: any) => {
    const app = express();
    app.use(express.json());

    app.get('/test', validators, (req, res) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        res.json({ success: true });
    });

    return app;
};

describe('UploadValidators', () => {
    // Para testes que precisam de mocks diretos
    let mockRequest: {
        body: Record<string, any>;
        params: Record<string, any>;
        query: Record<string, any>;
        file: any;
        files: any[] | null;
    };
    let mockResponse: {
        status: jest.Mock;
        json: jest.Mock;
    };
    let mockNext: jest.Mock;

    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
            query: {},
            file: null,
            files: null
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();

        jest.clearAllMocks();
    });

    describe('validateImageUpload', () => {
        const app = createTestApp(uploadValidators.validateImageUpload);

        test('deve aceitar dados válidos', async () => {
            const validData = {
                submissionId: '123e4567-e89b-12d3-a456-426614174000',
                authorEmail: 'test@example.com'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar submissionId inválido', async () => {
            const invalidData = {
                submissionId: 'invalid-uuid',
                authorEmail: 'test@example.com'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'submissionId',
                        msg: 'ID da submissão deve ser um UUID válido'
                    })
                ])
            );
        });

        test('deve rejeitar email inválido', async () => {
            const invalidData = {
                submissionId: '123e4567-e89b-12d3-a456-426614174000',
                authorEmail: 'invalid-email'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'authorEmail',
                        msg: 'Email deve ter formato válido'
                    })
                ])
            );
        });

        test('deve aceitar dados sem email', async () => {
            const validData = {
                submissionId: '123e4567-e89b-12d3-a456-426614174000'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('validateDocumentUpload', () => {
        const app = createTestApp(uploadValidators.validateDocumentUpload);

        test('deve aceitar dados válidos', async () => {
            const validData = {
                submissionId: '123e4567-e89b-12d3-a456-426614174000',
                authorEmail: 'test@example.com'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar submissionId inválido', async () => {
            const invalidData = {
                submissionId: 'invalid-uuid',
                authorEmail: 'test@example.com'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'submissionId',
                        msg: 'ID da submissão deve ser um UUID válido'
                    })
                ])
            );
        });

        test('deve rejeitar email inválido', async () => {
            const invalidData = {
                submissionId: '123e4567-e89b-12d3-a456-426614174000',
                authorEmail: 'invalid-email'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'authorEmail',
                        msg: 'Email deve ter formato válido'
                    })
                ])
            );
        });
    });

    describe('validateMultipleUpload', () => {
        const app = createTestApp(uploadValidators.validateMultipleUpload);

        test('deve aceitar dados válidos', async () => {
            const validData = {
                submissionId: '123e4567-e89b-12d3-a456-426614174000',
                authorEmail: 'test@example.com'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar submissionId inválido', async () => {
            const invalidData = {
                submissionId: 'invalid-uuid',
                authorEmail: 'test@example.com'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'submissionId',
                        msg: 'ID da submissão deve ser um UUID válido'
                    })
                ])
            );
        });
    });

    describe('validateFileDelete', () => {
        const app = createParamTestApp(uploadValidators.validateFileDelete);

        test('deve aceitar fileId válido', async () => {
            const validFileId = '123e4567-e89b-12d3-a456-426614174000';
            const validData = {
                authorEmail: 'test@example.com'
            };

            const response = await request(app)
                .get(`/test/${validFileId}`)
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar fileId inválido', async () => {
            const invalidFileId = 'invalid-uuid';
            const validData = {
                authorEmail: 'test@example.com'
            };

            const response = await request(app)
                .get(`/test/${invalidFileId}`)
                .send(validData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'fileId',
                        msg: 'ID do arquivo deve ser um UUID válido'
                    })
                ])
            );
        });

        test('deve rejeitar email inválido', async () => {
            const validFileId = '123e4567-e89b-12d3-a456-426614174000';
            const invalidData = {
                authorEmail: 'invalid-email'
            };

            const response = await request(app)
                .get(`/test/${validFileId}`)
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'authorEmail',
                        msg: 'Email deve ter formato válido'
                    })
                ])
            );
        });
    });

    describe('validateDownload', () => {
        const app = createParamTestApp(uploadValidators.validateDownload);

        test('deve aceitar fileId válido sem query params', async () => {
            const validFileId = '123e4567-e89b-12d3-a456-426614174000';

            const response = await request(app)
                .get(`/test/${validFileId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve aceitar fileId válido com expires válido', async () => {
            const validFileId = '123e4567-e89b-12d3-a456-426614174000';

            const response = await request(app)
                .get(`/test/${validFileId}?expires=60`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar fileId inválido', async () => {
            const invalidFileId = 'invalid-uuid';

            const response = await request(app)
                .get(`/test/${invalidFileId}`);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'fileId',
                        msg: 'ID do arquivo deve ser um UUID válido'
                    })
                ])
            );
        });

        test('deve rejeitar expires inválido', async () => {
            const validFileId = '123e4567-e89b-12d3-a456-426614174000';

            const response = await request(app)
                .get(`/test/${validFileId}?expires=1500`); // Acima do máximo (1440)

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'expires',
                        msg: 'Expiração deve ser entre 1 e 1440 minutos (24 horas)'
                    })
                ])
            );
        });
    });

    describe('validateStats', () => {
        const app = createQueryTestApp(uploadValidators.validateStats);

        test('deve aceitar sem submissionId', async () => {
            const response = await request(app)
                .get('/test');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve aceitar submissionId válido', async () => {
            const validSubmissionId = '123e4567-e89b-12d3-a456-426614174000';

            const response = await request(app)
                .get(`/test?submissionId=${validSubmissionId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar submissionId inválido', async () => {
            const invalidSubmissionId = 'invalid-uuid';

            const response = await request(app)
                .get(`/test?submissionId=${invalidSubmissionId}`);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'submissionId',
                        msg: 'ID da submissão deve ser um UUID válido'
                    })
                ])
            );
        });
    });

    describe('validateFileSize', () => {
        test('deve permitir arquivo com tamanho válido', () => {
            mockRequest.file = {
                size: constants.LIMITS.FILE_SIZE_MAX - 1000, // Menor que o limite
                originalname: 'test.jpg'
            };

            uploadValidators.validateFileSize(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        test('deve rejeitar arquivo único muito grande', () => {
            mockRequest.file = {
                size: constants.LIMITS.FILE_SIZE_MAX + 1000, // Maior que o limite
                originalname: 'test.jpg'
            };

            uploadValidators.validateFileSize(mockRequest, mockResponse, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Arquivo muito grande'
            }));
        });

        test('deve permitir múltiplos arquivos com tamanho válido', () => {
            mockRequest.files = [
                {
                    size: constants.LIMITS.FILE_SIZE_MAX - 1000,
                    originalname: 'test1.jpg'
                },
                {
                    size: constants.LIMITS.FILE_SIZE_MAX - 2000,
                    originalname: 'test2.jpg'
                }
            ];

            uploadValidators.validateFileSize(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        test('deve rejeitar um dos múltiplos arquivos muito grande', () => {
            mockRequest.files = [
                {
                    size: constants.LIMITS.FILE_SIZE_MAX - 1000, // Tamanho válido
                    originalname: 'test1.jpg'
                },
                {
                    size: constants.LIMITS.FILE_SIZE_MAX + 1000, // Tamanho inválido
                    originalname: 'test2.jpg'
                }
            ];

            uploadValidators.validateFileSize(mockRequest, mockResponse, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining('test2.jpg')
            }));
        });

        test('deve chamar next quando não há arquivos', () => {
            mockRequest.file = null;
            mockRequest.files = null;

            uploadValidators.validateFileSize(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });

    describe('sanitizeUploadData', () => {
        const app = createTestApp(uploadValidators.sanitizeUploadData);

        test('deve sanitizar dados de upload', async () => {
            const testData = {
                submissionId: '  123e4567-e89b-12d3-a456-426614174000  ',
                authorEmail: '  TEST@EXAMPLE.COM  '
            };

            const response = await request(app)
                .post('/test')
                .send(testData)
                .query({ submissionId: '  123e4567-e89b-12d3-a456-426614174000  ', expires: '60' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
