import uploadService from '../../services/upload';
import db from '../../database/client';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../../middleware/logging';

// Mock dependencies
jest.mock('cloudinary');
jest.mock('../../database/client');
jest.mock('../../middleware/logging', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  audit: jest.fn()
}));

describe('UploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock cloudinary methods
    (cloudinary.config as jest.Mock) = jest.fn();
    (cloudinary.uploader.upload_stream as jest.Mock) = jest.fn();
    (cloudinary.uploader.destroy as jest.Mock) = jest.fn().mockResolvedValue({ result: 'ok' });
    (cloudinary.utils.private_download_url as jest.Mock) = jest.fn().mockReturnValue('https://signed-url.com');
  });

  describe('uploadImage', () => {
    test('deve fazer upload de imagem válida', async () => {
      // Mock database query for file limit check
      (db.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT COUNT(*)')) {
          return Promise.resolve({ rows: [{ count: '2' }] }); // 2 existing files
        } else if (query.includes('INSERT INTO file_uploads')) {
          return Promise.resolve({
            rows: [{
              id: 'test-id',
              submission_id: 'test-submission',
              original_name: 'test.jpg',
              cloudinary_public_id: 'test-public-id',
              url: 'http://test-url.com',
              secure_url: 'https://test-url.com',
              format: 'jpg',
              resource_type: 'image',
              size: 1024,
              width: 100,
              height: 100,
              tags: JSON.stringify(['test']),
              metadata: JSON.stringify({}),
              uploaded_at: new Date(),
              uploaded_by: 'test@example.com'
            }]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      // Mock cloudinary upload_stream to call the callback with a successful result
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((options, callback) => {
        setTimeout(() => {
          callback(null, {
            public_id: 'test-public-id',
            url: 'http://test-url.com',
            secure_url: 'https://test-url.com',
            format: 'jpg',
            resource_type: 'image',
            width: 100,
            height: 100,
            bytes: 1024,
            signature: 'test-signature',
            version: 1,
            version_id: 'v1',
            tags: ['test'],
            created_at: '2023-01-01',
            etag: 'test-etag'
          });
        }, 0);

        // Return a mock stream
        return {
          on: jest.fn(),
          once: jest.fn(),
          emit: jest.fn(),
          pipe: jest.fn()
        };
      });

      // Call the method
      const result = await uploadService.uploadImage(
        Buffer.from('test'),
        'test.jpg',
        'test-submission',
        'test@example.com'
      );

      // Assertions
      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(result.submissionId).toBe('test-submission');
      expect(result.originalName).toBe('test.jpg');
      expect(result.cloudinaryPublicId).toBe('test-public-id');
      expect(result.resourceType).toBe('image');
      expect(logger.audit).toHaveBeenCalled();
    });

    test('deve rejeitar formato inválido', async () => {
      // Call the method with an invalid file extension
      await expect(uploadService.uploadImage(
        Buffer.from('test'),
        'test.txt', // Invalid extension for image
        'test-submission',
        'test@example.com'
      )).rejects.toThrow(/Arquivo inválido/);

      expect(logger.error).toHaveBeenCalled();
    });

    test('deve verificar limite de arquivos', async () => {
      // Mock database query to return max files count
      (db.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT COUNT(*)')) {
          return Promise.resolve({ rows: [{ count: '5' }] }); // Max files reached
        }
        return Promise.resolve({ rows: [] });
      });

      // Call the method and expect it to throw
      await expect(uploadService.uploadImage(
        Buffer.from('test'),
        'test.jpg',
        'test-submission',
        'test@example.com'
      )).rejects.toThrow(/Máximo de .* arquivos por submissão/);

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('uploadDocument', () => {
    test('deve fazer upload de documento válido', async () => {
      // Mock database query for file limit check and file insertion
      (db.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT COUNT(*)')) {
          return Promise.resolve({ rows: [{ count: '2' }] }); // 2 existing files
        } else if (query.includes('INSERT INTO file_uploads')) {
          return Promise.resolve({
            rows: [{
              id: 'test-id',
              submission_id: 'test-submission',
              original_name: 'test.pdf',
              cloudinary_public_id: 'test-public-id',
              url: 'http://test-url.com',
              secure_url: 'https://test-url.com',
              format: 'pdf',
              resource_type: 'document',
              size: 1024,
              tags: JSON.stringify(['test']),
              metadata: JSON.stringify({
                documentPreview: {
                  thumbnail: 'https://thumbnail.com',
                  preview: 'https://preview.com',
                  downloadUrl: 'https://download.com'
                }
              }),
              uploaded_at: new Date(),
              uploaded_by: 'test@example.com'
            }]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      // Mock cloudinary upload_stream to call the callback with a successful result
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((options, callback) => {
        setTimeout(() => {
          callback(null, {
            public_id: 'test-public-id',
            url: 'http://test-url.com',
            secure_url: 'https://test-url.com',
            format: 'pdf',
            resource_type: 'raw',
            bytes: 1024,
            signature: 'test-signature',
            version: 1,
            version_id: 'v1',
            tags: ['test'],
            created_at: '2023-01-01',
            etag: 'test-etag'
          });
        }, 0);

        // Return a mock stream
        return {
          on: jest.fn(),
          once: jest.fn(),
          emit: jest.fn(),
          pipe: jest.fn()
        };
      });

      // Call the method
      const result = await uploadService.uploadDocument(
        Buffer.from('test'),
        'test.pdf',
        'test-submission',
        'test@example.com'
      );

      // Assertions
      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(result.submissionId).toBe('test-submission');
      expect(result.originalName).toBe('test.pdf');
      expect(result.cloudinaryPublicId).toBe('test-public-id');
      expect(result.resourceType).toBe('document');
      expect(logger.audit).toHaveBeenCalled();
    });
  });

  describe('uploadMultipleFiles', () => {
    test('deve processar múltiplos arquivos', async () => {
      // Setup mocks for the first file (image)
      const originalUploadImage = uploadService.uploadImage;
      uploadService.uploadImage = jest.fn().mockResolvedValue({
        id: 'image-id',
        submissionId: 'test-submission',
        originalName: 'image.jpg',
        cloudinaryPublicId: 'image-public-id',
        url: 'http://image-url.com',
        secureUrl: 'https://image-url.com',
        format: 'jpg',
        resourceType: 'image',
        size: 1024,
        width: 100,
        height: 100,
        tags: ['test'],
        metadata: {},
        uploadedAt: new Date(),
        uploadedBy: 'test@example.com'
      });

      // Setup mocks for the second file (document)
      const originalUploadDocument = uploadService.uploadDocument;
      uploadService.uploadDocument = jest.fn().mockResolvedValue({
        id: 'doc-id',
        submissionId: 'test-submission',
        originalName: 'doc.pdf',
        cloudinaryPublicId: 'doc-public-id',
        url: 'http://doc-url.com',
        secureUrl: 'https://doc-url.com',
        format: 'pdf',
        resourceType: 'document',
        size: 2048,
        tags: ['test'],
        metadata: {},
        uploadedAt: new Date(),
        uploadedBy: 'test@example.com'
      });

      try {
        // Call the method
        const result = await uploadService.uploadMultipleFiles(
          [
            { buffer: Buffer.from('image'), filename: 'image.jpg' },
            { buffer: Buffer.from('document'), filename: 'doc.pdf' }
          ],
          'test-submission',
          'test@example.com'
        );

        // Assertions
        expect(result).toBeDefined();
        expect(result.successful.length).toBe(2);
        expect(result.failed.length).toBe(0);
        expect(result.summary.total).toBe(2);
        expect(result.summary.successful).toBe(2);
        expect(result.summary.failed).toBe(0);
        expect(logger.audit).toHaveBeenCalled();
      } finally {
        // Restore original methods
        uploadService.uploadImage = originalUploadImage;
        uploadService.uploadDocument = originalUploadDocument;
      }
    });

    test('deve tratar falhas individuais', async () => {
      // Setup mocks for the first file (image) - success
      const originalUploadImage = uploadService.uploadImage;
      uploadService.uploadImage = jest.fn().mockResolvedValue({
        id: 'image-id',
        submissionId: 'test-submission',
        originalName: 'image.jpg',
        cloudinaryPublicId: 'image-public-id',
        url: 'http://image-url.com',
        secureUrl: 'https://image-url.com',
        format: 'jpg',
        resourceType: 'image',
        size: 1024,
        width: 100,
        height: 100,
        tags: ['test'],
        metadata: {},
        uploadedAt: new Date(),
        uploadedBy: 'test@example.com'
      });

      // Setup mocks for the second file (document) - failure
      const originalUploadDocument = uploadService.uploadDocument;
      uploadService.uploadDocument = jest.fn().mockRejectedValue(
        new Error('Falha no upload do documento')
      );

      try {
        // Call the method
        const result = await uploadService.uploadMultipleFiles(
          [
            { buffer: Buffer.from('image'), filename: 'image.jpg' },
            { buffer: Buffer.from('document'), filename: 'doc.pdf' }
          ],
          'test-submission',
          'test@example.com'
        );

        // Assertions
        expect(result).toBeDefined();
        expect(result.successful.length).toBe(1);
        expect(result.failed.length).toBe(1);
        expect(result.summary.total).toBe(2);
        expect(result.summary.successful).toBe(1);
        expect(result.summary.failed).toBe(1);
        expect(result.failed[0].filename).toBe('doc.pdf');
        expect(result.failed[0].error).toBe('Falha no upload do documento');
        expect(logger.audit).toHaveBeenCalled();
      } finally {
        // Restore original methods
        uploadService.uploadImage = originalUploadImage;
        uploadService.uploadDocument = originalUploadDocument;
      }
    });
  });

  describe('deleteFile', () => {
    test('deve deletar arquivo próprio', async () => {
      // Mock database queries
      (db.query as jest.Mock).mockImplementation((query, params) => {
        if (query.includes('SELECT * FROM file_uploads WHERE id =')) {
          return Promise.resolve({
            rows: [{
              id: 'test-id',
              submission_id: 'test-submission',
              original_name: 'test.jpg',
              cloudinary_public_id: 'test-public-id',
              url: 'http://test-url.com',
              secure_url: 'https://test-url.com',
              format: 'jpg',
              resource_type: 'image',
              size: 1024,
              width: 100,
              height: 100,
              tags: JSON.stringify(['test']),
              metadata: JSON.stringify({}),
              uploaded_at: new Date(),
              uploaded_by: 'test@example.com'
            }]
          });
        } else if (query.includes('DELETE FROM file_uploads')) {
          return Promise.resolve({ rowCount: 1 });
        }
        return Promise.resolve({ rows: [] });
      });

      // Call the method
      const result = await uploadService.deleteFile('test-id', 'test@example.com');

      // Assertions
      expect(result).toBe(true);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test-public-id', { resource_type: 'image' });
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM file_uploads'), ['test-id']);
      expect(logger.audit).toHaveBeenCalled();
    });

    test('deve rejeitar arquivo de outro autor', async () => {
      // Mock database query to return file with different owner
      (db.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM file_uploads WHERE id =')) {
          return Promise.resolve({
            rows: [{
              id: 'test-id',
              submission_id: 'test-submission',
              original_name: 'test.jpg',
              cloudinary_public_id: 'test-public-id',
              url: 'http://test-url.com',
              secure_url: 'https://test-url.com',
              format: 'jpg',
              resource_type: 'image',
              size: 1024,
              width: 100,
              height: 100,
              tags: JSON.stringify(['test']),
              metadata: JSON.stringify({}),
              uploaded_at: new Date(),
              uploaded_by: 'owner@example.com' // Different owner
            }]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      // Call the method and expect it to throw
      await expect(uploadService.deleteFile('test-id', 'different@example.com'))
        .rejects.toThrow('Você não tem permissão para deletar este arquivo');

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('cleanupOrphanedFiles', () => {
    test('deve limpar arquivos órfãos com sucesso', async () => {
      // Mock database query to return orphaned files
      (db.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('LEFT JOIN submissions')) {
          return Promise.resolve({
            rows: [
              {
                id: 'orphan-1',
                submission_id: 'deleted-submission-1',
                original_name: 'orphan1.jpg',
                cloudinary_public_id: 'orphan-public-id-1',
                resource_type: 'image'
              },
              {
                id: 'orphan-2',
                submission_id: 'deleted-submission-2',
                original_name: 'orphan2.pdf',
                cloudinary_public_id: 'orphan-public-id-2',
                resource_type: 'raw'
              }
            ]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      // Call the method
      const result = await uploadService.cleanupOrphanedFiles();

      // Assertions
      expect(result.deleted).toBe(2);
      expect(result.errors.length).toBe(0);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(2);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('orphan-public-id-1', { resource_type: 'image' });
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('orphan-public-id-2', { resource_type: 'raw' });
      expect(logger.audit).toHaveBeenCalled();
    });

    test('deve lidar com erros durante a limpeza', async () => {
      // Mock database query to return orphaned files
      (db.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('LEFT JOIN submissions')) {
          return Promise.resolve({
            rows: [
              {
                id: 'orphan-1',
                submission_id: 'deleted-submission-1',
                original_name: 'orphan1.jpg',
                cloudinary_public_id: 'orphan-public-id-1',
                resource_type: 'image'
              },
              {
                id: 'orphan-2',
                submission_id: 'deleted-submission-2',
                original_name: 'orphan2.pdf',
                cloudinary_public_id: 'orphan-public-id-2',
                resource_type: 'raw'
              }
            ]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      // Mock cloudinary.uploader.destroy to fail for the second file
      (cloudinary.uploader.destroy as jest.Mock)
        .mockImplementationOnce(() => Promise.resolve({ result: 'ok' }))
        .mockImplementationOnce(() => Promise.reject(new Error('Cloudinary error')));

      // Call the method
      const result = await uploadService.cleanupOrphanedFiles();

      // Assertions
      expect(result.deleted).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('orphan2.pdf');
      expect(result.errors[0]).toContain('Cloudinary error');
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(2);
      expect(logger.audit).toHaveBeenCalled();
    });

    test('deve lidar com erro na consulta ao banco de dados', async () => {
      // Mock database query to throw error
      (db.query as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      // Call the method and expect it to throw
      await expect(uploadService.cleanupOrphanedFiles()).rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalled();
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });
  });

  describe('getUploadStats', () => {
    test('deve retornar estatísticas de todos os uploads', async () => {
      // Mock database queries
      (db.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('GROUP BY resource_type, format')) {
          return Promise.resolve({
            rows: [
              {
                total_uploads: '3',
                total_size: '5120',  // 5KB
                resource_type: 'image',
                format: 'jpg',
                count: '3'
              },
              {
                total_uploads: '2',
                total_size: '10240', // 10KB
                resource_type: 'document',
                format: 'pdf',
                count: '2'
              }
            ]
          });
        } else if (query.includes('ORDER BY uploaded_at DESC')) {
          return Promise.resolve({
            rows: [
              {
                id: 'file-1',
                submission_id: 'submission-1',
                original_name: 'recent1.jpg',
                cloudinary_public_id: 'recent-public-id-1',
                url: 'http://test-url1.com',
                secure_url: 'https://test-url1.com',
                format: 'jpg',
                resource_type: 'image',
                size: 1024,
                width: 100,
                height: 100,
                tags: JSON.stringify(['test']),
                metadata: JSON.stringify({}),
                uploaded_at: new Date(),
                uploaded_by: 'test@example.com'
              },
              {
                id: 'file-2',
                submission_id: 'submission-2',
                original_name: 'recent2.pdf',
                cloudinary_public_id: 'recent-public-id-2',
                url: 'http://test-url2.com',
                secure_url: 'https://test-url2.com',
                format: 'pdf',
                resource_type: 'document',
                size: 2048,
                tags: JSON.stringify(['test']),
                metadata: JSON.stringify({}),
                uploaded_at: new Date(),
                uploaded_by: 'test@example.com'
              }
            ]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      // Call the method
      const stats = await uploadService.getUploadStats();

      // Assertions
      expect(stats.totalUploads).toBe(5); // 3 + 2
      expect(stats.totalSize).toBe(15360); // 5120 + 10240
      expect(stats.byType).toEqual({
        image: 3,
        document: 2
      });
      expect(stats.byFormat).toEqual({
        jpg: 3,
        pdf: 2
      });
      expect(stats.recentUploads.length).toBe(2);
      expect(stats.recentUploads[0].id).toBe('file-1');
      expect(stats.recentUploads[1].id).toBe('file-2');
      expect(stats.storageUsed.images).toBe(5120);
      expect(stats.storageUsed.documents).toBe(10240);
      expect(stats.storageUsed.total).toBe(15360);
    });

    test('deve retornar estatísticas para uma submissão específica', async () => {
      // Mock database queries with submission filter
      (db.query as jest.Mock).mockImplementation((query, params) => {
        if (query.includes('GROUP BY resource_type, format')) {
          expect(params).toEqual(['test-submission']);
          return Promise.resolve({
            rows: [
              {
                total_uploads: '2',
                total_size: '3072',
                resource_type: 'image',
                format: 'jpg',
                count: '2'
              }
            ]
          });
        } else if (query.includes('ORDER BY uploaded_at DESC')) {
          expect(params).toEqual(['test-submission']);
          return Promise.resolve({
            rows: [
              {
                id: 'file-1',
                submission_id: 'test-submission',
                original_name: 'submission1.jpg',
                cloudinary_public_id: 'submission-public-id-1',
                url: 'http://test-url1.com',
                secure_url: 'https://test-url1.com',
                format: 'jpg',
                resource_type: 'image',
                size: 1536,
                width: 100,
                height: 100,
                tags: JSON.stringify(['test']),
                metadata: JSON.stringify({}),
                uploaded_at: new Date(),
                uploaded_by: 'test@example.com'
              }
            ]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      // Call the method with submission ID
      const stats = await uploadService.getUploadStats('test-submission');

      // Assertions
      expect(stats.totalUploads).toBe(2);
      expect(stats.totalSize).toBe(3072);
      expect(stats.byType).toEqual({ image: 2 });
      expect(stats.byFormat).toEqual({ jpg: 2 });
      expect(stats.recentUploads.length).toBe(1);
      expect(stats.recentUploads[0].submissionId).toBe('test-submission');
      expect(stats.storageUsed.images).toBe(3072);
      expect(stats.storageUsed.documents).toBe(0);
      expect(stats.storageUsed.total).toBe(3072);
    });

    test('deve lidar com erro na consulta ao banco de dados', async () => {
      // Mock database query to throw error
      (db.query as jest.Mock).mockImplementation(() => {
        throw new Error('Database stats error');
      });

      // Call the method and expect it to throw
      await expect(uploadService.getUploadStats()).rejects.toThrow('Database stats error');

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
