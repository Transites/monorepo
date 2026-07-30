import responses from '../../utils/responses';

describe('Response Helpers', () => {
    let res: any;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe('With Custom Parameters (Explicit Values)', () => {
        it('success sends a 200 response with data', () => {
            responses.success(res, { hello: 'world' }, 'Ok', 200);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'Ok', data: { hello: 'world' } }));
        });

        it('created sends a 201 response', () => {
            responses.created(res, { id: 1 }, 'Created');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'Created', data: { id: 1 } }));
        });

        it('updated sends a 200 response', () => {
            responses.updated(res, { id: 2 }, 'Updated');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'Updated', data: { id: 2 } }));
        });

        it('deleted sends success with no data', () => {
            responses.deleted(res, 'Removed');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'Removed' }));
        });

        it('error sends a 500 response with details when provided', () => {
            responses.error(res, 'Internal', 500, { failure: true });
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Internal',
                details: { failure: true }
            }));
        });

        it('badRequest sends a 400 response', () => {
            responses.badRequest(res, 'Invalid', { field: 'email' });
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'Invalid', details: { field: 'email' } }));
        });

        it('unauthorized sends a 401 response', () => {
            responses.unauthorized(res, 'No access');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'No access' }));
        });

        it('forbidden sends a 403 response', () => {
            responses.forbidden(res, 'Denied');
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'Denied' }));
        });

        it('notFound sends a 404 response', () => {
            responses.notFound(res, 'Missing');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'Missing' }));
        });

        it('conflict sends a 409 response', () => {
            responses.conflict(res, 'Conflict');
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'Conflict' }));
        });

        it('unprocessableEntity sends a 422 response', () => {
            responses.unprocessableEntity(res, 'Unprocessable', { reason: 'bad' });
            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'Unprocessable', details: { reason: 'bad' } }));
        });

        it('tooManyRequests sends a 429 response', () => {
            responses.tooManyRequests(res, 'Slow down');
            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'Slow down' }));
        });

        it('paginated returns complete pagination metadata', () => {
            const items = [{ id: 1 }, { id: 2 }];
            responses.paginated(res, items, { page: 2, limit: 5, total: 12 }, 'Paged');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Paged',
                data: expect.objectContaining({
                    items,
                    pagination: expect.objectContaining({ page: 2, limit: 5, total: 12, pages: 3 })
                })
            }));
        });
    });

    describe('With Default Parameters (Branch Coverage)', () => {
        // Dispara o 'data = null', 'message = Sucesso' e 'statusCode = 200'
        it('success uses default parameters when none provided', () => {
            responses.success(res);
            expect(res.status).toHaveBeenCalledWith(200);
            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall.success).toBe(true);
            expect(jsonCall.message).toBe('Sucesso');
            expect(jsonCall.data).toBeUndefined(); // Garante que if (data !== null) não foi acionado
        });

        it('created uses default message', () => {
            responses.created(res, { id: 1 });
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Criado com sucesso' }));
        });

        it('updated uses default message', () => {
            responses.updated(res, { id: 1 });
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Atualizado com sucesso' }));
        });

        it('deleted uses default message', () => {
            responses.deleted(res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Removido com sucesso' }));
        });

        // Dispara o 'message = Erro interno', 'statusCode = 500' e 'details = null'
        it('error uses default parameters', () => {
            responses.error(res);
            expect(res.status).toHaveBeenCalledWith(500);
            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall.error).toBe('Erro interno');
            expect(jsonCall.details).toBeUndefined(); // Garante que if (details) não foi acionado
        });

        it('badRequest uses default message', () => {
            responses.badRequest(res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Solicitação inválida' }));
        });

        it('unauthorized uses default message', () => {
            responses.unauthorized(res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Não autorizado' }));
        });

        it('forbidden uses default message', () => {
            responses.forbidden(res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Acesso negado' }));
        });

        it('notFound uses default message', () => {
            responses.notFound(res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Recurso não encontrado' }));
        });

        it('conflict uses default message', () => {
            responses.conflict(res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Conflito de dados' }));
        });

        it('unprocessableEntity uses default message', () => {
            responses.unprocessableEntity(res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Entidade não processável' }));
        });

        it('tooManyRequests uses default message', () => {
            responses.tooManyRequests(res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Muitas tentativas' }));
        });

        // Dispara os fallbacks: page || 1, limit || 10, total || 0
        it('paginated applies fallback values for missing pagination data', () => {
            responses.paginated(res, [], {}); // Enviando paginação vazia
            
            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall.message).toBe('Dados recuperados com sucesso'); // default message
            expect(jsonCall.data.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 0,
                pages: 0
            });
        });
    });
});