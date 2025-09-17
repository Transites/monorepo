import { Response } from 'express';

interface PaginationParams {
    page?: number;
    limit?: number;
    total?: number;
}

class ResponseHelpers {
    // Success responses
    success(res: Response, data: any = null, message = 'Sucesso', statusCode = 200) {
        const response: {
            success: boolean;
            message: string;
            timestamp: string;
            data?: any;
        } = {
            success: true,
            message,
            timestamp: new Date().toISOString()
        };

        if (data !== null) {
            response.data = data;
        }

        return res.status(statusCode).json(response);
    }

    created(res: Response, data: any, message = 'Criado com sucesso') {
        return this.success(res, data, message, 201);
    }

    updated(res: Response, data: any, message = 'Atualizado com sucesso') {
        return this.success(res, data, message, 200);
    }

    deleted(res: Response, message = 'Removido com sucesso') {
        return this.success(res, null, message, 200);
    }

    // Error responses
    error(res: Response, message = 'Erro interno', statusCode = 500, details: any = null) {
        const response: {
            success: boolean;
            error: string;
            timestamp: string;
            details?: any;
        } = {
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        };

        if (details) {
            response.details = details;
        }

        return res.status(statusCode).json(response);
    }

    badRequest(res: Response, message = 'Solicitação inválida', details: any = null) {
        return this.error(res, message, 400, details);
    }

    unauthorized(res: Response, message = 'Não autorizado') {
        return this.error(res, message, 401);
    }

    forbidden(res: Response, message = 'Acesso negado') {
        return this.error(res, message, 403);
    }

    notFound(res: Response, message = 'Recurso não encontrado') {
        return this.error(res, message, 404);
    }

    conflict(res: Response, message = 'Conflito de dados') {
        return this.error(res, message, 409);
    }

    unprocessableEntity(res: Response, message = 'Entidade não processável', details: any = null) {
        return this.error(res, message, 422, details);
    }

    tooManyRequests(res: Response, message = 'Muitas tentativas') {
        return this.error(res, message, 429);
    }

    // Paginated responses
    paginated(res: Response, data: any[], pagination: PaginationParams, message = 'Dados recuperados com sucesso') {
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

export default new ResponseHelpers();
