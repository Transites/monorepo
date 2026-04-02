import { Request, Response, NextFunction  } from 'express';
import articlesService from '../services/articles';
import responses from '../utils/responses';
import { handleControllerError } from '../utils/errorHandler';

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
}

export default new ArticleController();