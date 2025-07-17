export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  secure: boolean;
}

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: CloudinaryTransformation[];
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  quality?: string | number;
  width?: number;
  height?: number;
  crop?: 'scale' | 'fit' | 'fill' | 'pad' | 'crop';
  tags?: string[];
  context?: Record<string, string>;
  metadata?: Record<string, any>;
  overwrite?: boolean;
  allowedFormats?: string[];
}

export interface CloudinaryTransformation {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string | number;
  format?: string;
  gravity?: string;
  effect?: string;
  overlay?: string;
  background?: string;
}

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  width?: number;
  height?: number;
  bytes: number;
  signature: string;
  version: number;
  versionId: string;
  tags: string[];
  context?: Record<string, string>;
  metadata?: Record<string, any>;
  createdAt: string;
  etag: string;
}

export interface FileUpload {
  id: string;
  submissionId: string;
  originalName: string;
  cloudinaryPublicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: 'image' | 'document';
  size: number;
  width?: number;
  height?: number;
  tags: string;
  metadata: Record<string, any>;
  uploadedAt: Date;
  uploadedBy: string; // email do autor
}

export interface ImageOptimization {
  thumbnail: string; // 150x150
  small: string;     // 300x300
  medium: string;    // 600x600
  large: string;     // 1200x1200
  original: string;
}

export interface DocumentPreview {
  thumbnail: string;
  preview: string;   // Preview de primeira página para PDFs
  downloadUrl: string;
}

export interface UploadValidation {
  isValid: boolean;
  errors: string[];
  fileType: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface BulkUploadResult {
  successful: FileUpload[];
  failed: Array<{
    filename: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface UploadStats {
  totalUploads: number;
  totalSize: number;
  byType: Record<string, number>;
  byFormat: Record<string, number>;
  recentUploads: FileUpload[];
  storageUsed: {
    images: number;
    documents: number;
    total: number;
  };
}
