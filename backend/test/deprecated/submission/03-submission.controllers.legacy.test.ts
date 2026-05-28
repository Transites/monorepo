import { Request, Response, NextFunction } from 'express';
import submissionController from '../../controllers/submission';
import submissionService from '../../services/submission';
import emailService from '../../services/email';
import responses from '../../utils/responses';
import { validationResult } from 'express-validator';
import untypedLogger from '../../middleware/logging';
import { LoggerWithAudit } from "../../types/migration";

const logger = untypedLogger as unknown as LoggerWithAudit;

// Mock dependencies
jest.mock('../../services/submission');
jest.mock('../../services/email');
jest.mock('../../utils/responses');
jest.mock('../../middleware/logging');
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('SubmissionController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1'
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    jest.clearAllMocks();

    // Mock validation result to be empty (no errors) by default
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });
  });

  describe('createSubmission', () => {
    const mockSubmissionData = {
      author_name: 'Test Author',
      author_email: 'test@example.com',
      title: 'Test Submission'
    };

    const mockCreatedSubmission = {
      id: 'mock-id',
      token: 'mock-token',
      title: 'Test Submission',
      status: 'DRAFT',
      author_name: 'Test Author',
      created_at: new Date(),
      expires_at: new Date()
    };

    beforeEach(() => {
      mockRequest.body = mockSubmissionData;
      (submissionService.createSubmission as jest.Mock).mockResolvedValue(mockCreatedSubmission);
    });

    test('deve retornar submissão criada com token', async () => {
      await submissionController.createSubmission(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.createSubmission).toHaveBeenCalledWith(mockSubmissionData);
      expect(responses.created).toHaveBeenCalled();
      expect(logger.audit).toHaveBeenCalled();
    });

    test('deve aplicar validações de entrada', async () => {
      // Mock validation errors
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Error message' }])
      });

      await submissionController.createSubmission(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.createSubmission).not.toHaveBeenCalled();
      expect(responses.badRequest).toHaveBeenCalled();
    });

    test('deve chamar next com erro em caso de falha', async () => {
      const mockError = new Error('Test error');
      (submissionService.createSubmission as jest.Mock).mockRejectedValue(mockError);

      await submissionController.createSubmission(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateSubmission', () => {
    const mockSubmissionId = 'mock-id';
    const mockToken = 'mock-token';
    const mockAuthorEmail = 'test@example.com';
    const mockUpdateData = {
      title: 'Updated Title',
      summary: 'Updated Summary'
    };

    const mockSubmission = {
      id: mockSubmissionId,
      token: mockToken,
      author_name: 'Test Author',
      author_email: mockAuthorEmail,
      title: 'Original Title',
      status: 'DRAFT'
    };

    const mockUpdatedSubmission = {
      ...mockSubmission,
      ...mockUpdateData,
      updated_at: new Date()
    };

    const mockStats = {
      completeness: {
        percentage: 75,
        missingFields: ['content'],
        isComplete: false
      }
    };

    beforeEach(() => {
      mockRequest.params = { token: mockToken };
      mockRequest.body = mockUpdateData;
      (mockRequest as any).submission = mockSubmission;
      (mockRequest as any).authorEmail = mockAuthorEmail;

      (submissionService.updateSubmission as jest.Mock).mockResolvedValue(mockUpdatedSubmission);
      (submissionService.getSubmissionStats as jest.Mock).mockResolvedValue(mockStats);
    });

    test('deve atualizar com middleware de token', async () => {
      await submissionController.updateSubmission(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.updateSubmission).toHaveBeenCalledWith(
        mockSubmissionId,
        mockUpdateData,
        mockAuthorEmail
      );
      expect(submissionService.getSubmissionStats).toHaveBeenCalledWith(mockSubmissionId);
      expect(responses.updated).toHaveBeenCalled();
    });

    test('deve validar dados de entrada', async () => {
      // Mock validation errors
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Error message' }])
      });

      await submissionController.updateSubmission(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.updateSubmission).not.toHaveBeenCalled();
      expect(responses.badRequest).toHaveBeenCalled();
    });
  });

  describe('autoSave', () => {
    const mockSubmissionId = 'mock-id';
    const mockToken = 'mock-token';
    const mockAuthorEmail = 'test@example.com';
    const mockUpdateData = {
      title: 'Draft Title',
      content: 'Draft Content'
    };

    const mockSubmission = {
      id: mockSubmissionId,
      token: mockToken,
      author_name: 'Test Author',
      author_email: mockAuthorEmail,
      title: 'Original Title',
      status: 'DRAFT'
    };

    const mockUpdatedSubmission = {
      ...mockSubmission,
      ...mockUpdateData,
      updated_at: new Date()
    };

    beforeEach(() => {
      mockRequest.params = { token: mockToken };
      mockRequest.body = mockUpdateData;
      (mockRequest as any).submission = mockSubmission;

      (submissionService.updateSubmission as jest.Mock).mockResolvedValue(mockUpdatedSubmission);
    });

    test('deve salvar sem validação rigorosa', async () => {
      await submissionController.autoSave(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.updateSubmission).toHaveBeenCalledWith(
        mockSubmissionId,
        mockUpdateData,
        mockAuthorEmail
      );
      expect(responses.success).toHaveBeenCalled();
    });

    test('deve retornar sucesso mesmo com falhas', async () => {
      const mockError = new Error('Test error');
      (submissionService.updateSubmission as jest.Mock).mockRejectedValue(mockError);

      await submissionController.autoSave(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(logger.warn).toHaveBeenCalled();
      expect(responses.success).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          autoSaved: false,
          error: expect.any(String)
        })
      );
      expect(mockNext).not.toHaveBeenCalled(); // Não deve propagar o erro
    });
  });
  describe('getSubmissionPreview', () => {
    const mockSubmissionId = 'mock-id';
    const mockToken = 'mock-token';

    const mockSubmission = {
      id: mockSubmissionId,
      token: mockToken,
      title: 'Test Submission',
      status: 'DRAFT'
    };

    const mockPreview = {
      html: '<div>Preview HTML content</div>',
      css: 'body { font-family: Arial; }',
      metadata: {
        title: 'Test Submission',
        author: 'Test Author'
      }
    };

    beforeEach(() => {
      mockRequest.params = { token: mockToken };
      (mockRequest as any).submission = mockSubmission;

      (submissionService.generatePreview as jest.Mock).mockResolvedValue(mockPreview);
    });

    test('deve gerar preview com sucesso', async () => {
      await submissionController.getSubmissionPreview(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.generatePreview).toHaveBeenCalledWith(mockSubmissionId);
      expect(responses.success).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          preview: mockPreview,
          disclaimers: expect.any(Array)
        }),
        'Preview gerado com sucesso'
      );
    });

    test('deve chamar next com erro em caso de falha', async () => {
      const mockError = new Error('Test error');
      (submissionService.generatePreview as jest.Mock).mockRejectedValue(mockError);

      await submissionController.getSubmissionPreview(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('submitForReview', () => {
    const mockSubmissionId = 'mock-id';
    const mockToken = 'mock-token';
    const mockAuthorEmail = 'test@example.com';

    const mockSubmission = {
      id: mockSubmissionId,
      token: mockToken,
      author_name: 'Test Author',
      author_email: mockAuthorEmail,
      title: 'Test Submission',
      status: 'DRAFT'
    };

    const mockUpdatedSubmission = {
      ...mockSubmission,
      status: 'UNDER_REVIEW',
      submitted_at: new Date()
    };

    beforeEach(() => {
      mockRequest.params = { token: mockToken };
      (mockRequest as any).submission = mockSubmission;
      (mockRequest as any).authorEmail = mockAuthorEmail;

      (submissionService.submitForReview as jest.Mock).mockResolvedValue(mockUpdatedSubmission);
    });

    test('deve enviar submissão para revisão com sucesso', async () => {
      await submissionController.submitForReview(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.submitForReview).toHaveBeenCalledWith(
        mockSubmissionId,
        mockAuthorEmail
      );
      expect(responses.success).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          submission: expect.objectContaining({
            id: mockUpdatedSubmission.id,
            status: mockUpdatedSubmission.status,
            submitted_at: mockUpdatedSubmission.submitted_at,
            title: mockUpdatedSubmission.title
          }),
          message: expect.any(String),
          nextSteps: expect.any(Array)
        }),
        'Submissão enviada para revisão com sucesso'
      );
    });

    test('deve chamar next com erro em caso de falha', async () => {
      const mockError = new Error('Test error');
      (submissionService.submitForReview as jest.Mock).mockRejectedValue(mockError);

      await submissionController.submitForReview(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getSubmissionByToken', () => {
    const mockToken = 'mock-token';
    const mockSubmission = {
      id: 'mock-id',
      token: mockToken,
      title: 'Test Submission',
      status: 'DRAFT',
      author_name: 'Test Author',
      created_at: new Date(),
      expires_at: new Date()
    };

    beforeEach(() => {
      mockRequest.params = { token: mockToken };
      mockRequest.query = { include_versions: 'false' };
    });

    test('deve retornar submissão quando encontrada', async () => {
      (submissionService.getSubmissionByToken as jest.Mock).mockResolvedValue({
        found: true,
        submission: mockSubmission,
        tokenInfo: { isValid: true, daysRemaining: 30 }
      });

      await submissionController.getSubmissionByToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.getSubmissionByToken).toHaveBeenCalledWith(mockToken, false);
      expect(responses.success).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          submission: mockSubmission,
          tokenInfo: expect.any(Object),
          canEdit: expect.any(Boolean),
          canSubmitForReview: expect.any(Boolean)
        }),
        'Submissão encontrada'
      );
    });

    test('deve retornar erro 410 quando token expirado', async () => {
      (submissionService.getSubmissionByToken as jest.Mock).mockResolvedValue({
        found: false,
        reason: 'TOKEN_EXPIRED',
        submission: { ...mockSubmission, status: 'EXPIRED' }
      });

      await submissionController.getSubmissionByToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responses.error).toHaveBeenCalledWith(
        mockResponse,
        'Token expirado',
        410,
        expect.objectContaining({
          reason: 'TOKEN_EXPIRED',
          canRecover: true,
          submission: expect.any(Object)
        })
      );
    });

    test('deve retornar 404 quando submissão não encontrada', async () => {
      (submissionService.getSubmissionByToken as jest.Mock).mockResolvedValue({
        found: false,
        reason: 'NOT_FOUND'
      });

      await submissionController.getSubmissionByToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responses.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Submissão não encontrada'
      );
    });

    test('deve incluir versões quando solicitado', async () => {
      mockRequest.query = { include_versions: 'true' };

      (submissionService.getSubmissionByToken as jest.Mock).mockResolvedValue({
        found: true,
        submission: { ...mockSubmission, versions: [{ id: 'v1' }, { id: 'v2' }] },
        tokenInfo: { isValid: true, daysRemaining: 30 }
      });

      await submissionController.getSubmissionByToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.getSubmissionByToken).toHaveBeenCalledWith(mockToken, true);
      expect(responses.success).toHaveBeenCalled();
    });

    test('deve chamar next com erro em caso de falha', async () => {
      const mockError = new Error('Test error');
      (submissionService.getSubmissionByToken as jest.Mock).mockRejectedValue(mockError);

      await submissionController.getSubmissionByToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getSubmissionStats', () => {
    const mockSubmissionId = 'mock-id';
    const mockToken = 'mock-token';

    const mockSubmission = {
      id: mockSubmissionId,
      token: mockToken,
      title: 'Test Submission',
      status: 'DRAFT'
    };

    const mockStats = {
      contentStats: {
        wordCount: 1500,
        readingTime: 8,
        complexity: 'medium'
      },
      completeness: {
        percentage: 75,
        missingFields: ['references'],
        isComplete: false
      },
      version_count: 3,
      attachment_count: 2,
      feedback_count: 1,
      days_since_creation: 5.5,
      days_to_expiry: 24.3
    };

    beforeEach(() => {
      mockRequest.params = { token: mockToken };
      (mockRequest as any).submission = mockSubmission;

      (submissionService.getSubmissionStats as jest.Mock).mockResolvedValue(mockStats);
    });

    test('deve retornar estatísticas formatadas corretamente', async () => {
      await submissionController.getSubmissionStats(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.getSubmissionStats).toHaveBeenCalledWith(mockSubmissionId);
      expect(responses.success).toHaveBeenCalledWith(
        mockResponse,
        {
          stats: {
            content: mockStats.contentStats,
            completeness: mockStats.completeness,
            versions: mockStats.version_count,
            attachments: mockStats.attachment_count,
            feedback: mockStats.feedback_count,
            timeline: {
              daysSinceCreation: Math.floor(mockStats.days_since_creation),
              daysToExpiry: Math.ceil(mockStats.days_to_expiry)
            }
          }
        },
        'Estatísticas da submissão'
      );
    });

    test('deve chamar next com erro em caso de falha', async () => {
      const mockError = new Error('Test error');
      (submissionService.getSubmissionStats as jest.Mock).mockRejectedValue(mockError);

      await submissionController.getSubmissionStats(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getAuthorSubmissions', () => {
    const mockEmail = 'test@example.com';
    const mockPage = 1;
    const mockLimit = 10;

    const mockSubmissions = [
      {
        id: 'submission-1',
        title: 'Test Submission 1',
        status: 'DRAFT',
        author_name: 'Test Author',
        author_email: mockEmail,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'submission-2',
        title: 'Test Submission 2',
        status: 'UNDER_REVIEW',
        author_name: 'Test Author',
        author_email: mockEmail,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const mockPagination = {
      total: 2,
      page: mockPage,
      limit: mockLimit,
      pages: 1
    };

    const mockResult = {
      submissions: mockSubmissions,
      pagination: mockPagination
    };

    beforeEach(() => {
      mockRequest.query = {
        email: mockEmail,
        page: mockPage.toString(),
        limit: mockLimit.toString()
      };

      (submissionService.getSubmissionsByAuthor as jest.Mock).mockResolvedValue(mockResult);
    });

    test('deve retornar submissões do autor com paginação', async () => {
      await submissionController.getAuthorSubmissions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.getSubmissionsByAuthor).toHaveBeenCalledWith(
        mockEmail,
        { page: mockPage, limit: mockLimit }
      );
      expect(responses.success).toHaveBeenCalledWith(
        mockResponse,
        {
          submissions: mockSubmissions,
          pagination: mockPagination
        },
        'Submissões do autor'
      );
    });

    test('deve usar valores padrão para paginação quando não fornecidos', async () => {
      mockRequest.query = { email: mockEmail };

      await submissionController.getAuthorSubmissions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.getSubmissionsByAuthor).toHaveBeenCalledWith(
        mockEmail,
        { page: 1, limit: 10 }
      );
    });

    test('deve validar dados de entrada', async () => {
      // Mock validation errors
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Error message' }])
      });

      await submissionController.getAuthorSubmissions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.getSubmissionsByAuthor).not.toHaveBeenCalled();
      expect(responses.badRequest).toHaveBeenCalled();
    });

    test('deve chamar next com erro em caso de falha', async () => {
      const mockError = new Error('Test error');
      (submissionService.getSubmissionsByAuthor as jest.Mock).mockRejectedValue(mockError);

      await submissionController.getAuthorSubmissions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(logger.error).toHaveBeenCalled();
    });
  });
  describe('checkInProgressArticles', () => {
    const mockEmail = 'test@example.com';
    const mockSubmissions = [
      {
        id: 'mock-id-1',
        token: 'mock-token-1',
        title: 'Test Submission 1',
        status: 'DRAFT',
        category: 'Category 1',
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(),
        feedback_count: 0
      },
      {
        id: 'mock-id-2',
        token: 'mock-token-2',
        title: 'Test Submission 2',
        status: 'CHANGES_REQUESTED',
        category: 'Category 2',
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(),
        feedback_count: 1
      }
    ];

    const mockResult = {
      submissions: mockSubmissions,
      pagination: {
        page: 1,
        limit: 2,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    };

    beforeEach(() => {
      mockRequest.body = { email: mockEmail };
      (submissionService.getInProgressSubmissionsByAuthor as jest.Mock).mockResolvedValue(mockResult);
      (emailService.sendSubmissionAccessLinks as jest.Mock).mockResolvedValue({ success: true });
    });

    test('deve retornar sucesso quando encontrar artigos em progresso', async () => {
      await submissionController.checkInProgressArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.getInProgressSubmissionsByAuthor).toHaveBeenCalledWith(mockEmail);
      expect(responses.success).toHaveBeenCalledWith(
        mockResponse,
        {
          count: 2,
          message: `Um email com os acessos para os 2 artigos em progresso foi enviado para ${mockEmail}`
        }
      );
      expect(logger.audit).toHaveBeenCalled();
    });

    test('deve retornar 404 quando não encontrar artigos em progresso', async () => {
      (submissionService.getInProgressSubmissionsByAuthor as jest.Mock).mockResolvedValue({
        submissions: [],
        pagination: {
          page: 1,
          limit: 0,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      });

      await submissionController.checkInProgressArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.getInProgressSubmissionsByAuthor).toHaveBeenCalledWith(mockEmail);
      expect(responses.notFound).toHaveBeenCalled();
      expect(emailService.sendSubmissionAccessLinks).not.toHaveBeenCalled();
    });

    test('deve aplicar validações de entrada', async () => {
      // Mock validation errors
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Email inválido' }])
      });

      await submissionController.checkInProgressArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.getInProgressSubmissionsByAuthor).not.toHaveBeenCalled();
      expect(responses.badRequest).toHaveBeenCalled();
      expect(emailService.sendSubmissionAccessLinks).not.toHaveBeenCalled();
    });

    test('deve lidar com erros no envio de email', async () => {
      // Setup to test the async email sending
      jest.spyOn(global, 'setImmediate').mockImplementation((callback) => {
        callback();
        return { unref: jest.fn() } as any;
      });

      (emailService.sendSubmissionAccessLinks as jest.Mock).mockRejectedValue(new Error('Email error'));

      await submissionController.checkInProgressArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(submissionService.getInProgressSubmissionsByAuthor).toHaveBeenCalledWith(mockEmail);
      expect(responses.success).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Failed to send submission access links email', expect.any(Object));
    });

    test('deve chamar next com erro em caso de falha no serviço', async () => {
      const mockError = new Error('Service error');
      (submissionService.getInProgressSubmissionsByAuthor as jest.Mock).mockRejectedValue(mockError);

      await submissionController.checkInProgressArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(emailService.sendSubmissionAccessLinks).not.toHaveBeenCalled();
    });
  });
});
