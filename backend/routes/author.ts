import express from 'express';
import submissionController from '../controllers/submission';
import submissionValidators from '../validators/submission';
const errorHandler = require('../middleware/errors');

const router = express.Router();

// GET /api/author/submissions
// Listar submissões do autor
// Public (requer email válido)
router.get('/submissions',
    submissionValidators.validateAuthorQuery,
    errorHandler.asyncHandler(submissionController.getAuthorSubmissions)
);

module.exports = router;
