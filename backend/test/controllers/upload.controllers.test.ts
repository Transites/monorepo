/**
 * Testes para UploadController
 */
import { Request, Response, NextFunction } from 'express';
import uploadController from '../../controllers/upload';
import uploadService from '../../services/upload';
import responses from '../../utils/responses';
import logger from '../../middleware/logging';
import { FileUpload, BulkUploadResult } from '../../types/upload';
import { validationResult } from 'express-validator';

// Mock dependencies
jest.mock('../../services/upload');
jest.mock('../../utils/responses');
jest.mock('../../middleware/logging');
jest.mock('express-validator', () => ({
    validationResult: jest.fn()
}));
jest.mock('multer', () => {
    const multerMock = () => ({
        single: jest.fn().mockImplementation(() => {
            return (req: any, res: any, next: any) => {
                next();
            };
        }),
        array: jest.fn().mockImplementation(() => {
            return (req: any, res: any, next: any) => {
                next();
            };
        })
    });
    multerMock.memoryStorage = jest.fn();
    return multerMock;
});

describe('UploadController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock<NextFunction>;

    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
            query: {},
            ip: '127.0.0.1'
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };

        mockNext = jest.fn();

        jest.clearAllMocks();

        // Mock validation result to be empty (no errors) by default
        (validationResult as unknown as jest.Mock).mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(true),
            array: jest.fn().mockReturnValue([])
        });
    });

    describe('uploadImage', () => {
        test('deve processar upload via API', async () => {
            // Setup mock request
            mockRequest.file = {
                buffer: Buffer.from('test image'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg',
                size: 1024
            } as Express.Multer.File;

            mockRequest.body = {
                submissionId: 'test-submission',
                authorEmail: 'test@example.com'
            };

            // Setup mock service response
            const mockUploadedFile: FileUpload = {
                id: 'test-id',
                submissionId: 'test-submission',
                originalName: 'test.jpg',
                cloudinaryPublicId: 'test-public-id',
                url: 'http://test-url.com',
                secureUrl: 'https://test-url.com',
                format: 'jpg',
                resourceType: 'image',
                size: 1024,
                width: 100,
                height: 100,
                tags: ['test'],
                metadata: {
                    optimizations: {
                        thumbnail: 'https://thumbnail.com',
                        small: 'https://small.com',
                        medium: 'https://medium.com',
                        large: 'https://large.com',
                        original: 'https://original.com'
                    }
                },
                uploadedAt: new Date(),
                uploadedBy: 'test@example.com'
            };

            (uploadService.uploadImage as jest.Mock).mockResolvedValue(mockUploadedFile);

            // Call the method
            await uploadController.uploadImage(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.uploadImage).toHaveBeenCalledWith(
                mockRequest.file!.buffer,
                mockRequest.file!.originalname,
                mockRequest.body.submissionId,
                mockRequest.body.authorEmail
            );
            expect(logger.audit).toHaveBeenCalled();
            expect(responses.created).toHaveBeenCalledWith(
                mockResponse,
                {
                    file: mockUploadedFile,
                    optimizations: mockUploadedFile.metadata.optimizations,
                    message: 'Imagem enviada com sucesso'
                }
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('deve aplicar validações', async () => {
            // Setup mock request without file
            mockRequest.file = undefined;
            mockRequest.body = {
                submissionId: 'test-submission',
                authorEmail: 'test@example.com'
            };

            // Mock validation errors
            (validationResult as unknown as jest.Mock).mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(true),
                array: jest.fn().mockReturnValue([])
            });

            // Call the method
            await uploadController.uploadImage(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.uploadImage).not.toHaveBeenCalled();
            expect(responses.badRequest).toHaveBeenCalledWith(
                mockResponse,
                'Nenhum arquivo enviado'
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('deve tratar erros', async () => {
            // Setup mock request
            mockRequest.file = {
                buffer: Buffer.from('test image'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg',
                size: 1024
            } as Express.Multer.File;

            mockRequest.body = {
                submissionId: 'test-submission',
                authorEmail: 'test@example.com'
            };

            // Setup mock service to throw error
            const testError = new Error('Test error');
            (uploadService.uploadImage as jest.Mock).mockRejectedValue(testError);

            // Call the method
            await uploadController.uploadImage(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(logger.error).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(testError);
        });
    });

    describe('uploadDocument', () => {
        test('deve processar upload de documento via API', async () => {
            // Setup mock request
            mockRequest.file = {
                buffer: Buffer.from('test document'),
                originalname: 'test.pdf',
                mimetype: 'application/pdf',
                size: 2048
            } as Express.Multer.File;

            mockRequest.body = {
                submissionId: 'test-submission',
                authorEmail: 'test@example.com'
            };

            // Setup mock service response
            const mockUploadedFile: FileUpload = {
                id: 'test-id',
                submissionId: 'test-submission',
                originalName: 'test.pdf',
                cloudinaryPublicId: 'test-public-id',
                url: 'http://test-url.com',
                secureUrl: 'https://test-url.com',
                format: 'pdf',
                resourceType: 'document',
                size: 2048,
                tags: ['test'],
                metadata: {
                    documentPreview: {
                        thumbnail: 'https://thumbnail.com',
                        pages: 2
                    }
                },
                uploadedAt: new Date(),
                uploadedBy: 'test@example.com'
            };

            (uploadService.uploadDocument as jest.Mock).mockResolvedValue(mockUploadedFile);

            // Call the method
            await uploadController.uploadDocument(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.uploadDocument).toHaveBeenCalledWith(
                mockRequest.file!.buffer,
                mockRequest.file!.originalname,
                mockRequest.body.submissionId,
                mockRequest.body.authorEmail
            );
            expect(logger.audit).toHaveBeenCalled();
            expect(responses.created).toHaveBeenCalledWith(
                mockResponse,
                {
                    file: mockUploadedFile,
                    preview: mockUploadedFile.metadata.documentPreview,
                    message: 'Documento enviado com sucesso'
                }
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('deve aplicar validações para documentos', async () => {
            // Setup mock request without file
            mockRequest.file = undefined;
            mockRequest.body = {
                submissionId: 'test-submission',
                authorEmail: 'test@example.com'
            };

            // Call the method
            await uploadController.uploadDocument(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.uploadDocument).not.toHaveBeenCalled();
            expect(responses.badRequest).toHaveBeenCalledWith(
                mockResponse,
                'Nenhum arquivo enviado'
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('deve tratar erros ao fazer upload de documento', async () => {
            // Setup mock request
            mockRequest.file = {
                buffer: Buffer.from('test document'),
                originalname: 'test.pdf',
                mimetype: 'application/pdf',
                size: 2048
            } as Express.Multer.File;

            mockRequest.body = {
                submissionId: 'test-submission',
                authorEmail: 'test@example.com'
            };

            // Setup mock service to throw error
            const testError = new Error('Erro ao fazer upload do documento');
            (uploadService.uploadDocument as jest.Mock).mockRejectedValue(testError);

            // Call the method
            await uploadController.uploadDocument(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(logger.error).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(testError);
        });
    });

    describe('uploadMultipleFiles', () => {
        test('deve processar upload múltiplo via API', async () => {
            // Setup mock request
            mockRequest.files = [
                {
                    buffer: Buffer.from('test image'),
                    originalname: 'test.jpg',
                    mimetype: 'image/jpeg',
                    size: 1024
                },
                {
                    buffer: Buffer.from('test document'),
                    originalname: 'test.pdf',
                    mimetype: 'application/pdf',
                    size: 2048
                }
            ] as Express.Multer.File[];

            mockRequest.body = {
                submissionId: 'test-submission',
                authorEmail: 'test@example.com'
            };

            // Setup mock service response
            const mockBulkResult: BulkUploadResult = {
                successful: [
                    {
                        id: 'image-id',
                        submissionId: 'test-submission',
                        originalName: 'test.jpg',
                        cloudinaryPublicId: 'test-image-id',
                        url: 'http://test-url.com/image',
                        secureUrl: 'https://test-url.com/image',
                        format: 'jpg',
                        resourceType: 'image',
                        size: 1024,
                        width: 100,
                        height: 100,
                        tags: ['test'],
                        metadata: {},
                        uploadedAt: new Date(),
                        uploadedBy: 'test@example.com'
                    },
                    {
                        id: 'doc-id',
                        submissionId: 'test-submission',
                        originalName: 'test.pdf',
                        cloudinaryPublicId: 'test-doc-id',
                        url: 'http://test-url.com/doc',
                        secureUrl: 'https://test-url.com/doc',
                        format: 'pdf',
                        resourceType: 'document',
                        size: 2048,
                        tags: ['test'],
                        metadata: {},
                        uploadedAt: new Date(),
                        uploadedBy: 'test@example.com'
                    }
                ],
                failed: [],
                summary: {
                    total: 2,
                    successful: 2,
                    failed: 0
                }
            };

            (uploadService.uploadMultipleFiles as jest.Mock).mockResolvedValue(mockBulkResult);

            // Call the method
            await uploadController.uploadMultipleFiles(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.uploadMultipleFiles).toHaveBeenCalledWith(
                mockRequest.files!.map(file => ({
                    buffer: file.buffer,
                    filename: file.originalname
                })),
                mockRequest.body.submissionId,
                mockRequest.body.authorEmail
            );
            expect(logger.audit).toHaveBeenCalled();
            expect(responses.created).toHaveBeenCalledWith(
                mockResponse,
                mockBulkResult,
                'Todos os 2 arquivos foram enviados com sucesso'
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('deve processar upload com arquivos com falha', async () => {
            // Setup mock request
            mockRequest.files = [
                {
                    buffer: Buffer.from('test image'),
                    originalname: 'test.jpg',
                    mimetype: 'image/jpeg',
                    size: 1024
                },
                {
                    buffer: Buffer.from('test document'),
                    originalname: 'test.pdf',
                    mimetype: 'application/pdf',
                    size: 2048
                }
            ] as Express.Multer.File[];

            mockRequest.body = {
                submissionId: 'test-submission',
                authorEmail: 'test@example.com'
            };

            // Setup mock service response with failed files
            const mockBulkResult: BulkUploadResult = {
                successful: [
                    {
                        id: 'image-id',
                        submissionId: 'test-submission',
                        originalName: 'test.jpg',
                        cloudinaryPublicId: 'test-image-id',
                        url: 'http://test-url.com/image',
                        secureUrl: 'https://test-url.com/image',
                        format: 'jpg',
                        resourceType: 'image',
                        size: 1024,
                        width: 100,
                        height: 100,
                        tags: ['test'],
                        metadata: {},
                        uploadedAt: new Date(),
                        uploadedBy: 'test@example.com'
                    }
                ],
                failed: [
                    {
                        filename: 'test.pdf',
                        error: 'Arquivo muito grande'
                    }
                ],
                summary: {
                    total: 2,
                    successful: 1,
                    failed: 1
                }
            };

            (uploadService.uploadMultipleFiles as jest.Mock).mockResolvedValue(mockBulkResult);

            // Call the method
            await uploadController.uploadMultipleFiles(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.uploadMultipleFiles).toHaveBeenCalled();
            expect(logger.audit).toHaveBeenCalled();
            expect(responses.success).toHaveBeenCalledWith(
                mockResponse,
                mockBulkResult,
                '1 arquivos enviados com sucesso, 1 falharam'
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('deve aplicar validações para upload múltiplo', async () => {
            // Setup mock request without files
            mockRequest.files = [];
            mockRequest.body = {
                submissionId: 'test-submission',
                authorEmail: 'test@example.com'
            };

            // Call the method
            await uploadController.uploadMultipleFiles(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.uploadMultipleFiles).not.toHaveBeenCalled();
            expect(responses.badRequest).toHaveBeenCalledWith(
                mockResponse,
                'Nenhum arquivo enviado'
            );
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('deleteFile', () => {
        test('deve deletar com autorização', async () => {
            // Setup mock request
            mockRequest.params = {
                fileId: 'test-id'
            };
            mockRequest.body = {
                authorEmail: 'test@example.com'
            };

            // Setup mock service response
            (uploadService.deleteFile as jest.Mock).mockResolvedValue(true);

            // Call the method
            await uploadController.deleteFile(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.deleteFile).toHaveBeenCalledWith(
                'test-id',
                'test@example.com'
            );
            expect(responses.success).toHaveBeenCalledWith(
                mockResponse,
                { deleted: true },
                'Arquivo deletado com sucesso'
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('deve rejeitar sem autorização', async () => {
            // Setup mock request without authorEmail
            mockRequest.params = {
                fileId: 'test-id'
            };
            mockRequest.body = {};

            // Call the method
            await uploadController.deleteFile(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.deleteFile).not.toHaveBeenCalled();
            expect(responses.badRequest).toHaveBeenCalledWith(
                mockResponse,
                'Email do autor é obrigatório'
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('deve tratar erros', async () => {
            // Setup mock request
            mockRequest.params = {
                fileId: 'test-id'
            };
            mockRequest.body = {
                authorEmail: 'test@example.com'
            };

            // Setup mock service to throw error
            const testError = new Error('Você não tem permissão para deletar este arquivo');
            (uploadService.deleteFile as jest.Mock).mockRejectedValue(testError);

            // Call the method
            await uploadController.deleteFile(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(logger.error).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(testError);
        });
    });

    describe('getUploadStats', () => {
        test('deve retornar estatísticas de upload', async () => {
            // Setup mock request
            mockRequest.query = {
                submissionId: 'test-submission'
            };

            // Setup mock service response
            const mockStats = {
                totalUploads: 10,
                totalSize: 5242880, // 5MB
                byType: {
                    image: 7,
                    document: 3
                },
                byFormat: {
                    jpg: 5,
                    png: 2,
                    pdf: 3
                },
                recentUploads: [],
                storageUsed: {
                    images: 2097152, // 2MB
                    documents: 3145728, // 3MB
                    total: 5242880 // 5MB
                }
            };

            (uploadService.getUploadStats as jest.Mock).mockResolvedValue(mockStats);

            // Call the method
            await uploadController.getUploadStats(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.getUploadStats).toHaveBeenCalledWith('test-submission');
            expect(responses.success).toHaveBeenCalledWith(
                mockResponse,
                expect.objectContaining({
                    stats: mockStats,
                    timestamp: expect.any(String)
                }),
                'Estatísticas de upload'
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('deve tratar erros ao obter estatísticas', async () => {
            // Setup mock request
            mockRequest.query = {
                submissionId: 'test-submission'
            };

            // Setup mock service to throw error
            const testError = new Error('Erro ao obter estatísticas');
            (uploadService.getUploadStats as jest.Mock).mockRejectedValue(testError);

            // Call the method
            await uploadController.getUploadStats(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.getUploadStats).toHaveBeenCalledWith('test-submission');
            expect(logger.error).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(testError);
        });
    });

    describe('cleanupOrphanedFiles', () => {
        test('deve limpar arquivos órfãos com sucesso', async () => {
            // Setup mock service response
            const mockCleanupResult = {
                deleted: 5,
                errors: []
            };

            (uploadService.cleanupOrphanedFiles as jest.Mock).mockResolvedValue(mockCleanupResult);

            // Call the method
            await uploadController.cleanupOrphanedFiles(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.cleanupOrphanedFiles).toHaveBeenCalled();
            expect(logger.audit).toHaveBeenCalledWith(
                'Orphaned files cleanup executed by admin',
                expect.objectContaining({
                    adminId: 'admin-id',
                    deletedCount: 5,
                    errorCount: 0
                })
            );
            expect(responses.success).toHaveBeenCalledWith(
                mockResponse,
                {
                    deleted: 5,
                    errors: [],
                    summary: '5 arquivos órfãos removidos'
                },
                'Limpeza de arquivos órfãos concluída'
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('deve tratar erros na limpeza de arquivos órfãos', async () => {
            // Setup mock service to throw error
            const testError = new Error('Erro na limpeza de arquivos');
            (uploadService.cleanupOrphanedFiles as jest.Mock).mockRejectedValue(testError);

            // Call the method
            await uploadController.cleanupOrphanedFiles(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.cleanupOrphanedFiles).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(testError);
        });
    });

    describe('generateDownloadUrl', () => {
        test('deve gerar URL de download', async () => {
            // Setup mock request
            mockRequest.params = {
                fileId: 'test-id'
            };
            mockRequest.query = {
                expires: '120'
            };

            // Setup mock service responses
            const mockFile: FileUpload = {
                id: 'test-id',
                submissionId: 'test-submission',
                originalName: 'test.pdf',
                cloudinaryPublicId: 'test-public-id',
                url: 'http://test-url.com',
                secureUrl: 'https://test-url.com',
                format: 'pdf',
                resourceType: 'document',
                size: 1024,
                tags: ['test'],
                metadata: {},
                uploadedAt: new Date(),
                uploadedBy: 'test@example.com'
            };

            (uploadService.getFileById as jest.Mock).mockResolvedValue(mockFile);
            (uploadService.generateSignedUrl as jest.Mock).mockReturnValue('https://signed-download-url.com');

            // Call the method
            await uploadController.generateDownloadUrl(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.getFileById).toHaveBeenCalledWith('test-id');
            expect(uploadService.generateSignedUrl).toHaveBeenCalledWith(
                'test-public-id',
                'raw',
                120
            );
            expect(responses.success).toHaveBeenCalledWith(
                mockResponse,
                {
                    downloadUrl: 'https://signed-download-url.com',
                    expiresIn: 120,
                    file: {
                        id: 'test-id',
                        originalName: 'test.pdf',
                        size: 1024,
                        format: 'pdf'
                    }
                },
                'URL de download gerada'
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('deve tratar arquivo não encontrado', async () => {
            // Setup mock request
            mockRequest.params = {
                fileId: 'nonexistent-id'
            };

            // Setup mock service to return null (file not found)
            (uploadService.getFileById as jest.Mock).mockResolvedValue(null);

            // Call the method
            await uploadController.generateDownloadUrl(mockRequest as any, mockResponse as any, mockNext);

            // Assertions
            expect(uploadService.getFileById).toHaveBeenCalledWith('nonexistent-id');
            expect(uploadService.generateSignedUrl).not.toHaveBeenCalled();
            expect(responses.notFound).toHaveBeenCalledWith(
                mockResponse,
                'Arquivo não encontrado'
            );
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});
