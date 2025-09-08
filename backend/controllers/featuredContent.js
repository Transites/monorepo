const { FeaturedContentService } = require('../services/featuredContent.js');

const featuredContentService = new FeaturedContentService();

const getFeaturedContent = async (req, res) => {
    try {
        const featuredContent = await featuredContentService.getFeaturedContent();
        
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