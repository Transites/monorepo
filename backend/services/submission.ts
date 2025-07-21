// @ts-nocheck
import db from '../database/client';
import tokenService from './tokens';
import emailService from './email';
import constants from '../utils/constants';
import { generateSlug } from '../utils/url';
import {
    ValidationException,
    SubmissionNotFoundException,
    InvalidStatusException,
    IncompleteSubmissionException,
    AttachmentLimitException,
    AttachmentNotFoundException,
    TokenExpiredException,
    InvalidTokenException,
    DatabaseException
} from '../utils/exceptions';

import untypedLogger from '../middleware/logging';
import { LoggerWithAudit } from "../types/migration";

const logger = untypedLogger as unknown as LoggerWithAudit;

export interface SubmissionSummary {
    id: string;
    title: string;
    status: string;
    category: string;
    created_at: Date;
    updated_at: Date;
    expires_at: Date;
    feedback_count: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface AuthorSubmissionsResult {
    submissions: SubmissionSummary[];
    pagination: PaginationInfo;
}

interface SubmissionData {
    author_name: string;
    author_email: string;
    author_institution?: string;
    title: string;
    summary?: string;
    content?: string;
    keywords?: string[];
    category?: string;
    metadata?: Record<string, any>;
}

interface AttachmentData {
    filename: string;
    url: string;
    file_type: string;
    size: number;
    metadata?: Record<string, any>;
}

interface VersionData {
    title: string;
    summary?: string;
    content: string;
    metadata?: Record<string, any>;
    change_summary?: string;
    created_by?: string;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

interface CompletenessResult {
    isComplete: boolean;
    missingFields: string[];
    completenessPercentage: number;
    completedFields: number;
    totalFields: number;
}

class SubmissionService {
    private allowedCategories: string[];
    private maxKeywords: number;
    private maxAttachments: number;

    constructor() {
        this.allowedCategories = constants.CATEGORIES;
        this.maxKeywords = constants.LIMITS.KEYWORDS_MAX;
        this.maxAttachments = 5;
    }

    /**
     * Criar nova submissão
     */
    async createSubmission(submissionData: SubmissionData): Promise<any> {
        try {
            // Validar dados básicos
            const validation = this.validateSubmissionData(submissionData);
            if (!validation.isValid) {
                throw new ValidationException('Dados inválidos', validation.errors);
            }

            // Iniciar transação
            return await db.transaction(async (client: any) => {
                // Criar submissão
                const submission = await client.query(`
                    INSERT INTO submissions (token, author_name, author_email, author_institution,
                                             title, summary, content, keywords, category, metadata)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *
                `, [
                    await tokenService.generateSecureToken(),
                    submissionData.author_name,
                    submissionData.author_email,
                    submissionData.author_institution || null,
                    submissionData.title,
                    submissionData.summary || null,
                    submissionData.content || '',
                    submissionData.keywords || [],
                    submissionData.category || null,
                    submissionData.metadata || {}
                ]);

                const newSubmission = submission.rows[0];

                // Criar primeira versão
                await this.createVersionSnapshot(newSubmission.id, {
                    title: newSubmission.title,
                    summary: newSubmission.summary,
                    content: newSubmission.content,
                    metadata: newSubmission.metadata,
                    change_summary: 'Versão inicial'
                }, client);

                // Enviar email com token (async - não bloqueia)
                setImmediate(async () => {
                    try {
                        await emailService.sendSubmissionToken(
                            newSubmission.author_email,
                            newSubmission,
                            newSubmission.token
                        );
                    } catch (emailError: any) {
                        logger.error('Failed to send submission token email', {
                            submissionId: newSubmission.id,
                            error: emailError?.message
                        });
                    }
                });

                logger.audit('Submission created', {
                    submissionId: newSubmission.id,
                    authorEmail: newSubmission.author_email,
                    title: newSubmission.title,
                    category: newSubmission.category
                });

                return newSubmission;
            });

        } catch (error: any) {
            logger.error('Error creating submission', {
                authorEmail: submissionData.author_email,
                title: submissionData.title,
                error: error?.message
            });

            if (error instanceof ValidationException) {
                throw error;
            }

            throw new DatabaseException('Erro ao criar submissão', error);
        }
    }

