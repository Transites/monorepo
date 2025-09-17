import { body, query, param, ValidationChain } from 'express-validator';
import constants from '../utils/constants';

class SubmissionValidators {
    // Validação de criação de submissão
    validateCreateSubmission: ValidationChain[] = [
        body('author_name')
            .trim()
            .isLength({ min: 2, max: 255 })
            .withMessage('Nome do autor deve ter entre 2 e 255 caracteres')
            .matches(/^[a-zA-ZÀ-ÿ\s.]+$/)
            .withMessage('Nome deve conter apenas letras, espaços e pontos'),

        body('author_email')
            .isEmail()
            .withMessage('Email deve ter formato válido')
            .normalizeEmail()
            .isLength({ max: 255 })
            .withMessage('Email muito longo'),

        body('author_institution')
            .optional()
            .trim()
            .isLength({ max: 255 })
            .withMessage('Instituição muito longa'),

        body('title')
            .trim()
            .isLength({ min: 5, max: constants.LIMITS.TITLE_MAX })
            .withMessage(`Título deve ter entre 5 e ${constants.LIMITS.TITLE_MAX} caracteres`),

        body('summary')
            .optional()
            .trim()
            .isLength({ max: constants.LIMITS.SUMMARY_MAX })
            .withMessage(`Resumo muito longo (máx. ${constants.LIMITS.SUMMARY_MAX} caracteres)`),

        body('content')
            .optional()
            .trim()
            .isLength({ max: constants.LIMITS.CONTENT_MAX })
            .withMessage(`Conteúdo muito longo (máx. ${constants.LIMITS.CONTENT_MAX} caracteres)`),

        body('keywords')
            .optional()
            .isArray({ max: constants.LIMITS.KEYWORDS_MAX })
            .withMessage(`Máximo ${constants.LIMITS.KEYWORDS_MAX} palavras-chave permitidas`),

        body('keywords.*')
            .if(body('keywords').exists())
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Cada palavra-chave deve ter entre 1 e 50 caracteres'),

        body('category')
            .if((_value, { req }) => req.body.category)
            .optional()
            .isIn(constants.CATEGORIES)
            .withMessage(`Categoria deve ser uma das: ${constants.CATEGORIES.join(', ')}`),

        body('metadata')
            .optional()
            .isObject()
            .withMessage('Metadados devem ser um objeto válido')
    ];

    // Validação de atualização de submissão
    validateUpdateSubmission: ValidationChain[] = [
        body('title')
            .optional()
            .trim()
            .isLength({ min: 5, max: constants.LIMITS.TITLE_MAX })
            .withMessage(`Título deve ter entre 5 e ${constants.LIMITS.TITLE_MAX} caracteres`),

        body('summary')
            .optional()
            .trim()
            .isLength({ max: constants.LIMITS.SUMMARY_MAX })
            .withMessage(`Resumo muito longo (máx. ${constants.LIMITS.SUMMARY_MAX} caracteres)`),

        body('content')
            .optional()
            .trim()
            .isLength({ max: constants.LIMITS.CONTENT_MAX })
            .withMessage(`Conteúdo muito longo (máx. ${constants.LIMITS.CONTENT_MAX} caracteres)`),

        body('keywords')
            .optional()
            .isArray({ max: constants.LIMITS.KEYWORDS_MAX })
            .withMessage(`Máximo ${constants.LIMITS.KEYWORDS_MAX} palavras-chave permitidas`),

        body('keywords.*')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Cada palavra-chave deve ter entre 1 e 50 caracteres'),

        body('category')
            .optional()
            .isIn(constants.CATEGORIES)
            .withMessage(`Categoria deve ser uma das: ${constants.CATEGORIES.join(', ')}`),

        body('author_institution')
            .optional()
            .trim()
            .isLength({ max: 255 })
            .withMessage('Instituição muito longa'),

        body('metadata')
            .optional()
            .isObject()
            .withMessage('Metadados devem ser um objeto válido')
    ];

