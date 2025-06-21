const { body, param, query } = require('express-validator');

class TokenValidators {
    // Validação de token na URL
    validateTokenParam = [
        param('token')
            .isLength({ min: 64, max: 64 })
            .withMessage('Token deve ter exatamente 64 caracteres')
            .matches(/^[a-f0-9]+$/)
            .withMessage('Token deve conter apenas caracteres hexadecimais'),
    ];

    // Validação de email do autor
    validateAuthorEmail = [
        body('email')
            .isEmail()
            .withMessage('Email deve ter formato válido')
            .normalizeEmail()
            .isLength({ max: 255 })
            .withMessage('Email muito longo')
            .trim()
    ];

    // Validação de renovação de token
    validateTokenRenewal = [
        body('additionalDays')
            .optional()
            .isInt({ min: 1, max: 90 })
            .withMessage('Dias adicionais deve ser entre 1 e 90')
    ];

    // Validação de reativação
    validateReactivation = [
        param('submissionId')
            .isUUID()
            .withMessage('ID da submissão deve ser um UUID válido'),

        body('expiryDays')
            .optional()
            .isInt({ min: 1, max: 90 })
            .withMessage('Dias para expiração deve ser entre 1 e 90')
    ];

    // Validação de dias para listagem
    validateDaysQuery = [
        query('days')
            .optional()
            .isInt({ min: 1, max: 30 })
            .withMessage('Dias deve ser entre 1 e 30')
    ];

    // Validação de submissionId para admin
    validateSubmissionId = [
        param('submissionId')
            .isUUID()
            .withMessage('ID da submissão deve ser um UUID válido')
    ];

    // Sanitização de dados
    sanitizeTokenData = [
        body('email').trim().toLowerCase(),
        body('additionalDays').toInt(),
        body('expiryDays').toInt(),
        query('days').toInt()
    ];
}

module.exports = new TokenValidators();