    /**
     * Buscar submissão por token
     */
    async getSubmissionByToken(token: string, includeVersions = false): Promise<any> {
        try {
            // Validar token
            const tokenValidation = await tokenService.validateToken(token);
            if (!tokenValidation.isValid) {
                if (tokenValidation.reason === 'TOKEN_EXPIRED') {
                    throw new TokenExpiredException('Token expirado', true);
                }
                throw new InvalidTokenException('Token inválido');
            }

            const submission = tokenValidation.submission;

            if (!submission) {
                throw new SubmissionNotFoundException('Submissão não encontrada para este token');
            }

            // Buscar anexos
            const attachments = await db.query(
                'SELECT id, filename, url, file_type, size FROM submission_attachments WHERE submission_id = $1',
                [submission.id]
            );

            // Buscar versões se solicitado
            let versions = [];
            if (includeVersions) {
                const versionsResult = await db.query(
                    'SELECT * FROM submission_versions WHERE submission_id = $1 ORDER BY version_number DESC',
                    [submission.id]
                );
                versions = versionsResult.rows;
            }

            // Buscar feedback mais recente
            const feedback = await db.query(`
                SELECT f.*, a.name as admin_name
                FROM feedback f
                         JOIN admins a ON f.admin_id = a.id
                WHERE f.submission_id = $1
                ORDER BY f.created_at DESC
            `, [submission.id]);

            const result = {
                found: true,
                submission: {
                    ...submission,
                    attachments: attachments.rows,
                    feedback: feedback.rows,
                    versions: versions
                },
                tokenInfo: tokenValidation.tokenInfo
            };

            logger.audit('Submission accessed by token', {
                submissionId: submission.id,
                token: token.substring(0, 8) + '...',
                authorEmail: submission.author_email
            });

            return result;

        } catch (error: any) {
            logger.error('Error getting submission by token', {
                token: token?.substring(0, 8) + '...',
                error: error?.message
            });

            if (error instanceof TokenExpiredException || error instanceof InvalidTokenException) {
                throw error;
            }

            throw new DatabaseException('Erro ao buscar submissão', error);
        }
    }

    /**
     * Atualizar submissão
     */
    async updateSubmission(submissionId: string, updateData: Partial<SubmissionData>, authorEmail: string): Promise<any> {
        try {
            // Buscar submissão atual
            const currentSubmission = await db.findById('submissions', submissionId);
            if (!currentSubmission) {
                throw new SubmissionNotFoundException();
            }

            // Verificar se pode ser editada
            const editableStatuses = [
                constants.SUBMISSION_STATUS.DRAFT,
                constants.SUBMISSION_STATUS.CHANGES_REQUESTED
            ];

            if (!editableStatuses.includes(currentSubmission.status)) {
                throw new InvalidStatusException(
                    `Submissão não pode ser editada no status: ${currentSubmission.status}`,
                    currentSubmission.status,
                    editableStatuses
                );
            }

            // Validar dados de atualização
            const validation = this.validateSubmissionData(updateData as SubmissionData, false);
            if (!validation.isValid) {
                throw new ValidationException('Dados inválidos', validation.errors);
            }

            // Verificar se há mudanças significativas
            const hasSignificantChanges = this.hasSignificantChanges(currentSubmission, updateData);

            return await db.transaction(async (client: any) => {
                // Preparar dados para atualização
                const updateFields: string[] = [];
                const updateValues: any[] = [];
                let paramCount = 1;

                // Campos que podem ser atualizados
                const updatableFields = [
                    'title', 'summary', 'content', 'keywords',
                    'category', 'author_institution', 'metadata'
                ];

                updatableFields.forEach(field => {
                    if (updateData[field as keyof typeof updateData] !== undefined) {
                        // check if the updated data is different from the current data
                        const currentData = currentSubmission[field as keyof typeof currentSubmission];
                        const newData = updateData[field as keyof typeof updateData];
                        if (JSON.stringify(currentData) === JSON.stringify(newData)) {
                            return; // Skip if no change
                        }
                        updateFields.push(`${field} = $${paramCount}`);
                        updateValues.push(updateData[field as keyof typeof updateData]);
                        paramCount++;
                    }
                });

                if (updateFields.length === 0) {
                    return currentSubmission; // Nenhuma mudança
                }

                // Adicionar timestamp de atualização
                updateFields.push(`updated_at = $${paramCount}`);
                updateValues.push(new Date());
                paramCount++;

                // ID da submissão
                updateValues.push(submissionId);

                // Executar atualização
                const result = await client.query(`
                    UPDATE submissions
                    SET ${updateFields.join(', ')}
                    WHERE id = $${paramCount}
                    RETURNING *
                `, updateValues);

                const updatedSubmission = result.rows[0];

                // Criar nova versão se houve mudanças significativas
                if (hasSignificantChanges) {
                    await this.createVersionSnapshot(submissionId, {
                        title: updatedSubmission.title,
                        summary: updatedSubmission.summary,
                        content: updatedSubmission.content,
                        metadata: updatedSubmission.metadata,
                        change_summary: 'Atualização pelo autor'
                    }, client);
                }

                logger.audit('Submission updated', {
                    submissionId,
                    authorEmail,
                    hasSignificantChanges,
                    fieldsUpdated: Object.keys(updateData)
                });

                return updatedSubmission;
            });

        } catch (error: any) {
            logger.error('Error updating submission', {
                submissionId,
                authorEmail,
                error: error?.message
            });

            if (error instanceof SubmissionNotFoundException ||
                error instanceof InvalidStatusException ||
                error instanceof ValidationException) {
                throw error;
            }

            throw new DatabaseException('Erro ao atualizar submissão', error);
        }
    }

