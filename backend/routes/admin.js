const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const emailRoutes = require('./email');

// Mount email routes
router.use('/email', emailRoutes);

// Admin info route
router.get('/', authMiddleware.requireAuth, (req, res) => {
    res.json({
        message: 'Admin API',
        admin: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name
        },
        endpoints: {
            email: '/api/admin/email'
        }
    });
});

module.exports = router;
