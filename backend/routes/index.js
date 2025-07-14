const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const tokenRoutes = require('./tokens');
const submissionRoutes = require('./submission');
const authorRoutes = require('./author');

// API information
router.get('/', (req, res) => {
    res.json({
        name: 'Enciclopédia Transitos API',
        version: '1.0.0',
        description: 'Sistema de submissão e gestão de artigos acadêmicos',
        endpoints: {
            auth: '/api/auth',
            admin: '/api/admin',
            submissions: '/api/submissions',
            health: '/api/health'
        },
        documentation: 'https://enciclopedia.iea.usp.br/docs'
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/tokens', tokenRoutes);
router.use('/submissions', submissionRoutes);
router.use('/author', authorRoutes);

module.exports = router;
