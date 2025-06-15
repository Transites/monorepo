const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
// const adminRoutes = require('./admin');
// const submissionRoutes = require('./submissions');

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
// router.use('/admin', adminRoutes);
// router.use('/submissions', submissionRoutes);

// Placeholder routes for testing
router.get('/test', (req, res) => {
    res.json({
        message: 'API funcionando',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
    });
});

router.post('/test', (req, res) => {
    res.json({
        message: 'POST endpoint funcionando',
        receivedData: req.body,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
    });
});

module.exports = router;
