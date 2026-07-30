const mockDb = {
  query: jest.fn(),
  // Mock para simular a transação do banco, repassando o próprio mockDb como client
  transaction: jest.fn(async (callback) => await callback(mockDb)),
};

jest.mock('../../middleware/logging', () => ({
  error: jest.fn(),
  audit: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

jest.mock('../../utils/exceptions', () => ({
  DatabaseException: class DatabaseException extends Error {
    constructor(message, cause) {
      super(message);
      this.name = 'DatabaseException';
      this.cause = cause;
    }
  },
  SubmissionNotFoundException: class SubmissionNotFoundException extends Error {
    constructor(message) {
      super(message);
      this.name = 'SubmissionNotFoundException';
    }
  },
  ValidationException: class ValidationException extends Error {
    constructor(message, errors) {
      super(message);
      this.name = 'ValidationException';
      this.errors = errors;
    }
  },
}));

// Mock do submissionService usado em createAuthorCounterProposal
jest.mock('../../services/submission', () => ({
  createVersionSnapshot: jest.fn(),
}));
const submissionService = require('../../services/submission');

const SubmissionSuggestionsService = require('../../services/submissionSuggestions').default;
const service = new SubmissionSuggestionsService(mockDb);

// ─── fixtures ──────────────────────────────────────────────────────────────────

const SUBMISSION_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const ADMIN_ID      = 'bbbbbbbb-0000-0000-0000-000000000002';
const AUTHOR_EMAIL  = 'author@example.com';

const mockSuggestion = {
  id:                'cccccccc-0000-0000-0000-000000000003',
  submission_id:     SUBMISSION_ID,
  admin_id:          ADMIN_ID,
  admin_name:        'Curador Teste',
  suggested_title:   'Título Sugerido',
  suggested_summary: 'Resumo sugerido',
  suggested_content: 'Conteúdo sugerido',
  suggested_category: 'pessoa',
  suggested_keywords: ['palavra1', 'palavra2'],
  notes:             'Notas do curador',
  status:            'pending',
  created_at:        new Date().toISOString(),
};

const mockSubmissionRow = { id: SUBMISSION_ID, author_email: AUTHOR_EMAIL };

// ─── testes ────────────────────────────────────────────────────────────────────

describe('SubmissionSuggestionsService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createSuggestion ────────────────────────────────────────────────────────
  describe('createSuggestion', () => {
    // ... [Seus testes originais de createSuggestion podem ser mantidos aqui]
    test('deve criar sugestão com sucesso', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockSubmissionRow] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockSuggestion] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.createSuggestion(SUBMISSION_ID, ADMIN_ID, {
        suggested_title:   'Título Sugerido',
        suggested_content: 'Conteúdo sugerido',
        notes:             'Notas do curador',
      });

      expect(result).toEqual(mockSuggestion);
    });

    test('deve lançar SubmissionNotFoundException quando submissão não existe', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      await expect(
        service.createSuggestion('id-inexistente', ADMIN_ID, { notes: 'teste' })
      ).rejects.toMatchObject({ name: 'SubmissionNotFoundException' });
    });
  });

  // ── createAuthorCounterProposal ──────────────────────────────────────────────
  describe('createAuthorCounterProposal', () => {
    const mockUpdatedSubmission = { ...mockSubmissionRow, title: 'Novo Titulo' };

    test('deve criar contra-proposta e gerar snapshot', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockSubmissionRow] }) // Check owner
        .mockResolvedValueOnce({ rows: [] }) // UPDATE suggestion (rejeita original)
        .mockResolvedValueOnce({ rows: [mockUpdatedSubmission] }); // UPDATE submission

      const result = await service.createAuthorCounterProposal(
        SUBMISSION_ID, AUTHOR_EMAIL, mockSuggestion.id, { notes: 'Minha versão' }
      );

      expect(result).toEqual(mockUpdatedSubmission);
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(submissionService.createVersionSnapshot).toHaveBeenCalledWith(
        SUBMISSION_ID,
        expect.objectContaining({ created_by: 'author', change_summary: 'Minha versão' }),
        mockDb
      );
    });

    test('deve lançar SubmissionNotFoundException se submissão não existir', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      await expect(
        service.createAuthorCounterProposal(SUBMISSION_ID, AUTHOR_EMAIL, mockSuggestion.id, { notes: '' })
      ).rejects.toMatchObject({ name: 'SubmissionNotFoundException' });
    });

    test('deve lançar ValidationException se email não for do dono', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockSubmissionRow] });
      await expect(
        service.createAuthorCounterProposal(SUBMISSION_ID, 'fake@email.com', mockSuggestion.id, { notes: '' })
      ).rejects.toMatchObject({ name: 'ValidationException' });
    });

    test('deve capturar erro inesperado no banco e lançar DatabaseException', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('DB Error'));
      await expect(
        service.createAuthorCounterProposal(SUBMISSION_ID, AUTHOR_EMAIL, mockSuggestion.id, { notes: '' })
      ).rejects.toMatchObject({ name: 'DatabaseException' });
    });
  });

  // ── acceptSuggestion ─────────────────────────────────────────────────────────
  describe('acceptSuggestion', () => {
    test('deve aplicar campos e aceitar sugestão com sucesso', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockSubmissionRow] }) // Check owner
        .mockResolvedValueOnce({ rows: [mockSuggestion] }) // Check suggestion pendente
        .mockResolvedValueOnce({ rows: [] }) // Update submissions (applies fields)
        .mockResolvedValueOnce({ rows: [] }); // Update suggestions (accepted)

      const result = await service.acceptSuggestion(SUBMISSION_ID, mockSuggestion.id, AUTHOR_EMAIL);

      expect(result).toEqual({ success: true });
      expect(mockDb.query).toHaveBeenCalledTimes(4);
      
      const updateSubCall = mockDb.query.mock.calls[2][0];
      expect(updateSubCall).toContain('UPDATE submissions SET');
      expect(updateSubCall).toContain('title = $1');
      expect(updateSubCall).toContain('status = $'); // Verifica se muda status
    });

    test('deve lançar SubmissionNotFoundException caso sugestão não seja encontrada ou não esteja pendente', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockSubmissionRow] }) 
        .mockResolvedValueOnce({ rows: [] }); // Retorna vazio na sugestão

      await expect(
        service.acceptSuggestion(SUBMISSION_ID, mockSuggestion.id, AUTHOR_EMAIL)
      ).rejects.toMatchObject({ name: 'SubmissionNotFoundException' });
    });

    test('deve aceitar sugestão mesmo sem campos alterados na submissão (apenas aceita nas suggestions)', async () => {
      const suggestionSemCampos = { ...mockSuggestion, suggested_title: null, suggested_summary: null, suggested_content: null, suggested_category: null, suggested_keywords: null, suggested_metadata: null };
      
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockSubmissionRow] }) 
        .mockResolvedValueOnce({ rows: [suggestionSemCampos] }) 
        .mockResolvedValueOnce({ rows: [] }); // Só roda o update da suggestion (accepted)

      await service.acceptSuggestion(SUBMISSION_ID, mockSuggestion.id, AUTHOR_EMAIL);
      expect(mockDb.query).toHaveBeenCalledTimes(3); // Pulou o UPDATE submissions
    });
  });

  // ── verifyAuthorOwnership & Outros Métodos Omitidos Opcionais ─────────────────
  describe('verifyAuthorOwnership', () => {
    test('deve retornar true se email for correspondente', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ author_email: AUTHOR_EMAIL }] });
      const result = await service.verifyAuthorOwnership(SUBMISSION_ID, AUTHOR_EMAIL);
      expect(result).toBe(true);
    });

    test('deve retornar false se submissão não existir', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      const result = await service.verifyAuthorOwnership(SUBMISSION_ID, AUTHOR_EMAIL);
      expect(result).toBe(false);
    });

    test('deve retornar false se email for diferente', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ author_email: 'outropilantra@email.com' }] });
      const result = await service.verifyAuthorOwnership(SUBMISSION_ID, AUTHOR_EMAIL);
      expect(result).toBe(false);
    });
  });

  describe('getVersionsBySubmission', () => {
    test('deve retornar histórico de versões', async () => {
      const mockVersions = [{ version_number: 1 }, { version_number: 2 }];
      mockDb.query.mockResolvedValueOnce({ rows: mockVersions });

      const result = await service.getVersionsBySubmission(SUBMISSION_ID);
      expect(result).toEqual(mockVersions);
    });

    test('deve lançar DatabaseException em caso de erro', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('fail'));
      await expect(service.getVersionsBySubmission(SUBMISSION_ID)).rejects.toMatchObject({ name: 'DatabaseException' });
    });
  });

  // Manter os testes de getSuggestionsBySubmission, getPendingSuggestion e getSubmissionForReview...
  // (Você pode colar os testes que você já tem funcionando perfeitamente logo abaixo)
});