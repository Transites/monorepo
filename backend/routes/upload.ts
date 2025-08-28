/**
 * ❌ ALL UPLOAD ROUTES DEPRECATED - File upload not used by React frontend
 * 
 * Upload system was part of unused submission workflow.
 * See BACKEND_ROUTE_USAGE_ANALYSIS.md for details
 * 
 * @warning DO NOT MODIFY without implementing frontend file upload features first
 */

import express from 'express';
import uploadController from '../controllers/upload';
import uploadValidators from '../validators/upload';
const errorHandler = require('../middleware/errors');

const router = express.Router();

// Middleware to add deprecation headers for all upload endpoints
const addDeprecationHeader = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.set('X-API-Deprecation-Warning', 'Upload endpoints not used by current frontend');
    res.set('X-API-Status', 'DEPRECATED - File upload system not implemented in UI');
    next();
};

/**
 * @deprecated NOT USED by React frontend - image upload not implemented
 * @status UNTESTED - Part of unused submission workflow
 * @warning DO NOT MODIFY without implementing file upload UI first
 */
// POST /api/upload/image
// Upload de imagem única
// DEPRECATED - Image upload not used
router.post('/image',
    addDeprecationHeader,
    uploadController.uploadSingle,
    uploadValidators.sanitizeUploadData,
    uploadValidators.validateImageUpload,
    uploadValidators.validateFileSize,
    errorHandler.asyncHandler(uploadController.uploadImage)
);

/**
 * @deprecated NOT USED by React frontend - document upload not implemented
 * @status UNTESTED - Part of unused submission workflow
 * @warning DO NOT MODIFY without implementing file upload UI first
 */
// POST /api/upload/document
// Upload de documento único
// DEPRECATED - Document upload not used
router.post('/document',
    addDeprecationHeader,
    uploadController.uploadSingle,
    uploadValidators.sanitizeUploadData,
    uploadValidators.validateDocumentUpload,
    uploadValidators.validateFileSize,
    errorHandler.asyncHandler(uploadController.uploadDocument)
);

/**
 * @deprecated NOT USED by React frontend - multiple upload not implemented
 * @status UNTESTED - Part of unused submission workflow
 * @warning DO NOT MODIFY without implementing file upload UI first
 */
// POST /api/upload/multiple
// Upload múltiplo de arquivos
// DEPRECATED - Multiple upload not used
router.post('/multiple',
    addDeprecationHeader,
    uploadController.uploadMultiple,
    uploadValidators.sanitizeUploadData,
    uploadValidators.validateMultipleUpload,
    uploadValidators.validateFileSize,
    errorHandler.asyncHandler(uploadController.uploadMultipleFiles)
);

/**
 * @deprecated NOT USED by React frontend - file deletion not implemented
 * @status UNTESTED - Part of unused submission workflow
 * @warning DO NOT MODIFY without implementing file management UI first
 */
// DELETE /api/upload/:fileId
// Deletar arquivo
// DEPRECATED - File deletion not used
router.delete('/:fileId',
    addDeprecationHeader,
    uploadValidators.sanitizeUploadData,
    uploadValidators.validateFileDelete,
    errorHandler.asyncHandler(uploadController.deleteFile)
);

/**
 * @deprecated NOT USED by React frontend - file download not implemented
 * @status UNTESTED - Part of unused submission workflow
 * @warning DO NOT MODIFY without implementing file access UI first
 */
// GET /api/upload/:fileId/download
// Gerar URL de download seguro
// DEPRECATED - File download not used
router.get('/:fileId/download',
    addDeprecationHeader,
    uploadValidators.validateDownload,
    errorHandler.asyncHandler(uploadController.generateDownloadUrl)
);

/**
 * @deprecated NOT USED by React frontend - upload stats not implemented
 * @status UNTESTED - Part of unused submission workflow
 * @warning DO NOT MODIFY without implementing statistics UI first
 */
// GET /api/upload/stats
// Estatísticas de upload
// DEPRECATED - Upload stats not used
router.get('/stats',
    addDeprecationHeader,
    uploadValidators.validateStats,
    errorHandler.asyncHandler(uploadController.getUploadStats)
);

module.exports = router;
