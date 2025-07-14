const tokenService = require('../services/tokens');
const rateLimit = require('express-rate-limit');
const logger = require('./logging');
const responses = require('../utils/responses');
const constants = require('../utils/constants');

class TokenMiddleware {
    /**
     * Rate limiting específico para tentativas de token
     */
    createTokenRateLimit() {
        return rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: constants.LIMITS.TOKEN_ATTEMPTS_PER_HOUR, // 10 tentativas por hora
            keyGenerator: (req) => {
                // Combinar IP + token para rate limiting mais específico
                const token = req.params.token || req.body.token || 'no-token';
                return `${req.ip}:${token.substring(0, 8)}`;
            },
            message: {
                error: 'Muitas tentativas de acesso por token, tente novamente em 1 hora',
                retryAfter: 3600
            },
            standardHeaders: true,
            legacyHeaders: false,
            onLimitReached: (req) => {
                const token = req.params.token || req.body.token;
                logger.security('Token rate limit reached', {
                    ip: req.ip,
                    token: token?.substring(0, 8) + '...' || 'unknown',
                    userAgent: req.get('User-Agent'),
                    path: req.path
                });
            }
        });
    }

    /**
     * Middleware para validar token na URL
     */
    validateSubmissionToken = async (req, res, next) => {
        try {
            const token = req.params.token;

            if (!token) {
                return responses.badRequest(res, 'Token não fornecido');
            }

            // Validar token
            const validation = await tokenService.validateToken(token);

            if (!validation.isValid) {
                const errorMessages = {
                    TOKEN_INVALID_FORMAT: 'Formato de token inválido',
                    TOKEN_NOT_FOUND: 'Token não encontrado',
                    TOKEN_EXPIRED: 'Token expirado',
                    VALIDATION_ERROR: 'Erro na validação do token'
                };

                const message = errorMessages[validation.reason] || 'Token inválido';

                if (validation.reason === 'TOKEN_EXPIRED') {
                    return responses.error(res, message, 410, {
                        reason: validation.reason,
                        submission: validation.submission,
                        canRecover: true
                    });
                }

                return responses.unauthorized(res, message);
            }

            // Adicionar submissão e info do token ao request
            req.submission = validation.submission;
            req.tokenInfo = validation.tokenInfo;

            // Log de acesso bem-sucedido
            logger.audit('Token access granted', {
                submissionId: validation.submission.id,
                token: token.substring(0, 8) + '...',
                authorEmail: validation.submission.author_email,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            next();
        } catch (error) {
            logger.error('Error in token validation middleware', {
                token: req.params.token?.substring(0, 8) + '...' || 'unknown',
                error: error.message,
                ip: req.ip
            });
            next(error);
        }
    };

    /**
     * Middleware para verificar se autor é o dono da submissão
     */
    validateAuthorEmail = async (req, res, next) => {
        try {
            const authorEmail = req.body.author_email || req.query.author_email;
            const submissionId = req.submission?.id;

            if (!authorEmail) {
                return responses.badRequest(res, 'Email do autor é obrigatório');
            }

            if (!submissionId) {
                return responses.badRequest(res, 'Submissão não encontrada');
            }

            // Validar email do autor
            const validation = await tokenService.validateAuthorEmail(submissionId, authorEmail);

            if (!validation.isValid) {
                const errorMessages = {
                    SUBMISSION_NOT_FOUND: 'Submissão não encontrada',
                    EMAIL_MISMATCH: 'Email não confere com o autor da submissão',
                    VALIDATION_ERROR: 'Erro na validação do email'
                };

                const message = errorMessages[validation.reason] || 'Email inválido';

                if (validation.reason === 'EMAIL_MISMATCH') {
                    // Log tentativa suspeita
                    logger.security('Author email mismatch', {
                        submissionId,
                        providedEmail: authorEmail,
                        expectedEmail: req.submission.author_email,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                }

                return responses.forbidden(res, message);
            }

            // Email válido - adicionar ao request
            req.authorEmail = authorEmail;

            next();

        } catch (error) {
            logger.error('Error in author email validation middleware', {
                submissionId: req.submission?.id,
                email: req.body.email || req.query.email,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * Middleware para verificar se submissão pode ser editada
     */
    checkEditableStatus = (req, res, next) => {
        const submission = req.submission;

        if (!submission) {
            return responses.badRequest(res, 'Submissão não encontrada');
        }

        const editableStatuses = [
            constants.SUBMISSION_STATUS.DRAFT,
            constants.SUBMISSION_STATUS.CHANGES_REQUESTED
        ];

        if (!editableStatuses.includes(submission.status)) {
            const statusMessages = {
                [constants.SUBMISSION_STATUS.UNDER_REVIEW]: 'Submissão em revisão, aguarde feedback',
                [constants.SUBMISSION_STATUS.APPROVED]: 'Submissão já aprovada, não pode ser editada',
                [constants.SUBMISSION_STATUS.PUBLISHED]: 'Artigo já publicado, não pode ser editado',
                [constants.SUBMISSION_STATUS.REJECTED]: 'Submissão rejeitada, entre em contato com o admin',
                [constants.SUBMISSION_STATUS.EXPIRED]: 'Token expirado, solicite reativação'
            };

            const message = statusMessages[submission.status] || 'Submissão não pode ser editada';

            return responses.forbidden(res, message, {
                status: submission.status,
                canEdit: false
            });
        }

        // Status permite edição
        next();
    };

    /**
     * Middleware para verificar se está próximo do vencimento
     */
    checkTokenExpiry = (req, res, next) => {
        const tokenInfo = req.tokenInfo;

        if (tokenInfo?.needsRenewal) {
            // Adicionar aviso no response header
            res.set('X-Token-Expiry-Warning', 'true');
            res.set('X-Token-Days-Remaining', tokenInfo.daysToExpiry.toString());

            logger.audit('Token expiry warning', {
                submissionId: req.submission.id,
                daysToExpiry: tokenInfo.daysToExpiry,
                ip: req.ip
            });
        }

        next();
    };

    /**
     * Middleware para log de ações em submissões
     */
    logSubmissionAction = (action) => {
        return (req, res, next) => {
            const originalSend = res.send;

            res.send = function (data) {
                // Log apenas se a ação foi bem-sucedida
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    logger.audit(`Submission action: ${action}`, {
                        submissionId: req.submission?.id,
                        authorEmail: req.authorEmail || req.submission?.author_email,
                        action,
                        path: req.path,
                        method: req.method,
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        tokenExpiry: req.tokenInfo?.expiresAt
                    });
                }

                originalSend.call(this, data);
            };

            next();
        };
    };

    /**
     * Middleware para adicionar informações do token à resposta
     * Garante que informações importantes do token estejam disponíveis no frontend
     */
    addTokenInfoToResponse = (req, res, next) => {
        try {
            // Verifica se as informações do token estão disponíveis
            if (!req.tokenInfo) {
                logger.warn('Token info not available in request', {
                    path: req.path,
                    method: req.method
                });
                return next();
            }

            // Adiciona headers relacionados ao token
            if (req.tokenInfo.isNearExpiry) {
                res.set('X-Token-Expiry-Warning', 'true');
                res.set('X-Token-Days-Remaining', req.tokenInfo.daysToExpiry.toString());
            }

            // Intercepta o método send para adicionar informações do token à resposta
            const originalSend = res.send;
            res.send = function(data) {
                try {
                    // Apenas modifica respostas de sucesso com formato JSON
                    if (res.statusCode >= 200 && res.statusCode < 300 && data) {
                        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

                        // Se a resposta já tem tokenInfo, não sobrescreve
                        if (parsedData.data && !parsedData.data.tokenInfo) {
                            parsedData.data.tokenInfo = {
                                expiresAt: req.tokenInfo.expiresAt,
                                daysToExpiry: req.tokenInfo.daysToExpiry,
                                needsRenewal: req.tokenInfo.needsRenewal
                            };

                            return originalSend.call(this, JSON.stringify(parsedData));
                        }
                    }
                } catch (error) {
                    logger.error('Error adding token info to response', {
                        error: error.message,
                        path: req.path
                    });
                }

                return originalSend.call(this, data);
            };

            next();
        } catch (error) {
            logger.error('Error in addTokenInfoToResponse middleware', {
                error: error.message,
                path: req.path
            });
            next();
        }
    };
}

module.exports = new TokenMiddleware();
