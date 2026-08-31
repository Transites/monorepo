import { Request, Response, NextFunction  } from 'express';
import articlesService from '../services/articles';
import responses from '../utils/responses';
import { handleControllerError } from '../utils/errorHandler';
import untypedLogger from '../middleware/logging';

const logger = untypedLogger as any;

class ArticleController {

      async listArticles(req: Request, res: Response, next: NextFunction): Promise<any> {
            try {

                  const search = req.query.search as string | undefined;
                  const category = req.query.category as string | undefined;

                  const page = parseInt(req.query.page as string) || 1;
                  const limit = parseInt(req.query.limit as string) || 12;

                  const result = await articlesService.listArticles({
                        search,
                        category,
                        page,
                        limit,
                  });


                  return responses.success(res, {
                        articles: result.articles,
                        pagination: result.pagination,
                        categories: result.categories,
                  }, 'Artigos listados com sucesso!');
            } catch (error: any) {
                  return handleControllerError(error, res, next, {
                        operation: 'listArticles',
                        search: req.query.search,
                  });
            }
      }


      async getArticleById(req: Request, res: Response, next: NextFunction): Promise<any> {
            try{
                  const {id} = req.params;

                  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                  if (!uuidRegex.test(id)) {
                  return responses.badRequest(res, 'ID inválido', ['ID deve ser um UUID válido']);
                  }

                  const article = await articlesService.getArticleById(id);

                  if(!article) {
                        return responses.notFound(res, 'Artigo não encontrado');
                  }

                  return responses.success(res, {article}, 'Artigo encontrado');

            }catch(error: any){
                  return handleControllerError(error, res, next, {
                        operation: 'getArticleById',
                        articleId: req.params.id,
                  });
            }
      }

      async updateArticle(req: Request, res: Response, next: NextFunction): Promise<any> {
            try {
            const { id } = req.params;

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                  return responses.badRequest(res, 'ID inválido', ['ID deve ser um UUID válido']);
            }

            const isAdmin = Boolean((req as any).user?.id || (req as any).user?.email);
            const payload = req.body && typeof req.body === 'object' && !Array.isArray(req.body) && req.body.data && typeof req.body.data === 'object'
                  ? req.body.data
                  : req.body;

            // Diagnostic logging to help debug cases where payload appears empty
            try {
                  const contentType = req.headers['content-type'] || req.get('Content-Type');
                  const contentLength = req.headers['content-length'] || req.get('Content-Length');
                  const bodyType = typeof req.body;
                  const isArrayBody = Array.isArray(req.body);
                  let bodyPreview = '';
                  try {
                        bodyPreview = JSON.stringify(req.body);
                        if (bodyPreview.length > 1000) bodyPreview = bodyPreview.slice(0, 1000) + '...';
                  } catch (e) {
                        bodyPreview = String(req.body);
                  }

                  logger.info('updateArticle called', {
                        operation: 'updateArticle',
                        articleId: id,
                        requester: (req as any).user?.email || (req as any).user?.id || req.ip,
                        contentType,
                        contentLength,
                        bodyType,
                        isArrayBody,
                        payloadKeys: Object.keys(payload || {}),
                        bodyPreview
                  });
            } catch (e) {
                  // ignore logging errors
            }

            const updated = await articlesService.updateArticle(id, payload, {
                  allowPublishedEdit: isAdmin,
            });
            return responses.success(res, { submission: updated }, 'Artigo atualizado com sucesso');

            } catch (error: any) {
                  return handleControllerError(error, res, next, {
                        operation: 'updateArticle',
                        articleId: req.params.id,
                  });
            }
      }

      async assignDoi(req: Request, res: Response, next: NextFunction): Promise<any> {
            try {
            const { id } = req.params;

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                  return responses.badRequest(res, 'ID inválido', ['ID deve ser um UUID válido']);
            }

            const updated = await articlesService.assignDoi(id);
            return responses.success(res, { submission: updated }, 'DOI atribuído com sucesso');

            } catch (error: any) {
                  return handleControllerError(error, res, next, {
                        operation: 'assignDoi',
                        articleId: req.params.id,
                  });
            }
      }
}

export default new ArticleController();