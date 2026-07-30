import express from 'express';
import articlesController from '../controllers/articles';

const errorHandler = require('../middleware/errors');
const router = express.Router();

router.get(
      '/',
      errorHandler.asyncHandler(articlesController.listArticles)
);

router.get(
      '/id/:id',
      errorHandler.asyncHandler(articlesController.getArticleById)
);

router.patch(
  '/:id',
  errorHandler.asyncHandler(articlesController.updateArticle)
);

router.post(
  '/:id/assign-doi',
  errorHandler.asyncHandler(articlesController.assignDoi)
);

module.exports = router;