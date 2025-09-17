// @ts-nocheck
import {
    AdminDashboard,
    SubmissionWithReview,
    SubmissionFilters,
    PaginatedSubmissions,
    AdminFeedback,
    SubmissionReview,
    BulkAction,
    BulkActionResult,
    AdminActionLog,
    PublishRequest,
    PublishResult,
    RecentActivity,
    FeedbackStatus,
    SubmissionStatus,
    Submission, ReviewStatus
} from '../types/admin';
import { generateSlug, generateArticleUrl } from '../utils/url';
import { InvalidStatusException } from "../utils/exceptions";

class AdminReviewService {
    private readonly pageSize = 20;
    private readonly maxBulkActions = 50;

    constructor(
        private readonly db: any, // Database client
        private readonly emailService: any, // Email service
        private readonly logger: any // Logger service
    ) {
    }

    /**
     * Obter dashboard completo para admin
     */
    public async getDashboard(adminId: string): Promise<AdminDashboard> {
        try {
            const [summary, recentActivity, statusCounts, categoryCounts, monthlyData, topAuthors, reviewStats] =
                await Promise.all([
                    this.getDashboardSummary(),
                    this.getRecentActivity(10),
                    this.getSubmissionsByStatus(),
                    this.getSubmissionsByCategory(),
                    this.getMonthlySubmissions(),
                    this.getTopAuthors(),
                    this.getReviewStats()
                ]);

            const dashboard: AdminDashboard = {
                summary,
                recentActivity,
                submissionsByStatus: statusCounts,
                submissionsByCategory: categoryCounts,
                submissionsByMonth: monthlyData,
                topAuthors,
                reviewStats
            };

            this.logger.audit('Admin dashboard accessed', {
                adminId,
                timestamp: new Date()
            });

            return dashboard;

        } catch (error) {
            this.logger.error('Error getting admin dashboard', {
                adminId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Listar submissões com filtros e paginação
     */
    public async getSubmissions(
        filters: SubmissionFilters = {},
        adminId?: string
    ): Promise<PaginatedSubmissions> {
        try {
            const page = filters.page || 1;
            const limit = Math.min(filters.limit || this.pageSize, 100);
            const offset = (page - 1) * limit;

            // Construir query com filtros
            const { query: submissionsQuery, params: submissionsParams } = this.buildFilterQuery(filters, limit, offset);
            const { query: countQuery, params: countParams } = this.buildCountQuery(filters);

            const [submissionsResult, countResult] = await Promise.all([
                this.db.query(submissionsQuery, submissionsParams),
                this.db.query(countQuery, countParams)
            ]);

            // Mapear resultados
            const submissions = submissionsResult.rows.map(this.mapSubmissionWithReview.bind(this));
            const totalItems = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalItems / limit);

            const result: PaginatedSubmissions = {
                submissions,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems,
                    itemsPerPage: limit,
                    hasNext: page < totalPages,
                    hasPrevious: page > 1
                },
                filters
            };

            this.logger.audit('Admin submissions list accessed', {
                adminId,
                filters,
                resultCount: submissions.length,
                totalItems
            });

            return result;

        } catch (error) {
            this.logger.error('Error getting submissions for admin', {
                adminId,
                filters,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Revisar submissão (aprovar/rejeitar/solicitar mudanças)
     */
    public async reviewSubmission(
        submissionId: string,
        adminId: string,
        status: FeedbackStatus,
        notes?: string,
        rejectionReason?: string
    ): Promise<SubmissionReview> {
        try {
            // Verificar se submissão existe
            const submission = await this.getSubmissionById(submissionId);
            if (!submission) {
                throw new Error('Submissão não encontrada');
            }

            // Verificar se pode ser revisada
            if (!['DRAFT', 'UNDER_REVIEW', 'CHANGES_REQUESTED'].includes(submission.status)) {
                throw new InvalidStatusException('Submissão não pode ser revisada no status atual: ' + submission.status);
            }

            // Atualizar status da submissão
            const newStatus = this.mapReviewStatusToSubmissionStatus(status);

            const reviewQuery = `
                UPDATE submissions
                SET status           = $1,
                    reviewed_by      = $2,
                    review_notes     = $3,
                    rejection_reason = $4,
                    reviewed_at      = NOW(),
                    updated_at       = NOW()
                WHERE id = $5
                RETURNING *
            `;

            const reviewResult = await this.db.query(reviewQuery, [
                newStatus, adminId, notes, rejectionReason, submissionId
            ]);

            const updatedSubmission = reviewResult.rows[0];

            // Criar registro de review
            const reviewRecord: SubmissionReview = {
                id: crypto.randomUUID(),
                submissionId,
                adminId,
                status,
                reviewNotes: notes,
                rejectionReason,
                reviewedAt: new Date(),
                adminName: await this.getAdminName(adminId)
            };

            // Enviar notificação por email para o autor
            await this.sendReviewNotification(updatedSubmission, reviewRecord);

            // Log da ação
            await this.logAdminAction(adminId, 'review_submission', 'submission', submissionId, {
                status,
                notes,
                rejectionReason,
                previousStatus: submission.status
            });

            this.logger.audit('Submission reviewed', {
                submissionId,
                adminId,
                status,
                previousStatus: submission.status,
                hasNotes: !!notes,
                hasRejectionReason: !!rejectionReason
            });

            return reviewRecord;

        } catch (error) {
            this.logger.error('Error reviewing submission', {
                submissionId,
                adminId,
                status,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Enviar feedback para autor
     */
    public async sendFeedback(
        submissionId: string,
        adminId: string,
        content: string,
    ): Promise<AdminFeedback> {
        try {
            // Verificar se submissão existe
            const submission = await this.getSubmissionById(submissionId);
            if (!submission) {
                throw new Error('Submissão não encontrada');
            }

            // Criar feedback
            const feedbackId = crypto.randomUUID();
            const adminName = await this.getAdminName(adminId);

            const addFeedback = `
                INSERT INTO feedback (id, submission_id, admin_id, content, status, created_at)
                VALUES ($1, $2, $3, $4, 'PENDING', NOW())
            `;

            await this.db.query(addFeedback, [
                feedbackId, submissionId, adminId, content
            ]);

            const feedback: AdminFeedback = {
                id: feedbackId,
                submissionId,
                adminId,
                content,
                status: 'pending',
                createdAt: new Date(),
                adminName
            };

            // Atualizar status da submissão para "changes_requested" se não estiver
            if (submission.status !== 'CHANGES_REQUESTED') {
                await this.db.query(
                    'UPDATE submissions SET status = $1, updated_at = NOW() WHERE id = $2',
                    ['CHANGES_REQUESTED', submissionId]
                );
            }

            // Enviar email para o autor
            await this.emailService.sendFeedbackToAuthor(submission, feedback, adminName);

            // Log da ação
            await this.logAdminAction(adminId, 'send_feedback', 'feedback', feedbackId, {
                submissionId,
                contentLength: content.length,
            });

            this.logger.audit('Feedback sent to author', {
                submissionId,
                adminId,
                feedbackId,
                contentLength: content.length,
            });

            return feedback;

        } catch (error) {
            this.logger.error('Error sending feedback', {
                submissionId,
                adminId,
                contentLength: content?.length || 0,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Publicar submissão como artigo
     */
    // TODO: atualizar esse metodo para nao mexer com tabela articles e manusear a tabela submissions diretamente, apenas atualizando o status da linha.
    // TODO: deletar a tabela articles.
    public async publishSubmission(
        submissionId: string,
        adminId: string,
        publishRequest: PublishRequest
    ): Promise<PublishResult> {
        try {
            // Verificar se submissão existe e está aprovada
            const submission = await this.getSubmissionById(submissionId);
            if (!submission) {
                throw new Error('Submissão não encontrada');
            }

            if (submission.status !== 'APPROVED') {
                throw new Error('Apenas submissões aprovadas podem ser publicadas');
            }

            // Generate slug and submission URL
            const slug = generateSlug(submission.title);
            const submissionUrl = generateArticleUrl(slug);

            // Atualizar status da submissão
            await this.db.query(
                'UPDATE submissions SET status = $1, updated_at = NOW() WHERE id = $2',
                ['PUBLISHED', submissionId]
            );

            // Enviar notificação de publicação para o autor
            await this.emailService.notifyAuthorApproval(submission, submissionUrl);

            // Log da ação
            await this.logAdminAction(adminId, 'publish_submission', 'submission', {
                submissionId,
                publishNotes: publishRequest.publishNotes,
                submissionUrl
            });

            this.logger.audit('Submission published', {
                submissionId,
                adminId,
                publishedAt,
                submissionUrl
            });

            return {
                success: true,
                articleUrl: submissionUrl
            };

        } catch (error) {
            this.logger.error('Error publishing submission', {
                submissionId,
                adminId,
                publishRequest,
                error: error instanceof Error ? error.message : String(error)
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Buscar submissões (busca textual)
     */
    public async searchSubmissions(
        query: string,
        adminId: string,
        filters: Partial<SubmissionFilters> = {}
    ): Promise<SubmissionWithReview[]> {
        try {
            let paramIndex = 2;
            const conditions = [];
            const params: any[] = [query]; // Não precisa de % com to_tsquery

            if (filters.status) {
                conditions.push(`s.status = ANY($${paramIndex}::submission_status[])`);
                params.push(filters.status);
                paramIndex++;
            }

            if (filters.category) {
                conditions.push(`s.category = ANY($${paramIndex}::text[])`);
                params.push(filters.category);
                paramIndex++;
            }

            const searchQuery = `
                SELECT s.*,
                       a.name                                             as admin_name,
                       COUNT(fu.id)                                       as file_count,
                       COALESCE(SUM(fu.size), 0)                          as total_size,
                       EXTRACT(EPOCH FROM (s.expires_at - NOW())) / 86400 as days_until_expiry,
                       -- Ranking para ordenação por relevância
                       GREATEST(
                           CASE
                               WHEN to_tsvector('portuguese',
                                                title || ' ' || COALESCE(summary, '') || ' ' || COALESCE(content, ''))
                                   @@ plainto_tsquery('portuguese', $1) THEN 1
                               ELSE 0 END,
                           CASE
                               WHEN to_tsvector('portuguese', author_name || ' ' || author_email)
                                   @@ plainto_tsquery('portuguese', $1) THEN 1
                               ELSE 0 END
                       )                                                  as search_rank
                FROM submissions s
                         LEFT JOIN admins a ON s.reviewed_by = a.id
                         LEFT JOIN file_uploads fu ON s.id = fu.submission_id
                WHERE (
                          -- Usa os índices GIN para busca textual
                          to_tsvector('portuguese',
                                      title || ' ' || COALESCE(summary, '') || ' ' || COALESCE(content, ''))
                              @@ plainto_tsquery('portuguese', $1)
                              OR
                          to_tsvector('portuguese', author_name || ' ' || author_email)
                              @@ plainto_tsquery('portuguese', $1)
                          )
                    ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}
                GROUP BY s.id, a.name
                ORDER BY
                    search_rank DESC, -- Primeiro por relevância
                    s.updated_at DESC -- Depois por data
                LIMIT 50
            `;

            const result = await this.db.query(searchQuery, params);

            const submissions = result.rows.map(this.mapSubmissionWithReview.bind(this));

            this.logger.audit('Admin search performed', {
                adminId,
                query,
                filters,
                resultCount: submissions.length
            });

            return submissions;

        } catch (error) {
            this.logger.error('Error searching submissions', {
                adminId,
                query,
                filters,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Ações em lote
     */
    public async performBulkAction(
        bulkAction: BulkAction,
        adminId: string
    ): Promise<BulkActionResult> {
        try {
            if (bulkAction.submissionIds.length > this.maxBulkActions) {
                throw new Error(`Máximo de ${this.maxBulkActions} ações em lote permitidas`);
            }

            const result: BulkActionResult = {
                successful: [],
                failed: [],
                summary: {
                    total: bulkAction.submissionIds.length,
                    successful: 0,
                    failed: 0
                }
            };

            for (const submissionId of bulkAction.submissionIds) {
                try {
                    await this.performSingleBulkAction(submissionId, bulkAction, adminId);
                    result.successful.push(submissionId);
                    result.summary.successful++;
                } catch (error) {
                    result.failed.push({
                        submissionId,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    result.summary.failed++;
                }
            }

            // Log da ação em lote
            await this.logAdminAction(adminId, 'bulk_action', 'submission', 'multiple', {
                action: bulkAction.action,
                submissionIds: bulkAction.submissionIds,
                successful: result.summary.successful,
                failed: result.summary.failed,
                reason: bulkAction.reason
            });

            this.logger.audit('Bulk action performed', {
                adminId,
                action: bulkAction.action,
                total: result.summary.total,
                successful: result.summary.successful,
                failed: result.summary.failed
            });

            return result;

        } catch (error) {
            this.logger.error('Error performing bulk action', {
                adminId,
                action: bulkAction.action,
                submissionCount: bulkAction.submissionIds.length,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Obter histórico de ações do admin
     */
    public async getAdminActionLog(
        adminId: string,
        filters: {
            action?: string;
            targetType?: string;
            dateFrom?: Date;
            dateTo?: Date;
            page?: number;
            limit?: number;
        } = {}
    ): Promise<{ logs: AdminActionLog[]; total: number }> {
        try {
            const page = filters.page || 1;
            const limit = Math.min(filters.limit || 50, 100);
            const offset = (page - 1) * limit;

            const params: any[] = [adminId];
            let whereClause = `1=1 AND admin_id = $${params.length}`;

            if (filters.action) {
                params.push(filters.action);
                whereClause += ` AND action = $${params.length}`;
            }

            if (filters.targetType) {
                params.push(filters.targetType);
                whereClause += ` AND target_type = $${params.length}`;
            }

            if (filters.dateFrom) {
                params.push(filters.dateFrom);
                whereClause += ` AND timestamp >= $${params.length}`;
            }

            if (filters.dateTo) {
                params.push(filters.dateTo);
                whereClause += ` AND timestamp <= $${params.length}`;
            }

            // Query principal
            params.push(limit, offset);
            const logsQuery = `
                SELECT *
                FROM admin_action_logs
                WHERE ${whereClause}
                ORDER BY timestamp DESC
                LIMIT $${params.length - 1} OFFSET $${params.length}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*)
                FROM admin_action_logs
                WHERE ${whereClause}
            `;

            const [logsResult, countResult] = await Promise.all([
                this.db.query(logsQuery, params),
                this.db.query(countQuery, params.slice(0, -2))
            ]);

            return {
                logs: logsResult.rows,
                total: parseInt(countResult.rows[0].count)
            };

        } catch (error) {
            this.logger.error('Error getting admin action log', {
                adminId,
                filters,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    // =============================================================================
    // MÉTODOS PRIVADOS
    // =============================================================================

    private async getDashboardSummary() {
        const result = await this.db.query(`
            SELECT COUNT(*)                                                 as total_submissions,
                   COUNT(CASE WHEN status = 'UNDER_REVIEW' THEN 1 END)      as pending_review,
                   COUNT(CASE WHEN status = 'CHANGES_REQUESTED' THEN 1 END) as changes_requested,
                   COUNT(CASE WHEN status = 'APPROVED' THEN 1 END)          as approved,
                   COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END)         as published,
                   COUNT(CASE WHEN status = 'REJECTED' THEN 1 END)          as rejected,
                   COUNT(CASE
                             WHEN expires_at < NOW() + INTERVAL '5 days' AND status NOT IN ('PUBLISHED', 'REJECTED')
                                 THEN 1 END)                                as expiring_soon
            FROM submissions
        `);

        return {
            totalSubmissions: parseInt(result.rows[0].total_submissions),
            pendingReview: parseInt(result.rows[0].pending_review),
            changesRequested: parseInt(result.rows[0].changes_requested),
            approved: parseInt(result.rows[0].approved),
            published: parseInt(result.rows[0].published),
            rejected: parseInt(result.rows[0].rejected),
            expiringSoon: parseInt(result.rows[0].expiring_soon)
        };
    }

    private async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
        const result = await this.db.query(`
            SELECT s.id         as submission_id,
                   s.title      as submission_title,
                   s.author_name,
                   s.status,
                   s.created_at,
                   s.updated_at,
                   s.reviewed_at,
                   a.name       as admin_name,
                   'submission' as activity_type
            FROM submissions s
                     LEFT JOIN admins a ON s.reviewed_by = a.id
            ORDER BY GREATEST(s.created_at, s.updated_at) DESC
            LIMIT $1
        `, [limit]);

        return result.rows.map(row => ({
            id: row.submission_id,
            type: this.getActivityType(row),
            description: this.getActivityDescription(row),
            submissionId: row.submission_id,
            submissionTitle: row.submission_title,
            authorName: row.author_name,
            adminName: row.admin_name,
            timestamp: new Date(row.updated_at || row.created_at),
            status: row.status
        }));
    }

    private getActivityType(row: any): 'submission' | 'review' | 'feedback' | 'publish' {
        if (row.status === 'PUBLISHED') return 'publish';
        if (row.reviewed_at) return 'review';
        return 'submission';
    }

    private getActivityDescription(row: any): string {
        switch (row.status) {
            case 'DRAFT':
                return 'Nova submissão criada';
            case 'UNDER_REVIEW':
                return 'Submissão em revisão';
            case 'CHANGES_REQUESTED':
                return 'Correções solicitadas';
            case 'APPROVED':
                return 'Submissão aprovada';
            case 'PUBLISHED':
                return 'Artigo publicado';
            case 'REJECTED':
                return 'Submissão rejeitada';
            default:
                return 'Atividade desconhecida';
        }
    }

    private async getSubmissionsByStatus() {
        const result = await this.db.query(`
            SELECT status,
                   COUNT(*)                                           as count,
                   ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
            FROM submissions
            GROUP BY status
            ORDER BY count DESC
        `);

        return result.rows.map(row => ({
            status: row.status,
            count: parseInt(row.count),
            percentage: parseFloat(row.percentage)
        }));
    }

    private async getSubmissionsByCategory() {
        const result = await this.db.query(`
            SELECT COALESCE(category, 'Sem categoria')                as category,
                   COUNT(*)                                           as count,
                   ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
            FROM submissions
            GROUP BY category
            ORDER BY count DESC
            LIMIT 10
        `);

        return result.rows.map(row => ({
            category: row.category,
            count: parseInt(row.count),
            percentage: parseFloat(row.percentage)
        }));
    }

    private async getMonthlySubmissions() {
        const result = await this.db.query(`
            SELECT EXTRACT(YEAR FROM created_at)                    as year,
                   EXTRACT(MONTH FROM created_at)                   as month,
                   TO_CHAR(created_at, 'Month')                     as month_name,
                   COUNT(*)                                         as count,
                   COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as published
            FROM submissions
            WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY year, month, month_name
            ORDER BY year, month
        `);

        return result.rows.map(row => ({
            month: row.month_name.trim(),
            year: parseInt(row.year),
            count: parseInt(row.count),
            published: parseInt(row.published)
        }));
    }

    private async getTopAuthors() {
        const result = await this.db.query(`
            SELECT author_name,
                   author_email,
                   COUNT(*)                                                                      as submission_count,
                   COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END)                              as published_count,
                   ROUND(COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
            FROM submissions
            GROUP BY author_name, author_email
            HAVING COUNT(*) > 1
            ORDER BY published_count DESC, submission_count DESC
            LIMIT 10
        `);

        return result.rows.map(row => ({
            authorName: row.author_name,
            authorEmail: row.author_email,
            submissionCount: parseInt(row.submission_count),
            publishedCount: parseInt(row.published_count),
            successRate: parseFloat(row.success_rate)
        }));
    }

    private async getReviewStats() {
        const result = await this.db.query(`
            SELECT COUNT(*)                                                              as total_reviews,
                   COUNT(CASE WHEN reviewed_at >= NOW() - INTERVAL '1 month' THEN 1 END) as reviews_this_month,
                   AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600)            as avg_review_time,
                   MIN(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600)            as fastest_review,
                   MAX(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600)            as slowest_review
            FROM submissions
            WHERE reviewed_at IS NOT NULL
        `);

        const adminStats = await this.db.query(`
            SELECT a.id                                                                           as admin_id,
                   a.name                                                                         as admin_name,
                   COUNT(*)                                                                       as review_count,
                   AVG(EXTRACT(EPOCH FROM (s.reviewed_at - s.created_at)) / 3600)                 as avg_review_time,
                   ROUND(COUNT(CASE WHEN s.status = 'APPROVED' THEN 1 END) * 100.0 / COUNT(*), 2) as approval_rate
            FROM admins a
                     JOIN submissions s ON a.id = s.reviewed_by
            WHERE s.reviewed_at IS NOT NULL
            GROUP BY a.id, a.name
            ORDER BY review_count DESC
        `);

        const row = result.rows[0];
        return {
            totalReviews: parseInt(row.total_reviews),
            reviewsThisMonth: parseInt(row.reviews_this_month),
            avgReviewTime: parseFloat(row.avg_review_time) || 0,
            fastestReview: parseFloat(row.fastest_review) || 0,
            slowestReview: parseFloat(row.slowest_review) || 0,
            byAdmin: adminStats.rows.map(admin => ({
                adminId: admin.admin_id,
                adminName: admin.admin_name,
                reviewCount: parseInt(admin.review_count),
                avgReviewTime: parseFloat(admin.avg_review_time),
                approvalRate: parseFloat(admin.approval_rate)
            }))
        };
    }

    private buildFilterQuery(filters: SubmissionFilters, limit: number, offset: number) {
        // noinspection SqlShouldBeInGroupBy,SqlConstantExpression
        let query = `
            SELECT s.*,
                   a.name                                                   as admin_name,
                   COUNT(fu.id)                                             as file_count,
                   COALESCE(SUM(fu.size), 0)                                as total_size,
                   EXTRACT(EPOCH FROM (s.expires_at - NOW())) / 86400       as days_until_expiry,
                   CASE WHEN s.status = 'APPROVED' THEN true ELSE false END as can_be_published,
                   GREATEST(s.created_at, s.updated_at)                     as last_activity
            FROM submissions s
                     LEFT JOIN admins a ON s.reviewed_by = a.id
                     LEFT JOIN file_uploads fu ON s.id = fu.submission_id
            WHERE 1 = 1
        `;

        const params: any[] = [];

        if (filters.status && filters.status.length > 0) {
            params.push(filters.status);
            query += ` AND s.status = ANY($${params.length}::submission_status[])`;
        }

        if (filters.category && filters.category.length > 0) {
            params.push(filters.category);
            query += ` AND s.category = ANY($${params.length}::text[])`;
        }

        if (filters.authorEmail) {
            params.push(`%${filters.authorEmail}%`);
            query += ` AND s.author_email ILIKE $${params.length}`;
        }

        if (filters.adminId) {
            params.push(filters.adminId);
            query += ` AND s.reviewed_by = $${params.length}`;
        }

        if (filters.dateFrom) {
            params.push(filters.dateFrom);
            query += ` AND s.created_at >= $${params.length}`;
        }

        if (filters.dateTo) {
            params.push(filters.dateTo);
            query += ` AND s.created_at <= $${params.length}`;
        }

        if (filters.search) {
            params.push(`%${filters.search}%`);
            query += ` AND (s.title ILIKE $${params.length} OR s.author_name ILIKE $${params.length} OR s.content ILIKE $${params.length})`;
        }

        if (filters.expiringDays) {
            params.push(filters.expiringDays);
            query += ` AND s.expires_at <= NOW() + INTERVAL '1 day' * $${params.length}`;
        }

        query += ` GROUP BY s.id, s.token, s.status, s.author_name, s.author_email, s.author_institution,
                       s.title, s.summary, s.content, s.keywords, s.category, s.metadata, s.attachments,
                       s.reviewed_by, s.review_notes, s.rejection_reason, s.created_at, s.updated_at,
                       s.expires_at, s.submitted_at, s.reviewed_at, a.name`;

        if (filters.hasFiles !== undefined) {
            if (filters.hasFiles) {
                query += ` HAVING COUNT(fu.id) > 0`;
            } else {
                query += ` HAVING COUNT(fu.id) = 0`;
            }
        }

        const allowedSortFields = ['created_at', 'updated_at', 'title', 'author_name', 'status'];
        const safeSortBy = allowedSortFields.includes(filters.sortBy) ? filters.sortBy : 'updated_at';
        const safeSortOrder = ['asc', 'desc'].includes(filters.sortOrder?.toLowerCase()) ? filters.sortOrder.toUpperCase() : 'DESC';

        query += ` ORDER BY s.${safeSortBy} ${safeSortOrder}`;

        params.push(limit, offset);
        query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

        return { query, params };
    }

    private buildCountQuery(filters: SubmissionFilters) {
        let query = `
            SELECT COUNT(DISTINCT s.id) as count
            FROM submissions s
                     LEFT JOIN admins a ON s.reviewed_by = a.id
        `;

        if (filters.hasFiles === undefined) {
            query += ` LEFT JOIN file_uploads fu ON s.id = fu.submission_id`;
        }

        query += ` WHERE 1 = 1`;

        const params: any[] = [];

        if (filters.status && filters.status.length > 0) {
            params.push(filters.status);
            query += ` AND s.status = ANY($${params.length}::submission_status[])`;
        }

        if (filters.category && filters.category.length > 0) {
            params.push(filters.category);
            query += ` AND s.category = ANY($${params.length}::text[])`;
        }

        if (filters.authorEmail) {
            params.push(`%${filters.authorEmail}%`);
            query += ` AND s.author_email ILIKE $${params.length}`;
        }

        if (filters.adminId) {
            params.push(filters.adminId);
            query += ` AND s.reviewed_by = $${params.length}`;
        }

        if (filters.dateFrom) {
            params.push(filters.dateFrom);
            query += ` AND s.created_at >= $${params.length}`;
        }

        if (filters.dateTo) {
            params.push(filters.dateTo);
            query += ` AND s.created_at <= $${params.length}`;
        }

        if (filters.search) {
            params.push(`%${filters.search}%`);
            query += ` AND (s.title ILIKE $${params.length} OR s.author_name ILIKE $${params.length} OR s.content ILIKE $${params.length})`;
        }

        if (filters.expiringDays) {
            params.push(filters.expiringDays);
            query += ` AND s.expires_at <= NOW() + INTERVAL '1 day' * $${params.length}`;
        }

        if (filters.hasFiles !== undefined) {
            if (filters.hasFiles) {
                query += ` AND EXISTS (SELECT 1 FROM file_uploads fu WHERE fu.submission_id = s.id)`;
            } else {
                query += ` AND NOT EXISTS (SELECT 1 FROM file_uploads fu WHERE fu.submission_id = s.id)`;
            }
        }

        return { query, params };
    }
    private mapSubmissionWithReview(row: any): SubmissionWithReview {
        const reviewStatus = row.reviewed_by ? this.mapSubmissionStatusToReviewStatus(row.status) : undefined;
        return {
            id: row.id,
            token: row.token,
            status: row.status,
            authorName: row.author_name,
            authorEmail: row.author_email,
            authorInstitution: row.author_institution,
            title: row.title,
            summary: row.summary,
            content: row.content,
            keywords: row.keywords,
            category: row.category,
            metadata: row.metadata,
            attachments: row.attachments,
            reviewedBy: row.reviewed_by,
            reviewNotes: row.review_notes,
            rejectionReason: row.rejection_reason,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            expiresAt: new Date(row.expires_at),
            submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
            reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,

            // Campos adicionais
            review: row.reviewed_by ? {
                id: row.id,
                submissionId: row.id,
                adminId: row.reviewed_by,
                status: reviewStatus,
                reviewNotes: row.review_notes,
                rejectionReason: row.rejection_reason,
                reviewedAt: new Date(row.reviewed_at),
                adminName: row.admin_name
            } : undefined,
            feedback: [], // Será carregado separadamente se necessário
            fileCount: parseInt(row.file_count) || 0,
            totalSize: parseInt(row.total_size) || 0,
            daysUntilExpiry: parseInt(row.days_until_expiry) || 0,
            canBePublished: row.can_be_published || false,
            lastActivity: new Date(row.last_activity)
        };
    }

    private mapReviewStatusToSubmissionStatus(reviewStatus: ReviewStatus): SubmissionStatus {
        switch (reviewStatus) {
            case 'approved':
                return 'APPROVED';
            case 'rejected':
                return 'REJECTED';
            case 'changes_requested':
                return 'CHANGES_REQUESTED';
            case 'pending':
                return 'UNDER_REVIEW';
            default:
                return 'UNDER_REVIEW';
        }
    }

    private mapSubmissionStatusToReviewStatus(status: SubmissionStatus): FeedbackStatus {
        switch (status) {
            case 'APPROVED':
                return 'approved';
            case 'REJECTED':
                return 'rejected';
            case 'CHANGES_REQUESTED':
                return 'changes_requested';
            default:
                return 'pending';
        }
    }

    private async getSubmissionById(submissionId: string): Promise<Submission | null> {
        const result = await this.db.query(
            'SELECT * FROM submissions WHERE id = $1',
            [submissionId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    }

    private async getAdminName(adminId: string): Promise<string> {
        const result = await this.db.query(
            'SELECT name FROM admins WHERE id = $1',
            [adminId]
        );

        return result.rows[0]?.name || 'Admin';
    }

    private async sendReviewNotification(submission: any, review: SubmissionReview): Promise<void> {
        try {
            const feedbackContent = review.status === 'rejected' ?
                (review.rejectionReason || 'Sua submissão foi rejeitada.') :
                (review.reviewNotes || 'Foram solicitadas alterações em sua submissão.');
            const feedback = {
                id: review.id,
                submissionId: review.submissionId,
                adminId: review.adminId,
                content: feedbackContent,
                status: review.status,
                createdAt: review.reviewedAt,
                adminName: review.adminName
            }
            if (review.status === 'rejected' || review.status === 'changes_requested') {
                await this.emailService.sendFeedbackToAuthor(submission, feedback, review.adminName);
            }
            // Caso contrário, notificação será enviada quando publicar.
        } catch (error) {
            this.logger.error('Error sending review notification', {
                submissionId: submission.id,
                reviewStatus: review.status,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    private async performSingleBulkAction(
        submissionId: string,
        bulkAction: BulkAction,
        adminId: string
    ): Promise<void> {
        switch (bulkAction.action) {
            case 'approve':
                await this.reviewSubmission(submissionId, adminId, 'approved', bulkAction.notes);
                break;
            case 'reject':
                await this.reviewSubmission(submissionId, adminId, 'rejected', bulkAction.notes, bulkAction.reason);
                break;
            case 'request_changes':
                await this.reviewSubmission(submissionId, adminId, 'changes_requested', bulkAction.notes);
                break;
            case 'extend_expiry':
                await this.extendSubmissionExpiry(submissionId, 30); // 30 dias
                break;
            default:
                throw new Error(`Ação não suportada: ${bulkAction.action}`);
        }
    }

    private async extendSubmissionExpiry(submissionId: string, days: number): Promise<void> {
        await this.db.query(
            'UPDATE submissions SET expires_at = expires_at + ($1 || \' days\')::interval WHERE id = $2',
            [days, submissionId]
        );
    }

    private async logAdminAction(
        adminId: string,
        action: string,
        targetType: string,
        targetId: string,
        details: Record<string, any>
    ): Promise<void> {
        await this.db.query(`
            INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, details, timestamp)
            VALUES ($1, $2, $3, $4, $5, NOW())
        `, [adminId, action, targetType, targetId, JSON.stringify(details)]);
    }
}

export default AdminReviewService;
