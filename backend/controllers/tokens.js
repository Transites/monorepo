const tokenService = require('../services/tokens');
const db = require('../database/client');
const logger = require('../middleware/logging');
const responses = require('../utils/responses');
const { validationResult } = require('express-validator');

class TokenController {
    /**
     * GET /api/tokens/:token/validate
     * Validar token e retornar informações básicas
     */
    async validateToken(req, res, next) {
        try {
            const token = req.params.token;

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

            // Retornar informações básicas da submissão
            const { submission, tokenInfo } = validation;

            return responses.success(res, {
                submission: {
                    id: submission.id,
                    title: submission.title,
                    status: submission.status,
                    author_name: submission.author_name,
                    created_at: submission.created_at,
                    updated_at: submission.updated_at
                },
                tokenInfo
            }, 'Token válido');

        } catch (error) {
            logger.error('Error validating token', {
                token: req.params.token?.substring(0, 8) + '...',
                error: error.message
            });
            next(error);
        }
    }

    /**
     * POST /api/tokens/:token/verify-email
     * Verificar email do autor antes de dar acesso completo
     */
    async verifyAuthorEmail(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return responses.badRequest(res, 'Dados inválidos', errors.array());
            }

            const token = req.params.token;
            const { email } = req.body;

            // Primeiro validar o token
            const tokenValidation = await tokenService.validateToken(token);
            if (!tokenValidation.isValid) {
                return responses.unauthorized(res, 'Token inválido');
            }

            // Verificar email do autor
            const emailValidation = await tokenService.validateAuthorEmail(
                tokenValidation.submission.id,
                email
            );

            if (!emailValidation.isValid) {
                if (emailValidation.reason === 'EMAIL_MISMATCH') {
                    logger.security('Author email verification failed', {
                        submissionId: tokenValidation.submission.id,
                        providedEmail: email,
                        expectedEmail: tokenValidation.submission.author_email,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });

                    return responses.forbidden(res, 'Email não confere com o autor da submissão');
                }

                return responses.badRequest(res, 'Erro na verificação do email');
            }

            // Email verificado com sucesso
            logger.audit('Author email verified', {
                submissionId: tokenValidation.submission.id,
                authorEmail: email,
                ip: req.ip
            });

            return responses.success(res, {
                verified: true,
                submission: tokenValidation.submission,
                tokenInfo: tokenValidation.tokenInfo
            }, 'Email verificado com sucesso');

        } catch (error) {
            logger.error('Error verifying author email', {
                token: req.params.token?.substring(0, 8) + '...',
                email: req.body.email,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * POST /api/tokens/:token/renew
     * Renovar token (estender expiração)
     */
    async renewToken(req, res, next) {
        try {
            const token = req.params.token;
            const { additionalDays } = req.body;

            // Validar token primeiro
            const validation = await tokenService.validateToken(token);
            if (!validation.isValid) {
                return responses.unauthorized(res, 'Token inválido para renovação');
            }

            // Renovar token
            const renewal = await tokenService.renewToken(
                validation.submission.id,
                additionalDays
            );

            return responses.success(res, {
                renewed: true,
                newExpiresAt: renewal.newExpiresAt,
                additionalDays: renewal.additionalDays
            }, 'Token renovado com sucesso');

        } catch (error) {
            logger.error('Error renewing token', {
                token: req.params.token?.substring(0, 8) + '...',
                error: error.message
            });
            next(error);
        }
    }

    /**
     * POST /api/admin/tokens/:submissionId/regenerate
     * Regenerar token completamente (apenas admin)
     */
    async regenerateToken(req, res, next) {
        try {
            const submissionId = req.params.submissionId;

            // Verificar se submissão existe
            const submission = await db.findById('submissions', submissionId);
            if (!submission) {
                return responses.notFound(res, 'Submissão não encontrada');
            }

            // Regenerar token
            const result = await tokenService.regenerateToken(submissionId);

            logger.audit('Token regenerated by admin', {
                submissionId,
                adminId: req.user.id,
                oldToken: submission.token?.substring(0, 8) + '...',
                newToken: result.token.substring(0, 8) + '...'
            });

            return responses.success(res, {
                token: result.token,
                expiresAt: result.expiresAt,
                submission: {
                    id: submission.id,
                    title: submission.title,
                    author_email: submission.author_email
                }
            }, 'Token regenerado com sucesso');

        } catch (error) {
            logger.error('Error regenerating token', {
                submissionId: req.params.submissionId,
                adminId: req.user?.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * POST /api/admin/tokens/:submissionId/reactivate
     * Reativar submissão expirada (apenas admin)
     */
    async reactivateExpired(req, res, next) {
        try {
            const submissionId = req.params.submissionId;
            const { expiryDays } = req.body;

            // Verificar se submissão existe
            const submission = await db.findById('submissions', submissionId);
            if (!submission) {
                return responses.notFound(res, 'Submissão não encontrada');
            }

            // Reativar submissão
            const result = await tokenService.reactivateExpired(submissionId, expiryDays);

            logger.audit('Expired submission reactivated by admin', {
                submissionId,
                adminId: req.user.id,
                newToken: result.token.substring(0, 8) + '...',
                newStatus: result.status,
                expiryDays
            });

            return responses.success(res, {
                token: result.token,
                status: result.status,
                expiresAt: result.expiresAt,
                submission: {
                    id: submission.id,
                    title: submission.title,
                    author_email: submission.author_email
                }
            }, 'Submissão reativada com sucesso');

        } catch (error) {
            logger.error('Error reactivating expired submission', {
                submissionId: req.params.submissionId,
                adminId: req.user?.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * GET /api/admin/tokens/expiring
     * Listar submissões próximas do vencimento (apenas admin)
     */
    async getExpiringSubmissions(req, res, next) {
        try {
            const daysAhead = parseInt(req.query.days) || 5;
            const expiring = await tokenService.findExpiringSubmissions(daysAhead);

            return responses.success(res, {
                submissions: expiring,
                daysAhead,
                count: expiring.length
            }, 'Submissões próximas do vencimento');

        } catch (error) {
            logger.error('Error getting expiring submissions', {
                daysAhead: req.query.days,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * POST /api/admin/tokens/cleanup
     * Executar limpeza de tokens expirados (apenas admin)
     */
    async cleanupExpiredTokens(req, res, next) {
        try {
            const result = await tokenService.cleanupExpiredTokens();

            logger.audit('Token cleanup executed by admin', {
                adminId: req.user.id,
                expiredCount: result.expiredCount
            });

            return responses.success(res, {
                expiredCount: result.expiredCount,
                expiredSubmissions: result.expiredSubmissions
            }, `${result.expiredCount} tokens expirados limpos`);

        } catch (error) {
            logger.error('Error during token cleanup', {
                adminId: req.user?.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * GET /api/admin/tokens/stats
     * Estatísticas de tokens (apenas admin)
     */
    async getTokenStats(req, res, next) {
        try {
            const stats = await tokenService.getTokenStats();

            return responses.success(res, {
                stats,
                timestamp: new Date().toISOString()
            }, 'Estatísticas de tokens');

        } catch (error) {
            logger.error('Error getting token stats', {
                error: error.message
            });
            next(error);
        }
    }
}

module.exports = new TokenController();
