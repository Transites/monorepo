const SubmissionSuggestionsControllerModule = require('../../controllers/submissionSuggestions');
const SubmissionSuggestionsController = SubmissionSuggestionsControllerModule.default || SubmissionSuggestionsControllerModule;

const responsesModule = require('../../utils/responses');
const responses = responsesModule.default || responsesModule;

const { handleControllerError } = require('../../utils/errorHandler');

// Mocks das dependências externas
jest.mock('../../utils/responses', () => ({
  success: jest.fn(),
  created: jest.fn(),
  badRequest: jest.fn(),
  notFound: jest.fn(),
}));

jest.mock('../../utils/errorHandler', () => ({
  handleControllerError: jest.fn(),
}));

jest.mock('../../middleware/logging', () => ({
  audit: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

describe('SubmissionSuggestionsController', () => {
  let controller;
  let mockService;
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      getSubmissionForReview: jest.fn(),
      createSuggestion: jest.fn(),
      getSuggestionsBySubmission: jest.fn(),
      getPendingSuggestion: jest.fn(),
      verifyAuthorOwnership: jest.fn(),
      acceptSuggestion: jest.fn(),
      createAuthorCounterProposal: jest.fn(),
      getVersionsBySubmission: jest.fn(),
    };

    controller = new SubmissionSuggestionsController(mockService);

    req = {
      params: { id: 'sub-123', suggestionId: 'sugg-123' },
      user: { id: 'admin-456', email: 'author@test.com' },
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  describe('getSubmissionForReview', () => {
    it('deve retornar success carregando submissão para revisão', async () => {
      const mockResult = { submission: { id: 'sub-123' }, suggestions: [] };
      mockService.getSubmissionForReview.mockResolvedValue(mockResult);

      await controller.getSubmissionForReview(req, res, next);

      expect(mockService.getSubmissionForReview).toHaveBeenCalledWith('sub-123');
      expect(responses.success).toHaveBeenCalledWith(res, mockResult, 'Submissão carregada para revisão');
    });

    it('deve delegar erro para handleControllerError', async () => {
      const error = new Error('Falha no banco');
      mockService.getSubmissionForReview.mockRejectedValue(error);

      await controller.getSubmissionForReview(req, res, next);

      expect(handleControllerError).toHaveBeenCalledWith(error, res, next, expect.any(Object));
    });
  });

  describe('createSuggestion', () => {
    it('deve retornar badRequest se campo notes não existir', async () => {
      req.body = { suggested_title: 'Title' };
      await controller.createSuggestion(req, res, next);

      expect(responses.badRequest).toHaveBeenCalledWith(res, 'Notas são obrigatórias', expect.any(Array));
      expect(mockService.createSuggestion).not.toHaveBeenCalled();
    });

    it('deve chamar o service e retornar created com sucesso', async () => {
      req.body = { notes: 'Minha avaliação' };
      mockService.createSuggestion.mockResolvedValue({ id: 'sugg-123', notes: 'Minha avaliação' });

      await controller.createSuggestion(req, res, next);

      expect(mockService.createSuggestion).toHaveBeenCalledWith('sub-123', 'admin-456', expect.objectContaining({ notes: 'Minha avaliação' }));
      expect(responses.created).toHaveBeenCalledWith(res, expect.any(Object), 'Sugestão criada com sucesso');
    });

    it('deve delegar erro para handleControllerError', async () => {
      req.body = { notes: 'Minha avaliação' };
      const error = new Error('Fail');
      mockService.createSuggestion.mockRejectedValue(error);

      await controller.createSuggestion(req, res, next);

      expect(handleControllerError).toHaveBeenCalledWith(error, res, next, expect.any(Object));
    });
  });

  describe('getSuggestions', () => {
    it('deve retornar todas as sugestões com sucesso', async () => {
      const mockSuggestions = [{ id: 'sugg-1' }];
      mockService.getSuggestionsBySubmission.mockResolvedValue(mockSuggestions);

      await controller.getSuggestions(req, res, next);

      expect(responses.success).toHaveBeenCalledWith(res, { suggestions: mockSuggestions }, 'Sugestões carregadas');
    });

    it('deve delegar erro para handleControllerError', async () => {
      mockService.getSuggestionsBySubmission.mockRejectedValue(new Error('fail'));
      await controller.getSuggestions(req, res, next);
      expect(handleControllerError).toHaveBeenCalled();
    });
  });

  describe('getAuthorSuggestions', () => {
    it('deve retornar notFound se o usuário não for o dono da submissão', async () => {
      mockService.verifyAuthorOwnership.mockResolvedValue(false);

      await controller.getAuthorSuggestions(req, res, next);

      expect(responses.notFound).toHaveBeenCalledWith(res, 'Submissão não encontrada');
    });

    it('deve retornar as sugestões com sucesso caso seja o dono', async () => {
      mockService.verifyAuthorOwnership.mockResolvedValue(true);
      mockService.getSuggestionsBySubmission.mockResolvedValue([]);

      await controller.getAuthorSuggestions(req, res, next);

      expect(responses.success).toHaveBeenCalledWith(res, { suggestions: [] }, 'Sugestões carregadas');
    });
  });

  describe('acceptSuggestion', () => {
    it('deve aceitar sugestão e retornar sucesso', async () => {
      mockService.acceptSuggestion.mockResolvedValue({ success: true });

      await controller.acceptSuggestion(req, res, next);

      expect(mockService.acceptSuggestion).toHaveBeenCalledWith('sub-123', 'sugg-123', 'author@test.com');
      expect(responses.success).toHaveBeenCalledWith(res, { success: true }, 'Sugestão aceita e aplicada com sucesso');
    });

    it('deve delegar erro para handleControllerError', async () => {
      mockService.acceptSuggestion.mockRejectedValue(new Error('Fail'));
      await controller.acceptSuggestion(req, res, next);
      expect(handleControllerError).toHaveBeenCalled();
    });
  });

  describe('counterSuggestion', () => {
    it('deve retornar badRequest se não houver notes na contra-proposta', async () => {
      req.body = {};
      await controller.counterSuggestion(req, res, next);
      expect(responses.badRequest).toHaveBeenCalledWith(res, 'Notas são obrigatórias', expect.any(Array));
    });

    it('deve retornar created ao criar contra-proposta com sucesso', async () => {
      req.body = { notes: 'Rejeito isso' };
      mockService.createAuthorCounterProposal.mockResolvedValue({ id: 'sugg-counter' });

      await controller.counterSuggestion(req, res, next);

      expect(mockService.createAuthorCounterProposal).toHaveBeenCalledWith('sub-123', 'author@test.com', 'sugg-123', req.body);
      expect(responses.created).toHaveBeenCalledWith(res, { suggestion: { id: 'sugg-counter' } }, 'Contra-proposta enviada com sucesso');
    });

    it('deve delegar erro para handleControllerError em caso de falha', async () => {
      req.body = { notes: 'Rejeito isso' };
      mockService.createAuthorCounterProposal.mockRejectedValue(new Error('fail'));
      await controller.counterSuggestion(req, res, next);
      expect(handleControllerError).toHaveBeenCalled();
    });
  });

  describe('getSubmissionVersions', () => {
    it('deve retornar notFound se autor não for dono', async () => {
      mockService.verifyAuthorOwnership.mockResolvedValue(false);
      await controller.getSubmissionVersions(req, res, next);
      expect(responses.notFound).toHaveBeenCalledWith(res, 'Submissão não encontrada');
    });

    it('deve retornar sucesso com a lista de versões se for o dono', async () => {
      mockService.verifyAuthorOwnership.mockResolvedValue(true);
      mockService.getVersionsBySubmission.mockResolvedValue([{ version_number: 1 }]);

      await controller.getSubmissionVersions(req, res, next);

      expect(responses.success).toHaveBeenCalledWith(res, { versions: [{ version_number: 1 }] }, 'Versões carregadas');
    });

    it('deve delegar falha para handleControllerError', async () => {
      mockService.verifyAuthorOwnership.mockRejectedValue(new Error('Fail'));
      await controller.getSubmissionVersions(req, res, next);
      expect(handleControllerError).toHaveBeenCalled();
    });
  });
});