    // Validação de submissão para revisão
    validateSubmitForReview: ValidationChain[] = [
        // Middleware vai validar se submissão está completa
    ];

    // Validação de consulta de submissões do autor
    validateAuthorQuery: ValidationChain[] = [
        query('email')
            .isEmail()
            .withMessage('Email deve ter formato válido')
            .normalizeEmail(),

        query('page')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Página deve ser entre 1 e 100'),

        query('limit')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Limite deve ser entre 1 e 50')
    ];

    // Validação de parâmetro de token
    validateTokenParam: ValidationChain[] = [
        param('token')
            .isLength({ min: 64, max: 64 })
            .withMessage('Token deve ter exatamente 64 caracteres')
            .matches(/^[a-f0-9]+$/)
            .withMessage('Token deve conter apenas caracteres hexadecimais')
    ];

    // Validação de auto-save (mais permissiva)
    validateAutoSave: ValidationChain[] = [
        body('title')
            .optional()
            .trim()
            .isLength({ max: constants.LIMITS.TITLE_MAX })
            .withMessage(`Título muito longo (máx. ${constants.LIMITS.TITLE_MAX} caracteres)`),

        body('summary')
            .optional()
            .trim()
            .isLength({ max: constants.LIMITS.SUMMARY_MAX })
            .withMessage(`Resumo muito longo (máx. ${constants.LIMITS.SUMMARY_MAX} caracteres)`),

        body('content')
            .optional()
            .trim()
            .isLength({ max: constants.LIMITS.CONTENT_MAX })
            .withMessage(`Conteúdo muito longo (máx. ${constants.LIMITS.CONTENT_MAX} caracteres)`)
    ];

    // Sanitização de dados
    sanitizeSubmissionData: ValidationChain[] = [
        body('author_name').trim(),
        body('author_email').trim().toLowerCase(),
        body('author_institution').trim(),
        body('title').trim(),
        body('summary').trim(),
        body('content').trim(),
        body('category').trim(),
    ];

    // Validação de email do autor (para middleware)
    validateAuthorEmail: ValidationChain[] = [
        body('email')
            .isEmail()
            .withMessage('Email deve ter formato válido')
            .normalizeEmail()
    ];

    // Validação de email para verificação de artigos em progresso
    validateEmailParam: ValidationChain[] = [
        body('email')
            .isEmail()
            .withMessage('Email deve ter formato válido')
            .normalizeEmail()
            .isLength({ max: 255 })
            .withMessage('Email muito longo')
    ];

    // Validação customizada para completude
    validateCompleteness: ValidationChain[] = [
        body('title')
            .custom((value, { req }) => {
                const submission = (req as any).submission || req.body;
                if (!submission.title || submission.title.length < 5) {
                    throw new Error('Título deve ter pelo menos 5 caracteres');
                }
                return true;
            }),

        body('summary')
            .custom((value, { req }) => {
                const submission = (req as any).submission || req.body;
                if (!submission.summary || submission.summary.length < 50) {
                    throw new Error('Resumo deve ter pelo menos 50 caracteres');
                }
                return true;
            }),

        body('content')
            .custom((value, { req }) => {
                const submission = (req as any).submission || req.body;
                if (!submission.content || submission.content.length < 100) {
                    throw new Error('Conteúdo deve ter pelo menos 100 caracteres');
                }
                return true;
            }),

        body('category')
            .custom((value, { req }) => {
                const submission = (req as any).submission || req.body;
                if (!submission.category) {
                    throw new Error('Categoria é obrigatória');
                }
                return true;
            }),

        body('keywords')
            .custom((value, { req }) => {
                const submission = (req as any).submission || req.body;
                if (!submission.keywords || !Array.isArray(submission.keywords) || submission.keywords.length < 1) {
                    throw new Error('Pelo menos 1 palavra-chave é obrigatória');
                }
                return true;
            })
    ];
}

export default new SubmissionValidators();
