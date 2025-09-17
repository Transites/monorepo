/**
 * Testes para AuthValidators
 */
const request = require('supertest');
const express = require('express');
const authValidators = require('../../validators/auth');
const authService = require('../../services/auth');

// Só mockamos o authService já que é uma dependência externa
jest.mock('../../services/auth', () => ({
    validatePasswordStrength: jest.fn()
}));

// Helper para criar app de teste
const createTestApp = (validators) => {
    const app = express();
    app.use(express.json());

    app.post('/test', validators, (req, res) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        res.json({ success: true });
    });

    return app;
};

describe('AuthValidators', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('validateLogin', () => {
        const app = createTestApp(authValidators.validateLogin);

        test('deve aceitar dados válidos', async () => {
            const validData = {
                email: 'admin@iea.usp.br',
                password: 'senha123',
                rememberMe: true
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('deve rejeitar email inválido', async () => {
            const invalidData = {
                email: 'email-invalido',
                password: 'senha123'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'email',
                        msg: expect.stringContaining('Email deve ter formato válido')
                    })
                ])
            );
        });

        test('deve rejeitar senha vazia', async () => {
            const invalidData = {
                email: 'admin@iea.usp.br',
                password: ''
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'password',
                        msg: expect.stringContaining('Senha é obrigatória')
                    })
                ])
            );
        });

        test('deve aceitar rememberMe opcional como boolean', async () => {
            const validData = {
                email: 'admin@iea.usp.br',
                password: 'senha123',
                rememberMe: false
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
        });

        test('deve rejeitar rememberMe inválido', async () => {
            const invalidData = {
                email: 'admin@iea.usp.br',
                password: 'senha123',
                rememberMe: 'invalid'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'rememberMe',
                        msg: expect.stringContaining('RememberMe deve ser boolean')
                    })
                ])
            );
        });

        test('deve normalizar email', async () => {
            const dataWithUnnormalizedEmail = {
                email: 'ADMIN@IEA.USP.BR',
                password: 'senha123'
            };

            const response = await request(app)
                .post('/test')
                .send(dataWithUnnormalizedEmail);

            expect(response.status).toBe(200);
        });
    });

    describe('validateChangePassword', () => {
        const app = createTestApp(authValidators.validateChangePassword);

        test('deve aceitar senhas válidas', async () => {
            authService.validatePasswordStrength.mockReturnValue({
                isValid: true,
                errors: []
            });

            const validData = {
                currentPassword: 'senhaAtual123',
                newPassword: 'NovaSenha123!',
                confirmPassword: 'NovaSenha123!'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(authService.validatePasswordStrength).toHaveBeenCalledWith('NovaSenha123!');
        });

        test('deve rejeitar senha atual vazia', async () => {
            const invalidData = {
                currentPassword: '',
                newPassword: 'NovaSenha123!',
                confirmPassword: 'NovaSenha123!'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'currentPassword',
                        msg: expect.stringContaining('Senha atual é obrigatória')
                    })
                ])
            );
        });

        test('deve rejeitar nova senha muito curta', async () => {
            const invalidData = {
                currentPassword: 'senhaAtual123',
                newPassword: '123',
                confirmPassword: '123'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'newPassword',
                        msg: expect.stringContaining('Nova senha deve ter pelo menos 8 caracteres')
                    })
                ])
            );
        });

        test('deve rejeitar senha fraca', async () => {
            authService.validatePasswordStrength.mockReturnValue({
                isValid: false,
                errors: ['Senha deve conter pelo menos uma letra maiúscula']
            });

            const invalidData = {
                currentPassword: 'senhaAtual123',
                newPassword: 'senha123',
                confirmPassword: 'senha123'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'newPassword',
                        msg: expect.stringContaining('Senha deve conter pelo menos uma letra maiúscula')
                    })
                ])
            );
            expect(authService.validatePasswordStrength).toHaveBeenCalledWith('senha123');
        });

        test('deve verificar confirmação de senha', async () => {
            const invalidData = {
                currentPassword: 'senhaAtual123',
                newPassword: 'NovaSenha123!',
                confirmPassword: 'SenhaDiferente123!'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'confirmPassword',
                        msg: expect.stringContaining('Confirmação de senha não confere')
                    })
                ])
            );
        });
    });

    describe('validateCreateAdmin', () => {
        const app = createTestApp(authValidators.validateCreateAdmin);

        test('deve aceitar admin válido', async () => {
            authService.validatePasswordStrength.mockReturnValue({
                isValid: true,
                errors: []
            });

            const validData = {
                email: 'admin@iea.usp.br',
                password: 'Senha123!',
                name: 'Administrador Teste'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(authService.validatePasswordStrength).toHaveBeenCalledWith('Senha123!');
        });

        test('deve rejeitar email não institucional', async () => {
            const invalidData = {
                email: 'admin@gmail.com',
                password: 'Senha123!',
                name: 'Administrador Teste'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'email',
                        msg: expect.stringContaining('Email deve ser institucional (USP)')
                    })
                ])
            );
        });

        test('deve aceitar diferentes domínios USP', async () => {
            authService.validatePasswordStrength.mockReturnValue({
                isValid: true,
                errors: []
            });

            const validEmails = [
                'admin@usp.br',
                'admin@iea.usp.br',
                'admin@fe.usp.br'
            ];

            for (const email of validEmails) {
                const validData = {
                    email,
                    password: 'Senha123!',
                    name: 'Administrador Teste'
                };

                const response = await request(app)
                    .post('/test')
                    .send(validData);

                expect(response.status).toBe(200);
            }
        });

        test('deve validar força da senha', async () => {
            authService.validatePasswordStrength.mockReturnValue({
                isValid: false,
                errors: ['Senha deve conter pelo menos um caractere especial']
            });

            const invalidData = {
                email: 'admin@iea.usp.br',
                password: 'Senha123',
                name: 'Administrador Teste'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'password',
                        msg: expect.stringContaining('Senha deve conter pelo menos um caractere especial')
                    })
                ])
            );
            expect(authService.validatePasswordStrength).toHaveBeenCalledWith('Senha123');
        });

        test('deve validar nome', async () => {
            const invalidData = {
                email: 'admin@iea.usp.br',
                password: 'Senha123!',
                name: 'A' // muito curto
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'name',
                        msg: expect.stringContaining('Nome deve ter entre 2 e 255 caracteres')
                    })
                ])
            );
        });

        test('deve rejeitar nome com caracteres inválidos', async () => {
            const invalidData = {
                email: 'admin@iea.usp.br',
                password: 'Senha123!',
                name: 'Admin123' // contém números
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'name',
                        msg: expect.stringContaining('Nome deve conter apenas letras e espaços')
                    })
                ])
            );
        });

        test('deve aceitar nomes com acentos', async () => {
            authService.validatePasswordStrength.mockReturnValue({
                isValid: true,
                errors: []
            });

            const validData = {
                email: 'admin@iea.usp.br',
                password: 'Senha123!',
                name: 'José da Silva Júnior'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
        });
    });

    describe('validateUpdateAdmin', () => {
        const app = express();
        app.use(express.json());
        app.put('/test/:id', authValidators.validateUpdateAdmin, (req, res) => {
            const errors = require('express-validator').validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            res.json({ success: true });
        });

        test('deve aceitar ID UUID válido', async () => {
            const validId = '123e4567-e89b-12d3-a456-426614174000';
            const validData = {
                name: 'Nome Atualizado'
            };

            const response = await request(app)
                .put(`/test/${validId}`)
                .send(validData);

            expect(response.status).toBe(200);
        });

        test('deve rejeitar ID inválido', async () => {
            const invalidId = 'invalid-id';
            const validData = {
                name: 'Nome Atualizado'
            };

            const response = await request(app)
                .put(`/test/${invalidId}`)
                .send(validData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'id',
                        msg: expect.stringContaining('ID deve ser um UUID válido')
                    })
                ])
            );
        });
    });

    describe('validateConfirmReset', () => {
        const app = createTestApp(authValidators.validateConfirmReset);

        test('deve aceitar token válido', async () => {
            authService.validatePasswordStrength.mockReturnValue({
                isValid: true,
                errors: []
            });

            const validData = {
                token: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                newPassword: 'NovaSenha123!'
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
        });

        test('deve rejeitar token com tamanho inválido', async () => {
            const invalidData = {
                token: '123abc', // muito curto
                newPassword: 'NovaSenha123!'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'token',
                        msg: expect.stringContaining('Token inválido')
                    })
                ])
            );
        });

        test('deve rejeitar token não hexadecimal', async () => {
            const invalidData = {
                token: 'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // contém G
                newPassword: 'NovaSenha123!'
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'token',
                        msg: expect.stringContaining('Token deve ser hexadecimal')
                    })
                ])
            );
        });
    });
});