    /**
     * Enviar submissão para revisão
     */
    async submitForReview(submissionId: string, authorEmail: string): Promise<any> {
        try {
            // Buscar submissão
            const submission = await db.findById('submissions', submissionId);
            if (!submission) {
                throw new SubmissionNotFoundException();
            }

            // Verificar se está em status válido para envio
            const validStatuses = [
                constants.SUBMISSION_STATUS.DRAFT,
                constants.SUBMISSION_STATUS.CHANGES_REQUESTED
            ];

            if (!validStatuses.includes(submission.status)) {
                throw new InvalidStatusException(
                    `Submissão não pode ser enviada no status: ${submission.status}`,
                    submission.status,
                    validStatuses
                );
            }

            // Validar se submissão está completa
            const completeness = this.validateCompleteness(submission);
            if (!completeness.isComplete) {
                throw new IncompleteSubmissionException(
                    'Submissão incompleta',
                    completeness.missingFields
                );
            }

            return await db.transaction(async (client: any) => {
                // Atualizar status e timestamp
                const result = await client.query(`
                    UPDATE submissions
                    SET status       = $1,
                        submitted_at = $2,
                        updated_at   = $2
                    WHERE id = $3
                    RETURNING *
                `, [
                    constants.SUBMISSION_STATUS.UNDER_REVIEW,
                    new Date(),
                    submissionId
                ]);

                const updatedSubmission = result.rows[0];

                // Renovar token automaticamente (30 dias adicionais)
                await tokenService.renewToken(submissionId, 30);

                // Criar snapshot da versão submetida
                await this.createVersionSnapshot(submissionId, {
                    title: updatedSubmission.title,
                    summary: updatedSubmission.summary,
                    content: updatedSubmission.content,
                    metadata: updatedSubmission.metadata,
                    change_summary: 'Versão submetida para revisão'
                }, client);

                // Buscar emails dos admins
                // Expected adminsResult = { rows: [{ email: string }] }
                // TODO: create type for Rows, something like Rows<{ email: string }> and Rows<T>.
                const adminsResult = await client.query(
                    'SELECT email FROM admins WHERE is_active = true'
                );
                const adminEmails = adminsResult.rows.map((admin: { email: any; }) => admin.email);

                // Notificar admins (async - não bloqueia)
                setImmediate(async () => {
                    try {
                        await emailService.notifyAdminNewSubmission(updatedSubmission, adminEmails);
                    } catch (emailError: any) {
                        logger.error('Failed to notify admins about new submission', {
                            submissionId,
                            error: emailError?.message
                        });
                    }
                });

                logger.audit('Submission submitted for review', {
                    submissionId,
                    authorEmail,
                    previousStatus: submission.status,
                    adminEmails: adminEmails.length
                });

                return updatedSubmission;
            });

        } catch (error: any) {
            logger.error('Error submitting for review', {
                submissionId,
                authorEmail,
                error: error?.message
            });

            if (error instanceof SubmissionNotFoundException ||
                error instanceof InvalidStatusException ||
                error instanceof IncompleteSubmissionException) {
                throw error;
            }

            throw new DatabaseException('Erro ao enviar submissão para revisão', error);
        }
    }

