import express from 'express';
import submissionController from '../controllers/submission';
import { resolve } from '../di';
import SubmissionSuggestionsController from '../controllers/submissionSuggestions';
const errorHandler = require('../middleware/errors');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const suggestionsController = resolve<SubmissionSuggestionsController>('SubmissionSuggestionsController');

router.use(authMiddleware.requireAuthAsAuthor);

// DEBUG TEMPORÁRIO — remover depois
router.use((req, res, next) => {
  console.log('=== AUTHOR ROUTE DEBUG ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body:', JSON.stringify(req.body));
  console.log('Body keys:', Object.keys(req.body || {}));
  next();
});

// Lista todas as submissões do autor logado
router.get('/submissions',
  errorHandler.asyncHandler(submissionController.getAuthorSubmissions)
);

// Lista sugestões de uma submissão específica
router.get('/submissions/:id/suggestions',
  errorHandler.asyncHandler(suggestionsController.getAuthorSuggestions)
);

// Autor aceita sugestão
router.post('/submissions/:id/suggestions/:suggestionId/accept',
  errorHandler.asyncHandler(suggestionsController.acceptSuggestion)
);

// Autor cria contra-proposta
router.post('/submissions/:id/suggestions/:suggestionId/counter',
  errorHandler.asyncHandler(suggestionsController.counterSuggestion)
);

// Lista as versões de uma submissão específica
router.get('/submissions/:id/versions',
  errorHandler.asyncHandler(suggestionsController.getSubmissionVersions)
);
module.exports = router;