// Set env before requiring the service
process.env.JWT_SECRET = 'a'.repeat(32);
process.env.BCRYPT_ROUNDS = '1';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authModule = require('../../services/auth');
const auth = authModule;
const { AuthService } = authModule;

describe('AuthService', () => {
    it('validatePasswordStrength detects weaknesses', () => {
        const r1 = auth.validatePasswordStrength('short');
        expect(r1.isValid).toBe(false);
        const r2 = auth.validatePasswordStrength('GoodPass1!');
        expect(r2.isValid).toBe(true);
    });

    it('generateResetToken returns 64 char hex', () => {
        const t = auth.generateResetToken();
        expect(typeof t).toBe('string');
        expect(t).toHaveLength(64);
    });

    it('generateJWT and verifyJWT roundtrip', () => {
        const payload = { id: 'u1' };
        const token = auth.generateJWT(payload, '1h');
        const decoded = auth.verifyJWT(token);
        expect(decoded.id).toBe('u1');
        expect(decoded.jti).toBeDefined();
    });

    it('extractTokenFromHeader works', () => {
        expect(auth.extractTokenFromHeader('Bearer abc')).toBe('abc');
        expect(auth.extractTokenFromHeader(null)).toBeNull();
    });

    it('generateTokenPair returns two tokens', () => {
        const pair = auth.generateTokenPair({ id: 'u1' }, false);
        expect(pair.accessToken).toBeDefined();
        expect(pair.refreshToken).toBeDefined();
        expect(pair.refreshExpiresIn).toBe('7d');
    });

    it('generateTokenPair returns 30d tokens when rememberMe is true', () => {
        const pair = auth.generateTokenPair({ id: 'u1' }, true);
        expect(pair.accessToken).toBeDefined();
        expect(pair.refreshToken).toBeDefined();
        expect(pair.refreshExpiresIn).toBe('30d');
    });

    it('getTokenTimeToExpiry and isTokenNearExpiry behave', async () => {
        const token = auth.generateJWT({ id: 'u2' }, '1s');
        const time = auth.getTokenTimeToExpiry(token);
        expect(typeof time).toBe('number');
        // token is near expiry because it's 1s
        expect(auth.isTokenNearExpiry(token, 1)).toBe(true);
    });

    it('getTokenTimeToExpiry returns 0 when token is already expired', async () => {
        const token = auth.generateJWT({ id: 'u3' }, '1s');
        await new Promise((resolve) => setTimeout(resolve, 1100));
        expect(auth.getTokenTimeToExpiry(token)).toBe(0);
    });

    it('hashPassword throws when bcrypt fails', async () => {
        const saltSpy = jest.spyOn(bcrypt, 'genSalt').mockRejectedValue(new Error('salt fail'));
        await expect(auth.hashPassword('Abcdef1!')).rejects.toThrow('Erro ao processar senha');
        saltSpy.mockRestore();
    });

    it('comparePassword returns false when bcrypt compare fails', async () => {
        const compareSpy = jest.spyOn(bcrypt, 'compare').mockRejectedValue(new Error('compare fail'));
        const result = await auth.comparePassword('Abcdef1!', 'hash');
        expect(result).toBe(false);
        compareSpy.mockRestore();
    });

    it('generateJWT throws when jwt.sign fails', () => {
        const signSpy = jest.spyOn(jwt, 'sign').mockImplementation(() => { throw new Error('jwt-sign-fail'); });
        expect(() => auth.generateJWT({ id: 'u1' }, '1h')).toThrow('Erro ao gerar token');
        signSpy.mockRestore();
    });

    it('getTokenTimeToExpiry returns null for invalid token', () => {
        const decodeSpy = jest.spyOn(jwt, 'decode').mockReturnValue(null);
        expect(auth.getTokenTimeToExpiry('invalid')).toBeNull();
        decodeSpy.mockRestore();
    });

    it('isTokenNearExpiry returns true for invalid token', () => {
        const decodeSpy = jest.spyOn(jwt, 'decode').mockReturnValue(null);
        expect(auth.isTokenNearExpiry('invalid')).toBe(true);
        decodeSpy.mockRestore();
    });

    it('getTokenTimeToExpiry returns null when jwt.decode throws', () => {
        const decodeSpy = jest.spyOn(jwt, 'decode').mockImplementation(() => { throw new Error('decode fail'); });
        expect(auth.getTokenTimeToExpiry('invalid')).toBeNull();
        decodeSpy.mockRestore();
    });

    it('validatePasswordStrength rejects common passwords', () => {
        const result = auth.validatePasswordStrength('password123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(expect.arrayContaining([
            'Senha muito comum, escolha uma mais segura'
        ]));
    });

    it('validatePasswordStrength requires a lowercase letter', () => {
        const result = auth.validatePasswordStrength('PASSWORD123!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(expect.arrayContaining([
            'Senha deve conter pelo menos uma letra minúscula'
        ]));
    });

    it('constructor throws when JWT_SECRET is missing or too short', () => {
        const originalSecret = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;

        expect(() => new AuthService()).toThrow('JWT_SECRET environment variable is required');

        process.env.JWT_SECRET = 'too-short-secret';
        expect(() => new AuthService()).toThrow('JWT_SECRET must be at least 32 characters long');

        process.env.JWT_SECRET = originalSecret;
    });

    it('hashPassword and comparePassword work', async () => {
        const hashed = await auth.hashPassword('Abcdef1!');
        expect(typeof hashed).toBe('string');
        const ok = await auth.comparePassword('Abcdef1!', hashed);
        expect(ok).toBe(true);
    });
});
