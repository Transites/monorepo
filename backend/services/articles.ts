const db = require('../database/client');

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
                  whereClause += ` AND s.category = $${params.length}`;
            }


            const articlesQuery = `
                  SELECT
                        s.id,
                        s. title,
                        s.summary,
                        s.author_name,
                        s.category,
                        s.keywords,
                        s.status,
                        s.created_at
                  FROM submissions s
                  ${whereClause}
                  ORDER BY s.status DESC NULLS LAST, s.created_at DESC
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

}

export default new ArticlesService();