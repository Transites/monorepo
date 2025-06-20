/**
 * Testes para AuthService
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../../middleware/logging');

jest.mock('jsonwebtoken');
jest.mock('../../middleware/logging');

describe('AuthService', () => {
    let authService;
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();

        process.env = {
            ...originalEnv,
            JWT_SECRET: 'test-secret-key-with-at-least-32-characters-for-testing',
            BCRYPT_ROUNDS: '4' // Reduzido para acelerar os testes
        };

        jest.resetModules();
        authService = require('../../services/auth');
        logger.error = jest.fn();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('hashPassword', () => {
        test('deve gerar hash bcrypt válido', async () => {
            const password = 'password123';
            const result = await authService.hashPassword(password);

            // Verifica se o resultado é uma string (hash)
            expect(typeof result).toBe('string');
            expect(result).not.toBe(password);
            expect(result.length).toBeGreaterThan(50); // Hashes bcrypt são longos
        });

        test('deve usar salt rounds correto', async () => {
            process.env.BCRYPT_ROUNDS = '6';

            jest.resetModules();
            const freshAuthService = require('../../services/auth');

            const password = 'password123';
            const hash = await freshAuthService.hashPassword(password);

            // Verifica se o hash contém o número de rounds correto
            // Hashes bcrypt começam com $2b$[rounds]$
            expect(hash).toMatch(/^\$2b\$06\$/);
        });

        test('deve gerar hashes diferentes para mesma senha', async () => {
            const password = 'password123';

            // Executar função duas vezes com a mesma senha
            const hash1 = await authService.hashPassword(password);
            const hash2 = await authService.hashPassword(password);

            // Verificar se os hashes são diferentes (devido ao salt aleatório)
            expect(hash1).not.toBe(hash2);

            // Mas ambos devem validar a mesma senha
            expect(await bcrypt.compare(password, hash1)).toBe(true);
            expect(await bcrypt.compare(password, hash2)).toBe(true);
        });

        test('deve tratar erro com senha inválida', async () => {
            // Testa com senha null/undefined
            await expect(authService.hashPassword(null))
                .rejects
                .toThrow('Erro ao processar senha');

            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('comparePassword', () => {
        test('deve validar senha correta', async () => {
            const password = 'password123';

            // Primeiro gera um hash real
            const hash = await authService.hashPassword(password);

            // Depois testa se a comparação funciona
            const result = await authService.comparePassword(password, hash);

            expect(result).toBe(true);
        });

        test('deve rejeitar senha incorreta', async () => {
            const correctPassword = 'password123';
            const wrongPassword = 'wrongpassword';

            // Gera hash da senha correta
            const hash = await authService.hashPassword(correctPassword);

            // Testa com senha incorreta
            const result = await authService.comparePassword(wrongPassword, hash);

            expect(result).toBe(false);
        });

        test('deve retornar false para hash inválido', async () => {
            const password = 'password123';
            const invalidHash = 'invalid-hash';

            const result = await authService.comparePassword(password, invalidHash);

            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalledWith(
                'Password comparison error',
                expect.objectContaining({
                    error: expect.any(String)
                })
            );
        });

        test('deve funcionar com senhas complexas', async () => {
            const complexPassword = 'C0mpl3x!P@ssw0rd#2024$';

            const hash = await authService.hashPassword(complexPassword);
            const result = await authService.comparePassword(complexPassword, hash);

            expect(result).toBe(true);
        });
    });

    describe('generateJWT', () => {
        test('deve gerar JWT válido', () => {
            jwt.sign.mockReturnValue('test-token');

            const payload = { id: 'user-id', email: 'admin@iea.usp.br' };
            const token = authService.generateJWT(payload);

            expect(jwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'user-id',
                    email: 'admin@iea.usp.br',
                    iat: expect.any(Number),
                    jti: 'test-uuid'
                }),
                'test-secret-key-with-at-least-32-characters-for-testing',
                expect.objectContaining({
                    expiresIn: '24h',
                    issuer: 'enciclopedia-transitos',
                    audience: 'admin',
                    algorithm: 'HS256'
                })
            );

            expect(token).toBe('test-token');
        });

        test('deve incluir payload correto', () => {
            jwt.sign.mockImplementation((payload) => JSON.stringify(payload));

            const payload = {
                id: 'user-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                role: 'admin'
            };

            const token = authService.generateJWT(payload);

            const tokenPayload = JSON.parse(token);
            expect(tokenPayload).toMatchObject({
                id: 'user-id',
                email: 'admin@iea.usp.br',
                name: 'Admin',
                role: 'admin',
                iat: expect.any(Number),
                jti: 'test-uuid'
            });
        });

        test('deve aplicar expiração', () => {
            jwt.sign.mockReturnValue('test-token');

            const payload = { id: 'user-id' };
            authService.generateJWT(payload, '7d');

            expect(jwt.sign).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(String),
                expect.objectContaining({
                    expiresIn: '7d'
                })
            );
        });
    });

    describe('verifyJWT', () => {
        test('deve verificar JWT válido', () => {
            const decodedPayload = {
                id: 'user-id',
                email: 'admin@iea.usp.br',
                iat: Math.floor(Date.now() / 1000)
            };
            jwt.verify.mockReturnValue(decodedPayload);

            const result = authService.verifyJWT('valid-token');

            expect(jwt.verify).toHaveBeenCalledWith(
                'valid-token',
                'test-secret-key-with-at-least-32-characters-for-testing',
                expect.objectContaining({
                    issuer: 'enciclopedia-transitos',
                    audience: 'admin',
                    algorithms: ['HS256']
                })
            );

            expect(result).toEqual(decodedPayload);
        });

        test('deve rejeitar JWT inválido', () => {
            const error = new Error('Token inválido');
            error.name = 'JsonWebTokenError';
            jwt.verify.mockImplementation(() => {
                throw error;
            });

            expect(() => {
                authService.verifyJWT('invalid-token');
            }).toThrow('Token inválido');
        });

        test('deve detectar expiração', () => {
            const error = new Error('Token expirado');
            error.name = 'TokenExpiredError';
            jwt.verify.mockImplementation(() => {
                throw error;
            });

            expect(() => {
                authService.verifyJWT('expired-token');
            }).toThrow('Token expirado');
        });
    });

    describe('validatePasswordStrength', () => {
        test('deve validar senha forte', () => {
            const strongPassword = 'StrongP@ssw0rd';
            const result = authService.validatePasswordStrength(strongPassword);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('deve rejeitar senha fraca', () => {
            const weakPassword = 'password';
            const result = authService.validatePasswordStrength(weakPassword);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('deve listar requisitos não atendidos', () => {
            const weakPassword = 'password';
            const result = authService.validatePasswordStrength(weakPassword);

            expect(result.errors).toContain('Senha deve conter pelo menos uma letra maiúscula');
            expect(result.errors).toContain('Senha deve conter pelo menos um caractere especial');
            expect(result.errors).toContain('Senha muito comum, escolha uma mais segura');
        });

        test('deve validar todos os requisitos', () => {
            // Testa cada requisito individualmente
            expect(authService.validatePasswordStrength('short').errors)
                .toContain('Senha deve ter pelo menos 8 caracteres');

            expect(authService.validatePasswordStrength('lowercase123!').errors)
                .toContain('Senha deve conter pelo menos uma letra maiúscula');

            expect(authService.validatePasswordStrength('UPPERCASE123!').errors)
                .toContain('Senha deve conter pelo menos uma letra minúscula');

            expect(authService.validatePasswordStrength('NoNumbers!').errors)
                .toContain('Senha deve conter pelo menos um número');

            expect(authService.validatePasswordStrength('NoSpecial123').errors)
                .toContain('Senha deve conter pelo menos um caractere especial');
        });
    });

    describe('Integração bcrypt + AuthService', () => {
        test('deve fazer hash e comparação completa', async () => {
            const password = 'MySecureP@ssw0rd2024!';

            // Testa o fluxo completo: hash -> compare
            const hash = await authService.hashPassword(password);
            const isValid = await authService.comparePassword(password, hash);
            const isInvalid = await authService.comparePassword('wrong-password', hash);

            expect(isValid).toBe(true);
            expect(isInvalid).toBe(false);
        });

        test('deve manter consistência entre diferentes execuções', async () => {
            const password = 'ConsistentTest123!';

            // Gera múltiplos hashes da mesma senha
            const hashes = await Promise.all([
                authService.hashPassword(password),
                authService.hashPassword(password),
                authService.hashPassword(password)
            ]);

            // Todos os hashes devem ser diferentes
            expect(hashes[0]).not.toBe(hashes[1]);
            expect(hashes[1]).not.toBe(hashes[2]);
            expect(hashes[0]).not.toBe(hashes[2]);

            // Mas todos devem validar a mesma senha
            for (const hash of hashes) {
                expect(await authService.comparePassword(password, hash)).toBe(true);
            }
        });
    });
});
