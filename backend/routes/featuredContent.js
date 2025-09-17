const express = require('express');
const { getFeaturedContent } = require('../controllers/featuredContent.js');

const router = express.Router();

// GET /api/featured-content - Get current featured content
router.get('/', getFeaturedContent);

module.exports = router;