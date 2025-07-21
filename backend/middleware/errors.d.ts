import { Request, Response, NextFunction } from 'express';

interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

interface CustomError extends Error {
  status?: number;
  statusCode?: number;
  details?: ValidationErrorDetail[] | any;
  code?: string;
}

export declare class ErrorHandler {
  /**
   * 404 handler
   */
  notFound(req: Request, res: Response, next: NextFunction): void;

  /**
   * General error handler
   */
  general(err: CustomError, req: Request, res: Response, next: NextFunction): void;

  /**
   * Extract validation errors from different sources
   */
  extractValidationErrors(err: CustomError): ValidationErrorDetail[] | null;

  /**
   * Async error wrapper
   */
  asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>):
    (req: Request, res: Response, next: NextFunction) => void;

  /**
   * Custom error classes
   */
  createError(message: string, statusCode?: number, details?: any): CustomError;

  /**
   * Create validation error
   */
  createValidationError(message: string, details: ValidationErrorDetail[] | any): CustomError;

  /**
   * Create unauthorized error
   */
  createUnauthorizedError(message?: string): CustomError;

  /**
   * Create forbidden error
   */
  createForbiddenError(message?: string): CustomError;

  /**
   * Create not found error
   */
  createNotFoundError(message?: string): CustomError;
}

// Export a default instance for backward compatibility with CommonJS
export const ErrorHandler: ErrorHandler;
