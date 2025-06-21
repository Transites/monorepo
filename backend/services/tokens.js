const crypto = require('crypto');
const db = require('../database/client');
const logger = require('../middleware/logging');
const constants = require('../utils/constants');

class TokenService {
    constructor() {
        this.tokenLength = 64; // 32 bytes = 64 hex chars
        this.defaultExpiryDays = constants.TIME.TOKEN_EXPIRY_DAYS || 30;
        this.warningDays = 5; // Avisar 5 dias antes de expirar
    }

    /**
     * Gerar token criptograficamente seguro
     */
    generateSecureToken() {
        // Combinar timestamp + random bytes para garantir unicidade
        const timestamp = Date.now().toString(16); // hex timestamp
        const randomBytes = crypto.randomBytes(28).toString('hex'); // 28 bytes = 56 hex chars
        const combined = timestamp + randomBytes;

        // Hash SHA-256 para garantir tamanho fixo e distribuição uniforme
        const hash = crypto.createHash('sha256').update(combined).digest('hex');

        // Retornar primeiros 64 caracteres (32 bytes)
        return hash.substring(0, this.tokenLength);
    }

    /**
     * Criar novo token para submissão
     */
    async createSubmissionToken(submissionId, customExpiryDays = null) {
        try {
            const token = this.generateSecureToken();
            const expiryDays = customExpiryDays || this.defaultExpiryDays;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiryDays);

            // Atualizar submissão com novo token
            await db.update('submissions', submissionId, {
                token,
                expires_at: expiresAt,
                updated_at: new Date()
            });

            logger.audit('Submission token created', {
                submissionId,
                token: token.substring(0, 8) + '...', // Log apenas primeiros 8 chars
                expiresAt,
                expiryDays
            });

            // Buscar submissão para enviar email
            const submission = await db.findById('submissions', submissionId);
            if (submission) {
                const emailService = require('./email');
                await emailService.sendSubmissionToken(
                    submission.author_email,
                    submission,
                    token
                );
            }

            return {
                token,
                expiresAt,
                expiryDays
            };

        } catch (error) {
            logger.error('Error creating submission token', {
                submissionId,
                error: error.message
            });
            throw new Error('Erro ao criar token de submissão');
        }
    }

    /**
     * Validar token e retornar submissão
     */
    async validateToken(token) {
        try {
            if (!this.isValidTokenFormat(token)) {
                logger.security('Invalid token format attempted', {
                    token: token?.substring(0, 8) + '...' || 'null'
                });
                return { isValid: false, reason: 'TOKEN_INVALID_FORMAT' };
            }

            // Buscar submissão pelo token
            const submission = await db.findByToken(token);
            if (!submission) {
                logger.security('Token not found', {
                    token: token.substring(0, 8) + '...'
                });
                return { isValid: false, reason: 'TOKEN_NOT_FOUND' };
            }

            // Verificar expiração
            const now = new Date();
            const expiresAt = new Date(submission.expires_at);

            if (now > expiresAt) {
                // Token expirado - marcar como EXPIRED se ainda não foi
                if (submission.status !== constants.SUBMISSION_STATUS.EXPIRED) {
                    await this.markAsExpired(submission.id);
                }

                logger.security('Expired token access attempted', {
                    submissionId: submission.id,
                    token: token.substring(0, 8) + '...',
                    expiresAt,
                    status: submission.status
                });
                return {
                    isValid: false,
                    reason: 'TOKEN_EXPIRED',
                    submission: {
                        id: submission.id,
                        title: submission.title,
                        author_email: submission.author_email,
                        expires_at: submission.expires_at
                    }
                };
            }

            // Verificar se está próximo do vencimento
            const daysToExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            const isNearExpiry = daysToExpiry <= this.warningDays;

            // Token válido
            logger.audit('Valid token access', {
                submissionId: submission.id,
                token: token.substring(0, 8) + '...',
                status: submission.status,
                daysToExpiry,
                isNearExpiry
            });

            return {
                isValid: true,
                submission,
                tokenInfo: {
                    expiresAt,
                    daysToExpiry,
                    isNearExpiry,
                    needsRenewal: isNearExpiry
                }
            };

        } catch (error) {
            logger.error('Error validating token', {
                token: token?.substring(0, 8) + '...' || 'null',
                error: error.message
            });
            return { isValid: false, reason: 'VALIDATION_ERROR' };
        }
    }

    /**
     * Verificar se email confere com o da submissão
     */
    async validateAuthorEmail(submissionId, email) {
        try {
            const submission = await db.findById('submissions', submissionId);
            if (!submission) {
                return { isValid: false, reason: 'SUBMISSION_NOT_FOUND' };
            }

            const emailMatches = submission.author_email.toLowerCase() === email.toLowerCase();

            if (!emailMatches) {
                logger.security('Email mismatch for submission access', {
                    submissionId,
                    providedEmail: email,
                    expectedEmail: submission.author_email
                });
            }

            return {
                isValid: emailMatches,
                reason: emailMatches ? 'EMAIL_VALID' : 'EMAIL_MISMATCH',
                submission
            };

        } catch (error) {
            logger.error('Error validating author email', {
                submissionId,
                email,
                error: error.message
            });
            return { isValid: false, reason: 'VALIDATION_ERROR' };
        }
    }

    /**
     * Renovar token (extending expiry)
     */
    async renewToken(submissionId, additionalDays = null) {
        try {
            const days = additionalDays || this.defaultExpiryDays;
            const newExpiresAt = new Date();
            newExpiresAt.setDate(newExpiresAt.getDate() + days);

            await db.update('submissions', submissionId, {
                expires_at: newExpiresAt,
                updated_at: new Date()
            });

            logger.audit('Token renewed', {
                submissionId,
                newExpiresAt,
                additionalDays: days
            });

            return {
                success: true,
                newExpiresAt,
                additionalDays: days
            };

        } catch (error) {
            logger.error('Error renewing token', {
                submissionId,
                error: error.message
            });
            throw new Error('Erro ao renovar token');
        }
    }

    /**
     * Regenerar token completamente novo
     */
    async regenerateToken(submissionId) {
        try {
            const newToken = this.generateSecureToken();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + this.defaultExpiryDays);

            await db.update('submissions', submissionId, {
                token: newToken,
                expires_at: expiresAt,
                updated_at: new Date()
            });

            logger.audit('Token regenerated', {
                submissionId,
                newToken: newToken.substring(0, 8) + '...',
                expiresAt
            });

            return {
                token: newToken,
                expiresAt
            };

        } catch (error) {
            logger.error('Error regenerating token', {
                submissionId,
                error: error.message
            });
            throw new Error('Erro ao regenerar token');
        }
    }

    /**
     * Marcar submissão como expirada
     */
    async markAsExpired(submissionId) {
        try {
            await db.update('submissions', submissionId, {
                status: constants.SUBMISSION_STATUS.EXPIRED,
                updated_at: new Date()
            });

            logger.audit('Submission marked as expired', {
                submissionId
            });

        } catch (error) {
            logger.error('Error marking submission as expired', {
                submissionId,
                error: error.message
            });
        }
    }

    /**
     * Reativar submissão expirada
     */
    async reactivateExpired(submissionId, newExpiryDays = null) {
        try {
            const submission = await db.findById('submissions', submissionId);
            if (!submission) {
                throw new Error('Submissão não encontrada');
            }

            // Gerar novo token e data de expiração
            const newToken = this.generateSecureToken();
            const days = newExpiryDays || this.defaultExpiryDays;
            const newExpiresAt = new Date();
            newExpiresAt.setDate(newExpiresAt.getDate() + days);

            // Determinar novo status baseado no status anterior
            let newStatus = constants.SUBMISSION_STATUS.DRAFT;
            if (submission.status === constants.SUBMISSION_STATUS.EXPIRED) {
                // Se estava em CHANGES_REQUESTED antes de expirar, voltar para lá
                const lastFeedback = await db.query(
                    'SELECT * FROM feedback WHERE submission_id = $1 ORDER BY created_at DESC LIMIT 1',
                    [submissionId]
                );

                if (lastFeedback.rows.length > 0 && lastFeedback.rows[0].status === constants.FEEDBACK_STATUS.PENDING) {
                    newStatus = constants.SUBMISSION_STATUS.CHANGES_REQUESTED;
                }
            }

            await db.update('submissions', submissionId, {
                token: newToken,
                status: newStatus,
                expires_at: newExpiresAt,
                updated_at: new Date()
            });

            logger.audit('Expired submission reactivated', {
                submissionId,
                newToken: newToken.substring(0, 8) + '...',
                newStatus,
                newExpiresAt
            });

            return {
                token: newToken,
                status: newStatus,
                expiresAt: newExpiresAt
            };

        } catch (error) {
            logger.error('Error reactivating expired submission', {
                submissionId,
                error: error.message
            });
            throw new Error('Erro ao reativar submissão expirada');
        }
    }

    /**
     * Buscar submissões próximas do vencimento
     */
    async findExpiringSubmissions(daysAhead = 5) {
        try {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysAhead);

            const result = await db.query(`
                SELECT id,
                       token,
                       author_name,
                       author_email,
                       title,
                       expires_at,
                       EXTRACT(days FROM expires_at - NOW()) as days_to_expiry
                FROM submissions
                WHERE status IN ($1, $2)
                  AND expires_at <= $3
                  AND expires_at > NOW()
                ORDER BY expires_at
            `, [
                constants.SUBMISSION_STATUS.DRAFT,
                constants.SUBMISSION_STATUS.CHANGES_REQUESTED,
                futureDate
            ]);

            return result.rows;

        } catch (error) {
            logger.error('Error finding expiring submissions', {
                daysAhead,
                error: error.message
            });
            return [];
        }
    }

    /**
     * Cleanup automático de tokens expirados
     */
    async cleanupExpiredTokens() {
        try {
            const result = await db.query(`
                UPDATE submissions
                SET status = $1, updated_at = NOW()
                WHERE status IN ($2, $3)
                AND expires_at < NOW()
                RETURNING id, author_email, title
            `, [
                constants.SUBMISSION_STATUS.EXPIRED,
                constants.SUBMISSION_STATUS.DRAFT,
                constants.SUBMISSION_STATUS.CHANGES_REQUESTED
            ]);

            const expiredCount = result.rows.length;

            if (expiredCount > 0) {
                logger.audit('Expired tokens cleanup', {
                    expiredCount,
                    submissions: result.rows.map(sub => ({
                        id: sub.id,
                        author_email: sub.author_email,
                        title: sub.title
                    }))
                });
            }

            return {
                expiredCount,
                expiredSubmissions: result.rows
            };

        } catch (error) {
            logger.error('Error during token cleanup', {
                error: error.message
            });
            return { expiredCount: 0, expiredSubmissions: [] };
        }
    }

    /**
     * Validar formato do token
     */
    isValidTokenFormat(token) {
        return token &&
               typeof token === 'string' &&
               token.length === this.tokenLength &&
               /^[a-f0-9]+$/.test(token);
    }

    /**
     * Obter estatísticas de tokens
     */
    async getTokenStats() {
        try {
            const result = await db.query(`
                SELECT
                    status,
                    COUNT(*) as count,
                    COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_count,
                    COUNT(*) FILTER (WHERE expires_at <= NOW() + INTERVAL '5 days') as expiring_soon_count
                FROM submissions
                GROUP BY status
            `);

            const stats = {};
            result.rows.forEach(row => {
                stats[row.status] = {
                    total: parseInt(row.count),
                    expired: parseInt(row.expired_count),
                    expiringSoon: parseInt(row.expiring_soon_count)
                };
            });

            return stats;

        } catch (error) {
            logger.error('Error getting token stats', {
                error: error.message
            });
            return {};
        }
    }
}

module.exports = new TokenService();
