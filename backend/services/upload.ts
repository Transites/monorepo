import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';
import * as path from 'path';
import * as crypto from 'crypto';
import {
    CloudinaryConfig,
    UploadOptions,
    UploadResult,
    FileUpload,
    ImageOptimization,
    DocumentPreview,
    UploadValidation,
    BulkUploadResult,
    UploadStats,
} from '../types/upload';
import db from '../database/client';
import logger from '../middleware/logging';
import config from '../config/services';
import constants from '../utils/constants';
import { InvalidFileTypeException, UnauthorizedException } from "../utils/exceptions";

class UploadService {
    private readonly config: CloudinaryConfig;

    constructor() {
        this.config = {
            cloudName: config.storage.cloudName!,
            apiKey: config.storage.apiKey!,
            apiSecret: config.storage.apiSecret!,
            secure: config.storage.secure!
        }
        this.initializeCloudinary();
    }

    private initializeCloudinary(): void {
        cloudinary.config({
            cloud_name: this.config.cloudName,
            api_key: this.config.apiKey,
            api_secret: this.config.apiSecret,
            secure: this.config.secure
        });

        logger.info('Cloudinary initialized', {
            cloudName: this.config.cloudName,
            secure: this.config.secure
        });
    }

    /**
     * Upload de imagem com otimizações automáticas
     */
    public async uploadImage(
        fileBuffer: Buffer,
        filename: string,
        submissionId: string,
        authorEmail: string,
        options: Partial<UploadOptions> = {}
    ): Promise<FileUpload> {
        try {
            // Validar arquivo
            const validation = await this.validateFile(fileBuffer, filename, 'image');
            if (!validation.isValid) {
                throw new InvalidFileTypeException(`Arquivo inválido: ${validation.errors.join(', ')}`, [validation.fileType])
            }

            // Verificar limite de arquivos por submissão
            await this.checkSubmissionFileLimit(submissionId);

            // Gerar ID único para o arquivo
            const publicId = this.generatePublicId(filename, submissionId);

            // Configurar opções de upload para imagens
            const uploadOptions: UploadOptions = {
                folder: `submissions/${submissionId}`,
                publicId,
                resourceType: 'image',
                // format: 'auto',
                quality: 'auto:good',
                transformation: [
                    { quality: 'auto:good' },
                ],
                tags: ['submission', submissionId, 'image'],
                context: {
                    submissionId,
                    authorEmail,
                    originalName: filename
                },
                overwrite: false,
                ...options
            };

            // Upload para Cloudinary
            const uploadResult = await this.performCloudinaryUpload(fileBuffer, uploadOptions);

            // Gerar otimizações de imagem
            const optimizations = this.generateImageOptimizations(uploadResult.publicId);

            // Salvar no banco de dados
            const fileUpload: Omit<FileUpload, 'id'> = {
                submissionId,
                originalName: filename,
                cloudinaryPublicId: uploadResult.publicId,
                url: uploadResult.url,
                secureUrl: uploadResult.secureUrl,
                format: uploadResult.format,
                resourceType: 'image',
                size: uploadResult.bytes,
                width: uploadResult.width,
                height: uploadResult.height,
                tags: JSON.stringify(uploadResult.tags || []),
                metadata: {
                    ...uploadResult.metadata,
                    optimizations,
                    validation
                },
                uploadedAt: new Date(),
                uploadedBy: authorEmail
            };

            const savedFile = await this.saveFileToDatabase(fileUpload);

            logger.audit('Image uploaded successfully', {
                fileId: savedFile.id,
                submissionId,
                filename,
                size: uploadResult.bytes,
                authorEmail,
                publicId: uploadResult.publicId
            });

            return savedFile;

        } catch (error) {
            logger.error('Error uploading image', {
                filename,
                submissionId,
                authorEmail,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Upload de documento com preview automático
     */
    public async uploadDocument(
        fileBuffer: Buffer,
        filename: string,
        submissionId: string,
        authorEmail: string,
        options: Partial<UploadOptions> = {}
    ): Promise<FileUpload> {
        try {
            // Validar arquivo
            const validation = await this.validateFile(fileBuffer, filename, 'document');
            if (!validation.isValid) {
                throw new Error(`Arquivo inválido: ${validation.errors.join(', ')}`);
            }

            // Verificar limite de arquivos por submissão
            await this.checkSubmissionFileLimit(submissionId);

            // Gerar ID único para o arquivo
            const publicId = this.generatePublicId(filename, submissionId);

            // Configurar opções de upload para documentos
            const uploadOptions: UploadOptions = {
                folder: `submissions/${submissionId}/documents`,
                publicId,
                resourceType: 'raw',
                tags: ['submission', submissionId, 'document'],
                context: {
                    submissionId,
                    authorEmail,
                    originalName: filename
                },
                overwrite: false,
                ...options
            };

            // Upload para Cloudinary
            const uploadResult = await this.performCloudinaryUpload(fileBuffer, uploadOptions);

            // Gerar preview para documentos (se PDF)
            let documentPreview: DocumentPreview | undefined;
            if (path.extname(filename).toLowerCase() === '.pdf') {
                documentPreview = await this.generateDocumentPreview(uploadResult.publicId);
            }

            // Salvar no banco de dados
            const fileUpload: Omit<FileUpload, 'id'> = {
                submissionId,
                originalName: filename,
                cloudinaryPublicId: uploadResult.publicId,
                url: uploadResult.url,
                secureUrl: uploadResult.secureUrl,
                format: uploadResult.format,
                resourceType: 'document',
                size: uploadResult.bytes,
                tags: JSON.stringify(uploadResult.tags),
                metadata: {
                    ...uploadResult.metadata,
                    documentPreview,
                    validation
                },
                uploadedAt: new Date(),
                uploadedBy: authorEmail
            };

            const savedFile = await this.saveFileToDatabase(fileUpload);

            logger.audit('Document uploaded successfully', {
                fileId: savedFile.id,
                submissionId,
                filename,
                size: uploadResult.bytes,
                authorEmail,
                publicId: uploadResult.publicId
            });

            return savedFile;

        } catch (error) {
            logger.error('Error uploading document', {
                filename,
                submissionId,
                authorEmail,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Upload múltiplo de arquivos
     */
    public async uploadMultipleFiles(
        files: Array<{ buffer: Buffer; filename: string }>,
        submissionId: string,
        authorEmail: string
    ): Promise<BulkUploadResult> {
        const results: BulkUploadResult = {
            successful: [],
            failed: [],
            summary: {
                total: files.length,
                successful: 0,
                failed: 0
            }
        };

        for (const file of files) {
            try {
                const fileType = this.determineFileType(file.filename);
                let uploadedFile: FileUpload;

                if (fileType === 'image') {
                    uploadedFile = await this.uploadImage(
                        file.buffer,
                        file.filename,
                        submissionId,
                        authorEmail
                    );
                } else {
                    uploadedFile = await this.uploadDocument(
                        file.buffer,
                        file.filename,
                        submissionId,
                        authorEmail
                    );
                }

                results.successful.push(uploadedFile);
                results.summary.successful++;

            } catch (error) {
                results.failed.push({
                    filename: file.filename,
                    error: error instanceof Error ? error.message : String(error)
                });
                results.summary.failed++;
            }
        }

        logger.audit('Bulk upload completed', {
            submissionId,
            authorEmail,
            total: results.summary.total,
            successful: results.summary.successful,
            failed: results.summary.failed
        });

        return results;
    }

    /**
     * Deletar arquivo
     */
    public async deleteFile(fileId: string, authorEmail: string): Promise<boolean> {
        try {
            // Buscar arquivo no banco
            const file = await this.getFileById(fileId);
            if (!file) {
                throw new Error('Arquivo não encontrado');
            }

            // Verificar propriedade
            if (file.uploadedBy !== authorEmail) {
                throw new UnauthorizedException('Você não tem permissão para deletar este arquivo');
            }

            // Deletar do Cloudinary
            const deleteResult = await cloudinary.uploader.destroy(
                file.cloudinaryPublicId,
                { resource_type: file.resourceType === 'image' ? 'image' : 'raw' }
            );

            if (deleteResult.result !== 'ok') {
                logger.warn('Failed to delete from Cloudinary', {
                    fileId,
                    publicId: file.cloudinaryPublicId,
                    result: deleteResult.result
                });
            }

            // Deletar do banco
            await this.deleteFileFromDatabase(fileId);

            logger.audit('File deleted successfully', {
                fileId,
                filename: file.originalName,
                submissionId: file.submissionId,
                authorEmail,
                publicId: file.cloudinaryPublicId
            });

            return true;

        } catch (error) {
            logger.error('Error deleting file', {
                fileId,
                authorEmail,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Obter URL assinada para download seguro
     */
    public generateSignedUrl(
        publicId: string,
        resourceType: 'image' | 'raw' = 'image',
        expirationMinutes: number = 60
    ): string {
        const timestamp = Math.round(new Date().getTime() / 1000) + (expirationMinutes * 60);

        return cloudinary.utils.private_download_url(publicId, resourceType, {
            expires_at: timestamp,
            attachment: false
        });
    }

    /**
     * Gerar transformações de imagem em tempo real
     */
    public generateImageVariations(publicId: string): ImageOptimization {
        return this.generateImageOptimizations(publicId);
    }

    /**
     * Obter estatísticas de upload
     */
    async getUploadStats(submissionId?: string): Promise<UploadStats> {
        try {
            const whereClause = submissionId ? 'WHERE submission_id = $1' : '';
            const params = submissionId ? [submissionId] : [];

            const result = await db.query(`
                SELECT COUNT(*)  as total_uploads,
                       SUM(size) as total_size,
                       resource_type,
                       format,
                       COUNT(*)  as count
                FROM file_uploads ${whereClause}
                GROUP BY resource_type, format
                ORDER BY count DESC
            `, params);

            const recentUploads = await db.query(`
                SELECT *
                FROM file_uploads ${whereClause}
                ORDER BY uploaded_at DESC
                LIMIT 10
            `, params);

            // Processar estatísticas
            const stats: UploadStats = {
                totalUploads: 0,
                totalSize: 0,
                byType: {},
                byFormat: {},
                recentUploads: recentUploads.rows.map(this.mapDatabaseRowToFileUpload),
                storageUsed: {
                    images: 0,
                    documents: 0,
                    total: 0
                }
            };

            result.rows.forEach((row: any) => {
                stats.totalUploads += parseInt(row.count);
                stats.totalSize += parseInt(row.total_size || 0);
                stats.byType[row.resource_type] = (stats.byType[row.resource_type] || 0) + parseInt(row.count);
                stats.byFormat[row.format] = (stats.byFormat[row.format] || 0) + parseInt(row.count);

                if (row.resource_type === 'image') {
                    stats.storageUsed.images += parseInt(row.total_size || 0);
                } else {
                    stats.storageUsed.documents += parseInt(row.total_size || 0);
                }
            });

            stats.storageUsed.total = stats.storageUsed.images + stats.storageUsed.documents;

            return stats;

        } catch (error) {
            logger.error('Error getting upload stats', {
                submissionId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Limpar arquivos órfãos (sem submissão associada)
     */
    async cleanupOrphanedFiles(): Promise<{ deleted: number; errors: string[] }> {
        try {
            // Buscar arquivos órfãos
            const orphanedFiles = await db.query(`
                SELECT fu.*
                FROM file_uploads fu
                         LEFT JOIN submissions s ON fu.submission_id = s.id
                WHERE s.id IS NULL
            `);

            const deleted: string[] = [];
            const errors: string[] = [];

            for (const file of orphanedFiles.rows) {
                try {
                    // Deletar do Cloudinary
                    await cloudinary.uploader.destroy(
                        file.cloudinary_public_id,
                        { resource_type: file.resource_type === 'image' ? 'image' : 'raw' }
                    );

                    // Deletar do banco
                    await this.deleteFileFromDatabase(file.id);
                    deleted.push(file.id);

                } catch (error) {
                    errors.push(`Failed to delete ${file.original_name}: ${error}`);
                }
            }

            logger.audit('Orphaned files cleanup completed', {
                deletedCount: deleted.length,
                errorCount: errors.length
            });

            return {
                deleted: deleted.length,
                errors
            };

        } catch (error) {
            logger.error('Error during orphaned files cleanup', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Get file by ID
     */
    async getFileById(fileId: string): Promise<FileUpload | null> {
        const result = await db.query(
            'SELECT * FROM file_uploads WHERE id = $1',
            [fileId]
        );

        return result.rows.length > 0 ? this.mapDatabaseRowToFileUpload(result.rows[0]) : null;
    }

    // =============================================================================
    // MÉTODOS PRIVADOS
    // =============================================================================

    private async performCloudinaryUpload(
        fileBuffer: Buffer,
        options: UploadOptions
    ): Promise<UploadResult> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                options as any,
                (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                    if (error) {
                        reject(new Error(`Cloudinary upload failed: ${error.message}`));
                    } else if (result) {
                        resolve({
                            publicId: result.public_id,
                            url: result.url,
                            secureUrl: result.secure_url,
                            format: result.format,
                            resourceType: result.resource_type,
                            width: result.width,
                            height: result.height,
                            bytes: result.bytes,
                            signature: result.signature,
                            version: result.version,
                            versionId: result.version_id,
                            tags: result.tags || [],
                            // @ts-ignore
                            context: result.context,
                            metadata: result.metadata,
                            createdAt: result.created_at,
                            etag: result.etag
                        });
                    } else {
                        reject(new Error('Unknown error during upload'));
                    }
                }
            );

            const bufferStream = new Readable();
            bufferStream.push(fileBuffer);
            bufferStream.push(null);
            bufferStream.pipe(uploadStream);
        });
    }

    private async validateFile(
        fileBuffer: Buffer,
        filename: string,
        expectedType: 'image' | 'document'
    ): Promise<UploadValidation> {
        const errors: string[] = [];
        const extension = path.extname(filename).toLowerCase().substring(1);

        // Validar tamanho
        if (fileBuffer.length > constants.LIMITS.FILE_SIZE_MAX) {
            errors.push(`Arquivo muito grande. Máximo: ${constants.LIMITS.FILE_SIZE_MAX / 1024 / 1024}MB`);
        }

        if (fileBuffer.length === 0) {
            errors.push('Arquivo vazio');
        }

        // Validar tipo
        const allowedFormats = expectedType === 'image'
            ? constants.ALLOWED_IMAGE_TYPES
            : constants.ALLOWED_DOCUMENT_TYPES;

        if (!allowedFormats.includes(extension)) {
            errors.push(`Formato não permitido. Permitidos: ${allowedFormats.join(', ')}`);
        }

        // Validações específicas por tipo
        let dimensions: { width: number; height: number } | undefined;

        if (expectedType === 'image' && constants.ALLOWED_IMAGE_TYPES.includes(extension)) {
            dimensions = await this.getImageDimensions(fileBuffer);

            if (dimensions) {
                if (dimensions.width > 4000 || dimensions.height > 4000) {
                    errors.push('Imagem muito grande. Máximo: 4000x4000 pixels');
                }

                if (dimensions.width < 100 || dimensions.height < 100) {
                    errors.push('Imagem muito pequena. Mínimo: 100x100 pixels');
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            fileType: expectedType,
            size: fileBuffer.length,
            dimensions
        };
    }

    // TODO: implementar e testar!
    private async getImageDimensions(fileBuffer: Buffer): Promise<{ width: number; height: number } | undefined> {
        try {
            // Implementação básica - em produção usar biblioteca como 'sharp' ou 'image-size'
            // Por simplicidade, retornando null aqui
            return undefined;
        } catch (error) {
            return undefined;
        }
    }

    private generatePublicId(filename: string, submissionId: string): string {
        const name = path.parse(filename).name;
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');

        return `${submissionId}/${name}_${timestamp}_${random}`;
    }

    private generateImageOptimizations(publicId: string): ImageOptimization {
        const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}/image/upload`;

        return {
            thumbnail: `${baseUrl}/c_fill,w_150,h_150,q_auto,f_auto/${publicId}`,
            small: `${baseUrl}/c_fit,w_300,h_300,q_auto,f_auto/${publicId}`,
            medium: `${baseUrl}/c_fit,w_600,h_600,q_auto,f_auto/${publicId}`,
            large: `${baseUrl}/c_fit,w_1200,h_1200,q_auto,f_auto/${publicId}`,
            original: `${baseUrl}/q_auto,f_auto/${publicId}`
        };
    }

    private async generateDocumentPreview(publicId: string): Promise<DocumentPreview> {
        const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}/image/upload`;

        return {
            thumbnail: `${baseUrl}/c_fit,w_200,h_300,q_auto,f_jpg,pg_1/${publicId}.jpg`,
            preview: `${baseUrl}/c_fit,w_600,h_800,q_auto,f_jpg,pg_1/${publicId}.jpg`,
            downloadUrl: `https://res.cloudinary.com/${this.config.cloudName}/raw/upload/${publicId}`
        };
    }

    private determineFileType(filename: string): 'image' | 'document' {
        const extension = path.extname(filename).toLowerCase().substring(1);
        return constants.ALLOWED_IMAGE_TYPES.includes(extension) ? 'image' : 'document';
    }

    private async checkSubmissionFileLimit(submissionId: string): Promise<void> {
        const result = await db.query(
            'SELECT COUNT(*) FROM file_uploads WHERE submission_id = $1',
            [submissionId]
        );

        const currentCount = parseInt(result.rows[0].count);
        if (currentCount >= constants.SUBMISSION_LIMITS.MAX_ATTACHMENTS) {
            throw new Error(`Máximo de ${constants.SUBMISSION_LIMITS.MAX_ATTACHMENTS} arquivos por submissão`);
        }
    }

    private async saveFileToDatabase(fileUpload: Omit<FileUpload, 'id'>): Promise<FileUpload> {
        const result = await db.query(`
            INSERT INTO file_uploads (submission_id, original_name, cloudinary_public_id, url, secure_url,
                                      format, resource_type, size, width, height, tags, metadata, uploaded_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [
            fileUpload.submissionId,
            fileUpload.originalName,
            fileUpload.cloudinaryPublicId,
            fileUpload.url,
            fileUpload.secureUrl,
            fileUpload.format,
            fileUpload.resourceType,
            fileUpload.size,
            fileUpload.width,
            fileUpload.height,
            fileUpload.tags,
            JSON.stringify(fileUpload.metadata),
            fileUpload.uploadedBy
        ]);

        return this.mapDatabaseRowToFileUpload(result.rows[0]);
    }

    private async deleteFileFromDatabase(fileId: string): Promise<void> {
        await db.query('DELETE FROM file_uploads WHERE id = $1', [fileId]);
    }

    private mapDatabaseRowToFileUpload(row: any): FileUpload {
        return {
            id: row.id,
            submissionId: row.submission_id,
            originalName: row.original_name,
            cloudinaryPublicId: row.cloudinary_public_id,
            url: row.url,
            secureUrl: row.secure_url,
            format: row.format,
            resourceType: row.resource_type,
            size: row.size,
            width: row.width,
            height: row.height,
            tags: row.tags ?? [],
            metadata: row.metadata ?? '{}',
            uploadedAt: new Date(row.uploaded_at),
            uploadedBy: row.uploaded_by
        };
    }
}

export default new UploadService();
