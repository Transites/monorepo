const { FeaturedContentService } = require('../services/featuredContent.js');

const featuredContentService = new FeaturedContentService();

const getFeaturedContent = async (req, res) => {
    try {
        // allow optional ?date=YYYY-MM-DD to preview a specific day's selection
        const qDate = req.query && req.query.date ? String(req.query.date) : undefined;
        // Compute seed used (validate format) or use local server date
        let seed;
        if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
            seed = qDate;
        } else {
            const now = new Date();
            seed = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        }
        // expose seed in header for debugging
        res.set('X-Featured-Seed', seed);
        const featuredContent = await featuredContentService.getFeaturedContent(seed);
        
        // Transform to match frontend expected format
        const formattedContent = featuredContent.map(item => ({
            id: item.submission.id,
            title: item.submission.title,
            summary: item.submission.summary,
            category: item.submission.category,
            author_name: item.submission.author_name,
            metadata: item.submission.metadata,
            display_order: item.display_order,
        }));
        // expose chosen titles in header for debugging
        try {
            const titlesHeader = formattedContent.map(f => f.title.replace(/[,\n\r]+/g, ' ')).slice(0,3).join(' | ');
            res.set('X-Featured-Titles', titlesHeader);
        } catch (e) {
            // ignore header set errors
        }

        res.json({ featured: formattedContent });
    } catch (error) {
        console.error('Featured content API error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to fetch featured content'
        });
    }
};

module.exports = { getFeaturedContent };