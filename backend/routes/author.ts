/**
 * ❌ ALL AUTHOR ROUTES DEPRECATED - Author dashboard not implemented in React frontend
 * 
 * Author-specific functionality was part of unused submission system.
 * See BACKEND_ROUTE_USAGE_ANALYSIS.md for details
 * 
 * @warning DO NOT MODIFY without implementing author dashboard UI first
 */

import express from 'express';
import submissionController from '../controllers/submission';
import submissionValidators from '../validators/submission';
const errorHandler = require('../middleware/errors');

const router = express.Router();

// Middleware to add deprecation headers for all author endpoints
const addDeprecationHeader = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.set('X-API-Deprecation-Warning', 'Author endpoints not used by current frontend');
    res.set('X-API-Status', 'DEPRECATED - Author dashboard not implemented in UI');
    next();
};

/**
 * @deprecated NOT USED by React frontend - author submissions list not implemented
 * @status UNTESTED - No author dashboard UI to test this endpoint
 * @warning DO NOT MODIFY without implementing author dashboard first
 */
// GET /api/author/submissions
// Listar submissões do autor
// DEPRECATED - Author submissions list not used
router.get('/submissions',
    addDeprecationHeader,
    submissionValidators.validateAuthorQuery,
    errorHandler.asyncHandler(submissionController.getAuthorSubmissions)
);

module.exports = router;
