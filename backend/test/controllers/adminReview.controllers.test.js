const { validationResult } = require('express-validator');
const logger = require('../../middleware/logging');
const ResponseHelpers = require('../../utils/responses');

// Mock dependencies
jest.mock('express-validator');
jest.mock('../../middleware/logging');
jest.mock('../../services/adminReview');
jest.mock('../../utils/responses');

describe('AdminReviewController', () => {
  let adminReviewController;
  let adminReviewService;
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mocks
    adminReviewService = require('../../services/adminReview').default;

    adminReviewService.getDashboard = jest.fn();
    adminReviewService.getSubmissions = jest.fn();
    adminReviewService.reviewSubmission = jest.fn();
    adminReviewService.sendFeedback = jest.fn();
    adminReviewService.publishSubmission = jest.fn();
    adminReviewService.searchSubmissions = jest.fn();
    adminReviewService.performBulkAction = jest.fn();
    adminReviewService.getAdminActionLog = jest.fn();
    adminReviewService.getSubmissionById = jest.fn();

    ResponseHelpers.success = jest.fn().mockReturnThis();
    ResponseHelpers.badRequest = jest.fn().mockReturnThis();
    ResponseHelpers.notFound = jest.fn().mockReturnThis();
    ResponseHelpers.created = jest.fn().mockReturnThis();
    ResponseHelpers.error = jest.fn().mockReturnThis();

    // Import controller (after mocks are set up)
    const AdminReviewController = require('../../controllers/adminReview');
    adminReviewController = new AdminReviewController.default(
      adminReviewService,
      logger,
      ResponseHelpers
    );


    // Setup request, response, next
    req = {
      user: { id: 'admin-123', email: 'admin@example.com', name: 'Admin User' },
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    // Default validation result for most tests
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });
  });

  describe('getDashboard', () => {
    test('deve retornar dashboard com sucesso', async () => {
      // Setup
      const mockDashboard = {
        stats: {
          totalSubmissions: 100,
          pendingReview: 25,
          approved: 50,
          rejected: 15,
          changesRequested: 10
        },
        recentActivity: [
          { id: 'act1', action: 'review', timestamp: new Date().toISOString() }
        ]
      };

      adminReviewService.getDashboard.mockResolvedValue(mockDashboard);

      // Execute
      await adminReviewController.getDashboard(req, res, next);

      // Verify
      expect(adminReviewService.getDashboard).toHaveBeenCalledWith('admin-123');
      expect(ResponseHelpers.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          dashboard: mockDashboard,
          timestamp: expect.any(String)
        }),
        'Dashboard carregado com sucesso'
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('deve tratar erros corretamente', async () => {
      // Setup
      const testError = new Error('Erro ao carregar dashboard');
      adminReviewService.getDashboard.mockRejectedValue(testError);

      // Execute
      await adminReviewController.getDashboard(req, res, next);

      // Verify
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting admin dashboard',
        expect.objectContaining({
          adminId: 'admin-123',
          error: 'Erro ao carregar dashboard'
        })
      );
      expect(next).toHaveBeenCalledWith(testError);
    });
  });

  describe('getSubmissions', () => {
    test('deve retornar submissões com filtros', async () => {
      // Setup
      req.query = {
        status: 'pending,approved',
        category: 'article,essay',
        page: '2',
        limit: '10',
        sortBy: 'created_at',
        sortOrder: 'asc'
      };

      const mockResult = {
        submissions: [
          { id: 'sub1', title: 'Submission 1', status: 'pending' },
          { id: 'sub2', title: 'Submission 2', status: 'approved' }
        ],
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3
      };

      adminReviewService.getSubmissions.mockResolvedValue(mockResult);

      // Execute
      await adminReviewController.getSubmissions(req, res, next);

      // Verify
      expect(adminReviewService.getSubmissions).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ['pending', 'approved'],
          category: ['article', 'essay'],
          page: 2,
          limit: 10,
          sortBy: 'created_at',
          sortOrder: 'asc'
        }),
        'admin-123'
      );

      expect(ResponseHelpers.success).toHaveBeenCalledWith(
        res,
        mockResult,
        'Submissões carregadas com sucesso'
      );
    });

    test('deve validar filtros inválidos', async () => {
      // Setup
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Filtro inválido' }])
      });

      // Execute
      await adminReviewController.getSubmissions(req, res, next);

      // Verify
      expect(adminReviewService.getSubmissions).not.toHaveBeenCalled();
      expect(ResponseHelpers.badRequest).toHaveBeenCalledWith(
        res,
        'Filtros inválidos',
        [{ msg: 'Filtro inválido' }]
      );
    });

    test('deve tratar erros corretamente', async () => {
      // Setup
      const testError = new Error('Erro ao buscar submissões');
      adminReviewService.getSubmissions.mockRejectedValue(testError);

      // Execute
      await adminReviewController.getSubmissions(req, res, next);

      // Verify
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting submissions for admin',
        expect.objectContaining({
          adminId: 'admin-123',
          error: 'Erro ao buscar submissões'
        })
      );
      expect(next).toHaveBeenCalledWith(testError);
    });
  });

  describe('reviewSubmission', () => {
    test('deve revisar submissão com sucesso', async () => {
      // Setup
      req.params = { id: 'sub-123' };
      req.body = {
        status: 'approved',
        notes: 'Excelente trabalho!'
      };

      const mockReview = {
        id: 'review-123',
        submissionId: 'sub-123',
        adminId: 'admin-123',
        status: 'approved',
        notes: 'Excelente trabalho!',
        createdAt: new Date().toISOString()
      };

      adminReviewService.reviewSubmission.mockResolvedValue(mockReview);

      // Execute
      await adminReviewController.reviewSubmission(req, res, next);

      // Verify
      expect(adminReviewService.reviewSubmission).toHaveBeenCalledWith(
        'sub-123',
        'admin-123',
        'approved',
        'Excelente trabalho!',
        undefined
      );

      expect(logger.audit).toHaveBeenCalledWith(
        'Submission reviewed via API',
        expect.objectContaining({
          submissionId: 'sub-123',
          adminId: 'admin-123',
          status: 'approved'
        })
      );

      expect(ResponseHelpers.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          review: mockReview,
          message: expect.any(String)
        }),
        'Revisão realizada com sucesso'
      );
    });

    test('deve validar dados de revisão inválidos', async () => {
      // Setup
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Status inválido' }])
      });

      // Execute
      await adminReviewController.reviewSubmission(req, res, next);

      // Verify
      expect(adminReviewService.reviewSubmission).not.toHaveBeenCalled();
      expect(ResponseHelpers.badRequest).toHaveBeenCalledWith(
        res,
        'Dados de revisão inválidos',
        [{ msg: 'Status inválido' }]
      );
    });

    test('deve tratar erros corretamente', async () => {
      // Setup
      req.params = { id: 'sub-123' };
      req.body = { status: 'approved' };

      const testError = new Error('Erro ao revisar submissão');
      adminReviewService.reviewSubmission.mockRejectedValue(testError);

      // Execute
      await adminReviewController.reviewSubmission(req, res, next);

      // Verify
      expect(logger.error).toHaveBeenCalledWith(
        'Error reviewing submission',
        expect.objectContaining({
          submissionId: 'sub-123',
          adminId: 'admin-123',
          error: 'Erro ao revisar submissão'
        })
      );
      expect(next).toHaveBeenCalledWith(testError);
    });
  });

  describe('sendFeedback', () => {
    test('deve enviar feedback com sucesso', async () => {
      // Setup
      req.params = { id: 'sub-123' };
      req.body = {
        content: 'Este é um feedback para o autor.',
        isPublic: true
      };

      const mockFeedback = {
        id: 'feedback-123',
        submissionId: 'sub-123',
        adminId: 'admin-123',
        content: 'Este é um feedback para o autor.',
        createdAt: new Date().toISOString()
      };

      adminReviewService.sendFeedback.mockResolvedValue(mockFeedback);

      // Execute
      await adminReviewController.sendFeedback(req, res, next);

      // Verify
      expect(adminReviewService.sendFeedback).toHaveBeenCalledWith(
        'sub-123',
        'admin-123',
        'Este é um feedback para o autor.'
      );

      expect(logger.audit).toHaveBeenCalledWith(
        'Feedback sent via API',
        expect.objectContaining({
          submissionId: 'sub-123',
          adminId: 'admin-123',
          feedbackId: 'feedback-123'
        })
      );

      expect(ResponseHelpers.created).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          feedback: mockFeedback,
          message: 'Feedback enviado com sucesso'
        }),
        'Feedback enviado para o autor'
      );
    });

    test('deve validar dados de feedback inválidos', async () => {
      // Setup
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Conteúdo obrigatório' }])
      });

      // Execute
      await adminReviewController.sendFeedback(req, res, next);

      // Verify
      expect(adminReviewService.sendFeedback).not.toHaveBeenCalled();
      expect(ResponseHelpers.badRequest).toHaveBeenCalledWith(
        res,
        'Dados de feedback inválidos',
        [{ msg: 'Conteúdo obrigatório' }]
      );
    });

    test('deve tratar erros corretamente', async () => {
      // Setup
      req.params = { id: 'sub-123' };
      req.body = { content: 'Feedback de teste' };

      const testError = new Error('Erro ao enviar feedback');
      adminReviewService.sendFeedback.mockRejectedValue(testError);

      // Execute
      await adminReviewController.sendFeedback(req, res, next);

      // Verify
      expect(logger.error).toHaveBeenCalledWith(
        'Error sending feedback',
        expect.objectContaining({
          submissionId: 'sub-123',
          adminId: 'admin-123',
          error: 'Erro ao enviar feedback'
        })
      );
      expect(next).toHaveBeenCalledWith(testError);
    });
  });

  describe('publishSubmission', () => {
    test('deve publicar submissão com sucesso', async () => {
      // Setup
      req.params = { id: 'sub-123' };
      req.body = {
        publishNotes: 'Notas para publicação',
        scheduledFor: '2025-08-01T12:00:00Z',
        categoryOverride: 'artigo-especial',
        keywordsOverride: ['keyword1', 'keyword2']
      };

      const mockResult = {
        success: true,
        articleId: 'article-123',
        publishedAt: new Date().toISOString()
      };

      adminReviewService.publishSubmission.mockResolvedValue(mockResult);

      // Execute
      await adminReviewController.publishSubmission(req, res, next);

      // Verify
      expect(adminReviewService.publishSubmission).toHaveBeenCalledWith(
        'sub-123',
        'admin-123',
        expect.objectContaining({
          submissionId: 'sub-123',
          publishNotes: 'Notas para publicação',
          scheduledFor: expect.any(Date),
          categoryOverride: 'artigo-especial',
          keywordsOverride: ['keyword1', 'keyword2']
        })
      );

      expect(logger.audit).toHaveBeenCalledWith(
        'Article published via API',
        expect.objectContaining({
          submissionId: 'sub-123',
          articleId: 'article-123',
          adminId: 'admin-123'
        })
      );

      expect(ResponseHelpers.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          articleId: 'article-123',
          publishedAt: expect.any(String),
          message: 'Artigo publicado com sucesso'
        }),
        'Submissão publicada como artigo'
      );
    });

    test('deve tratar falha na publicação', async () => {
      // Setup
      req.params = { id: 'sub-123' };
      req.body = { publishNotes: 'Notas para publicação' };

      const mockResult = {
        success: false,
        error: 'Submissão não está aprovada'
      };

      adminReviewService.publishSubmission.mockResolvedValue(mockResult);

      // Execute
      await adminReviewController.publishSubmission(req, res, next);

      // Verify
      expect(ResponseHelpers.error).toHaveBeenCalledWith(
        res,
        'Submissão não está aprovada',
        400
      );
    });

    test('deve validar dados de publicação inválidos', async () => {
      // Setup
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Data inválida' }])
      });

      // Execute
      await adminReviewController.publishSubmission(req, res, next);

      // Verify
      expect(adminReviewService.publishSubmission).not.toHaveBeenCalled();
      expect(ResponseHelpers.badRequest).toHaveBeenCalledWith(
        res,
        'Dados de publicação inválidos',
        [{ msg: 'Data inválida' }]
      );
    });

    test('deve tratar erros corretamente', async () => {
      // Setup
      req.params = { id: 'sub-123' };
      req.body = { publishNotes: 'Notas para publicação' };

      const testError = new Error('Erro ao publicar submissão');
      adminReviewService.publishSubmission.mockRejectedValue(testError);

      // Execute
      await adminReviewController.publishSubmission(req, res, next);

      // Verify
      expect(logger.error).toHaveBeenCalledWith(
        'Error publishing submission',
        expect.objectContaining({
          submissionId: 'sub-123',
          adminId: 'admin-123',
          error: 'Erro ao publicar submissão'
        })
      );
      expect(next).toHaveBeenCalledWith(testError);
    });
  });

  describe('searchSubmissions', () => {
    test('deve buscar submissões com sucesso', async () => {
      // Setup
      req.query = {
        q: 'termo de busca',
        status: 'pending,approved',
        category: 'article'
      };

      const mockSubmissions = [
        { id: 'sub1', title: 'Submission with termo', status: 'pending' },
        { id: 'sub2', title: 'Another termo de busca', status: 'approved' }
      ];

      adminReviewService.searchSubmissions.mockResolvedValue(mockSubmissions);

      // Execute
      await adminReviewController.searchSubmissions(req, res, next);

      // Verify
      expect(adminReviewService.searchSubmissions).toHaveBeenCalledWith(
        'termo de busca',
        'admin-123',
        expect.objectContaining({
          status: ['pending', 'approved'],
          category: ['article']
        })
      );

      expect(ResponseHelpers.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          submissions: mockSubmissions,
          query: 'termo de busca',
          count: 2
        }),
        'Busca realizada com sucesso'
      );
    });

    test('deve validar query de busca muito curta', async () => {
      // Setup
      req.query = { q: 'a' }; // Menos de 2 caracteres

      // Execute
      await adminReviewController.searchSubmissions(req, res, next);

      // Verify
      expect(adminReviewService.searchSubmissions).not.toHaveBeenCalled();
      expect(ResponseHelpers.badRequest).toHaveBeenCalledWith(
        res,
        'Query de busca deve ter pelo menos 2 caracteres'
      );
    });

    test('deve validar parâmetros de busca inválidos', async () => {
      // Setup
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Parâmetro inválido' }])
      });

      // Execute
      await adminReviewController.searchSubmissions(req, res, next);

      // Verify
      expect(adminReviewService.searchSubmissions).not.toHaveBeenCalled();
      expect(ResponseHelpers.badRequest).toHaveBeenCalledWith(
        res,
        'Parâmetros de busca inválidos',
        [{ msg: 'Parâmetro inválido' }]
      );
    });

    test('deve tratar erros corretamente', async () => {
      // Setup
      req.query = { q: 'termo de busca' };

      const testError = new Error('Erro na busca');
      adminReviewService.searchSubmissions.mockRejectedValue(testError);

      // Execute
      await adminReviewController.searchSubmissions(req, res, next);

      // Verify
      expect(logger.error).toHaveBeenCalledWith(
        'Error searching submissions',
        expect.objectContaining({
          adminId: 'admin-123',
          query: 'termo de busca',
          error: 'Erro na busca'
        })
      );
      expect(next).toHaveBeenCalledWith(testError);
    });
  });

  describe('performBulkAction', () => {
    test('deve realizar ação em lote com sucesso', async () => {
      // Setup
      req.body = {
        submissionIds: ['sub1', 'sub2', 'sub3'],
        action: 'approve',
        notes: 'Aprovação em lote',
        reason: 'Todos atendem aos critérios'
      };

      const mockResult = {
        summary: {
          total: 3,
          successful: 3,
          failed: 0
        },
        results: [
          { id: 'sub1', success: true },
          { id: 'sub2', success: true },
          { id: 'sub3', success: true }
        ]
      };

      adminReviewService.performBulkAction.mockResolvedValue(mockResult);

      // Execute
      await adminReviewController.performBulkAction(req, res, next);

      // Verify
      expect(adminReviewService.performBulkAction).toHaveBeenCalledWith(
        expect.objectContaining({
          submissionIds: ['sub1', 'sub2', 'sub3'],
          action: 'approve',
          notes: 'Aprovação em lote',
          reason: 'Todos atendem aos critérios'
        }),
        'admin-123'
      );

      expect(logger.audit).toHaveBeenCalledWith(
        'Bulk action performed via API',
        expect.objectContaining({
          adminId: 'admin-123',
          action: 'approve',
          submissionCount: 3,
          successful: 3,
          failed: 0
        })
      );

      expect(ResponseHelpers.success).toHaveBeenCalledWith(
        res,
        mockResult,
        'Ação realizada com sucesso em 3 submissões'
      );
    });

    test('deve tratar ações em lote com falhas parciais', async () => {
      // Setup
      req.body = {
        submissionIds: ['sub1', 'sub2', 'sub3'],
        action: 'approve'
      };

      const mockResult = {
        summary: {
          total: 3,
          successful: 2,
          failed: 1
        },
        results: [
          { id: 'sub1', success: true },
          { id: 'sub2', success: true },
          { id: 'sub3', success: false, error: 'Submissão não encontrada' }
        ]
      };

      adminReviewService.performBulkAction.mockResolvedValue(mockResult);

      // Execute
      await adminReviewController.performBulkAction(req, res, next);

      // Verify
      expect(ResponseHelpers.success).toHaveBeenCalledWith(
        res,
        mockResult,
        'Ação realizada: 2 sucessos, 1 falhas'
      );
    });

    test('deve validar dados de ação em lote inválidos', async () => {
      // Setup
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Ação inválida' }])
      });

      // Execute
      await adminReviewController.performBulkAction(req, res, next);

      // Verify
      expect(adminReviewService.performBulkAction).not.toHaveBeenCalled();
      expect(ResponseHelpers.badRequest).toHaveBeenCalledWith(
        res,
        'Dados de ação em lote inválidos',
        [{ msg: 'Ação inválida' }]
      );
    });

    test('deve tratar erros corretamente', async () => {
      // Setup
      req.body = {
        submissionIds: ['sub1', 'sub2'],
        action: 'approve'
      };

      const testError = new Error('Erro na ação em lote');
      adminReviewService.performBulkAction.mockRejectedValue(testError);

      // Execute
      await adminReviewController.performBulkAction(req, res, next);

      // Verify
      expect(logger.error).toHaveBeenCalledWith(
        'Error performing bulk action',
        expect.objectContaining({
          adminId: 'admin-123',
          action: 'approve',
          submissionCount: 2,
          error: 'Erro na ação em lote'
        })
      );
      expect(next).toHaveBeenCalledWith(testError);
    });
  });

  describe('getActivityLog', () => {
    test('deve retornar histórico de atividades com sucesso', async () => {
      // Setup
      req.query = {
        action: 'review',
        targetType: 'submission',
        dateFrom: '2025-01-01',
        dateTo: '2025-07-19',
        page: '1',
        limit: '20'
      };

      const mockResult = {
        logs: [
          {
            id: 'log1',
            adminId: 'admin-123',
            action: 'review',
            targetId: 'sub1',
            targetType: 'submission',
            timestamp: new Date().toISOString()
          }
        ],
        total: 1
      };

      adminReviewService.getAdminActionLog.mockResolvedValue(mockResult);

      // Execute
      await adminReviewController.getActivityLog(req, res, next);

      // Verify
      expect(adminReviewService.getAdminActionLog).toHaveBeenCalledWith(
        'admin-123',
        expect.objectContaining({
          action: 'review',
          targetType: 'submission',
          dateFrom: expect.any(Date),
          dateTo: expect.any(Date),
          page: 1,
          limit: 20
        })
      );

      expect(ResponseHelpers.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          logs: mockResult.logs,
          total: 1,
          filters: expect.any(Object)
        }),
        'Histórico de ações carregado'
      );
    });

    test('deve tratar erros corretamente', async () => {
      // Setup
      const testError = new Error('Erro ao carregar histórico');
      adminReviewService.getAdminActionLog.mockRejectedValue(testError);

      // Execute
      await adminReviewController.getActivityLog(req, res, next);

      // Verify
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting activity log',
        expect.objectContaining({
          adminId: 'admin-123',
          error: 'Erro ao carregar histórico'
        })
      );
      expect(next).toHaveBeenCalledWith(testError);
    });
  });

  describe('getReviewMessage', () => {
    test('deve retornar mensagem correta para cada status', () => {
      // Testando método privado através de método público
      req.params = { id: 'sub-123' };

      // Aprovado
      req.body = { status: 'approved' };
      adminReviewService.reviewSubmission.mockResolvedValue({});
      adminReviewController.reviewSubmission(req, res, next);
      expect(ResponseHelpers.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: 'Submissão aprovada. Agora pode ser publicada.'
        }),
        expect.anything()
      );

      // Rejeitado
      jest.clearAllMocks();
      req.body = { status: 'rejected' };
      adminReviewService.reviewSubmission.mockResolvedValue({});
      adminReviewController.reviewSubmission(req, res, next);
      expect(ResponseHelpers.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: 'Submissão rejeitada. Autor será notificado.'
        }),
        expect.anything()
      );

      // Correções solicitadas
      jest.clearAllMocks();
      req.body = { status: 'changes_requested' };
      adminReviewService.reviewSubmission.mockResolvedValue({});
      adminReviewController.reviewSubmission(req, res, next);
      expect(ResponseHelpers.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: 'Correções solicitadas. Autor será notificado.'
        }),
        expect.anything()
      );

      // Pendente
      jest.clearAllMocks();
      req.body = { status: 'pending' };
      adminReviewService.reviewSubmission.mockResolvedValue({});
      adminReviewController.reviewSubmission(req, res, next);
      expect(ResponseHelpers.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: 'Revisão iniciada.'
        }),
        expect.anything()
      );

      // Status desconhecido
      jest.clearAllMocks();
      req.body = { status: 'unknown_status' };
      adminReviewService.reviewSubmission.mockResolvedValue({});
      adminReviewController.reviewSubmission(req, res, next);
      expect(ResponseHelpers.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: 'Revisão processada.'
        }),
        expect.anything()
      );
    });
  });
});