    /**
     * Adicionar anexo à submissão
     */
    async addAttachment(submissionId: string, attachmentData: AttachmentData): Promise<any> {
        try {
            // Verificar limite de anexos
            const existingAttachments = await db.query(
                'SELECT COUNT(*) FROM submission_attachments WHERE submission_id = $1',
                [submissionId]
            );

            const currentCount = parseInt(existingAttachments.rows[0].count);
            if (currentCount >= this.maxAttachments) {
                throw new AttachmentLimitException(
                    `Máximo de ${this.maxAttachments} anexos permitidos`,
                    this.maxAttachments
                );
            }

            // Inserir anexo
            const result = await db.query(`
                INSERT INTO submission_attachments (submission_id, filename, url, file_type, size, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [
                submissionId,
                attachmentData.filename,
                attachmentData.url,
                attachmentData.file_type,
                attachmentData.size,
                attachmentData.metadata || {}
            ]);

            const attachment = result.rows[0];

            logger.audit('Attachment added to submission', {
                submissionId,
                attachmentId: attachment.id,
                filename: attachment.filename,
                fileType: attachment.file_type,
                size: attachment.size
            });

            return attachment;

        } catch (error: any) {
            logger.error('Error adding attachment', {
                submissionId,
                filename: attachmentData.filename,
                error: error?.message
            });

            if (error instanceof AttachmentLimitException) {
                throw error;
            }

            throw new DatabaseException('Erro ao adicionar anexo', error);
        }
    }

    /**
     * Remover anexo da submissão
     */
    async removeAttachment(submissionId: string, attachmentId: string): Promise<any> {
        try {
            // Verificar se anexo pertence à submissão
            const attachment = await db.query(
                'SELECT * FROM submission_attachments WHERE id = $1 AND submission_id = $2',
                [attachmentId, submissionId]
            );

            if (attachment.rows.length === 0) {
                throw new AttachmentNotFoundException();
            }

            // Remover do banco
            await db.query(
                'DELETE FROM submission_attachments WHERE id = $1',
                [attachmentId]
            );

            logger.audit('Attachment removed from submission', {
                submissionId,
                attachmentId,
                filename: attachment.rows[0].filename
            });

            return { success: true, removedAttachment: attachment.rows[0] };

        } catch (error: any) {
            logger.error('Error removing attachment', {
                submissionId,
                attachmentId,
                error: error?.message
            });

            if (error instanceof AttachmentNotFoundException) {
                throw error;
            }

            throw new DatabaseException('Erro ao remover anexo', error);
        }
    }

    /**
     * Obter estatísticas da submissão
     */
    async getSubmissionStats(submissionId: string): Promise<any> {
        try {
            const stats = await db.query(`
                SELECT s.*,
                       (SELECT COUNT(*) FROM submission_versions WHERE submission_id = s.id)    as version_count,
                       (SELECT COUNT(*) FROM submission_attachments WHERE submission_id = s.id) as attachment_count,
                       (SELECT COUNT(*) FROM feedback WHERE submission_id = s.id)               as feedback_count,
                       EXTRACT(days FROM NOW() - s.created_at)                                  as days_since_creation,
                       EXTRACT(days FROM s.expires_at - NOW())                                  as days_to_expiry
                FROM submissions s
                WHERE s.id = $1
            `, [submissionId]);

            if (stats.rows.length === 0) {
                throw new SubmissionNotFoundException();
            }

            const submission = stats.rows[0];

            // Calcular estatísticas de conteúdo
            const contentStats = {
                titleLength: submission.title?.length || 0,
                summaryLength: submission.summary?.length || 0,
                contentLength: submission.content?.length || 0,
                keywordCount: submission.keywords?.length || 0,
                hasCategory: !!submission.category,
                hasInstitution: !!submission.author_institution
            };

            // Calcular completude
            const completeness = this.validateCompleteness(submission);

            return {
                ...submission,
                contentStats,
                completeness: {
                    percentage: completeness.completenessPercentage,
                    missingFields: completeness.missingFields,
                    isComplete: completeness.isComplete
                }
            };

        } catch (error: any) {
            logger.error('Error getting submission stats', {
                submissionId,
                error: error?.message
            });

            if (error instanceof SubmissionNotFoundException) {
                throw error;
            }

            throw new DatabaseException('Erro ao obter estatísticas', error);
        }
    }

    /**
     * Gerar preview da submissão
     */
    async generatePreview(submissionId: string): Promise<any> {
        try {
            const submission = await db.findById('submissions', submissionId);
            if (!submission) {
                throw new SubmissionNotFoundException();
            }

            // Buscar anexos
            const attachments = await db.query(
                'SELECT filename, url, file_type FROM submission_attachments WHERE submission_id = $1',
                [submissionId]
            );

            // Gerar slug baseado no título
            const slug = generateSlug(submission.title);

            // Processar conteúdo para preview
            const processedContent = this.processContentForPreview(submission.content);

            return {
                title: submission.title,
                slug,
                summary: submission.summary,
                content: processedContent,
                author: {
                    name: submission.author_name,
                    institution: submission.author_institution
                },
                category: submission.category,
                keywords: submission.keywords,
                attachments: attachments.rows,
                metadata: submission.metadata,
                previewGeneratedAt: new Date()
            };

        } catch (error: any) {
            logger.error('Error generating preview', {
                submissionId,
                error: error?.message
            });

            if (error instanceof SubmissionNotFoundException) {
                throw error;
            }

            throw new DatabaseException('Erro ao gerar preview', error);
        }
    }

    /**
     * Buscar submissões por autor (para dashboard do autor)
     */
    async getSubmissionsByAuthor(authorEmail: string, pagination = {
        page: 1,
        limit: 10
    }): Promise<AuthorSubmissionsResult> {
        try {
            const offset = (pagination.page - 1) * pagination.limit;

            const result = await db.query(`
                SELECT id,
                       title,
                       status,
                       category,
                       created_at,
                       updated_at,
                       expires_at,
                       (SELECT COUNT(*) FROM feedback WHERE submission_id = s.id) as feedback_count
                FROM submissions s
                WHERE author_email = $1
                ORDER BY updated_at DESC
                LIMIT $2 OFFSET $3
            `, [authorEmail, pagination.limit, offset]);

            const totalResult = await db.query(
                'SELECT COUNT(*) FROM submissions WHERE author_email = $1',
                [authorEmail]
            );

            const total = parseInt(totalResult.rows[0].count);
            const totalPages = Math.ceil(total / pagination.limit);

            const submissions = result.rows as SubmissionSummary[];

            return {
                submissions,
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total,
                    totalPages,
                    hasNext: pagination.page < totalPages,
                    hasPrev: pagination.page > 1
                }
            };

        } catch (error: any) {
            logger.error('Error getting submissions by author', {
                authorEmail,
                pagination,
                error: error?.message
            });
            throw error;
        }
    }

    /**
     * Criar snapshot de versão
     */
    async createVersionSnapshot(submissionId: string, versionData: VersionData, client: any = null): Promise<any> {
        const dbClient = client || db;

        try {
            // Buscar próximo número de versão
            const versionResult = await dbClient.query(
                'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM submission_versions WHERE submission_id = $1',
                [submissionId]
            );

            const nextVersion = versionResult.rows[0].next_version;

            // Inserir nova versão
            const result = await dbClient.query(`
                INSERT INTO submission_versions (submission_id, version_number, title, summary, content,
                                                 metadata, created_by, change_summary)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [
                submissionId,
                nextVersion,
                versionData.title,
                versionData.summary,
                versionData.content,
                versionData.metadata || {},
                versionData.created_by || 'system',
                versionData.change_summary || 'Versão automática'
            ]);

            return result.rows[0];

        } catch (error: any) {
            logger.error('Error creating version snapshot', {
                submissionId,
                error: error?.message
            });
            throw error;
        }
    }

