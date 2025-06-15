class ResponseHelpers {
    // Success responses
    success(res, data = null, message = 'Sucesso', statusCode = 200) {
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString()
        };

        if (data !== null) {
            response.data = data;
        }

        return res.status(statusCode).json(response);
    }

    created(res, data, message = 'Criado com sucesso') {
        return this.success(res, data, message, 201);
    }

    updated(res, data, message = 'Atualizado com sucesso') {
        return this.success(res, data, message, 200);
    }

    deleted(res, message = 'Removido com sucesso') {
        return this.success(res, null, message, 200);
    }

    // Error responses
    error(res, message = 'Erro interno', statusCode = 500, details = null) {
        const response = {
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        };

        if (details) {
            response.details = details;
        }

        return res.status(statusCode).json(response);
    }

    badRequest(res, message = 'Solicitação inválida', details = null) {
        return this.error(res, message, 400, details);
    }

    unauthorized(res, message = 'Não autorizado') {
        return this.error(res, message, 401);
    }

    forbidden(res, message = 'Acesso negado') {
        return this.error(res, message, 403);
    }

    notFound(res, message = 'Recurso não encontrado') {
        return this.error(res, message, 404);
    }

    conflict(res, message = 'Conflito de dados') {
        return this.error(res, message, 409);
    }

    tooManyRequests(res, message = 'Muitas tentativas') {
        return this.error(res, message, 429);
    }

    // Paginated responses
    paginated(res, data, pagination, message = 'Dados recuperados com sucesso') {
        return this.success(res, {
            items: data,
            pagination: {
                page: pagination.page || 1,
                limit: pagination.limit || 10,
                total: pagination.total || 0,
                pages: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
            }
        }, message);
    }
}

module.exports = new ResponseHelpers();
