import { Request, Response, NextFunction } from 'express';

interface User {
  id: string | number;
  email: string;
  name: string;
}

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export declare class AuthMiddleware {
  /**
   * Extrai e verifica JWT do header Authorization
   */
  verifyJWT(req: Request, res: Response, next: NextFunction): Promise<void | Response>;

  /**
   * Middleware que exige autenticação
   */
  requireAuth(req: Request, res: Response, next: NextFunction): Promise<void | Response>;

  /**
   * Middleware que torna autenticação opcional
   */
  optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Middleware para verificar se é admin específico
   */
  requireAdminEmail(allowedEmails: string | string[]): (req: Request, res: Response, next: NextFunction) => void | Response;

  /**
   * Middleware para verificar se admin é o mesmo ou superadmin
   */
  requireOwnerOrSuperAdmin(req: Request, res: Response, next: NextFunction): void | Response;

  /**
   * Rate limiting específico para autenticação
   */
  createAuthRateLimit(): any; // Returns express-rate-limit middleware

  /**
   * Middleware para logging de ações administrativas
   */
  logAdminAction(action: string): (req: Request, res: Response, next: NextFunction) => void;
}

// Export a default instance for backward compatibility with CommonJS
export const AuthMiddleware: AuthMiddleware;
