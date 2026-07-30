jest.resetModules();

const mockDb = { query: jest.fn() };
const mockUploader = {
    destroy: jest.fn()
};
const mockUtils = {
    private_download_url: jest.fn().mockReturnValue('https://download.url')
};

jest.doMock('../../database/client', () => mockDb);
jest.doMock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: mockUploader,
        utils: mockUtils
    }
}));
jest.doMock('../../config/services', () => ({
    storage: {
        cloudName: 'test-cloud',
        apiKey: 'key',
        apiSecret: 'secret',
        secure: true
    }
}));

const uploadService = require('../../services/upload').default;
const { InvalidFileTypeException, UnauthorizedException } = require('../../utils/exceptions');

describe('UploadService (unit)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('generateImageVariations returns optimizations including publicId', () => {
        const variations = uploadService.generateImageVariations('sub1/img_123');
        expect(variations.thumbnail).toContain('sub1/img_123');
        expect(Object.keys(variations)).toEqual(expect.arrayContaining(['thumbnail','small','medium','large','original']));
    });

    it('uploadImage throws on invalid file type', async () => {
        const buf = Buffer.from('data');
        await expect(uploadService.uploadImage(buf, 'file.txt', 's1', 'a@b.com'))
            .rejects.toThrow(InvalidFileTypeException);
    });

    it('uploadImage succeeds when cloud upload and db save work', async () => {
        const buf = Buffer.from('data');
        mockDb.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });

        uploadService.performCloudinaryUpload = jest.fn().mockResolvedValue({
            publicId: 'pub1', url: 'http://u', secureUrl: 'https://u', format: 'jpg', resourceType: 'image', width: 100, height: 100, bytes: 1024, tags: [], metadata: {}
        });
        uploadService.saveFileToDatabase = jest.fn().mockResolvedValue({
            id: 'file-1', submissionId: 's1', originalName: 'img.jpg', cloudinaryPublicId: 'pub1', url: 'http://u', secureUrl: 'https://u', format: 'jpg', resourceType: 'image', size: 1024, width: 100, height: 100, tags: [], metadata: {}, uploadedAt: new Date(), uploadedBy: 'a@b.com'
        });

        const result = await uploadService.uploadImage(buf, 'img.jpg', 's1', 'a@b.com');
        expect(result.id).toBe('file-1');
        expect(uploadService.performCloudinaryUpload).toHaveBeenCalled();
        expect(uploadService.saveFileToDatabase).toHaveBeenCalled();
    });

    it('validateFile rejects empty and invalid extension', async () => {
        const buf = Buffer.from('');
        const validation = await uploadService.validateFile(buf, 'bad.exe', 'image');
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toEqual(expect.arrayContaining([
            'Arquivo vazio',
            expect.stringContaining('Formato não permitido')
        ]));
    });

    it('determineFileType returns document for unsupported image extension', () => {
        expect(uploadService.determineFileType('file.pdf')).toBe('document');
        expect(uploadService.determineFileType('file.jpg')).toBe('image');
    });

    it('generateDocumentPreview returns preview URLs', async () => {
        const preview = await uploadService.generateDocumentPreview('submission/abc');
        expect(preview.thumbnail).toContain('submission/abc');
        expect(preview.downloadUrl).toContain('submission/abc');
    });

    it('checkSubmissionFileLimit throws when max attachments reached', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [{ count: String(require('../../utils/constants').SUBMISSION_LIMITS.MAX_ATTACHMENTS) }] });
        await expect(uploadService.checkSubmissionFileLimit('s1')).rejects.toThrow('Máximo de');
    });

    it('uploadDocument succeeds and generates preview for PDF', async () => {
        const buf = Buffer.from('data');
        mockDb.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
        uploadService.performCloudinaryUpload = jest.fn().mockResolvedValue({
            publicId: 'sub1/doc', url: 'http://u', secureUrl: 'https://u', format: 'pdf', resourceType: 'raw', width: 0, height: 0, bytes: 512, tags: [], metadata: {}
        });
        uploadService.generateDocumentPreview = jest.fn().mockResolvedValue({
            thumbnail: 'thumb', preview: 'preview', downloadUrl: 'download'
        });
        uploadService.saveFileToDatabase = jest.fn().mockResolvedValue({
            id: 'file-doc', submissionId: 's1', originalName: 'doc.pdf', cloudinaryPublicId: 'sub1/doc', url: 'http://u', secureUrl: 'https://u', format: 'pdf', resourceType: 'document', size: 512, width: 0, height: 0, tags: [], metadata: { documentPreview: { thumbnail: 'thumb' }, validation: {} }, uploadedAt: new Date(), uploadedBy: 'a@b.com'
        });

        const result = await uploadService.uploadDocument(buf, 'doc.pdf', 's1', 'a@b.com');
        expect(result.id).toBe('file-doc');
        expect(uploadService.generateDocumentPreview).toHaveBeenCalled();
    });

    it('deleteFile throws if user is not owner', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'file1', uploaded_by: 'other@example.com', cloudinary_public_id: 'cid', resource_type: 'image', original_name: 'img.jpg', submission_id: 's1' }] });
        await expect(uploadService.deleteFile('file1', 'a@b.com')).rejects.toThrow(UnauthorizedException);
    });

    it('deleteFile returns true when deletion succeeds', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'file1', uploaded_by: 'a@b.com', cloudinary_public_id: 'cid', resource_type: 'image', original_name: 'img.jpg', submission_id: 's1' }] });
        mockUploader.destroy.mockResolvedValueOnce({ result: 'ok' });
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const result = await uploadService.deleteFile('file1', 'a@b.com');
        expect(result).toBe(true);
        expect(mockUploader.destroy).toHaveBeenCalledWith('cid', { resource_type: 'image' });
    });

    it('generateSignedUrl delegates to cloudinary utils', () => {
        const url = uploadService.generateSignedUrl('sub1/file', 'raw', 30);
        expect(mockUtils.private_download_url).toHaveBeenCalledWith('sub1/file', 'raw', expect.any(Object));
        expect(url).toBe('https://download.url');
    });

    it('getUploadStats returns transformed stats', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [{ total_uploads: '1', total_size: '1024', resource_type: 'image', format: 'jpg', count: '1' }] });
        mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'file1', submission_id: 's1', original_name: 'img.jpg', cloudinary_public_id: 'cid', url: 'http://u', secure_url: 'https://u', format: 'jpg', resource_type: 'image', size: 1024, width: 100, height: 100, tags: [], metadata: '{}', uploaded_at: new Date().toISOString(), uploaded_by: 'a@b.com' }] });

        const stats = await uploadService.getUploadStats('s1');
        expect(stats.totalUploads).toBe(1);
        expect(stats.storageUsed.images).toBe(1024);
    });

    it('cleanupOrphanedFiles returns deleted count', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'file1', cloudinary_public_id: 'cid', resource_type: 'image', original_name: 'img.jpg' }] });
        mockUploader.destroy.mockResolvedValueOnce({ result: 'ok' });
        uploadService.deleteFileFromDatabase = jest.fn().mockResolvedValue(undefined);

        const result = await uploadService.cleanupOrphanedFiles();
        expect(result.deleted).toBe(1);
        expect(result.errors).toEqual([]);
    });
});
