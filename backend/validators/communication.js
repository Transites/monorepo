const { body, param, query } = require('express-validator');

class CommunicationValidators {
    // Validação para re-enviar token
    validateResendToken() {
        return [
            param('submissionId')
                .isUUID()
                .withMessage('ID da submissão deve ser um UUID válido'),

            body('customMessage')
                .optional()
                .isString()
                .isLength({ max: 500 })
                .withMessage('Mensagem personalizada deve ter no máximo 500 caracteres')
                .trim()
        ];
    }

    // Validação para regenerar token
    validateRegenerateToken() {
        return [
            param('submissionId')
                .isUUID()
                .withMessage('ID da submissão deve ser um UUID válido'),

            body('reason')
                .optional()
                .isString()
                .isLength({ max: 200 })
                .withMessage('Motivo deve ter no máximo 200 caracteres')
                .trim()
        ];
    }

    // Validação para reativar submissão
    validateReactivateSubmission() {
        return [
            param('submissionId')
                .isUUID()
                .withMessage('ID da submissão deve ser um UUID válido'),

            body('newExpiryDays')
                .optional()
                .isInt({ min: 1, max: 365 })
                .withMessage('Dias de expiração deve ser entre 1 e 365')
        ];
    }

    // Validação para lembrete personalizado
    validateCustomReminder() {
        return [
            param('submissionId')
                .isUUID()
                .withMessage('ID da submissão deve ser um UUID válido'),

            body('message')
                .isString()
                .isLength({ min: 10, max: 1000 })
                .withMessage('Mensagem deve ter entre 10 e 1000 caracteres')
                .trim(),

            body('urgency')
                .optional()
                .isIn(['low', 'normal', 'high', 'urgent'])
                .withMessage('Urgência deve ser: low, normal, high ou urgent')
        ];
    }

    // Validação para histórico
    validateCommunicationHistory() {
        return [
            param('submissionId')
                .isUUID()
                .withMessage('ID da submissão deve ser um UUID válido'),

            query('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limite deve ser entre 1 e 100')
        ];
    }

    // Validação para estatísticas
    validateCommunicationStats() {
        return [
            query('days')
                .optional()
                .isInt({ min: 1, max: 365 })
                .withMessage('Período deve ser entre 1 e 365 dias')
        ];
    }
}

module.exports = new CommunicationValidators();
