const tokenService = require('../../services/tokens');
const db = require('../../database/client');
const logger = require('../../middleware/logging');
const emailService = require('../../services/email');

// Mock do logger para evitar poluição no console durante os testes e verificar chamadas
jest.mock('../../middleware/logging', () => ({
    audit: jest.fn(),
    error: jest.fn(),
    security: jest.fn()
}));

// Mock do email (requerido inline no createSubmissionToken)
jest.mock('../../services/email', () => ({
    sendSubmissionToken: jest.fn()
}));

describe('TokenService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    describe('generateSecureToken & isValidTokenFormat', () => {
        it('generateSecureToken returns 64 hex chars', () => {
            const t = tokenService.generateSecureToken();
            expect(typeof t).toBe('string');
            expect(t).toHaveLength(64);
            expect(/^[a-f0-9]+$/.test(t)).toBe(true);
        });

        it('isValidTokenFormat validates correctly', () => {
            const good = tokenService.generateSecureToken();
            expect(tokenService.isValidTokenFormat(good)).toBe(true);
            expect(tokenService.isValidTokenFormat('short')).toBe(false);
            expect(tokenService.isValidTokenFormat(null)).toBe(false);
            expect(tokenService.isValidTokenFormat('z'.repeat(64))).toBe(false); // não hexadecimal
        });
    });

    describe('createSubmissionToken', () => {
        it('creates a token and sends email successfully', async () => {
            jest.spyOn(db, 'update').mockResolvedValue(true);
            jest.spyOn(db, 'findById').mockResolvedValue({ id: 's1', author_email: 'test@test.com' });
            emailService.sendSubmissionToken.mockResolvedValue({ success: true });

            const result = await tokenService.createSubmissionToken('s1');
            
            expect(result).toHaveProperty('token');
            expect(emailService.sendSubmissionToken).toHaveBeenCalled();
            expect(logger.audit).toHaveBeenCalled();
        });

        it('creates a token but logs error if email fails', async () => {
            jest.spyOn(db, 'update').mockResolvedValue(true);
            jest.spyOn(db, 'findById').mockResolvedValue({ id: 's1', author_email: 'test@test.com' });
            emailService.sendSubmissionToken.mockResolvedValue({ success: false, errorMessage: 'SMTP error' });

            const result = await tokenService.createSubmissionToken('s1');
            
            expect(result).toHaveProperty('token');
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to send submission token email'), expect.any(Object));
        });

        it('throws error and logs when database fails', async () => {
            jest.spyOn(db, 'update').mockRejectedValue(new Error('DB Error'));
            
            await expect(tokenService.createSubmissionToken('s1')).rejects.toThrow('Erro ao criar token de submissão');
            expect(logger.error).toHaveBeenCalledWith('Error creating submission token', expect.any(Object));
        });
    });

    describe('validateToken', () => {
        const validTokenStr = 'a'.repeat(64);

        it('returns TOKEN_INVALID_FORMAT when format is wrong', async () => {
            const res = await tokenService.validateToken('invalid-format');
            expect(res.isValid).toBe(false);
            expect(res.reason).toBe('TOKEN_INVALID_FORMAT');
            expect(logger.security).toHaveBeenCalled();
        });

        it('returns TOKEN_NOT_FOUND when db returns no submission', async () => {
            jest.spyOn(db, 'findByToken').mockResolvedValue(null);
            const res = await tokenService.validateToken(validTokenStr);
            expect(res.isValid).toBe(false);
            expect(res.reason).toBe('TOKEN_NOT_FOUND');
        });

        it('returns TOKEN_EXPIRED when submission expired', async () => {
            const expired = { id: 's1', expires_at: new Date(Date.now() - 1000).toISOString(), status: 'DRAFT', title: 'T', author_email: 'a@b' };
            jest.spyOn(db, 'findByToken').mockResolvedValue(expired);
            jest.spyOn(tokenService, 'markAsExpired').mockResolvedValue();

            const res = await tokenService.validateToken(validTokenStr);
            expect(res.isValid).toBe(false);
            expect(res.reason).toBe('TOKEN_EXPIRED');
            expect(tokenService.markAsExpired).toHaveBeenCalledWith('s1');
        });

        it('returns true when token is valid and not expired', async () => {
            const valid = { id: 's1', expires_at: new Date(Date.now() + 86400000 * 10).toISOString(), status: 'DRAFT' };
            jest.spyOn(db, 'findByToken').mockResolvedValue(valid);

            const res = await tokenService.validateToken(validTokenStr);
            expect(res.isValid).toBe(true);
            expect(res.tokenInfo).toBeDefined();
            expect(logger.audit).toHaveBeenCalled();
        });

        it('returns VALIDATION_ERROR when database throws error', async () => {
            jest.spyOn(db, 'findByToken').mockRejectedValue(new Error('DB Error'));
            const res = await tokenService.validateToken(validTokenStr);
            expect(res.isValid).toBe(false);
            expect(res.reason).toBe('VALIDATION_ERROR');
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('validateAuthorEmail', () => {
        it('returns true for exact email match', async () => {
            jest.spyOn(db, 'findById').mockResolvedValue({ author_email: 'test@iea.usp.br' });
            const res = await tokenService.validateAuthorEmail('s1', 'test@iea.usp.br');
            expect(res.isValid).toBe(true);
        });

        it('returns true for case insensitive email match', async () => {
            jest.spyOn(db, 'findById').mockResolvedValue({ author_email: 'Test@IEA.usp.br' });
            const res = await tokenService.validateAuthorEmail('s1', 'test@iea.usp.br');
            expect(res.isValid).toBe(true);
        });

        it('returns false when email mismatches', async () => {
            jest.spyOn(db, 'findById').mockResolvedValue({ author_email: 'author@test.com' });
            const res = await tokenService.validateAuthorEmail('s1', 'wrong@test.com');
            expect(res.isValid).toBe(false);
            expect(res.reason).toBe('EMAIL_MISMATCH');
            expect(logger.security).toHaveBeenCalled();
        });

        it('returns false when submission is not found', async () => {
            jest.spyOn(db, 'findById').mockResolvedValue(null);
            const res = await tokenService.validateAuthorEmail('s1', 'test@test.com');
            expect(res.isValid).toBe(false);
            expect(res.reason).toBe('SUBMISSION_NOT_FOUND');
        });

        it('returns VALIDATION_ERROR on database exception', async () => {
            jest.spyOn(db, 'findById').mockRejectedValue(new Error('DB Error'));
            const res = await tokenService.validateAuthorEmail('s1', 'test@test.com');
            expect(res.isValid).toBe(false);
            expect(res.reason).toBe('VALIDATION_ERROR');
        });
    });

    describe('renewToken & regenerateToken', () => {
        it('renewToken updates db and returns new date', async () => {
            jest.spyOn(db, 'update').mockResolvedValue(true);
            const r = await tokenService.renewToken('s1', 10);
            expect(r.success).toBe(true);
            expect(r.additionalDays).toBe(10);
        });

        it('renewToken throws on db error', async () => {
            jest.spyOn(db, 'update').mockRejectedValue(new Error('DB Error'));
            await expect(tokenService.renewToken('s1')).rejects.toThrow('Erro ao renovar token');
        });

        it('regenerateToken sets new token and returns it', async () => {
            jest.spyOn(db, 'update').mockResolvedValue(true);
            const r = await tokenService.regenerateToken('s1');
            expect(r.token).toHaveLength(64);
        });

        it('regenerateToken throws on db error', async () => {
            jest.spyOn(db, 'update').mockRejectedValue(new Error('DB Error'));
            await expect(tokenService.regenerateToken('s1')).rejects.toThrow('Erro ao regenerar token');
        });
    });

    describe('markAsExpired', () => {
        it('updates status successfully', async () => {
            jest.spyOn(db, 'update').mockResolvedValue(true);
            await tokenService.markAsExpired('s1');
            expect(logger.audit).toHaveBeenCalledWith('Submission marked as expired', expect.any(Object));
        });

        it('catches and logs error when db throws', async () => {
            jest.spyOn(db, 'update').mockRejectedValue(new Error('DB Error'));
            await tokenService.markAsExpired('s1');
            expect(logger.error).toHaveBeenCalledWith('Error marking submission as expired', expect.any(Object));
        });
    });

    describe('reactivateExpired', () => {
        it('throws when submission not found', async () => {
            jest.spyOn(db, 'findById').mockResolvedValue(null);
            await expect(tokenService.reactivateExpired('nope')).rejects.toThrow('Erro ao reativar submissão expirada');
        });

        it('reactivates normally to DRAFT status', async () => {
            jest.spyOn(db, 'findById').mockResolvedValue({ id: 's1', status: 'CANCELED' });
            jest.spyOn(db, 'update').mockResolvedValue(true);

            const res = await tokenService.reactivateExpired('s1');
            expect(res.status).toBe('DRAFT'); // Status constants fallback
        });

        it('reactivates EXPIRED submission to CHANGES_REQUESTED if it had pending feedback', async () => {
            jest.spyOn(db, 'findById').mockResolvedValue({ id: 's1', status: 'EXPIRED' });
            // Simula query do feedback retornando pendente
            jest.spyOn(db, 'query').mockResolvedValue({ rows: [{ status: 'PENDING' }] });
            jest.spyOn(db, 'update').mockResolvedValue(true);

            const res = await tokenService.reactivateExpired('s1');
            expect(res.status).toBe('CHANGES_REQUESTED');
        });

        it('throws error when database fails during reactivation', async () => {
            jest.spyOn(db, 'findById').mockRejectedValue(new Error('DB Error'));
            await expect(tokenService.reactivateExpired('s1')).rejects.toThrow('Erro ao reativar submissão expirada');
        });
    });

    describe('findExpiringSubmissions', () => {
        it('returns rows on success', async () => {
            jest.spyOn(db, 'query').mockResolvedValue({ rows: [{ id: 's1' }] });
            const rows = await tokenService.findExpiringSubmissions(5);
            expect(rows.length).toBe(1);
        });

        it('returns empty array on error', async () => {
            jest.spyOn(db, 'query').mockRejectedValue(new Error('DB Error'));
            const rows = await tokenService.findExpiringSubmissions(5);
            expect(rows).toEqual([]);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('cleanupExpiredTokens', () => {
        it('processes and logs expired tokens successfully (>0 rows)', async () => {
            jest.spyOn(db, 'query').mockResolvedValue({ rows: [{ id: '1', title: 'T' }] });
            const res = await tokenService.cleanupExpiredTokens();
            
            expect(res.expiredCount).toBe(1);
            expect(logger.audit).toHaveBeenCalledWith('Expired tokens cleanup', expect.any(Object));
        });

        it('handles cleanup successfully when 0 tokens expire', async () => {
            jest.spyOn(db, 'query').mockResolvedValue({ rows: [] });
            const res = await tokenService.cleanupExpiredTokens();
            
            expect(res.expiredCount).toBe(0);
        });

        it('returns safely on exception', async () => {
            jest.spyOn(db, 'query').mockRejectedValue(new Error('DB Error'));
            const res = await tokenService.cleanupExpiredTokens();
            
            expect(res.expiredCount).toBe(0);
            expect(res.expiredSubmissions).toEqual([]);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getTokenStats', () => {
        it('returns mapped stats successfully', async () => {
            jest.spyOn(db, 'query').mockResolvedValue({
                rows: [
                    { status: 'DRAFT', count: '5', expired_count: '2', expiring_soon_count: '1' }
                ]
            });
            const stats = await tokenService.getTokenStats();
            expect(stats.DRAFT.total).toBe(5);
            expect(stats.DRAFT.expired).toBe(2);
        });

        it('returns empty object on database error', async () => {
            jest.spyOn(db, 'query').mockRejectedValue(new Error('DB Error'));
            const stats = await tokenService.getTokenStats();
            expect(stats).toEqual({});
            expect(logger.error).toHaveBeenCalled();
        });
    });
});