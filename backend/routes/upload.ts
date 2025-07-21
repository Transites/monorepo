import express from 'express';
import uploadController from '../controllers/upload';
import uploadValidators from '../validators/upload';
const errorHandler = require('../middleware/errors');

const router = express.Router();

// POST /api/upload/image
// Upload de imagem única
// Public (requer validação de submissão)
router.post('/image',
    uploadController.uploadSingle,
    uploadValidators.sanitizeUploadData,
    uploadValidators.validateImageUpload,
    uploadValidators.validateFileSize,
    errorHandler.asyncHandler(uploadController.uploadImage)
);

// POST /api/upload/document
// Upload de documento único
// Public (requer validação de submissão)
router.post('/document',
    uploadController.uploadSingle,
    uploadValidators.sanitizeUploadData,
    uploadValidators.validateDocumentUpload,
    uploadValidators.validateFileSize,
    errorHandler.asyncHandler(uploadController.uploadDocument)
);

// POST /api/upload/multiple
// Upload múltiplo de arquivos
// Public (requer validação de submissão)
router.post('/multiple',
    uploadController.uploadMultiple,
    uploadValidators.sanitizeUploadData,
    uploadValidators.validateMultipleUpload,
    uploadValidators.validateFileSize,
    errorHandler.asyncHandler(uploadController.uploadMultipleFiles)
);

// DELETE /api/upload/:fileId
// Deletar arquivo
// Public (requer email do autor)
router.delete('/:fileId',
    uploadValidators.sanitizeUploadData,
    uploadValidators.validateFileDelete,
    errorHandler.asyncHandler(uploadController.deleteFile)
);

// GET /api/upload/:fileId/download
// Gerar URL de download seguro
// Public
router.get('/:fileId/download',
    uploadValidators.validateDownload,
    errorHandler.asyncHandler(uploadController.generateDownloadUrl)
);

// GET /api/upload/stats
// Estatísticas de upload
// Public
router.get('/stats',
    uploadValidators.validateStats,
    errorHandler.asyncHandler(uploadController.getUploadStats)
);

module.exports = router;
