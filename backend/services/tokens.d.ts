interface Submission {
  id: string | number;
  token?: string;
  author_name: string;
  author_email: string;
  title: string;
  status: string;
  expires_at: Date | string;
  updated_at?: Date | string;
  created_at?: Date | string;
}

interface TokenValidationResult {
  isValid: boolean;
  reason?: string;
  submission?: Submission | {
    id: string | number;
    title: string;
    author_email: string;
    expires_at: Date | string;
  };
  tokenInfo?: {
    expiresAt: Date;
    daysToExpiry: number;
    isNearExpiry: boolean;
    needsRenewal: boolean;
  };
}

interface EmailValidationResult {
  isValid: boolean;
  reason: string;
  submission?: Submission;
}

interface TokenRenewalResult {
  success: boolean;
  newExpiresAt: Date;
  additionalDays: number;
}

interface TokenGenerationResult {
  token: string;
  expiresAt: Date;
  expiryDays?: number;
}

interface TokenReactivationResult {
  token: string;
  status: string;
  expiresAt: Date;
}

interface ExpiringSubmission {
  id: string | number;
  token: string;
  author_name: string;
  author_email: string;
  title: string;
  expires_at: Date | string;
  days_to_expiry: number;
}

interface TokenCleanupResult {
  expiredCount: number;
  expiredSubmissions: Array<{
    id: string | number;
    author_email: string;
    title: string;
  }>;
}

interface TokenStats {
  [status: string]: {
    total: number;
    expired: number;
    expiringSoon: number;
  };
}

export declare class TokenService {
  readonly tokenLength: number;
  readonly defaultExpiryDays: number;
  readonly warningDays: number;

  constructor();

  /**
   * Gerar token criptograficamente seguro
   */
  generateSecureToken(): string;

  /**
   * Criar novo token para submissão
   */
  createSubmissionToken(submissionId: string | number, customExpiryDays?: number | null): Promise<TokenGenerationResult>;

  /**
   * Validar token e retornar submissão
   */
  validateToken(token: string): Promise<TokenValidationResult>;

  /**
   * Verificar se email confere com o da submissão
   */
  validateAuthorEmail(submissionId: string | number, email: string): Promise<EmailValidationResult>;

  /**
   * Renovar token (extending expiry)
   */
  renewToken(submissionId: string | number, additionalDays?: number): Promise<TokenRenewalResult>;

  /**
   * Regenerar token completamente novo
   */
  regenerateToken(submissionId: string | number): Promise<TokenGenerationResult>;

  /**
   * Marcar submissão como expirada
   */
  markAsExpired(submissionId: string | number): Promise<void>;

  /**
   * Reativar submissão expirada
   */
  reactivateExpired(submissionId: string | number, newExpiryDays?: number | null): Promise<TokenReactivationResult>;

  /**
   * Buscar submissões próximas do vencimento
   */
  findExpiringSubmissions(daysAhead?: number): Promise<ExpiringSubmission[]>;

  /**
   * Cleanup automático de tokens expirados
   */
  cleanupExpiredTokens(): Promise<TokenCleanupResult>;

  /**
   * Validar formato do token
   */
  isValidTokenFormat(token: any): boolean;

  /**
   * Obter estatísticas de tokens
   */
  getTokenStats(): Promise<TokenStats>;
}

declare const tokenService: TokenService;
export default tokenService;
