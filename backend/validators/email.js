const { body } = require('express-validator');

class EmailValidators {
    // Validação de teste de email
    validateEmailTest = [
        body('testEmail')
            .isEmail()
            .withMessage('Email de teste deve ter formato válido')
            .normalizeEmail()
    ];

    // Validação de reenvio de token
    validateResendToken = [
        body('submissionId')
            .isUUID()
            .withMessage('ID da submissão deve ser um UUID válido')
    ];

    // Validação de lembrete customizado
    validateCustomReminder = [
        body('submissionId')
            .isUUID()
            .withMessage('ID da submissão deve ser um UUID válido'),

        body('message')
            .isLength({ min: 10, max: 1000 })
            .withMessage('Mensagem deve ter entre 10 e 1000 caracteres')
            .trim()
    ];

    // Validação de notificação em massa
    validateBulkNotification = [
        body('submissionIds')
            .isArray({ min: 1, max: 50 })
            .withMessage('Deve conter entre 1 e 50 IDs de submissão'),

        body('submissionIds.*')
            .isUUID()
            .withMessage('Cada ID deve ser um UUID válido'),

        body('subject')
            .isLength({ min: 5, max: 200 })
            .withMessage('Assunto deve ter entre 5 e 200 caracteres')
            .trim(),

        body('message')
            .isLength({ min: 10, max: 2000 })
            .withMessage('Mensagem deve ter entre 10 e 2000 caracteres')
            .trim()
    ];

    // Sanitização de dados
    sanitizeEmailData = [
        body('testEmail').trim().toLowerCase(),
        body('message').trim(),
        body('subject').trim()
    ];
}

module.exports = new EmailValidators();
