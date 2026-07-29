import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import * as path from 'path';
import config from '../config/services';
import constants from '../utils/constants';
import { InvalidFileTypeException } from '../utils/exceptions';

cloudinary.config({
    cloud_name: config.storage.cloudName,
    api_key: config.storage.apiKey,
    api_secret: config.storage.apiSecret,
    secure: config.storage.secure
});

export interface SubmissionMediaUploadResult {
    url: string;
    resourceType: 'image' | 'video';
}

class MediaService {
    /**
     * Uploads the single image/video attached to an article submission to Cloudinary.
     * Nothing is persisted to the database here — the resulting URL is stored by the
     * caller on the submission record itself (submissions.media_url).
     */
    public async uploadSubmissionMedia(fileBuffer: Buffer, filename: string): Promise<SubmissionMediaUploadResult> {
        const resourceType = this.determineResourceType(filename);

        const sizeLimit = resourceType === 'video'
            ? constants.LIMITS.VIDEO_SIZE_MAX
            : constants.LIMITS.FILE_SIZE_MAX;

        if (fileBuffer.length === 0) {
            throw new InvalidFileTypeException('Arquivo vazio', [filename]);
        }

        if (fileBuffer.length > sizeLimit) {
            throw new InvalidFileTypeException(
                `Arquivo muito grande. Máximo: ${sizeLimit / 1024 / 1024}MB`,
                [filename]
            );
        }

        const uploadResult = await this.performCloudinaryUpload(fileBuffer, resourceType);

        return {
            url: uploadResult.secure_url || uploadResult.url,
            resourceType
        };
    }

    private determineResourceType(filename: string): 'image' | 'video' {
        const extension = path.extname(filename).toLowerCase().substring(1);

        if (constants.ALLOWED_IMAGE_TYPES.includes(extension)) {
            return 'image';
        }

        if (constants.ALLOWED_VIDEO_TYPES.includes(extension)) {
            return 'video';
        }

        throw new InvalidFileTypeException(
            `Formato não permitido. Permitidos: ${[...constants.ALLOWED_IMAGE_TYPES, ...constants.ALLOWED_VIDEO_TYPES].join(', ')}`,
            [extension]
        );
    }

    private performCloudinaryUpload(fileBuffer: Buffer, resourceType: 'image' | 'video'): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'submissions/media',
                    resource_type: resourceType,
                    overwrite: false
                },
                (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                    if (error) {
                        reject(new Error(`Cloudinary upload failed: ${error.message}`));
                    } else if (result) {
                        resolve(result);
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
}

export default new MediaService();
