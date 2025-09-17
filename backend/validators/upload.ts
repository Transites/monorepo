import { body, param, query } from 'express-validator';
import constants from '../utils/constants';

class UploadValidators {
  // Validação de upload de imagem
  validateImageUpload = [
    body('submissionId')
      .isUUID()
      .withMessage('ID da submissão deve ser um UUID válido'),

    body('authorEmail')
      .optional()
      .isEmail()
      .withMessage('Email deve ter formato válido')
      .normalizeEmail()

  ];

  // Validação de upload de documento
  validateDocumentUpload = [
    body('submissionId')
      .isUUID()
      .withMessage('ID da submissão deve ser um UUID válido'),

    body('authorEmail')
      .optional()
      .isEmail()
      .withMessage('Email deve ter formato válido')
      .normalizeEmail()
  ];

  // Validação de upload múltiplo
  validateMultipleUpload = [
    body('submissionId')
      .isUUID()
      .withMessage('ID da submissão deve ser um UUID válido'),

    body('authorEmail')
      .optional()
      .isEmail()
      .withMessage('Email deve ter formato válido')
      .normalizeEmail()
  ];

  // Validação de deleção de arquivo
  validateFileDelete = [
    param('fileId')
      .isUUID()
      .withMessage('ID do arquivo deve ser um UUID válido'),

    body('authorEmail')
      .optional()
      .isEmail()
      .withMessage('Email deve ter formato válido')
      .normalizeEmail()
  ];

  // Validação de download
  validateDownload = [
    param('fileId')
      .isUUID()
      .withMessage('ID do arquivo deve ser um UUID válido'),

    query('expires')
      .optional()
      .isInt({ min: 1, max: 1440 })
      .withMessage('Expiração deve ser entre 1 e 1440 minutos (24 horas)')
  ];

  // Validação de estatísticas
  validateStats = [
    query('submissionId')
      .optional()
      .isUUID()
      .withMessage('ID da submissão deve ser um UUID válido')
  ];

  // Validação customizada de arquivo
  validateFileSize = (req: any, res: any, next: any): void => {
    if (req.file && req.file.size > constants.LIMITS.FILE_SIZE_MAX) {
      return res.status(400).json({
        error: 'Arquivo muito grande',
        maxSize: `${constants.LIMITS.FILE_SIZE_MAX / 1024 / 1024}MB`,
        receivedSize: `${Math.round(req.file.size / 1024 / 1024 * 100) / 100}MB`
      });
    }

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.size > constants.LIMITS.FILE_SIZE_MAX) {
          return res.status(400).json({
            error: `Arquivo "${file.originalname}" muito grande`,
            maxSize: `${constants.LIMITS.FILE_SIZE_MAX / 1024 / 1024}MB`,
            receivedSize: `${Math.round(file.size / 1024 / 1024 * 100) / 100}MB`
          });
        }
      }
    }

    next();
  };

  // Sanitização de dados
  sanitizeUploadData = [
    body('submissionId').trim(),
    body('authorEmail').trim().toLowerCase(),
    query('submissionId').trim(),
    query('expires').toInt()
  ];
}

export default new UploadValidators();
