jest.mock('express-validator', () => ({ validationResult: jest.fn() }));
import { validationResult } from 'express-validator';
import uploadController from '../../controllers/upload';
import uploadService from '../../services/upload';
import responses from '../../utils/responses';
import logger from '../../middleware/logging';

describe('UploadController', () => {
    let req: any;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            file: undefined,
            files: undefined,
            body: {},
            params: {},
            query: {},
            authorEmail: 'author@example.com',
            ip: '127.0.0.1'
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
        next = jest.fn();

        (responses as any).badRequest = jest.fn();
        (responses as any).created = jest.fn();
        (responses as any).success = jest.fn();
        (responses as any).notFound = jest.fn();

        (validationResult as unknown as jest.Mock).mockReturnValue({ isEmpty: () => true, array: () => [] });
    });

    test('uploadImage returns badRequest when no file uploaded', async () => {
        await uploadController.uploadImage(req, res, next);

        expect((responses as any).badRequest).toHaveBeenCalledWith(res, 'Nenhum arquivo enviado');
    });

    test('uploadImage returns badRequest when authorEmail missing', async () => {
        req.file = { buffer: Buffer.from('data'), originalname: 'img.jpg' };
        req.authorEmail = undefined;

        await uploadController.uploadImage(req, res, next);

        expect((responses as any).badRequest).toHaveBeenCalledWith(res, 'Email do autor é obrigatório');
    });

    test('uploadImage calls service and responds created', async () => {
        req.file = { buffer: Buffer.from('data'), originalname: 'img.jpg' };
        req.body = { submissionId: 's1' };
        (uploadService as any).uploadImage = jest.fn().mockResolvedValue({ id: 'file-1', originalName: 'img.jpg', metadata: { optimizations: {} } });

        await uploadController.uploadImage(req, res, next);

        expect((uploadService as any).uploadImage).toHaveBeenCalled();
        expect((responses as any).created).toHaveBeenCalledWith(res, expect.objectContaining({ file: expect.any(Object) }), 'Imagem enviada com sucesso');
    });

    test('uploadMultipleFiles responds success with partial failure', async () => {
        req.files = [
            { buffer: Buffer.from('data'), originalname: 'img.jpg' },
            { buffer: Buffer.from('data'), originalname: 'doc.pdf' }
        ];
        req.body = { submissionId: 's1' };
        (uploadService as any).uploadMultipleFiles = jest.fn().mockResolvedValue({ summary: { total: 2, successful: 1, failed: 1 }, successful: ['x'], failed: [{ filename: 'doc.pdf', error: 'bad' }] });

        await uploadController.uploadMultipleFiles(req, res, next);

        expect((responses as any).success).toHaveBeenCalledWith(res, expect.any(Object), '1 arquivos enviados com sucesso, 1 falharam');
    });

    test('deleteFile returns badRequest when authorEmail missing', async () => {
        req.params.fileId = 'file-1';
        req.authorEmail = undefined;

        await uploadController.deleteFile(req, res, next);

        expect((responses as any).badRequest).toHaveBeenCalledWith(res, 'Email do autor é obrigatório');
    });

    test('deleteFile responds success when deleted', async () => {
        req.params.fileId = 'file-1';
        req.authorEmail = 'author@example.com';
        (uploadService as any).deleteFile = jest.fn().mockResolvedValue(true);

        await uploadController.deleteFile(req, res, next);

        expect((responses as any).success).toHaveBeenCalledWith(res, { deleted: true }, 'Arquivo deletado com sucesso');
    });

    test('generateDownloadUrl returns badRequest for invalid fileId', async () => {
        req.params.fileId = 'invalid-id';

        await uploadController.generateDownloadUrl(req, res, next);

        expect((responses as any).badRequest).toHaveBeenCalledWith(res, 'ID do arquivo inválido');
    });

    test('generateDownloadUrl returns notFound when file missing', async () => {
        req.params.fileId = '11111111-1111-4111-8111-111111111111';
        (uploadService as any).getFileById = jest.fn().mockResolvedValue(null);

        await uploadController.generateDownloadUrl(req, res, next);

        expect((responses as any).notFound).toHaveBeenCalledWith(res, 'Arquivo não encontrado');
    });

    test('getUploadStats returns success with stats', async () => {
        req.query.submissionId = 's1';
        (uploadService as any).getUploadStats = jest.fn().mockResolvedValue({ totalUploads: 1, totalSize: 100, byType: {}, byFormat: {}, recentUploads: [], storageUsed: { images: 0, documents: 0, total: 0 } });

        await uploadController.getUploadStats(req, res, next);

        expect((responses as any).success).toHaveBeenCalledWith(res, expect.objectContaining({ stats: expect.any(Object) }), 'Estatísticas de upload');
    });
});
