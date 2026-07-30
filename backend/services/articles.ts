const db = require('../database/client');
import zenodoService from './zenodo';
import { generateSlug, generateArticleUrl } from '../utils/url';

interface ListArticlesParams {
      search?: string;
      category?: string;
      page: number;
      limit: number;
}

class ArticlesService {

      async listArticles({ search, category, page, limit }: ListArticlesParams){
            
            const offset = (page - 1) * limit;

            const params: any[] = ['PUBLISHED'];

            let whereClause = 'WHERE s.status = $1';

            if(search && search.trim()){
                  params.push(`%${search.trim()}%`);
                  whereClause += ` AND (s.title ILIKE $${params.length} OR s.summary ILIKE $${params.length} OR s.author_name ILIKE $${params.length})`;
            }

            if(category && category.trim()){
                  params.push(category.trim());
                  whereClause += ` AND s.category ILIKE $${params.length}`;
            }


            const articlesQuery = `
                  SELECT
                        s.id,
                        s. title,
                        s.summary,
                        s.author_name,
                        s.category,
                        s.keywords,
                        s.metadata,
                        s.status,
                        s.created_at
                  FROM submissions s
                  ${whereClause}
                  ORDER BY LOWER(s.title) ASC
                  LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

            const countQuery = `
                  SELECT COUNT(*) as total
                  FROM submissions s
                  ${whereClause}`; 
            
            const categoriesQuery = `
                  SELECT DISTINCT category
                  FROM submissions
                  WHERE STATUS = 'PUBLISHED'
                        AND category IS NOT NULL
                  ORDER BY category ASC`;
            
            params.push(limit, offset);

            const [articlesResult, countResult, categoriesResult] = await Promise.all([
                  db.query(articlesQuery, params),
                  db.query(countQuery, params.slice(0,-2)),
                  db.query(categoriesQuery),
            ]);

            const total = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(total/limit);

            return {
                  articles: articlesResult.rows,
                  categories: categoriesResult.rows.map((r:any) => r.category),
                  pagination: {
                        page,
                        limit,
                        total,
                        totalPages,
                        hasNext: page < totalPages,
                        hasPrevious: page > 1,

                  },
            };
      }

      async getArticleById(id: string) {
            const result = await db.query(
                  `SELECT
                  s.id, s.title, s.summary, s.content,
                  s.author_name, s.author_institution,
                  s.category, s.keywords,
                  s.published_at, s.created_at
                  FROM submissions s
                  WHERE s.id = $1 AND s.status = 'PUBLISHED'`,
                  [id]
            );

            return result.rows[0] || null;

      }

      async updateArticle(id: string, data: any) {
      // Campos permitidos — evita que alguém atualize status ou token
      const allowed = [
      'title', 'summary', 'content', 'content_html',
      'keywords', 'category', 'author_name',
      'author_institution', 'metadata'
      ];

      // Monta o SET dinamicamente só com os campos enviados
      const fields: string[] = [];
      const values: any[]    = [];
      let   i = 1;

      allowed.forEach(field => {
      if (data[field] !== undefined) {
            fields.push(`${field} = $${i}`);
            values.push(data[field]);
            i++;
      }
      });

      if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
      }

      fields.push(`updated_at = $${i}`);
      values.push(new Date());
      i++;

      values.push(id); // WHERE id = $i

      const result = await db.query(
      `UPDATE submissions SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
      );

      if (result.rows.length === 0) {
      throw new Error('Artigo não encontrado');
      }

      return result.rows[0];
      }

      async assignDoi(id: string) {
            const result = await db.query('SELECT * FROM submissions WHERE id = $1', [id]);
            const submission = result.rows[0];

            if (!submission) {
                  throw new Error('Artigo não encontrado');
            }

            if (submission.doi) {
                  throw new Error('Este artigo já possui um DOI atribuído');
            }

            if (!zenodoService.isEnabled()) {
                  throw new Error('Integração com o Zenodo está desabilitada');
            }

            const slug = generateSlug(submission.title);
            const articleUrl = generateArticleUrl(slug);

            const zenodoResult = await zenodoService.depositArticle({
                  id: submission.id,
                  title: submission.title,
                  summary: submission.summary,
                  content: submission.content,
                  keywords: submission.keywords,
                  category: submission.category,
                  author_name: submission.author_name,
                  author_institution: submission.author_institution,
                  metadata: submission.metadata,
            }, {
                  articleUrl,
                  publish: true,
            });

            if (!zenodoResult.doi) {
                  throw new Error('Zenodo não retornou um DOI para este artigo');
            }

            const updated = await db.query(
                  'UPDATE submissions SET doi = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                  [zenodoResult.doi, id]
            );

            return updated.rows[0];
      }

}

export default new ArticlesService();