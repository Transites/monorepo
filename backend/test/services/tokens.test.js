const tokenService = require('../../services/tokens');
const db = require('../../database/client');
const constants = require('../../utils/constants');

jest.mock('../../database/client');
jest.mock('../../middleware/logging');

describe('TokenService', () => {
    const sixtyFourCharacterToken = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const mockSubmissionId = 'submission-id';
    const mockAuthorEmail = 'author@example.com';

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock the generateSecureToken method to return a predictable value
        jest.spyOn(tokenService, 'generateSecureToken').mockReturnValue(sixtyFourCharacterToken);
    });

    describe('generateSecureToken', () => {
        test('deve gerar token de 64 caracteres hexadecimais', () => {
            const token = tokenService.generateSecureToken();
            expect(token).toHaveLength(64);
            expect(token).toMatch(/^[a-f0-9]+$/);
        });

        test('deve gerar tokens únicos', () => {
            // Restaurar a implementação original para este teste
            jest.spyOn(tokenService, 'generateSecureToken').mockRestore();

            const token1 = tokenService.generateSecureToken();
            const token2 = tokenService.generateSecureToken();
            expect(token1).not.toEqual(token2);

            // Restaurar o mock após o teste
            jest.spyOn(tokenService, 'generateSecureToken').mockReturnValue(sixtyFourCharacterToken);
        });

    });

    describe('validateToken', () => {
        test('deve validar token válido', async () => {
            const mockSubmission = {
                id: 'submission-id',
                token: sixtyFourCharacterToken,
                status: constants.SUBMISSION_STATUS.DRAFT,
                expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 dias no futuro
                author_email: 'author@example.com'
            };

            db.findByToken.mockResolvedValue(mockSubmission);

            const result = await tokenService.validateToken(mockSubmission.token);

            expect(result.isValid).toBe(true);
            expect(result.submission).toEqual(mockSubmission);
            expect(result.tokenInfo.daysToExpiry).toBeGreaterThan(9);
            expect(result.tokenInfo.isNearExpiry).toBe(false);
        });

        test('deve rejeitar token expirado', async () => {
            const mockSubmission = {
                id: 'submission-id',
                token: sixtyFourCharacterToken,
                status: constants.SUBMISSION_STATUS.DRAFT,
                expires_at: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia no passado
                author_email: 'author@example.com',
                title: 'Test Submission'
            };

            db.findByToken.mockResolvedValue(mockSubmission);
            db.update.mockResolvedValue({...mockSubmission, status: constants.SUBMISSION_STATUS.EXPIRED});

            const result = await tokenService.validateToken(mockSubmission.token);

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('TOKEN_EXPIRED');
            expect(result.submission).toBeDefined();
            expect(result.submission.id).toBe(mockSubmission.id);
            expect(db.update).toHaveBeenCalledWith('submissions', mockSubmission.id, expect.objectContaining({
                status: constants.SUBMISSION_STATUS.EXPIRED
            }));
        });

        test('deve rejeitar token inexistente', async () => {
            db.findByToken.mockResolvedValue(null);

            const result = await tokenService.validateToken(sixtyFourCharacterToken);

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('TOKEN_NOT_FOUND');
        });

        test('deve detectar proximidade de expiração', async () => {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 3); // 3 dias no futuro (dentro do período de aviso)

            const mockSubmission = {
                id: 'submission-id',
                token: sixtyFourCharacterToken,
                status: constants.SUBMISSION_STATUS.DRAFT,
                expires_at: expiryDate,
                author_email: 'author@example.com'
            };

            db.findByToken.mockResolvedValue(mockSubmission);

            const result = await tokenService.validateToken(mockSubmission.token);

            expect(result.isValid).toBe(true);
            expect(result.tokenInfo.isNearExpiry).toBe(true);
            expect(result.tokenInfo.needsRenewal).toBe(true);
            expect(result.tokenInfo.daysToExpiry).toBeLessThanOrEqual(3);
        });
    });

    describe('cleanupExpiredTokens', () => {
        test('deve marcar tokens expirados como EXPIRED', async () => {
            const mockExpiredSubmissions = [
                {id: 'sub1', author_email: 'author1@example.com', title: 'Submission 1'},
                {id: 'sub2', author_email: 'author2@example.com', title: 'Submission 2'}
            ];

            db.query.mockResolvedValue({rows: mockExpiredSubmissions});

            const result = await tokenService.cleanupExpiredTokens();

            expect(result.expiredCount).toBe(2);
            expect(result.expiredSubmissions).toEqual(mockExpiredSubmissions);
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE submissions'), [
                constants.SUBMISSION_STATUS.EXPIRED,
                constants.SUBMISSION_STATUS.DRAFT,
                constants.SUBMISSION_STATUS.CHANGES_REQUESTED
            ]);
        });

        test('deve retornar contagem correta', async () => {
            db.query.mockResolvedValue({rows: []});

            const result = await tokenService.cleanupExpiredTokens();

            expect(result.expiredCount).toBe(0);
            expect(result.expiredSubmissions).toEqual([]);
        });

        test('deve preservar tokens válidos', async () => {
            const mockExpiredSubmissions = [
                {id: 'sub1', author_email: 'author1@example.com', title: 'Submission 1'}
            ];

            db.query.mockResolvedValue({rows: mockExpiredSubmissions});

            await tokenService.cleanupExpiredTokens();

            // Verificar que a query contém a condição de expiração
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('expires_at < NOW()'),
                expect.anything()
            );
        });
    });

    describe('createSubmissionToken', () => {
        test('deve criar token com expiração padrão', async () => {
            db.update.mockResolvedValue({});

            const result = await tokenService.createSubmissionToken(mockSubmissionId);

            expect(result.token).toBe(sixtyFourCharacterToken);
            expect(result.expiryDays).toBe(tokenService.defaultExpiryDays);

            // Verificar se a data de expiração está correta (aproximadamente 30 dias no futuro)
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() + tokenService.defaultExpiryDays);
            const daysDiff = Math.abs(result.expiresAt.getDate() - expectedDate.getDate());
            expect(daysDiff).toBeLessThanOrEqual(1); // Permitir diferença de 1 dia devido a horários

            expect(db.update).toHaveBeenCalledWith('submissions', mockSubmissionId, expect.objectContaining({
                token: sixtyFourCharacterToken,
                expires_at: expect.any(Date)
            }));
        });

        test('deve criar token com expiração personalizada', async () => {
            const customDays = 60;
            db.update.mockResolvedValue({});

            const result = await tokenService.createSubmissionToken(mockSubmissionId, customDays);

            expect(result.token).toBe(sixtyFourCharacterToken);
            expect(result.expiryDays).toBe(customDays);

            // Verificar se a data de expiração está correta (aproximadamente 60 dias no futuro)
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() + customDays);
            const daysDiff = Math.abs(result.expiresAt.getDate() - expectedDate.getDate());
            expect(daysDiff).toBeLessThanOrEqual(1);

            expect(db.update).toHaveBeenCalledWith('submissions', mockSubmissionId, expect.objectContaining({
                token: sixtyFourCharacterToken,
                expires_at: expect.any(Date)
            }));
        });

        test('deve lançar erro quando falhar', async () => {
            db.update.mockRejectedValue(new Error('Database error'));

            await expect(tokenService.createSubmissionToken(mockSubmissionId))
                .rejects.toThrow('Erro ao criar token de submissão');
        });
    });

    describe('validateAuthorEmail', () => {
        test('deve validar email correto do autor', async () => {
            const mockSubmission = {
                id: mockSubmissionId,
                author_email: mockAuthorEmail
            };

            db.findById.mockResolvedValue(mockSubmission);

            const result = await tokenService.validateAuthorEmail(mockSubmissionId, mockAuthorEmail);

            expect(result.isValid).toBe(true);
            expect(result.reason).toBe('EMAIL_VALID');
            expect(result.submission).toEqual(mockSubmission);
        });

        test('deve validar email com diferença de maiúsculas/minúsculas', async () => {
            const mockSubmission = {
                id: mockSubmissionId,
                author_email: mockAuthorEmail.toUpperCase()
            };

            db.findById.mockResolvedValue(mockSubmission);

            const result = await tokenService.validateAuthorEmail(mockSubmissionId, mockAuthorEmail.toLowerCase());

            expect(result.isValid).toBe(true);
            expect(result.reason).toBe('EMAIL_VALID');
        });

        test('deve rejeitar email incorreto', async () => {
            const mockSubmission = {
                id: mockSubmissionId,
                author_email: mockAuthorEmail
            };

            db.findById.mockResolvedValue(mockSubmission);

            const result = await tokenService.validateAuthorEmail(mockSubmissionId, 'wrong@example.com');

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('EMAIL_MISMATCH');
        });

        test('deve rejeitar submissão inexistente', async () => {
            db.findById.mockResolvedValue(null);

            const result = await tokenService.validateAuthorEmail(mockSubmissionId, mockAuthorEmail);

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('SUBMISSION_NOT_FOUND');
        });

        test('deve lidar com erros', async () => {
            db.findById.mockRejectedValue(new Error('Database error'));

            const result = await tokenService.validateAuthorEmail(mockSubmissionId, mockAuthorEmail);

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('VALIDATION_ERROR');
        });
    });

    describe('renewToken', () => {
        test('deve renovar token com dias padrão', async () => {
            db.update.mockResolvedValue({});

            const result = await tokenService.renewToken(mockSubmissionId);

            expect(result.success).toBe(true);
            expect(result.additionalDays).toBe(tokenService.defaultExpiryDays);

            // Verificar se a data de expiração está correta
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() + tokenService.defaultExpiryDays);
            const daysDiff = Math.abs(result.newExpiresAt.getDate() - expectedDate.getDate());
            expect(daysDiff).toBeLessThanOrEqual(1);

            expect(db.update).toHaveBeenCalledWith('submissions', mockSubmissionId, expect.objectContaining({
                expires_at: expect.any(Date)
            }));
        });

        test('deve renovar token com dias personalizados', async () => {
            const customDays = 15;
            db.update.mockResolvedValue({});

            const result = await tokenService.renewToken(mockSubmissionId, customDays);

            expect(result.success).toBe(true);
            expect(result.additionalDays).toBe(customDays);

            // Verificar se a data de expiração está correta
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() + customDays);
            const daysDiff = Math.abs(result.newExpiresAt.getDate() - expectedDate.getDate());
            expect(daysDiff).toBeLessThanOrEqual(1);
        });

        test('deve lançar erro quando falhar', async () => {
            db.update.mockRejectedValue(new Error('Database error'));

            await expect(tokenService.renewToken(mockSubmissionId))
                .rejects.toThrow('Erro ao renovar token');
        });
    });

    describe('regenerateToken', () => {
        test('deve regenerar token completamente novo', async () => {
            db.update.mockResolvedValue({});

            const result = await tokenService.regenerateToken(mockSubmissionId);

            expect(result.token).toBe(sixtyFourCharacterToken);

            // Verificar se a data de expiração está correta
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() + tokenService.defaultExpiryDays);
            const daysDiff = Math.abs(result.expiresAt.getDate() - expectedDate.getDate());
            expect(daysDiff).toBeLessThanOrEqual(1);

            expect(db.update).toHaveBeenCalledWith('submissions', mockSubmissionId, expect.objectContaining({
                token: sixtyFourCharacterToken,
                expires_at: expect.any(Date)
            }));
        });

        test('deve lançar erro quando falhar', async () => {
            db.update.mockRejectedValue(new Error('Database error'));

            await expect(tokenService.regenerateToken(mockSubmissionId))
                .rejects.toThrow('Erro ao regenerar token');
        });
    });

    describe('reactivateExpired', () => {
        test('deve reativar submissão expirada como rascunho', async () => {
            const mockSubmission = {
                id: mockSubmissionId,
                status: constants.SUBMISSION_STATUS.EXPIRED
            };

            db.findById.mockResolvedValue(mockSubmission);
            db.query.mockResolvedValue({ rows: [] }); // Sem feedback pendente
            db.update.mockResolvedValue({});

            const result = await tokenService.reactivateExpired(mockSubmissionId);

            expect(result.token).toBe(sixtyFourCharacterToken);
            expect(result.status).toBe(constants.SUBMISSION_STATUS.DRAFT);

            // Verificar se a data de expiração está correta
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() + tokenService.defaultExpiryDays);
            const daysDiff = Math.abs(result.expiresAt.getDate() - expectedDate.getDate());
            expect(daysDiff).toBeLessThanOrEqual(1);

            expect(db.update).toHaveBeenCalledWith('submissions', mockSubmissionId, expect.objectContaining({
                token: sixtyFourCharacterToken,
                status: constants.SUBMISSION_STATUS.DRAFT,
                expires_at: expect.any(Date)
            }));
        });

        test('deve reativar submissão expirada com status de alterações solicitadas', async () => {
            const mockSubmission = {
                id: mockSubmissionId,
                status: constants.SUBMISSION_STATUS.EXPIRED
            };

            const mockFeedback = {
                rows: [{
                    status: constants.FEEDBACK_STATUS.PENDING
                }]
            };

            db.findById.mockResolvedValue(mockSubmission);
            db.query.mockResolvedValue(mockFeedback);
            db.update.mockResolvedValue({});

            const result = await tokenService.reactivateExpired(mockSubmissionId);

            expect(result.token).toBe(sixtyFourCharacterToken);
            expect(result.status).toBe(constants.SUBMISSION_STATUS.CHANGES_REQUESTED);

            expect(db.update).toHaveBeenCalledWith('submissions', mockSubmissionId, expect.objectContaining({
                token: sixtyFourCharacterToken,
                status: constants.SUBMISSION_STATUS.CHANGES_REQUESTED,
                expires_at: expect.any(Date)
            }));
        });

        test('deve reativar com dias de expiração personalizados', async () => {
            const customDays = 45;
            const mockSubmission = {
                id: mockSubmissionId,
                status: constants.SUBMISSION_STATUS.EXPIRED
            };

            db.findById.mockResolvedValue(mockSubmission);
            db.query.mockResolvedValue({ rows: [] });
            db.update.mockResolvedValue({});

            const result = await tokenService.reactivateExpired(mockSubmissionId, customDays);

            // Verificar se a data de expiração está correta
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() + customDays);
            const daysDiff = Math.abs(result.expiresAt.getDate() - expectedDate.getDate());
            expect(daysDiff).toBeLessThanOrEqual(1);
        });

        test('deve lançar erro quando submissão não for encontrada', async () => {
            db.findById.mockResolvedValue(null);

            await expect(tokenService.reactivateExpired(mockSubmissionId))
                .rejects.toThrow('Erro ao reativar submissão expirada');
        });

        test('deve lançar erro quando falhar', async () => {
            db.findById.mockRejectedValue(new Error('Database error'));

            await expect(tokenService.reactivateExpired(mockSubmissionId))
                .rejects.toThrow('Erro ao reativar submissão expirada');
        });
    });

    describe('findExpiringSubmissions', () => {
        test('deve encontrar submissões próximas do vencimento', async () => {
            const mockExpiringSubmissions = [
                {
                    id: 'sub1',
                    token: 'token1',
                    author_name: 'Author 1',
                    author_email: 'author1@example.com',
                    title: 'Submission 1',
                    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 dias no futuro
                    days_to_expiry: 3
                },
                {
                    id: 'sub2',
                    token: 'token2',
                    author_name: 'Author 2',
                    author_email: 'author2@example.com',
                    title: 'Submission 2',
                    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 dia no futuro
                    days_to_expiry: 1
                }
            ];

            db.query.mockResolvedValue({ rows: mockExpiringSubmissions });

            const result = await tokenService.findExpiringSubmissions(5);

            expect(result).toEqual(mockExpiringSubmissions);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT id, token, author_name, author_email, title, expires_at'),
                [
                    constants.SUBMISSION_STATUS.DRAFT,
                    constants.SUBMISSION_STATUS.CHANGES_REQUESTED,
                    expect.any(Date)
                ]
            );
        });

        test('deve retornar array vazio quando não houver submissões expirando', async () => {
            db.query.mockResolvedValue({ rows: [] });

            const result = await tokenService.findExpiringSubmissions(5);

            expect(result).toEqual([]);
        });

        test('deve retornar array vazio quando ocorrer erro', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            const result = await tokenService.findExpiringSubmissions(5);

            expect(result).toEqual([]);
        });
    });

    describe('getTokenStats', () => {
        test('deve retornar estatísticas de tokens por status', async () => {
            const mockStatsRows = [
                {
                    status: constants.SUBMISSION_STATUS.DRAFT,
                    count: '10',
                    expired_count: '2',
                    expiring_soon_count: '3'
                },
                {
                    status: constants.SUBMISSION_STATUS.CHANGES_REQUESTED,
                    count: '5',
                    expired_count: '1',
                    expiring_soon_count: '2'
                },
                {
                    status: constants.SUBMISSION_STATUS.EXPIRED,
                    count: '8',
                    expired_count: '8',
                    expiring_soon_count: '0'
                }
            ];

            db.query.mockResolvedValue({ rows: mockStatsRows });

            const result = await tokenService.getTokenStats();

            expect(result).toEqual({
                [constants.SUBMISSION_STATUS.DRAFT]: {
                    total: 10,
                    expired: 2,
                    expiringSoon: 3
                },
                [constants.SUBMISSION_STATUS.CHANGES_REQUESTED]: {
                    total: 5,
                    expired: 1,
                    expiringSoon: 2
                },
                [constants.SUBMISSION_STATUS.EXPIRED]: {
                    total: 8,
                    expired: 8,
                    expiringSoon: 0
                }
            });

            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT\n                    status,\n                    COUNT(*) as count'));
        });

        test('deve retornar objeto vazio quando ocorrer erro', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            const result = await tokenService.getTokenStats();

            expect(result).toEqual({});
        });
    });
});
