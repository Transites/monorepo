import express from 'express';
import submissionController from '../controllers/submission';
import { resolve } from '../di';
import SubmissionSuggestionsController from '../controllers/submissionSuggestions';
const errorHandler = require('../middleware/errors');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const suggestionsController = resolve<SubmissionSuggestionsController>('SubmissionSuggestionsController');

router.use(authMiddleware.requireAuthAsAuthor);

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

// Autor define a imagem ou vídeo de destaque da submissão
router.put('/submissions/:id/media',
  errorHandler.asyncHandler(submissionController.setMediaAsAuthor)
);

// Autor remove a imagem ou vídeo de destaque da submissão
router.delete('/submissions/:id/media',
  errorHandler.asyncHandler(submissionController.removeMediaAsAuthor)
);

module.exports = router;