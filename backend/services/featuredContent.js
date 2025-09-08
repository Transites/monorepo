const db = require('../database/client');

class FeaturedContentService {
    constructor() {
        this.db = db;
    }

    /**
     * Get all featured content items with full submission data
     */
    async getFeaturedContent() {
        const query = `
            SELECT 
                fc.id,
                fc.submission_id,
                fc.display_order,
                fc.content_type,
                fc.created_at as fc_created_at,
                fc.updated_at as fc_updated_at,
                s.*
            FROM featured_content fc
            JOIN submissions s ON fc.submission_id = s.id
            WHERE s.status = 'PUBLISHED'
            ORDER BY fc.display_order ASC
        `;
        
        try {
            const result = await this.db.query(query);
            return result.rows.map(row => ({
                id: row.id,
                submission_id: row.submission_id,
                display_order: row.display_order,
                content_type: row.content_type,
                created_at: row.fc_created_at,
                updated_at: row.fc_updated_at,
                submission: {
                    id: row.submission_id, // Fixed: use submission_id not row.id
                    title: row.title,
                    summary: row.summary,
                    category: row.category,
                    author_name: row.author_name,
                    metadata: row.metadata,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    status: row.status,
                    content: row.content,
                    keywords: row.keywords
                }
            }));
        } catch (error) {
            console.error('Error fetching featured content:', error);
            throw new Error('Failed to fetch featured content');
        }
    }
}

module.exports = { FeaturedContentService };