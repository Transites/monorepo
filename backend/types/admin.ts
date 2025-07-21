export interface SubmissionReview {
    id: string;
    submissionId: string;
    adminId: string;
    status: ReviewStatus;
    reviewNotes?: string;
    rejectionReason?: string;
    reviewedAt: Date;
    adminName: string;
}

export interface AdminFeedback {
    id: string;
    submissionId: string;
    adminId: string;
    content: string;
    status: ReviewStatus;
    createdAt: Date;
    updatedAt?: Date;
    adminName: string;
}

export interface Submission {
    id: string;
    token: string;
    status: SubmissionStatus;
    authorName: string;
    authorEmail: string;
    authorInstitution?: string;
    title: string;
    summary: string;
    content: string;
    keywords: string[];
    category?: string;
    metadata?: Record<string, any>;
    attachments?: string[];
    reviewedBy?: string;
    reviewNotes?: string;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
    submittedAt?: Date;
    reviewedAt?: Date;
}

export interface SubmissionWithReview extends Submission {
    review?: SubmissionReview;
    feedback: AdminFeedback[];
    fileCount: number;
    totalSize: number;
    daysUntilExpiry: number;
    canBePublished: boolean;
    lastActivity: Date;
}

export interface AdminDashboard {
    summary: {
        totalSubmissions: number;
        pendingReview: number;
        changesRequested: number;
        approved: number;
        published: number;
        rejected: number;
        expiringSoon: number;
    };
    recentActivity: RecentActivity[];
    submissionsByStatus: StatusCount[];
    submissionsByCategory: CategoryCount[];
    submissionsByMonth: MonthlyCount[];
    topAuthors: AuthorStats[];
    reviewStats: ReviewStats;
}

export interface RecentActivity {
    id: string;
    type: 'submission' | 'review' | 'feedback' | 'publish';
    description: string;
    submissionId: string;
    submissionTitle: string;
    authorName: string;
    adminName?: string;
    timestamp: Date;
    status?: SubmissionStatus;
}

export interface StatusCount {
    status: SubmissionStatus;
    count: number;
    percentage: number;
}

export interface CategoryCount {
    category: string;
    count: number;
    percentage: number;
}

export interface MonthlyCount {
    month: string;
    year: number;
    count: number;
    published: number;
}

export interface AuthorStats {
    authorName: string;
    authorEmail: string;
    submissionCount: number;
    publishedCount: number;
    successRate: number;
}

export interface ReviewStats {
    avgReviewTime: number; // em horas
    totalReviews: number;
    reviewsThisMonth: number;
    fastestReview: number;
    slowestReview: number;
    byAdmin: AdminReviewStats[];
}

export interface AdminReviewStats {
    adminId: string;
    adminName: string;
    reviewCount: number;
    avgReviewTime: number;
    approvalRate: number;
}

export interface SubmissionFilters {
    status?: SubmissionStatus[];
    category?: string[];
    authorEmail?: string;
    adminId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    expiringDays?: number;
    hasFiles?: boolean;
    sortBy?: 'created_at' | 'updated_at' | 'title' | 'author_name' | 'expires_at';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface PaginatedSubmissions {
    submissions: SubmissionWithReview[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
    filters: SubmissionFilters;
}

export interface BulkAction {
    submissionIds: string[];
    action: 'approve' | 'reject' | 'request_changes' | 'extend_expiry';
    reason?: string;
    notes?: string;
}

export interface BulkActionResult {
    successful: string[];
    failed: Array<{
        submissionId: string;
        error: string;
    }>;
    summary: {
        total: number;
        successful: number;
        failed: number;
    };
}

export interface AdminActionLog {
    id: string;
    adminId: string;
    adminName: string;
    action: string;
    targetType: 'submission' | 'feedback' | 'admin';
    targetId: string;
    details: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
}

export interface PublishRequest {
    submissionId: string;
    publishNotes?: string;
    categoryOverride?: string;
    keywordsOverride?: string[];
}

export interface PublishResult {
    success: boolean;
    articleId?: string;
    publishedAt?: Date;
    articleUrl?: string;
    error?: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';
export type FeedbackStatus = 'PENDING' | 'ADDRESSED' | 'RESOLVED';
export type SubmissionStatus =
    'DRAFT'
    | 'UNDER_REVIEW'
    | 'CHANGES_REQUESTED'
    | 'APPROVED'
    | 'PUBLISHED'
    | 'REJECTED'
    | 'EXPIRED';
