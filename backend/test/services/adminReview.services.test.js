/**
 * Testes para AdminReviewService
 */
const logger = require('../../middleware/logging');
const db = require('../../database/client');
const emailService = require('../../services/email');

// Mock dependencies
jest.mock('../../middleware/logging');
jest.mock('../../database/client');
jest.mock('../../services/email');

describe('AdminReviewService', () => {
    let adminReviewService;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mocks
        db.query = jest.fn();
        db.findById = jest.fn();
        db.update = jest.fn();
        db.insert = jest.fn();

        emailService.sendEmail = jest.fn();
        emailService.sendFeedbackToAuthor = jest.fn();

        logger.audit = jest.fn();
        logger.error = jest.fn();
        logger.info = jest.fn();

        // Import service (after mocks are set up)
        jest.resetModules();
        const AdminReviewService = require('../../services/adminReview').default;
        adminReviewService = new AdminReviewService(db, emailService, logger);
    });

    describe('getDashboard', () => {
        test('deve retornar dashboard completo com sucesso', async () => {
            const mockSummaryResult = {
                rows: [{
                    total_submissions: 100,
                    pending_review: 25,
                    approved: 50,
                    rejected: 15,
                    changes_requested: 10,
                    published: 2,
                    expiring_soon: 1,
                }]
            };

            const mockRecentActivityResult = {
                rows: [
                    {
                        submission_id: 'random-uuid4-123456',
                        submission_title: 'Sample Submission',
                        author_name: 'Sample Author',
                        status: 'CHANGES_REQUESTED',
                        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Two days ago
                        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // One day ago
                        reviewed_at: new Date().toISOString(),
                        admin_name: 'Admin User',
                        activity_type: 'submission'
                    }
                ]
            };

            const mockStatusCountsResult = {
                rows: [
                    {status: 'draft', count: '25'},
                    {status: 'under_review', count: '50'},
                    {status: 'changes_requested', count: '15'},
                    {status: 'approved', count: '10'},
                    {status: 'published', count: '7'},
                    {status: 'rejected', count: '15'},
                    {status: 'expired', count: '3'},
                ]
            };

            const mockCategoryCountsResult = {
                rows: [
                    {category: 'article', count: '40', percentage: (40 / (40 + 30 + 20 + 10)) * 100},
                    {category: 'essay', count: '30', percentage: (30 / (40 + 30 + 20 + 10)) * 100},
                    {category: 'review', count: '20', percentage: (20 / (40 + 30 + 20 + 10)) * 100},
                    {category: 'other', count: '10', percentage: (10 / (40 + 30 + 20 + 10)) * 100},
                ]
            };

            const mockMonthlyDataResult = {
                rows: [
                    {month_name: 'January', month: '1', year: '2025', count: '10', published: '5'},
                    {month_name: 'February', month: '2', year: '2025', count: '15', published: '7'},
                    {month_name: 'March', month: '3', year: '2025', count: '20', published: '12'},
                    {month_name: 'April', month: '4', year: '2025', count: '25', published: '15'},
                    {month_name: 'May', month: '5', year: '2025', count: '30', published: '20'},
                    {month_name: 'June', month: '6', year: '2025', count: '35', published: '25'}
                ]
            };

            const mockTopAuthorsResult = {
                rows: [
                    {
                        author_email: 'author1@example.com',
                        author_name: 'Author 1',
                        submission_count: '5',
                        published_count: '3',
                        success_rate: '60'
                    },
                    {
                        author_email: 'author2@example.com',
                        author_name: 'Author 2',
                        submission_count: '4',
                        published_count: '2',
                        success_rate: '50'
                    },
                    {
                        author_email: 'author3@example.com',
                        author_name: 'Author 3',
                        submission_count: '3',
                        published_count: '0',
                        success_rate: '0'
                    },
                ]
            };

            const mockReviewStatsResult = {
                rows: [
                    {
                        total_reviews: '100',
                        reviews_this_month: '20',
                        avg_review_time: '3.5', // em horas
                        fastest_review: '1.0', // em horas
                        slowest_review: '10.0', // em horas
                    }
                ]
            };

            const mockAdminStatsResult = {
                rows: [
                    {
                        admin_id: 'admin-123',
                        admin_name: 'Admin User',
                        review_count: 12,
                        avg_review_time: 3.5, // em horas
                        approval_rate: 75 // em porcentagem
                    }
                ]
            }

            // Setup db.query to return different results based on the query
            db.query
                .mockResolvedValueOnce(mockSummaryResult)
                .mockResolvedValueOnce(mockRecentActivityResult)
                .mockResolvedValueOnce(mockStatusCountsResult)
                .mockResolvedValueOnce(mockCategoryCountsResult)
                .mockResolvedValueOnce(mockMonthlyDataResult)
                .mockResolvedValueOnce(mockTopAuthorsResult)
                .mockResolvedValueOnce(mockReviewStatsResult)
                .mockResolvedValueOnce(mockAdminStatsResult);


            // Execute
            const result = await adminReviewService.getDashboard("admin-123");

            // Verify
            expect(db.query).toHaveBeenCalledTimes(8);
            expect(logger.audit).toHaveBeenCalledWith('Admin dashboard accessed', expect.any(Object));

            // Verify dashboard structure
            expect(result).toEqual({
                summary: expect.objectContaining({
                    totalSubmissions: 100,
                    pendingReview: 25,
                    approved: 50,
                    rejected: 15,
                    changesRequested: 10,
                    published: 2,
                    expiringSoon: 1
                }),
                recentActivity: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'random-uuid4-123456',
                        type: "review",
                        description: 'Correções solicitadas',
                        submissionId: 'random-uuid4-123456',
                        submissionTitle: 'Sample Submission',
                        authorName: 'Sample Author',
                        adminName: 'Admin User',
                        timestamp: expect.any(Date),
                        status: 'CHANGES_REQUESTED',
                    })
                ]),
                submissionsByStatus: expect.arrayContaining([
                    expect.objectContaining({status: 'draft', count: 25, percentage: expect.any(Number)})
                ]),
                submissionsByCategory: expect.arrayContaining([
                    expect.objectContaining({category: 'article', count: 40, percentage: expect.any(Number)})
                ]),
                submissionsByMonth: expect.arrayContaining([
                    expect.objectContaining({month: 'January', year: 2025, count: 10, published: 5})
                ]),
                topAuthors: expect.arrayContaining([
                    expect.objectContaining({
                        authorName: 'Author 1',
                        authorEmail: 'author1@example.com',
                        submissionCount: 5,
                        publishedCount: 3,
                        successRate: 60.0
                    })
                ]),
                reviewStats: expect.objectContaining({
                    totalReviews: 100,
                    reviewsThisMonth: 20,
                    avgReviewTime: 3.5,
                    fastestReview: 1.0,
                    slowestReview: 10.0,
                    byAdmin: expect.arrayContaining([
                        expect.objectContaining({
                            adminId: 'admin-123',
                            adminName: 'Admin User',
                            reviewCount: 12,
                            avgReviewTime: 3.5,
                            approvalRate: 75.0,
                        })
                    ])
                })
            });
        });

        test('deve tratar erros corretamente', async () => {
            // Setup
            const adminId = 'admin-123';
            const testError = new Error('Erro ao acessar banco de dados');

            // Make db.query throw an error
            db.query.mockRejectedValue(testError);

            // Execute & Verify
            await expect(adminReviewService.getDashboard(adminId))
                .rejects
                .toThrow(testError);

            expect(logger.error).toHaveBeenCalledWith('Error getting admin dashboard', expect.any(Object));
        });
    });

    describe('getSubmissions', () => {
        test('deve retornar submissões com filtros e paginação', async () => {
            // Setup
            const adminId = 'admin-123';
            const filters = {
                status: ['pending', 'approved'],
                category: ['article', 'essay'],
                page: 2,
                limit: 10,
                sortBy: 'created_at',
                sortOrder: 'desc'
            };

            const mockSubmissionsResult = {
                rows: [
                    {
                        id: 'sub1',
                        title: 'Submission 1',
                        author_name: 'Author 1',
                        author_email: 'author1@example.com',
                        category: 'article',
                        status: 'pending',
                        created_at: '2025-01-01T12:00:00Z',
                        updated_at: '2025-01-02T12:00:00Z',
                        review_id: 'rev1',
                        review_status: 'pending',
                        review_admin_id: 'admin-123',
                        review_created_at: '2025-01-02T12:00:00Z'
                    },
                    {
                        id: 'sub2',
                        title: 'Submission 2',
                        author_name: 'Author 2',
                        author_email: 'author2@example.com',
                        category: 'essay',
                        status: 'approved',
                        created_at: '2025-01-03T12:00:00Z',
                        updated_at: '2025-01-04T12:00:00Z',
                        review_id: 'rev2',
                        review_status: 'approved',
                        review_admin_id: 'admin-123',
                        review_created_at: '2025-01-04T12:00:00Z'
                    }
                ]
            };

            const mockCountResult = {
                rows: [{count: '25'}]
            };

            // Setup db.query to return different results
            db.query
                .mockResolvedValueOnce(mockSubmissionsResult)
                .mockResolvedValueOnce(mockCountResult);

            // Execute
            const result = await adminReviewService.getSubmissions(filters, adminId);

            // Verify
            expect(db.query).toHaveBeenCalledTimes(2);

            // Verify result structure
            expect(result).toEqual({
                submissions: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'sub1',
                        title: 'Submission 1',
                        authorName: 'Author 1',
                        category: 'article',
                        status: 'pending'
                    }),
                    expect.objectContaining({
                        id: 'sub2',
                        title: 'Submission 2',
                        authorName: 'Author 2',
                        category: 'essay',
                        status: 'approved'
                    })
                ]),
                pagination: expect.objectContaining({
                    currentPage: 2,
                    totalPages: 3,
                    totalItems: 25,
                    itemsPerPage: 10,
                    hasNext: true,
                    hasPrevious: true
                }),
                filters
            });
        });

        test('deve aplicar filtros corretamente', async () => {
            // Setup
            const adminId = 'admin-123';
            const filters = {
                status: ['pending'],
                category: ['article'],
                authorEmail: 'author@example.com',
                dateFrom: new Date('2025-01-01'),
                dateTo: new Date('2025-07-01')
            };

            // Mock results
            db.query.mockResolvedValueOnce({rows: []}).mockResolvedValueOnce({rows: [{count: '0'}]});

            // Execute
            await adminReviewService.getSubmissions(filters, adminId);

            // Verify query contains filter parameters
            const queryCall = db.query.mock.calls[0][0];
            const paramsCall = db.query.mock.calls[0][1];

            expect(queryCall).toContain('WHERE');
            expect(queryCall).toContain('s.status = ANY($1::submission_status[])');
            expect(queryCall).toContain('s.category = ANY($2::text[])');
            expect(queryCall).toContain('s.author_email ILIKE $3');
            expect(queryCall).toContain('s.created_at >= $4');
            expect(queryCall).toContain('s.created_at <= $5');

            expect(paramsCall).toContainEqual(['pending']);
            expect(paramsCall).toContainEqual(['article']);
            expect(paramsCall).toContain('%author@example.com%');
        });

        test('deve tratar erros corretamente', async () => {
            // Setup
            const adminId = 'admin-123';
            const filters = {};
            const testError = new Error('Erro ao acessar banco de dados');

            // Make db.query throw an error
            db.query.mockRejectedValue(testError);

            // Execute & Verify
            await expect(adminReviewService.getSubmissions(filters, adminId))
                .rejects
                .toThrow(testError);

            expect(logger.error).toHaveBeenCalledWith('Error getting submissions for admin', expect.any(Object));
        });
    });

    describe('reviewSubmission', () => {
        test('deve revisar submissão com sucesso', async () => {
            // Setup
            const submissionId = 'sub-123';
            const adminId = 'admin-123';
            const status = 'approved';
            const notes = 'Excelente trabalho!';
            const rejectionReason = undefined; // Definir rejectionReason que estava faltando

            const mockSubmission = {
                id: submissionId,
                author_email: 'author@example.com',
                author_name: 'Test Author',
                title: 'Test Submission',
                status: 'DRAFT' // Usar status válido para revisão
            };

            // Mock database operations - 4 chamadas ao total
            db.query
                .mockResolvedValueOnce({rows: [mockSubmission]}) // getSubmissionById
                .mockResolvedValueOnce({rows: [{...mockSubmission, status: 'APPROVED'}]}) // UPDATE submissions
                .mockResolvedValueOnce({rows: [{name: 'Admin User'}]}) // getAdminName
                .mockResolvedValueOnce({rows: [{}]}); // logAdminAction (INSERT)

            // Mock email service
            emailService.sendFeedbackToAuthor.mockResolvedValue({success: true});

            // Execute
            const result = await adminReviewService.reviewSubmission(
                submissionId,
                adminId,
                status,
                notes
            );

            // Verify - Agora esperamos 4 chamadas
            expect(db.query).toHaveBeenCalledTimes(4);
            expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT * FROM submissions WHERE id = $1'), [submissionId]);
            expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE submissions'), expect.arrayContaining([expect.any(String), adminId, notes, rejectionReason, submissionId]));
            expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('SELECT name FROM admins WHERE id = $1'), [adminId]);
            expect(db.query).toHaveBeenNthCalledWith(4, expect.stringContaining('INSERT INTO admin_action_logs'), expect.arrayContaining([adminId, 'review_submission', 'submission', submissionId, expect.any(String)]));

            expect(logger.audit).toHaveBeenCalledWith('Submission reviewed', expect.any(Object));

            // Verify result
            expect(result).toEqual(expect.objectContaining({
                id: expect.any(String),
                submissionId,
                adminId,
                status,
                reviewNotes: notes,
                adminName: 'Admin User'
            }));
        });

        test('deve tratar submissão não encontrada', async () => {
            // Setup
            const submissionId = 'non-existent';
            const adminId = 'admin-123';
            const status = 'approved';

            // Mock database operations
            db.query.mockResolvedValueOnce({rows: []}); // Empty result for getSubmissionById

            // Execute & Verify
            await expect(adminReviewService.reviewSubmission(submissionId, adminId, status))
                .rejects
                .toThrow('Submissão não encontrada');

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM submissions WHERE id = $1'), [submissionId]);
        });

        test('deve tratar erros de banco de dados', async () => {
            // Setup
            const submissionId = 'sub-123';
            const adminId = 'admin-123';
            const status = 'approved';
            const testError = new Error('Erro de banco de dados');

            // Mock database operations
            db.query
                .mockResolvedValueOnce({rows: [{id: submissionId, status: "UNDER_REVIEW"}]}) // getSubmissionById
                .mockRejectedValueOnce(testError); // UPDATE submissions

            // Execute & Verify
            await expect(adminReviewService.reviewSubmission(submissionId, adminId, status))
                .rejects
                .toThrow(testError);

            expect(logger.error).toHaveBeenCalledWith('Error reviewing submission', expect.any(Object));
        });
    });

    describe('sendFeedback', () => {
        test('deve enviar feedback com sucesso', async () => {
            // Setup
            const submissionId = 'sub-123';
            const adminId = 'admin-123';
            const content = 'Este é um feedback para o autor.';

            const mockSubmission = {
                id: submissionId,
                author_email: 'author@example.com',
                author_name: 'Test Author',
                title: 'Test Submission',
                status: 'UNDER_REVIEW' // Status que não é CHANGES_REQUESTED para testar o UPDATE
            };

            const mockFeedbackResult = {
                rows: [{
                    id: 'feedback-123',
                    submission_id: submissionId,
                    admin_id: adminId,
                    content,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }]
            };

            // Mock database operations - 5 chamadas ao total
            db.query
                .mockResolvedValueOnce({rows: [mockSubmission]}) // getSubmissionById
                .mockResolvedValueOnce({rows: [{name: 'Admin User'}]}) // getAdminName
                .mockResolvedValueOnce(mockFeedbackResult) // INSERT INTO feedback
                .mockResolvedValueOnce({rows: []}) // UPDATE submissions (status change)
                .mockResolvedValueOnce({rows: [{}]}); // logAdminAction (INSERT admin_action_logs)

            // Mock email service
            emailService.sendFeedbackToAuthor.mockResolvedValue({success: true});

            // Execute
            const result = await adminReviewService.sendFeedback(
                submissionId,
                adminId,
                content
            );

            // Verify database calls
            expect(db.query).toHaveBeenCalledTimes(5);
            expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT * FROM submissions WHERE id = $1'), [submissionId]);
            expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT name FROM admins WHERE id = $1'), [adminId]);
            expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('INSERT INTO feedback'), expect.arrayContaining([expect.any(String), submissionId, adminId, content]));
            expect(db.query).toHaveBeenNthCalledWith(4, expect.stringContaining('UPDATE submissions'), ['CHANGES_REQUESTED', submissionId]);
            expect(db.query).toHaveBeenNthCalledWith(5, expect.stringContaining('INSERT INTO admin_action_logs'), expect.arrayContaining([adminId, 'send_feedback', 'feedback', expect.any(String), expect.any(String)]));

            // Verify email service
            expect(emailService.sendFeedbackToAuthor).toHaveBeenCalledWith(
                mockSubmission,
                expect.objectContaining({
                    id: expect.any(String),
                    submissionId,
                    adminId,
                    content,
                    status: 'pending',
                    adminName: 'Admin User'
                }),
                'Admin User'
            );

            // Verify audit log
            expect(logger.audit).toHaveBeenCalledWith('Feedback sent to author', expect.any(Object));

            // Verify result
            expect(result).toEqual(expect.objectContaining({
                id: expect.any(String),
                submissionId,
                adminId,
                content,
                status: 'pending',
                adminName: 'Admin User'
            }));
        });

        test('deve tratar submissão não encontrada', async () => {
            // Setup
            const submissionId = 'non-existent';
            const adminId = 'admin-123';
            const content = 'Este é um feedback para o autor.';

            // Mock database operations - getSubmissionById retorna null quando não encontra
            db.query.mockResolvedValueOnce({rows: []}); // Retorna array vazio para simular não encontrado

            // Execute & Verify
            await expect(adminReviewService.sendFeedback(submissionId, adminId, content))
                .rejects
                .toThrow('Submissão não encontrada');

            // Verifica que apenas a primeira query foi chamada (getSubmissionById)
            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM submissions WHERE id = $1'),
                [submissionId]
            );

            // Verifica que outras operações não foram executadas
            expect(emailService.sendFeedbackToAuthor).not.toHaveBeenCalled();
        });

        test('deve tratar erros ao enviar email', async () => {
            // Setup
            const submissionId = 'sub-123';
            const adminId = 'admin-123';
            const content = 'Este é um feedback para o autor.';
            const emailError = new Error('Erro ao enviar email');

            const mockSubmission = {
                id: submissionId,
                author_email: 'author@example.com',
                author_name: 'Test Author',
                title: 'Test Submission',
                status: 'UNDER_REVIEW'
            };

            const mockFeedbackResult = {
                rows: [{
                    id: 'feedback-123',
                    submission_id: submissionId,
                    admin_id: adminId,
                    content,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }]
            };

            // Mock database operations - todas as 5 chamadas
            db.query
                .mockResolvedValueOnce({rows: [mockSubmission]}) // getSubmissionById
                .mockResolvedValueOnce({rows: [{name: 'Admin User'}]}) // getAdminName
                .mockResolvedValueOnce(mockFeedbackResult) // INSERT INTO feedback
                .mockResolvedValueOnce({rows: []}) // UPDATE submissions
                .mockResolvedValueOnce({rows: [{}]}); // logAdminAction

            // Mock email service to throw error
            emailService.sendFeedbackToAuthor.mockRejectedValue(emailError);

            // Execute & Verify - O método deve falhar devido ao erro de email
            await expect(adminReviewService.sendFeedback(submissionId, adminId, content))
                .rejects
                .toThrow('Erro ao enviar email');

            // Verify que as operações de banco foram executadas antes do erro
            expect(db.query).toHaveBeenCalledTimes(4); // Para antes do logAdminAction devido ao erro
            expect(emailService.sendFeedbackToAuthor).toHaveBeenCalled();

            // Verify que o erro foi logado
            expect(logger.error).toHaveBeenCalledWith('Error sending feedback', expect.objectContaining({
                error: 'Erro ao enviar email'
            }));
        });
    });
    describe('publishSubmission', () => {
        // test('deve publicar submissão com sucesso', async () => {
        //     // Setup
        //     const submissionId = 'sub-123';
        //     const adminId = 'admin-123';
        //     const publishRequest = {
        //         submissionId,
        //         publishNotes: 'Notas para publicação',
        //         scheduledFor: new Date('2025-08-01T12:00:00Z'),
        //         categoryOverride: 'artigo-especial',
        //         keywordsOverride: ['keyword1', 'keyword2']
        //     };
        //
        //     const mockSubmission = {
        //         id: submissionId,
        //         author_email: 'author@example.com',
        //         author_name: 'Test Author',
        //         title: 'Test Submission',
        //         status: 'APPROVED', // Status correto para publicação
        //         content: 'Conteúdo da submissão',
        //         category: 'article',
        //         keywords: ['original1', 'original2']
        //     };
        //
        //     const mockArticleResult = {
        //         rows: [{
        //             id: 'article-123',
        //             submission_id: submissionId,
        //             title: 'Test Submission',
        //             content: 'Conteúdo da submissão',
        //             author_name: 'Test Author',
        //             category: 'artigo-especial',
        //             keywords: ['keyword1', 'keyword2'],
        //             published_at: new Date('2025-08-01T12:00:00Z').toISOString(),
        //             created_at: new Date().toISOString()
        //         }]
        //     };
        //
        //     // Mock database operations - todas as chamadas necessárias
        //     db.query
        //         .mockResolvedValueOnce({rows: [mockSubmission]}) // getSubmissionById
        //         .mockResolvedValueOnce(mockArticleResult) // INSERT INTO articles
        //         .mockResolvedValueOnce({rows: [{...mockSubmission, status: 'PUBLISHED'}]}) // UPDATE submissions
        //         .mockResolvedValueOnce({rows: [{}]}); // logAdminAction
        //
        //     // Mock email service
        //     emailService.notifyAuthorApproval.mockResolvedValue({success: true});
        //
        //     // Execute
        //     const result = await adminReviewService.publishSubmission(
        //         submissionId,
        //         adminId,
        //         publishRequest
        //     );
        //
        //     // Verify database calls
        //     expect(db.query).toHaveBeenCalledTimes(3);
        //     expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT * FROM submissions WHERE id = $1'), [submissionId]);
        //     expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO articles'), expect.arrayContaining([expect.any(String), submissionId]));
        //     expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('UPDATE submissions'), expect.arrayContaining(['PUBLISHED', submissionId]));
        //
        //     // Verify email notification
        //     expect(emailService.notifyAuthorApproval).toHaveBeenCalledWith(
        //         mockSubmission,
        //         expect.objectContaining({
        //             articleId: 'article-123',
        //             publishedAt: expect.any(String)
        //         })
        //     );
        //
        //     // Verify audit log
        //     expect(logger.audit).toHaveBeenCalledWith('Article published', expect.any(Object));
        //
        //     // Verify result
        //     expect(result).toEqual(expect.objectContaining({
        //         success: true,
        //         articleId: 'article-123',
        //         publishedAt: expect.any(String)
        //     }));
        // });

        test('deve rejeitar publicação de submissão não aprovada', async () => {
            // Setup
            const submissionId = 'sub-123';
            const adminId = 'admin-123';
            const publishRequest = {
                submissionId,
                publishNotes: 'Notas para publicação'
            };

            const mockSubmission = {
                id: submissionId,
                status: 'PENDING', // Não está aprovada
                title: 'Test Submission'
            };

            // Mock database operations - apenas getSubmissionById
            db.query.mockResolvedValueOnce({rows: [mockSubmission]});

            // Execute
            const result = await adminReviewService.publishSubmission(
                submissionId,
                adminId,
                publishRequest
            );

            // Verify database calls - apenas 1 chamada para buscar submissão
            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM submissions WHERE id = $1'),
                [submissionId]
            );

            // Verify que outras operações não foram executadas
            expect(emailService.notifyAuthorApproval).not.toHaveBeenCalled();

            // Verify result
            expect(result).toEqual(expect.objectContaining({
                success: false,
                error: expect.stringContaining('Apenas submissões aprovadas podem ser publicadas')
            }));
        });

        test('deve tratar submissão não encontrada', async () => {
            // Setup
            const submissionId = 'non-existent';
            const adminId = 'admin-123';
            const publishRequest = {
                submissionId,
                publishNotes: 'Notas para publicação'
            };

            // Mock database operations - submissão não encontrada
            db.query.mockResolvedValueOnce({rows: []});

            // Execute
            const result = await adminReviewService.publishSubmission(
                submissionId,
                adminId,
                publishRequest
            );

            // Verify database calls
            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM submissions WHERE id = $1'),
                [submissionId]
            );

            // Verify result
            expect(result).toEqual(expect.objectContaining({
                success: false,
                error: 'Submissão não encontrada'
            }));

            // Verify que outras operações não foram executadas
            expect(emailService.notifyAuthorApproval).not.toHaveBeenCalled();
        });

        test('deve tratar erros de banco de dados', async () => {
            // Setup
            const submissionId = 'sub-123';
            const adminId = 'admin-123';
            const publishRequest = {
                submissionId,
                publishNotes: 'Notas para publicação'
            };
            const testError = new Error('Erro de banco de dados');

            const mockSubmission = {
                id: submissionId,
                status: 'APPROVED',
                title: 'Test Submission'
            };

            // Mock database operations - primeira chamada sucesso, segunda falha
            db.query
                .mockResolvedValueOnce({rows: [mockSubmission]}) // getSubmissionById
                .mockRejectedValueOnce(testError); // INSERT INTO articles falha

            // Execute
            const result = await adminReviewService.publishSubmission(
                submissionId,
                adminId,
                publishRequest
            );

            // Verify que erro foi tratado e retornou objeto de erro
            expect(result).toEqual(expect.objectContaining({
                success: false,
                error: 'Erro de banco de dados'
            }));

            // Verify que erro foi logado
            expect(logger.error).toHaveBeenCalledWith('Error publishing submission', expect.any(Object));

            // Verify que pelo menos a busca da submissão foi executada
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM submissions WHERE id = $1'),
                [submissionId]
            );
        });
    });

    describe('searchSubmissions', () => {
        test('deve buscar submissões com sucesso', async () => {
            // Setup
            const query = 'termo de busca';
            const adminId = 'admin-123';
            const filters = {
                status: ['pending', 'approved'],
                category: ['article']
            };

            const mockSearchResult = {
                rows: [
                    {
                        id: 'sub1',
                        title: 'Submission with termo',
                        author_name: 'Author 1',
                        author_email: 'author1@example.com',
                        category: 'article',
                        status: 'pending',
                        created_at: '2025-01-01T12:00:00Z',
                        updated_at: '2025-01-02T12:00:00Z',
                        review_id: 'rev1',
                        review_status: 'pending',
                        review_admin_id: 'admin-123',
                        review_created_at: '2025-01-02T12:00:00Z'
                    },
                    {
                        id: 'sub2',
                        title: 'Another termo de busca',
                        author_name: 'Author 2',
                        author_email: 'author2@example.com',
                        category: 'article',
                        status: 'approved',
                        created_at: '2025-01-03T12:00:00Z',
                        updated_at: '2025-01-04T12:00:00Z',
                        review_id: 'rev2',
                        review_status: 'approved',
                        review_admin_id: 'admin-123',
                        review_created_at: '2025-01-04T12:00:00Z'
                    }
                ]
            };

            // Mock database operations
            db.query.mockResolvedValue(mockSearchResult);

            // Execute
            const result = await adminReviewService.searchSubmissions(query, adminId, filters);

            // Verify
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE'),
                expect.arrayContaining(["termo de busca", filters.status, filters.category])
            );

            // Verify result
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(expect.objectContaining({
                id: 'sub1',
                title: 'Submission with termo'
            }));
            expect(result[1]).toEqual(expect.objectContaining({
                id: 'sub2',
                title: 'Another termo de busca'
            }));
        });

        test('deve aplicar filtros na busca', async () => {
            // Setup
            const query = 'termo';
            const adminId = 'admin-123';
            const filters = {
                status: ['pending'],
                category: ['article']
            };

            // Mock results
            db.query.mockResolvedValue({rows: []});

            // Execute
            await adminReviewService.searchSubmissions(query, adminId, filters);

            // Verify query contains filter parameters
            const queryCall = db.query.mock.calls[0][0];
            const paramsCall = db.query.mock.calls[0][1];

            expect(queryCall).toContain('WHERE');
            expect(queryCall).toContain('s.status = ANY($');
            expect(queryCall).toContain('s.category = ANY($');

            // Verify parameters include the search terms and filters
            expect(paramsCall).toContain('termo');
            expect(paramsCall).toContainEqual(['pending']);
            expect(paramsCall).toContainEqual(['article']);
        });

        test('deve tratar erros corretamente', async () => {
            // Setup
            const query = 'termo';
            const adminId = 'admin-123';
            const testError = new Error('Erro ao buscar submissões');

            // Make db.query throw an error
            db.query.mockRejectedValue(testError);

            // Execute & Verify
            await expect(adminReviewService.searchSubmissions(query, adminId))
                .rejects
                .toThrow(testError);

            expect(logger.error).toHaveBeenCalledWith('Error searching submissions', expect.any(Object));
        });
    });

    describe('performBulkAction', () => {
        test('deve realizar ação em lote com sucesso', async () => {
            // Setup
            const bulkAction = {
                submissionIds: ['sub1', 'sub2', 'sub3'],
                action: 'approve',
                notes: 'Aprovação em lote',
                reason: 'Todos atendem aos critérios'
            };
            const adminId = 'admin-123';

            // Mock reviewSubmission method (que será chamado para cada submissão)
            const reviewSubmissionSpy = jest.spyOn(adminReviewService, 'reviewSubmission');
            reviewSubmissionSpy.mockImplementation(async () => ({
                id: 'review-123',
                submissionId: 'sub1',
                adminId,
                status: 'approved',
                reviewNotes: bulkAction.notes
            }));

            // Mock logAdminAction (chamado no final)
            db.query.mockResolvedValueOnce({rows: [{}]}); // logAdminAction

            // Execute
            const result = await adminReviewService.performBulkAction(bulkAction, adminId);

            // Verify que reviewSubmission foi chamado para cada submissão
            expect(reviewSubmissionSpy).toHaveBeenCalledTimes(3);
            expect(reviewSubmissionSpy).toHaveBeenNthCalledWith(1, 'sub1', adminId, 'approved', bulkAction.notes);
            expect(reviewSubmissionSpy).toHaveBeenNthCalledWith(2, 'sub2', adminId, 'approved', bulkAction.notes);
            expect(reviewSubmissionSpy).toHaveBeenNthCalledWith(3, 'sub3', adminId, 'approved', bulkAction.notes);

            // Verify logAdminAction foi chamado
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO admin_action_logs'),
                expect.arrayContaining([adminId, 'bulk_action', 'submission', 'multiple', expect.any(String)])
            );

            expect(logger.audit).toHaveBeenCalledWith('Bulk action performed', expect.any(Object));

            // Verify result structure
            expect(result).toEqual(expect.objectContaining({
                summary: {
                    total: 3,
                    successful: 3,
                    failed: 0
                },
                successful: ['sub1', 'sub2', 'sub3'],
                failed: []
            }));

            reviewSubmissionSpy.mockRestore();
        });

        test('deve tratar falhas individuais em ações em lote', async () => {
            // Setup
            const bulkAction = {
                submissionIds: ['sub1', 'sub2', 'sub3'],
                action: 'approve',
                notes: 'Aprovação em lote'
            };
            const adminId = 'admin-123';

            // Mock reviewSubmission com sucesso e falha
            const reviewSubmissionSpy = jest.spyOn(adminReviewService, 'reviewSubmission');
            reviewSubmissionSpy
                .mockResolvedValueOnce({id: 'review-1'}) // sub1 sucesso
                .mockRejectedValueOnce(new Error('Submissão não encontrada')) // sub2 falha
                .mockRejectedValueOnce(new Error('Erro ao atualizar')); // sub3 falha

            // Mock logAdminAction
            db.query.mockResolvedValueOnce({rows: [{}]});

            // Execute
            const result = await adminReviewService.performBulkAction(bulkAction, adminId);

            // Verify
            expect(reviewSubmissionSpy).toHaveBeenCalledTimes(3);

            expect(result).toEqual(expect.objectContaining({
                summary: {
                    total: 3,
                    successful: 1,
                    failed: 2
                },
                successful: ['sub1'],
                failed: [
                    {
                        submissionId: 'sub2',
                        error: 'Submissão não encontrada'
                    },
                    {
                        submissionId: 'sub3',
                        error: 'Erro ao atualizar'
                    }
                ]
            }));

            reviewSubmissionSpy.mockRestore();
        });

        test('deve validar número máximo de ações em lote', async () => {
            // Setup - assumindo maxBulkActions = 50
            const bulkAction = {
                submissionIds: Array(51).fill().map((_, i) => `sub${i}`), // 51 IDs (acima do limite)
                action: 'approve'
            };
            const adminId = 'admin-123';

            // Execute & Verify
            await expect(adminReviewService.performBulkAction(bulkAction, adminId))
                .rejects
                .toThrow('Máximo de');

            // Verify que nenhuma ação foi executada
            expect(logger.audit).not.toHaveBeenCalled();
        });

        test('deve validar ação em lote', async () => {
            // Setup
            const bulkAction = {
                submissionIds: ['sub1', 'sub2'],
                action: 'invalid_action' // Ação inválida
            };
            const adminId = 'admin-123';

            // Execute & Verify
            const result = await adminReviewService.performBulkAction(bulkAction, adminId);
            expect(result).toEqual(
                expect.objectContaining({
                    "failed": expect.arrayContaining([
                        expect.objectContaining({
                            "error": "Ação não suportada: invalid_action",
                            "submissionId": "sub1"
                        }),
                        expect.objectContaining({
                            "error": "Ação não suportada: invalid_action",
                            "submissionId": "sub2"
                        })
                    ]),
                    "successful": [],
                    "summary": {
                        "failed": 2,
                        "successful": 0,
                        "total": 2
                    }
                }),
            )

            // Verify que nenhuma ação foi executada
            expect(logger.audit).toHaveBeenCalled();
        });

        test('deve processar ação reject com reason', async () => {
            // Setup
            const bulkAction = {
                submissionIds: ['sub1'],
                action: 'reject',
                notes: 'Não atende aos critérios',
                reason: 'Conteúdo inadequado'
            };
            const adminId = 'admin-123';

            // Mock reviewSubmission
            const reviewSubmissionSpy = jest.spyOn(adminReviewService, 'reviewSubmission');
            reviewSubmissionSpy.mockResolvedValueOnce({id: 'review-1'});

            // Mock logAdminAction
            db.query.mockResolvedValueOnce({rows: [{}]});

            // Execute
            const result = await adminReviewService.performBulkAction(bulkAction, adminId);

            // Verify que reviewSubmission foi chamado com os parâmetros corretos para reject
            expect(reviewSubmissionSpy).toHaveBeenCalledWith(
                'sub1',
                adminId,
                'rejected',
                bulkAction.notes,
                bulkAction.reason
            );

            expect(result.summary.successful).toBe(1);

            reviewSubmissionSpy.mockRestore();
        });

        test('deve processar ação request_changes', async () => {
            // Setup
            const bulkAction = {
                submissionIds: ['sub1'],
                action: 'request_changes',
                notes: 'Necessárias algumas correções'
            };
            const adminId = 'admin-123';

            // Mock reviewSubmission
            const reviewSubmissionSpy = jest.spyOn(adminReviewService, 'reviewSubmission');
            reviewSubmissionSpy.mockResolvedValueOnce({id: 'review-1'});

            // Mock logAdminAction
            db.query.mockResolvedValueOnce({rows: [{}]});

            // Execute
            const result = await adminReviewService.performBulkAction(bulkAction, adminId);

            // Verify
            expect(reviewSubmissionSpy).toHaveBeenCalledWith(
                'sub1',
                adminId,
                'changes_requested',
                bulkAction.notes
            );

            expect(result.summary.successful).toBe(1);

            reviewSubmissionSpy.mockRestore();
        });

        test('deve processar ação extend_expiry', async () => {
            // Setup
            const bulkAction = {
                submissionIds: ['sub1'],
                action: 'extend_expiry'
            };
            const adminId = 'admin-123';

            // Mock extendSubmissionExpiry
            const extendExpirySpy = jest.spyOn(adminReviewService, 'extendSubmissionExpiry');
            extendExpirySpy.mockResolvedValueOnce({success: true});

            // Mock logAdminAction
            db.query.mockResolvedValueOnce({rows: [{}]});

            // Execute
            const result = await adminReviewService.performBulkAction(bulkAction, adminId);

            // Verify
            expect(extendExpirySpy).toHaveBeenCalledWith('sub1', 30);
            expect(result.summary.successful).toBe(1);

            extendExpirySpy.mockRestore();
        });
    });

    describe('getAdminActionLog', () => {
        test('deve retornar histórico de ações com filtros', async () => {
            // Setup
            const adminId = 'admin-123';
            const filters = {
                action: 'review',
                targetType: 'submission',
                dateFrom: new Date('2025-01-01'),
                dateTo: new Date('2025-07-01'),
                page: 1,
                limit: 20
            };

            const mockLogsResult = {
                rows: [
                    {
                        id: 'log1',
                        admin_id: 'admin-123',
                        admin_name: 'Admin User',
                        action: 'review',
                        target_id: 'sub1',
                        target_type: 'submission',
                        details: '{"status":"approved"}',
                        created_at: '2025-01-15T12:00:00Z'
                    },
                    {
                        id: 'log2',
                        admin_id: 'admin-123',
                        admin_name: 'Admin User',
                        action: 'review',
                        target_id: 'sub2',
                        target_type: 'submission',
                        details: '{"status":"rejected"}',
                        created_at: '2025-02-15T12:00:00Z'
                    }
                ]
            };

            const mockCountResult = {
                rows: [{count: '2'}]
            };

            // Mock database operations
            db.query
                .mockResolvedValueOnce(mockLogsResult)
                .mockResolvedValueOnce(mockCountResult);

            // Execute
            const result = await adminReviewService.getAdminActionLog(adminId, filters);

            // Verify
            expect(db.query).toHaveBeenCalledTimes(2);

            // Verify query contains filter parameters
            const queryCall = db.query.mock.calls[0][0];
            const paramsCall = db.query.mock.calls[0][1];

            expect(queryCall).toContain('WHERE');
            expect(queryCall).toContain('admin_id = $1');
            expect(queryCall).toContain('action = $2');
            expect(queryCall).toContain('target_type = $3');
            expect(queryCall).toContain('timestamp >= $4');
            expect(queryCall).toContain('timestamp <= $5');

            expect(paramsCall).toContain('admin-123');
            expect(paramsCall).toContain('review');
            expect(paramsCall).toContain('submission');

            // Verify result
            expect(result).toEqual({
                logs: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'log1',
                        admin_id: 'admin-123',
                        admin_name: 'Admin User',
                        action: 'review',
                        target_id: 'sub1',
                        target_type: 'submission'
                    }),
                    expect.objectContaining({
                        id: 'log2',
                        admin_id: 'admin-123',
                        admin_name: 'Admin User',
                        action: 'review',
                        target_id: 'sub2',
                        target_type: 'submission'
                    })
                ]),
                total: 2
            });
        });

        test('deve aplicar paginação corretamente', async () => {
            // Setup
            const adminId = 'admin-123';
            const filters = {
                page: 2,
                limit: 10
            };

            // Mock results
            db.query
                .mockResolvedValueOnce({rows: []})
                .mockResolvedValueOnce({rows: [{count: '25'}]});

            // Execute
            await adminReviewService.getAdminActionLog(adminId, filters);

            // Verify query contains pagination parameters
            const queryCall = db.query.mock.calls[0][0];
            const paramsCall = db.query.mock.calls[0][1];

            expect(queryCall).toContain('LIMIT $');
            expect(queryCall).toContain('OFFSET $');

            // Verify offset calculation: (page - 1) * limit = (2 - 1) * 10 = 10
            expect(paramsCall).toContain(10); // OFFSET
            expect(paramsCall).toContain(10); // LIMIT
        });

        test('deve tratar erros corretamente', async () => {
            // Setup
            const adminId = 'admin-123';
            const filters = {};
            const testError = new Error('Erro ao acessar banco de dados');

            // Make db.query throw an error
            db.query.mockRejectedValue(testError);

            // Execute & Verify
            await expect(adminReviewService.getAdminActionLog(adminId, filters))
                .rejects
                .toThrow(testError);

            expect(logger.error).toHaveBeenCalledWith('Error getting admin action log', expect.any(Object));
        });
    });

    describe('getSubmissionById', () => {
        test('deve retornar submissão por ID', async () => {
            // Setup
            const submissionId = 'sub-123';

            const mockSubmission = {
                id: submissionId,
                title: 'Test Submission',
                author_name: 'Test Author',
                author_email: 'author@example.com',
                category: 'article',
                status: 'pending',
                created_at: '2025-01-01T12:00:00Z',
                updated_at: '2025-01-02T12:00:00Z'
            };

            // Mock database operations - usar db.query ao invés de db.findById
            db.query.mockResolvedValueOnce({rows: [mockSubmission]});

            // Execute
            const result = await adminReviewService.getSubmissionById(submissionId);

            // Verify
            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM submissions WHERE id = $1',
                [submissionId]
            );

            // Verify result
            expect(result).toEqual(mockSubmission);
        });

        test('deve retornar null quando submissão não encontrada', async () => {
            // Setup
            const submissionId = 'non-existent';

            // Mock database operations - retornar array vazio
            db.query.mockResolvedValueOnce({rows: []});

            // Execute
            const result = await adminReviewService.getSubmissionById(submissionId);

            // Verify database call
            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM submissions WHERE id = $1',
                [submissionId]
            );

            // Verify result
            expect(result).toBeNull();
        });

        test('deve tratar erros corretamente', async () => {
            // Setup
            const submissionId = 'sub-123';
            const testError = new Error('Erro ao acessar banco de dados');

            // Make db.query reject
            db.query.mockRejectedValueOnce(testError);

            // Execute & Verify
            await expect(adminReviewService.getSubmissionById(submissionId))
                .rejects
                .toThrow('Erro ao acessar banco de dados');

            // Verify database call was attempted
            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM submissions WHERE id = $1',
                [submissionId]
            );
        });
    });
});
