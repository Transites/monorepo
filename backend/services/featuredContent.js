const db = require('../database/client');

class FeaturedContentService {
    constructor() {
        this.db = db;
    }

    /**
     * Get all featured content items with full submission data
     */
    async getFeaturedContent(seedDate) {
        // We'll use all published submissions as the pool for daily rotation.
        // This ensures more variety even if `featured_content` table has only a few rows.
        const query = `SELECT s.* FROM submissions s WHERE s.status = 'PUBLISHED'`;

        // Helper: deterministic hash (djb2) for strings
        function hashString(str) {
            let hash = 5381;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) + hash) + str.charCodeAt(i);
                // keep in 32-bit range
                hash = hash & 0xffffffff;
            }
            return hash >>> 0; // ensure unsigned
        }

        try {
            const result = await this.db.query(query);
            const rows = result.rows || [];

            // Determine seed: prefer provided seedDate (YYYY-MM-DD), otherwise use current local date
            let seed;
            if (seedDate && /^\d{4}-\d{2}-\d{2}$/.test(seedDate)) {
                seed = seedDate;
            } else {
                const now = new Date();
                seed = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            }

            // Normalize submission rows
            const normalized = rows.map(r => ({
                submission_id: r.id,
                display_order: 0,
                content_type: 'submission',
                fc_created_at: null,
                fc_updated_at: null,
                title: r.title,
                summary: r.summary,
                category: r.category,
                author_name: r.author_name,
                metadata: r.metadata,
                created_at: r.created_at,
                updated_at: r.updated_at,
                status: r.status,
                content: r.content,
                keywords: r.keywords
            }));

            // Use a seeded PRNG (from seed string) to shuffle deterministically per day
            function mulberry32(a) {
                return function() {
                    a |= 0;
                    a = a + 0x6D2B79F5 | 0;
                    let t = Math.imul(a ^ a >>> 15, 1 | a);
                    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
                    return ((t ^ t >>> 14) >>> 0) / 4294967296;
                };
            }

            const seedHash = hashString(seed);
            const rand = mulberry32(seedHash);

            // Fisher-Yates shuffle using seeded PRNG
            const shuffled = normalized.slice();
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(rand() * (i + 1));
                const tmp = shuffled[i];
                shuffled[i] = shuffled[j];
                shuffled[j] = tmp;
            }

            const selected = shuffled.slice(0, 3);

            return selected.map(row => ({
                id: row.submission_id, // frontend expects id to be submission id
                submission_id: row.submission_id,
                display_order: row.display_order,
                content_type: row.content_type,
                created_at: row.fc_created_at,
                updated_at: row.fc_updated_at,
                submission: {
                    id: row.submission_id,
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