/**
 * Testes para TokenController
 */
const { validationResult } = require('express-validator');
const tokenController = require('../../controllers/tokens');
const tokenService = require('../../services/tokens');
const db = require('../../database/client');
const logger = require('../../middleware/logging');
const responses = require('../../utils/responses');

jest.mock('express-validator', () => ({
    validationResult: jest.fn()
}));
jest.mock('../../services/tokens');
jest.mock('../../database/client');
jest.mock('../../middleware/logging');
jest.mock('../../utils/responses');

describe('TokenController', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {},
            body: {},
            query: {},
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('test-user-agent'),
            user: { id: 'admin-id', email: 'admin@example.com' }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn()
        };

        next = jest.fn();

        responses.success = jest.fn().mockReturnValue('success');
        responses.badRequest = jest.fn().mockReturnValue('badRequest');
        responses.unauthorized = jest.fn().mockReturnValue('unauthorized');
        responses.forbidden = jest.fn().mockReturnValue('forbidden');
        responses.notFound = jest.fn().mockReturnValue('notFound');
        responses.error = jest.fn().mockReturnValue('error');

        validationResult.mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(true),
            array: jest.fn().mockReturnValue([])
        });
    });

    describe('validateToken', () => {
        test('deve retornar informações do token válido', async () => {
            req.params.token = 'valid-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

            const mockValidation = {
                isValid: true,
                submission: {
                    id: 'submission-id',
                    title: 'Test Submission',
                    status: 'DRAFT',
                    author_name: 'Test Author',
                    created_at: new Date(),
                    updated_at: new Date()
                },
                tokenInfo: {
                    expiresAt: new Date(),
                    daysToExpiry: 15,
                    isNearExpiry: false,
                    needsRenewal: false
                }
            };

            tokenService.validateToken.mockResolvedValue(mockValidation);

            await tokenController.validateToken(req, res, next);

            expect(tokenService.validateToken).toHaveBeenCalledWith(req.params.token);
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    submission: expect.objectContaining({
                        id: 'submission-id',
                        title: 'Test Submission'
                    }),
                    tokenInfo: mockValidation.tokenInfo
                }),
                'Token válido'
            );
        });

        test('deve rejeitar token inválido', async () => {
            req.params.token = 'invalid-token';

            tokenService.validateToken.mockResolvedValue({
                isValid: false,
                reason: 'TOKEN_INVALID_FORMAT'
            });

            await tokenController.validateToken(req, res, next);

            expect(tokenService.validateToken).toHaveBeenCalledWith(req.params.token);
            expect(responses.unauthorized).toHaveBeenCalledWith(
                res,
                'Formato de token inválido'
            );
        });
    });

    describe('verifyAuthorEmail', () => {
        test('deve verificar email do autor com sucesso', async () => {
            req.params.token = 'valid-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            req.body.email = 'author@example.com';

            const mockTokenValidation = {
                isValid: true,
                submission: {
                    id: 'submission-id',
                    author_email: 'author@example.com'
                },
                tokenInfo: {
                    expiresAt: new Date(),
                    daysToExpiry: 15
                }
            };

            const mockEmailValidation = {
                isValid: true,
                reason: 'EMAIL_VALID',
                submission: {
                    id: 'submission-id',
                    author_email: 'author@example.com'
                }
            };

            tokenService.validateToken.mockResolvedValue(mockTokenValidation);
            tokenService.validateAuthorEmail.mockResolvedValue(mockEmailValidation);

            await tokenController.verifyAuthorEmail(req, res, next);

            expect(tokenService.validateToken).toHaveBeenCalledWith(req.params.token);
            expect(tokenService.validateAuthorEmail).toHaveBeenCalledWith(
                'submission-id',
                'author@example.com'
            );
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    verified: true,
                    submission: mockTokenValidation.submission,
                    tokenInfo: mockTokenValidation.tokenInfo
                }),
                'Email verificado com sucesso'
            );
        });

        test('deve rejeitar email incorreto', async () => {
            req.params.token = 'valid-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            req.body.email = 'wrong@example.com';

            const mockTokenValidation = {
                isValid: true,
                submission: {
                    id: 'submission-id',
                    author_email: 'author@example.com'
                }
            };

            const mockEmailValidation = {
                isValid: false,
                reason: 'EMAIL_MISMATCH'
            };

            tokenService.validateToken.mockResolvedValue(mockTokenValidation);
            tokenService.validateAuthorEmail.mockResolvedValue(mockEmailValidation);

            await tokenController.verifyAuthorEmail(req, res, next);

            expect(logger.security).toHaveBeenCalled();
            expect(responses.forbidden).toHaveBeenCalledWith(
                res,
                'Email não confere com o autor da submissão'
            );
        });
    });

    describe('reactivateExpired', () => {
        test('deve reativar submissão expirada', async () => {
            req.params.submissionId = 'submission-id';
            req.body.expiryDays = 30;

            const mockSubmission = {
                id: 'submission-id',
                title: 'Test Submission',
                author_email: 'author@example.com',
                status: 'EXPIRED'
            };

            const mockResult = {
                token: 'new-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                status: 'DRAFT',
                expiresAt: new Date()
            };

            db.findById.mockResolvedValue(mockSubmission);
            tokenService.reactivateExpired.mockResolvedValue(mockResult);

            await tokenController.reactivateExpired(req, res, next);

            expect(db.findById).toHaveBeenCalledWith('submissions', 'submission-id');
            expect(tokenService.reactivateExpired).toHaveBeenCalledWith(
                'submission-id',
                30
            );
            expect(logger.audit).toHaveBeenCalled();
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    token: mockResult.token,
                    status: mockResult.status,
                    expiresAt: mockResult.expiresAt,
                    submission: expect.objectContaining({
                        id: 'submission-id',
                        title: 'Test Submission'
                    })
                }),
                'Submissão reativada com sucesso'
            );
        });

        test('deve gerar novo token', async () => {
            req.params.submissionId = 'submission-id';

            const mockSubmission = {
                id: 'submission-id',
                title: 'Test Submission',
                author_email: 'author@example.com',
                status: 'EXPIRED'
            };

            const mockResult = {
                token: 'new-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                status: 'DRAFT',
                expiresAt: new Date()
            };

            db.findById.mockResolvedValue(mockSubmission);
            tokenService.reactivateExpired.mockResolvedValue(mockResult);

            await tokenController.reactivateExpired(req, res, next);

            expect(tokenService.reactivateExpired).toHaveBeenCalledWith(
                'submission-id',
                undefined
            );
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    token: mockResult.token
                }),
                expect.any(String)
            );
        });

        test('deve determinar status correto', async () => {
            req.params.submissionId = 'submission-id';

            const mockSubmission = {
                id: 'submission-id',
                title: 'Test Submission',
                author_email: 'author@example.com',
                status: 'EXPIRED'
            };

            // Simular que o serviço determinou que deve voltar para CHANGES_REQUESTED
            const mockResult = {
                token: 'new-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                status: 'CHANGES_REQUESTED',
                expiresAt: new Date()
            };

            db.findById.mockResolvedValue(mockSubmission);
            tokenService.reactivateExpired.mockResolvedValue(mockResult);

            await tokenController.reactivateExpired(req, res, next);

            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    status: 'CHANGES_REQUESTED'
                }),
                expect.any(String)
            );
        });
    });

    describe('cleanupExpiredTokens', () => {
        test('deve executar limpeza de tokens expirados', async () => {
            const mockResult = {
                expiredCount: 5,
                expiredSubmissions: [
                    { id: 'sub1', author_email: 'author1@example.com', title: 'Submission 1' },
                    { id: 'sub2', author_email: 'author2@example.com', title: 'Submission 2' }
                ]
            };

            tokenService.cleanupExpiredTokens.mockResolvedValue(mockResult);

            await tokenController.cleanupExpiredTokens(req, res, next);

            expect(tokenService.cleanupExpiredTokens).toHaveBeenCalled();
            expect(logger.audit).toHaveBeenCalled();
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    expiredCount: 5,
                    expiredSubmissions: mockResult.expiredSubmissions
                }),
                '5 tokens expirados limpos'
            );
        });
    });

    describe('renewToken', () => {
        test('deve renovar token com sucesso', async () => {
            req.params.token = 'valid-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            req.body.additionalDays = 30;

            const mockValidation = {
                isValid: true,
                submission: {
                    id: 'submission-id',
                    title: 'Test Submission'
                }
            };

            const mockRenewal = {
                success: true,
                newExpiresAt: new Date(),
                additionalDays: 30
            };

            tokenService.validateToken.mockResolvedValue(mockValidation);
            tokenService.renewToken.mockResolvedValue(mockRenewal);

            await tokenController.renewToken(req, res, next);

            expect(tokenService.validateToken).toHaveBeenCalledWith(req.params.token);
            expect(tokenService.renewToken).toHaveBeenCalledWith(
                'submission-id',
                30
            );
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    renewed: true,
                    newExpiresAt: mockRenewal.newExpiresAt,
                    additionalDays: mockRenewal.additionalDays
                }),
                'Token renovado com sucesso'
            );
        });

        test('deve renovar token com dias padrão quando não especificado', async () => {
            req.params.token = 'valid-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            // Não especificar additionalDays

            const mockValidation = {
                isValid: true,
                submission: {
                    id: 'submission-id',
                    title: 'Test Submission'
                }
            };

            const mockRenewal = {
                success: true,
                newExpiresAt: new Date(),
                additionalDays: 30 // Valor padrão do serviço
            };

            tokenService.validateToken.mockResolvedValue(mockValidation);
            tokenService.renewToken.mockResolvedValue(mockRenewal);

            await tokenController.renewToken(req, res, next);

            expect(tokenService.renewToken).toHaveBeenCalledWith(
                'submission-id',
                undefined
            );
            expect(responses.success).toHaveBeenCalled();
        });

        test('deve rejeitar token inválido', async () => {
            req.params.token = 'invalid-token';

            tokenService.validateToken.mockResolvedValue({
                isValid: false,
                reason: 'TOKEN_NOT_FOUND'
            });

            await tokenController.renewToken(req, res, next);

            expect(tokenService.validateToken).toHaveBeenCalledWith(req.params.token);
            expect(tokenService.renewToken).not.toHaveBeenCalled();
            expect(responses.unauthorized).toHaveBeenCalledWith(
                res,
                'Token inválido para renovação'
            );
        });

        test('deve lidar com erros', async () => {
            req.params.token = 'valid-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

            const mockValidation = {
                isValid: true,
                submission: {
                    id: 'submission-id'
                }
            };

            tokenService.validateToken.mockResolvedValue(mockValidation);
            tokenService.renewToken.mockRejectedValue(new Error('Erro ao renovar token'));

            await tokenController.renewToken(req, res, next);

            expect(logger.error).toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('regenerateToken', () => {
        test('deve regenerar token com sucesso', async () => {
            req.params.submissionId = 'submission-id';

            const mockSubmission = {
                id: 'submission-id',
                title: 'Test Submission',
                author_email: 'author@example.com',
                token: 'old-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
            };

            const mockResult = {
                token: 'new-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                expiresAt: new Date()
            };

            db.findById.mockResolvedValue(mockSubmission);
            tokenService.regenerateToken.mockResolvedValue(mockResult);

            await tokenController.regenerateToken(req, res, next);

            expect(db.findById).toHaveBeenCalledWith('submissions', 'submission-id');
            expect(tokenService.regenerateToken).toHaveBeenCalledWith('submission-id');
            expect(logger.audit).toHaveBeenCalled();
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    token: mockResult.token,
                    expiresAt: mockResult.expiresAt,
                    submission: expect.objectContaining({
                        id: 'submission-id',
                        title: 'Test Submission',
                        author_email: 'author@example.com'
                    })
                }),
                'Token regenerado com sucesso'
            );
        });

        test('deve rejeitar submissão inexistente', async () => {
            req.params.submissionId = 'nonexistent-id';

            db.findById.mockResolvedValue(null);

            await tokenController.regenerateToken(req, res, next);

            expect(db.findById).toHaveBeenCalledWith('submissions', 'nonexistent-id');
            expect(tokenService.regenerateToken).not.toHaveBeenCalled();
            expect(responses.notFound).toHaveBeenCalledWith(
                res,
                'Submissão não encontrada'
            );
        });

        test('deve lidar com erros', async () => {
            req.params.submissionId = 'submission-id';

            db.findById.mockResolvedValue({
                id: 'submission-id',
                title: 'Test Submission'
            });
            tokenService.regenerateToken.mockRejectedValue(new Error('Erro ao regenerar token'));

            await tokenController.regenerateToken(req, res, next);

            expect(logger.error).toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('getExpiringSubmissions', () => {
        test('deve retornar submissões próximas do vencimento', async () => {
            req.query.days = '7';

            const mockExpiringSubmissions = [
                {
                    id: 'sub1',
                    token: 'token1',
                    author_name: 'Author 1',
                    author_email: 'author1@example.com',
                    title: 'Submission 1',
                    expires_at: new Date(),
                    days_to_expiry: 3
                },
                {
                    id: 'sub2',
                    token: 'token2',
                    author_name: 'Author 2',
                    author_email: 'author2@example.com',
                    title: 'Submission 2',
                    expires_at: new Date(),
                    days_to_expiry: 5
                }
            ];

            tokenService.findExpiringSubmissions.mockResolvedValue(mockExpiringSubmissions);

            await tokenController.getExpiringSubmissions(req, res, next);

            expect(tokenService.findExpiringSubmissions).toHaveBeenCalledWith(7);
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    submissions: mockExpiringSubmissions,
                    daysAhead: 7,
                    count: 2
                }),
                'Submissões próximas do vencimento'
            );
        });

        test('deve usar valor padrão de dias quando não especificado', async () => {
            // Não especificar req.query.days

            const mockExpiringSubmissions = [
                {
                    id: 'sub1',
                    token: 'token1',
                    author_name: 'Author 1',
                    author_email: 'author1@example.com',
                    title: 'Submission 1',
                    expires_at: new Date(),
                    days_to_expiry: 3
                }
            ];

            tokenService.findExpiringSubmissions.mockResolvedValue(mockExpiringSubmissions);

            await tokenController.getExpiringSubmissions(req, res, next);

            expect(tokenService.findExpiringSubmissions).toHaveBeenCalledWith(5); // Valor padrão
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    submissions: mockExpiringSubmissions,
                    daysAhead: 5,
                    count: 1
                }),
                'Submissões próximas do vencimento'
            );
        });

        test('deve lidar com erros', async () => {
            req.query.days = '7';

            tokenService.findExpiringSubmissions.mockRejectedValue(new Error('Erro ao buscar submissões'));

            await tokenController.getExpiringSubmissions(req, res, next);

            expect(logger.error).toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('getTokenStats', () => {
        test('deve retornar estatísticas de tokens', async () => {
            const mockStats = {
                DRAFT: {
                    total: 10,
                    expired: 2,
                    expiringSoon: 3
                },
                CHANGES_REQUESTED: {
                    total: 5,
                    expired: 1,
                    expiringSoon: 2
                },
                EXPIRED: {
                    total: 8,
                    expired: 8,
                    expiringSoon: 0
                }
            };

            tokenService.getTokenStats.mockResolvedValue(mockStats);

            await tokenController.getTokenStats(req, res, next);

            expect(tokenService.getTokenStats).toHaveBeenCalled();
            expect(responses.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    stats: mockStats,
                    timestamp: expect.any(String)
                }),
                'Estatísticas de tokens'
            );
        });

        test('deve lidar com erros', async () => {
            tokenService.getTokenStats.mockRejectedValue(new Error('Erro ao obter estatísticas'));

            await tokenController.getTokenStats(req, res, next);

            expect(logger.error).toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
