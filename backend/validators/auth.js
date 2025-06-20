const { body, param } = require('express-validator');
const authService = require('../services/auth');

class AuthValidators {
    // Validação de login
    validateLogin = [
        body('email')
            .isEmail()
            .withMessage('Email deve ter formato válido')
            .normalizeEmail()
            .isLength({ max: 255 })
            .withMessage('Email muito longo'),

        body('password')
            .notEmpty()
            .withMessage('Senha é obrigatória')
            .isLength({ min: 1, max: 255 })
            .withMessage('Senha inválida'),

        body('rememberMe')
            .optional()
            .isBoolean()
            .withMessage('RememberMe deve ser boolean')
    ];

    // Validação de mudança de senha
    validateChangePassword = [
        body('currentPassword')
            .notEmpty()
            .withMessage('Senha atual é obrigatória'),

        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Nova senha deve ter pelo menos 8 caracteres')
            .custom((password) => {
                const validation = authService.validatePasswordStrength(password);
                if (!validation.isValid) {
                    throw new Error(validation.errors.join('. '));
                }
                return true;
            }),

        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.newPassword) {
                    throw new Error('Confirmação de senha não confere');
                }
                return true;
            })
    ];

    // Validação de criação de admin
    validateCreateAdmin = [
        body('email')
            .isEmail()
            .withMessage('Email deve ter formato válido')
            .normalizeEmail()
            .isLength({ max: 255 })
            .withMessage('Email muito longo')
            .custom((email) => {
                // Verificar se é email institucional
                const institutionalDomains = ['usp.br', 'iea.usp.br'];
                const domain = email.split('@')[1];
                const isInstitutional = institutionalDomains.some(instDomain =>
                    domain === instDomain || domain.endsWith('.' + instDomain)
                );

                if (!isInstitutional) {
                    throw new Error('Email deve ser institucional (USP)');
                }
                return true;
            }),

        body('password')
            .isLength({ min: 8 })
            .withMessage('Senha deve ter pelo menos 8 caracteres')
            .custom((password) => {
                const validation = authService.validatePasswordStrength(password);
                if (!validation.isValid) {
                    throw new Error(validation.errors.join('. '));
                }
                return true;
            }),

        body('name')
            .trim()
            .isLength({ min: 2, max: 255 })
            .withMessage('Nome deve ter entre 2 e 255 caracteres')
            .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
            .withMessage('Nome deve conter apenas letras e espaços')
    ];

    // Validação de atualização de admin
    validateUpdateAdmin = [
        param('id')
            .isUUID()
            .withMessage('ID deve ser um UUID válido'),

        body('email')
            .optional()
            .isEmail()
            .withMessage('Email deve ter formato válido')
            .normalizeEmail(),

        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 255 })
            .withMessage('Nome deve ter entre 2 e 255 caracteres'),

        body('is_active')
            .optional()
            .isBoolean()
            .withMessage('is_active deve ser boolean')
    ];

    // Validação de refresh token
    validateRefreshToken = [
        body('refreshToken')
            .optional()
            .isString()
            .withMessage('Refresh token deve ser string')
    ];

    // Validação de reset de senha
    validateResetPassword = [
        body('email')
            .isEmail()
            .withMessage('Email deve ter formato válido')
            .normalizeEmail()
    ];

    // Validação de confirmação de reset
    validateConfirmReset = [
        body('token')
            .isLength({ min: 64, max: 64 })
            .withMessage('Token inválido')
            .isHexadecimal()
            .withMessage('Token deve ser hexadecimal'),

        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Nova senha deve ter pelo menos 8 caracteres')
            .custom((password) => {
                const validation = authService.validatePasswordStrength(password);
                if (!validation.isValid) {
                    throw new Error(validation.errors.join('. '));
                }
                return true;
            })
    ];

    // Sanitização de dados de entrada
    sanitizeAuthData = [
        body('email').trim().toLowerCase(),
        body('name').trim(),
        body('currentPassword').trim(),
        body('newPassword').trim(),
        body('password').trim()
    ];

    // Validação de parâmetros de ID
    validateAdminId = [
        param('id')
            .isUUID()
            .withMessage('ID deve ser um UUID válido')
    ];
}

module.exports = new AuthValidators();
