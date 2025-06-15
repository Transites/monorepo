const responseHelpers = require('./responses');

describe('Response Helpers Utility Tests', () => {
    let res;

    beforeEach(() => {
        // Mock Express response object
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe('Success Responses', () => {
        test('should send success response with default values', () => {
            responseHelpers.success(res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Sucesso',
                timestamp: expect.any(String)
            });
        });

        test('should send success response with data', () => {
            const data = { id: 1, name: 'Test' };
            responseHelpers.success(res, data, 'Custom message');

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Custom message',
                data,
                timestamp: expect.any(String)
            });
        });

        test('should send success response with custom status code', () => {
            responseHelpers.success(res, null, 'Custom message', 201);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Custom message',
                timestamp: expect.any(String)
            });
        });

        test('should send created response', () => {
            const data = { id: 1, name: 'Test' };
            responseHelpers.created(res, data);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Criado com sucesso',
                data,
                timestamp: expect.any(String)
            });
        });

        test('should send updated response', () => {
            const data = { id: 1, name: 'Updated Test' };
            responseHelpers.updated(res, data);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Atualizado com sucesso',
                data,
                timestamp: expect.any(String)
            });
        });

        test('should send deleted response', () => {
            responseHelpers.deleted(res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Removido com sucesso',
                timestamp: expect.any(String)
            });
        });
    });

    describe('Error Responses', () => {
        test('should send error response with default values', () => {
            responseHelpers.error(res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Erro interno',
                timestamp: expect.any(String)
            });
        });

        test('should send error response with custom message', () => {
            responseHelpers.error(res, 'Custom error');

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Custom error',
                timestamp: expect.any(String)
            });
        });

        test('should send error response with custom status code', () => {
            responseHelpers.error(res, 'Custom error', 400);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Custom error',
                timestamp: expect.any(String)
            });
        });

        test('should send error response with details', () => {
            const details = [{ field: 'name', message: 'Required' }];
            responseHelpers.error(res, 'Validation error', 400, details);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Validation error',
                details,
                timestamp: expect.any(String)
            });
        });

        test('should send bad request response', () => {
            responseHelpers.badRequest(res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Solicitação inválida',
                timestamp: expect.any(String)
            });
        });

        test('should send unauthorized response', () => {
            responseHelpers.unauthorized(res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Não autorizado',
                timestamp: expect.any(String)
            });
        });

        test('should send forbidden response', () => {
            responseHelpers.forbidden(res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Acesso negado',
                timestamp: expect.any(String)
            });
        });

        test('should send not found response', () => {
            responseHelpers.notFound(res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Recurso não encontrado',
                timestamp: expect.any(String)
            });
        });

        test('should send conflict response', () => {
            responseHelpers.conflict(res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Conflito de dados',
                timestamp: expect.any(String)
            });
        });

        test('should send too many requests response', () => {
            responseHelpers.tooManyRequests(res);

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Muitas tentativas',
                timestamp: expect.any(String)
            });
        });
    });

    describe('Paginated Responses', () => {
        test('should send paginated response with default values', () => {
            const data = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
            const pagination = { page: 1, limit: 10, total: 2 };

            responseHelpers.paginated(res, data, pagination);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Dados recuperados com sucesso',
                data: {
                    items: data,
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 2,
                        pages: 1
                    }
                },
                timestamp: expect.any(String)
            });
        });

        test('should calculate pages correctly', () => {
            const data = Array(25).fill({ name: 'Item' });
            const pagination = { page: 2, limit: 10, total: 25 };

            responseHelpers.paginated(res, data, pagination);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    pagination: expect.objectContaining({
                        pages: 3
                    })
                })
            }));
        });

        test('should handle empty data', () => {
            const data = [];
            const pagination = { page: 1, limit: 10, total: 0 };

            responseHelpers.paginated(res, data, pagination);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    items: [],
                    pagination: expect.objectContaining({
                        pages: 0
                    })
                })
            }));
        });

        test('should handle missing pagination values', () => {
            const data = [{ id: 1, name: 'Item 1' }];
            const pagination = {};

            responseHelpers.paginated(res, data, pagination);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        pages: 0
                    }
                })
            }));
        });
    });
});
