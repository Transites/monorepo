import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import multer from 'multer';
import uploadService from "../services/upload";
import { BulkUploadResult, FileUpload } from "../types/upload";
import responses from '../utils/responses';
import untypedLogger from '../middleware/logging';
import { LoggerWithAudit } from "../types/migration";

const logger = untypedLogger as unknown as LoggerWithAudit;

// Configurar multer para upload em memória
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5 // máximo 5 arquivos
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'application/rtf'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
        }
    }
});

interface AuthenticatedRequest extends Request {
    submission?: any;
    authorEmail?: string;
    user?: any;
}

class UploadController {

    // Middleware para upload de arquivo único
    public uploadSingle = upload.single('file');
    //
    // Middleware para upload múltiplo
    public uploadMultiple = upload.array('files', 5);

    /**
     * POST /api/upload/image
     * Upload de imagem única
     */
    async uploadImage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                responses.badRequest(res, 'Dados inválidos', errors.array());
                return;
            }

            if (!req.file) {
                responses.badRequest(res, 'Nenhum arquivo enviado');
                return;
            }

            const { submissionId } = req.body;
            const authorEmail = req.authorEmail || req.body.authorEmail;

            if (!authorEmail) {
                responses.badRequest(res, 'Email do autor é obrigatório');
                return;
            }

            // Upload da imagem
            const uploadedFile: FileUpload = await uploadService.uploadImage(
                req.file.buffer,
                req.file.originalname,
                submissionId,
                authorEmail
            );

            logger.audit('Image uploaded via API', {
                fileId: uploadedFile.id,
                submissionId,
                filename: uploadedFile.originalName,
                authorEmail,
                size: uploadedFile.size,
                ip: req.ip
            });

            responses.created(res, {
                    file: uploadedFile,
                    optimizations: uploadedFile.metadata.optimizations,
                },
                'Imagem enviada com sucesso'
            );

        } catch (error) {
            logger.error('Error in uploadImage controller', {
                filename: req.file?.originalname,
                submissionId: req.body.submissionId,
                error: error instanceof Error ? error.message : String(error),
                ip: req.ip
            });
            next(error);
        }
    };

    /**
     * POST /api/upload/document
     * Upload de documento único
     */
    async uploadDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                responses.badRequest(res, 'Dados inválidos', errors.array());
                return;
            }

            if (!req.file) {
                responses.badRequest(res, 'Nenhum arquivo enviado');
                return;
            }

            const { submissionId } = req.body;
            const authorEmail = req.authorEmail || req.body.authorEmail;

            if (!authorEmail) {
                responses.badRequest(res, 'Email do autor é obrigatório');
                return;
            }

            // Upload do documento
            const uploadedFile: FileUpload = await uploadService.uploadDocument(
                req.file.buffer,
                req.file.originalname,
                submissionId,
                authorEmail
            );

            logger.audit('Document uploaded via API', {
                fileId: uploadedFile.id,
                submissionId,
                filename: uploadedFile.originalName,
                authorEmail,
                size: uploadedFile.size,
                ip: req.ip
            });

            responses.created(res, {
                    file: uploadedFile,
                    preview: uploadedFile.metadata.documentPreview,
                },
                'Documento enviado com sucesso'
            );

        } catch (error) {
            logger.error('Error in uploadDocument controller', {
                filename: req.file?.originalname,
                submissionId: req.body.submissionId,
                error: error instanceof Error ? error.message : String(error),
                ip: req.ip
            });
            next(error);
        }
    };

    /**
     * POST /api/upload/multiple
     * Upload múltiplo de arquivos
     */
    async uploadMultipleFiles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                responses.badRequest(res, 'Dados inválidos', errors.array());
                return;
            }

            const files = req.files as Express.Multer.File[];
            if (!files || files.length === 0) {
                responses.badRequest(res, 'Nenhum arquivo enviado');
                return;
            }

            const { submissionId } = req.body;
            const authorEmail = req.authorEmail || req.body.authorEmail;

            if (!authorEmail) {
                responses.badRequest(res, 'Email do autor é obrigatório');
                return;
            }

            // Preparar arquivos para upload
            const fileData = files.map(file => ({
                buffer: file.buffer,
                filename: file.originalname
            }));

            // Upload múltiplo
            const result: BulkUploadResult = await uploadService.uploadMultipleFiles(
                fileData,
                submissionId,
                authorEmail
            );

            logger.audit('Multiple files uploaded via API', {
                submissionId,
                authorEmail,
                totalFiles: result.summary.total,
                successful: result.summary.successful,
                failed: result.summary.failed,
                ip: req.ip
            });

            if (result.summary.failed > 0) {
                responses.success(res, result,
                    `${result.summary.successful} arquivos enviados com sucesso, ${result.summary.failed} falharam`);
            } else {
                responses.created(res, result,
                    `Todos os ${result.summary.successful} arquivos foram enviados com sucesso`);
            }

        } catch (error) {
            logger.error('Error in uploadMultipleFiles controller', {
                fileCount: (req.files as Express.Multer.File[])?.length || 0,
                submissionId: req.body.submissionId,
                error: error instanceof Error ? error.message : String(error),
                ip: req.ip
            });
            next(error);
        }
    };

    /**
     * DELETE /api/upload/:fileId
     * Deletar arquivo
     */
    async deleteFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { fileId } = req.params;
            const authorEmail = req.authorEmail || req.body.authorEmail;

            if (!authorEmail) {
                responses.badRequest(res, 'Email do autor é obrigatório');
                return;
            }

            // Deletar arquivo
            const deleted = await uploadService.deleteFile(fileId, authorEmail);

            if (deleted) {
                responses.success(res, { deleted: true }, 'Arquivo deletado com sucesso');
            } else {
                responses.error(res, 'Falha ao deletar arquivo', 500);
            }

        } catch (error) {
            logger.error('Error in deleteFile controller', {
                fileId: req.params.fileId,
                authorEmail: req.authorEmail || req.body.authorEmail,
                error: error instanceof Error ? error.message : String(error),
                ip: req.ip
            });
            next(error);
        }
    };

    /**
     * GET /api/upload/:fileId/download
     * Gerar URL de download seguro
     */
    async generateDownloadUrl(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { fileId } = req.params;
            const expirationMinutes = parseInt(req.query.expires as string) || 60;

            // Validate fileId is UUID
            if (!fileId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(fileId)) {
                responses.badRequest(res, 'ID do arquivo inválido');
                return;
            }

            // Buscar arquivo
            const file = await uploadService.getFileById(fileId);
            if (!file) {
                responses.notFound(res, 'Arquivo não encontrado');
                return;
            }

            // Gerar URL assinada
            const downloadUrl = uploadService.generateSignedUrl(
                file.cloudinaryPublicId,
                file.resourceType === 'image' ? 'image' : 'raw',
                expirationMinutes
            );

            responses.success(res, {
                downloadUrl,
                expiresIn: expirationMinutes,
                file: {
                    id: file.id,
                    originalName: file.originalName,
                    size: file.size,
                    format: file.format
                }
            }, 'URL de download gerada');

        } catch (error) {
            logger.error('Error generating download URL', {
                fileId: req.params.fileId,
                error: error instanceof Error ? error.message : String(error)
            });
            next(error);
        }
    };

    /**
     * GET /api/upload/stats
     * Estatísticas de upload
     */
    async getUploadStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const submissionId = req.query.submissionId as string;

            const stats = await uploadService.getUploadStats(submissionId);

            responses.success(res, {
                stats,
                timestamp: new Date().toISOString()
            }, 'Estatísticas de upload');

        } catch (error) {
            logger.error('Error getting upload stats', {
                submissionId: req.query.submissionId,
                error: error instanceof Error ? error.message : String(error)
            });
            next(error);
        }
    };

    /**
     * POST /api/admin/upload/cleanup
     * Limpeza de arquivos órfãos (apenas admin)
     */
    async cleanupOrphanedFiles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await uploadService.cleanupOrphanedFiles();

            logger.audit('Orphaned files cleanup executed by admin', {
                adminId: req.user?.id,
                deletedCount: result.deleted,
                errorCount: result.errors.length
            });

            responses.success(res, {
                deleted: result.deleted,
                errors: result.errors,
                summary: `${result.deleted} arquivos órfãos removidos`
            }, 'Limpeza de arquivos órfãos concluída');

        } catch (error) {
            logger.error('Error in cleanup orphaned files', {
                adminId: req.user?.id,
                error: error instanceof Error ? error.message : String(error)
            });
            next(error);
        }
    };
}

export default new UploadController();