    /**
     * Validar dados da submissão
     */
    validateSubmissionData(data: SubmissionData, requireAll = true): ValidationResult {
        const errors: string[] = [];

        // Campos obrigatórios
        if (requireAll) {
            if (!data.author_name || data.author_name.trim().length < 2) {
                errors.push('Nome do autor deve ter pelo menos 2 caracteres');
            }

            if (!data.author_email || !this.isValidEmail(data.author_email)) {
                errors.push('Email do autor é obrigatório e deve ser válido');
            }

            if (!data.title || data.title.trim().length < 5) {
                errors.push('Título deve ter pelo menos 5 caracteres');
            }
        }

        // Validações condicionais
        if (data.title && data.title.length > constants.LIMITS.TITLE_MAX) {
            errors.push(`Título muito longo (máx. ${constants.LIMITS.TITLE_MAX} caracteres)`);
        }

        if (data.summary && data.summary.length > constants.LIMITS.SUMMARY_MAX) {
            errors.push(`Resumo muito longo (máx. ${constants.LIMITS.SUMMARY_MAX} caracteres)`);
        }

        if (data.content && data.content.length > constants.LIMITS.CONTENT_MAX) {
            errors.push(`Conteúdo muito longo (máx. ${constants.LIMITS.CONTENT_MAX} caracteres)`);
        }

        if (data.keywords && (!Array.isArray(data.keywords) || data.keywords.length > this.maxKeywords)) {
            errors.push(`Máximo ${this.maxKeywords} palavras-chave permitidas`);
        }

        if (data.category && !this.allowedCategories.includes(data.category)) {
            errors.push(`Categoria inválida. Permitidas: ${this.allowedCategories.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validar completude da submissão
     */
    validateCompleteness(submission: any): CompletenessResult {
        const requiredFields = [
            { field: 'title', min: 5 },
            { field: 'summary', min: 50 },
            { field: 'content', min: 100 },
            { field: 'category', min: 1 },
            { field: 'keywords', min: 1, isArray: true }
        ];

        const missingFields: string[] = [];
        let completedFields = 0;

        requiredFields.forEach(({ field, min, isArray }) => {
            const value = submission[field];

            if (isArray) {
                if (!value || !Array.isArray(value) || value.length < min) {
                    missingFields.push(field);
                } else {
                    completedFields++;
                }
            } else {
                if (!value || value.toString().trim().length < min) {
                    missingFields.push(field);
                } else {
                    completedFields++;
                }
            }
        });

        const completenessPercentage = Math.round((completedFields / requiredFields.length) * 100);

        return {
            isComplete: missingFields.length === 0,
            missingFields,
            completenessPercentage,
            completedFields,
            totalFields: requiredFields.length
        };
    }

    /**
     * Verificar se há mudanças significativas
     */
    hasSignificantChanges(current: any, updates: Partial<SubmissionData>): boolean {
        const significantFields = ['title', 'summary', 'content', 'category'];

        return significantFields.some(field => {
            if (updates[field as keyof typeof updates] === undefined) return false;
            return current[field] !== updates[field as keyof typeof updates];
        });
    }

    /**
     * Processar conteúdo para preview
     */
    processContentForPreview(content: string): string {
        if (!content) return '';

        // Limitações para preview
        const maxLength = 2000;

        // Processar markdown básico se necessário
        let processed = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/\n\n/g, '</p><p>') // Parágrafos
            .replace(/\n/g, '<br>'); // Quebras de linha

        // Adicionar tags de parágrafo
        processed = `<p>${processed}</p>`;

        // Truncar se muito longo
        if (processed.length > maxLength) {
            processed = processed.substring(0, maxLength) + '...';
        }

        return processed;
    }

    /**
     * Validar email
     */
    isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

export default new SubmissionService();
