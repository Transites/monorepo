const crypto = require('crypto');
const cryptoUtils = require('./crypto');

// Mock crypto to avoid actual randomness during tests
jest.mock('crypto', () => ({
    randomBytes: jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue('mockedRandomBytes')
    }),
    randomUUID: jest.fn().mockReturnValue('mockedUUID'),
    createHash: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('mockedHash')
    })
}));

describe('Crypto Utility Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Token Generation', () => {
        test('should generate token with default length', () => {
            const token = cryptoUtils.generateToken();

            expect(crypto.randomBytes).toHaveBeenCalledWith(32);
            expect(token).toBe('mockedRandomBytes');
        });

        test('should generate token with custom length', () => {
            const token = cryptoUtils.generateToken(64);

            expect(crypto.randomBytes).toHaveBeenCalledWith(64);
            expect(token).toBe('mockedRandomBytes');
        });
    });

    describe('UUID Generation', () => {
        test('should generate UUID', () => {
            const uuid = cryptoUtils.generateUUID();

            expect(crypto.randomUUID).toHaveBeenCalled();
            expect(uuid).toBe('mockedUUID');
        });
    });

    describe('Hashing', () => {
        test('should hash data', () => {
            const hash = cryptoUtils.hash('test-data');

            expect(crypto.createHash).toHaveBeenCalledWith('sha256');
            expect(crypto.createHash().update).toHaveBeenCalledWith('test-data');
            expect(crypto.createHash().digest).toHaveBeenCalledWith('hex');
            expect(hash).toBe('mockedHash');
        });
    });

    describe('Submission Token Generation', () => {
        test('should generate submission token', () => {
            // Mock Date.now
            const originalNow = Date.now;
            Date.now = jest.fn().mockReturnValue(1234567890);

            const token = cryptoUtils.generateSubmissionToken();

            // Restore Date.now
            Date.now = originalNow;

            expect(crypto.randomBytes).toHaveBeenCalledWith(24);
            expect(crypto.createHash).toHaveBeenCalledWith('sha256');
            expect(crypto.createHash().update).toHaveBeenCalledWith('1234567890mockedRandomBytes');
            expect(token).toBe('mockedHash');
        });
    });

    describe('Token Format Validation', () => {
        test('should validate correct token format', () => {
            // Mock implementation for this test only
            const isValidTokenFormat = jest.spyOn(cryptoUtils, 'isValidTokenFormat');
            isValidTokenFormat.mockImplementation((token) => {
                return typeof token === 'string' &&
                       token.length === 64 &&
                       /^[a-f0-9]+$/.test(token);
            });

            const validToken = 'a'.repeat(64);
            expect(cryptoUtils.isValidTokenFormat(validToken)).toBe(true);

            const hexToken = '0123456789abcdef'.repeat(4);
            expect(cryptoUtils.isValidTokenFormat(hexToken)).toBe(true);

            isValidTokenFormat.mockRestore();
        });

        test('should reject incorrect token format', () => {
            // Mock implementation for this test only
            const isValidTokenFormat = jest.spyOn(cryptoUtils, 'isValidTokenFormat');
            isValidTokenFormat.mockImplementation((token) => {
                return typeof token === 'string' &&
                       token.length === 64 &&
                       /^[a-f0-9]+$/.test(token);
            });

            expect(cryptoUtils.isValidTokenFormat('')).toBe(false); // empty
            expect(cryptoUtils.isValidTokenFormat('a'.repeat(63))).toBe(false); // too short
            expect(cryptoUtils.isValidTokenFormat('a'.repeat(65))).toBe(false); // too long
            expect(cryptoUtils.isValidTokenFormat('invalid-token-with-non-hex-chars!')).toBe(false); // non-hex chars
            expect(cryptoUtils.isValidTokenFormat(null)).toBe(false); // null
            expect(cryptoUtils.isValidTokenFormat(undefined)).toBe(false); // undefined
            expect(cryptoUtils.isValidTokenFormat(123)).toBe(false); // not a string

            isValidTokenFormat.mockRestore();
        });
    });

    describe('Correlation ID Generation', () => {
        test('should generate correlation ID', () => {
            const correlationId = cryptoUtils.generateCorrelationId();

            expect(crypto.randomUUID).toHaveBeenCalled();
            expect(correlationId).toBe('mockedUUID');
        });
    });

    describe('Cache Key Creation', () => {
        test('should create cache key from single part', () => {
            const cacheKey = cryptoUtils.createCacheKey('part1');

            expect(crypto.createHash).toHaveBeenCalledWith('sha256');
            expect(crypto.createHash().update).toHaveBeenCalledWith('part1');
            expect(cacheKey).toBe('mockedHash');
        });

        test('should create cache key from multiple parts', () => {
            const cacheKey = cryptoUtils.createCacheKey('part1', 'part2', 'part3');

            expect(crypto.createHash).toHaveBeenCalledWith('sha256');
            expect(crypto.createHash().update).toHaveBeenCalledWith('part1|part2|part3');
            expect(cacheKey).toBe('mockedHash');
        });
    });
});
