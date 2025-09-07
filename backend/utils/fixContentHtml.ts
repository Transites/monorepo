// @ts-nocheck
import db from '../database/client';
import markdownProcessor from './markdownProcessor';
import untypedLogger from '../middleware/logging';
import {LoggerWithAudit} from "../types/migration";

const logger = untypedLogger as unknown as LoggerWithAudit;

/**
 * Utility to fix all existing articles that have NULL content_html
 * This will convert their markdown content to HTML and update the database
 */
class ContentHtmlFixer {
    
    /**
     * Fix all articles that have NULL content_html by converting their content field
     */
    async fixAllArticles(): Promise<{
        total: number;
        updated: number;
        failed: number;
        errors: any[];
    }> {
        try {
            logger.audit('Starting content_html fix process', {});

            // Find all articles with NULL content_html but non-empty content
            const articlesQuery = `
                SELECT id, title, content
                FROM submissions 
                WHERE content_html IS NULL 
                AND content IS NOT NULL 
                AND content != ''
                ORDER BY created_at DESC
            `;

            const result = await db.query(articlesQuery);
            const articles = result.rows;

            logger.audit('Found articles needing content_html fix', {
                count: articles.length
            });

            if (articles.length === 0) {
                return {
                    total: 0,
                    updated: 0,
                    failed: 0,
                    errors: []
                };
            }

            let updated = 0;
            let failed = 0;
            const errors: any[] = [];

            // Process each article
            for (const article of articles) {
                try {
                    await this.fixSingleArticle(article.id, article.content, article.title);
                    updated++;
                    
                    logger.audit('Fixed article content_html', {
                        articleId: article.id,
                        title: article.title,
                        contentLength: article.content?.length || 0
                    });

                } catch (error: any) {
                    failed++;
                    const errorInfo = {
                        articleId: article.id,
                        title: article.title,
                        error: error?.message
                    };
                    errors.push(errorInfo);
                    
                    logger.error('Failed to fix article content_html', errorInfo);
                }
            }

            const summary = {
                total: articles.length,
                updated,
                failed,
                errors
            };

            logger.audit('Content_html fix process completed', summary);

            return summary;

        } catch (error: any) {
            logger.error('Error in content_html fix process', {
                error: error?.message
            });
            throw error;
        }
    }

    /**
     * Fix a single article's content_html
     */
    async fixSingleArticle(articleId: string, content: string, title: string): Promise<void> {
        try {
            // Process the markdown content to HTML
            const htmlContent = markdownProcessor.processForDatabase(content);

            if (!htmlContent) {
                throw new Error('Failed to generate HTML content');
            }

            // Update the database
            const updateQuery = `
                UPDATE submissions 
                SET content_html = $1, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `;

            await db.query(updateQuery, [htmlContent, articleId]);

            logger.audit('Updated article content_html', {
                articleId,
                title,
                originalLength: content.length,
                htmlLength: htmlContent.length
            });

        } catch (error: any) {
            logger.error('Error fixing single article', {
                articleId,
                title,
                error: error?.message
            });
            throw error;
        }
    }

    /**
     * Verify that the fixes worked by checking a specific article
     */
    async verifyFix(articleId: string): Promise<{
        success: boolean;
        hasContent: boolean;
        hasContentHtml: boolean;
        contentLength: number;
        htmlLength: number;
    }> {
        try {
            const result = await db.query(
                'SELECT content, content_html FROM submissions WHERE id = $1',
                [articleId]
            );

            if (result.rows.length === 0) {
                return {
                    success: false,
                    hasContent: false,
                    hasContentHtml: false,
                    contentLength: 0,
                    htmlLength: 0
                };
            }

            const article = result.rows[0];
            const hasContent = !!article.content;
            const hasContentHtml = !!article.content_html;

            return {
                success: hasContent && hasContentHtml,
                hasContent,
                hasContentHtml,
                contentLength: article.content?.length || 0,
                htmlLength: article.content_html?.length || 0
            };

        } catch (error: any) {
            logger.error('Error verifying fix', {
                articleId,
                error: error?.message
            });
            throw error;
        }
    }

    /**
     * Preview what would be generated for an article without updating it
     */
    async previewFix(articleId: string): Promise<{
        title: string;
        originalContent: string;
        generatedHtml: string;
        isValid: boolean;
    }> {
        try {
            const result = await db.query(
                'SELECT title, content FROM submissions WHERE id = $1',
                [articleId]
            );

            if (result.rows.length === 0) {
                throw new Error('Article not found');
            }

            const article = result.rows[0];
            const generatedHtml = markdownProcessor.processForDatabase(article.content);
            const isValid = markdownProcessor.validateHtml(generatedHtml || '');

            return {
                title: article.title,
                originalContent: article.content,
                generatedHtml: generatedHtml || '',
                isValid
            };

        } catch (error: any) {
            logger.error('Error previewing fix', {
                articleId,
                error: error?.message
            });
            throw error;
        }
    }
}

export default new ContentHtmlFixer();