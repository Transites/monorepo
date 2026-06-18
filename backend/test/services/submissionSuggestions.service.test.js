const mockDb = {
  query: jest.fn(),
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
}));

const SubmissionSuggestionsService =
  require('../../services/submissionSuggestions').default;

const service = new SubmissionSuggestionsService(mockDb);

// ─── fixtures ──────────────────────────────────────────────────────────────────

const SUBMISSION_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const ADMIN_ID      = 'bbbbbbbb-0000-0000-0000-000000000002';

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

const mockSubmissionRow = { id: SUBMISSION_ID };

// ─── testes ────────────────────────────────────────────────────────────────────

describe('SubmissionSuggestionsService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createSuggestion ────────────────────────────────────────────────────────

  describe('createSuggestion', () => {

    test('deve criar sugestão com sucesso', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockSubmissionRow] }) // SELECT submissions
        .mockResolvedValueOnce({ rows: [] })                  // UPDATE pending → rejected
        .mockResolvedValueOnce({ rows: [mockSuggestion] })    // INSERT suggestion
        .mockResolvedValueOnce({ rows: [] });                 // UPDATE submissions status

      const result = await service.createSuggestion(SUBMISSION_ID, ADMIN_ID, {
        suggested_title:   'Título Sugerido',
        suggested_content: 'Conteúdo sugerido',
        notes:             'Notas do curador',
      });

      expect(result).toEqual(mockSuggestion);
      expect(mockDb.query).toHaveBeenCalledTimes(4);
    });

    test('deve lançar SubmissionNotFoundException quando submissão não existe', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // SELECT retorna vazio

      await expect(
        service.createSuggestion('id-inexistente', ADMIN_ID, { notes: 'teste' })
      ).rejects.toMatchObject({ name: 'SubmissionNotFoundException' });

      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    test('deve cancelar sugestões pendentes anteriores do mesmo admin', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockSubmissionRow] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockSuggestion] })
        .mockResolvedValueOnce({ rows: [] });

      await service.createSuggestion(SUBMISSION_ID, ADMIN_ID, { notes: 'nova sugestão' });

      const cancelQuery = mockDb.query.mock.calls[1][0];
      expect(cancelQuery).toContain("status = 'rejected'");
      expect(cancelQuery).toContain('submission_suggestions');

      const cancelParams = mockDb.query.mock.calls[1][1];
      expect(cancelParams).toContain(SUBMISSION_ID);
      expect(cancelParams).toContain(ADMIN_ID);
    });

    test('deve atualizar status da submissão para CHANGES_REQUESTED', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockSubmissionRow] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockSuggestion] })
        .mockResolvedValueOnce({ rows: [] });

      await service.createSuggestion(SUBMISSION_ID, ADMIN_ID, { notes: 'teste' });

      const statusQuery = mockDb.query.mock.calls[3][0];
      expect(statusQuery).toContain('CHANGES_REQUESTED');
      expect(statusQuery).toContain('submissions');
    });

    test('deve aceitar sugestão apenas com notas (sem campos editados)', async () => {
      const suggestionSoNotas = { ...mockSuggestion, suggested_title: null, suggested_content: null };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockSubmissionRow] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [suggestionSoNotas] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.createSuggestion(SUBMISSION_ID, ADMIN_ID, {
        notes: 'Apenas comentário sem edição',
      });

      expect(result).toEqual(suggestionSoNotas);
    });

    test('deve lançar DatabaseException em erro inesperado do banco', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockSubmissionRow] })
        .mockRejectedValueOnce(new Error('connection lost'));

      await expect(
        service.createSuggestion(SUBMISSION_ID, ADMIN_ID, { notes: 'teste' })
      ).rejects.toMatchObject({ name: 'DatabaseException' });
    });
  });

  // ── getSuggestionsBySubmission ───────────────────────────────────────────────

  describe('getSuggestionsBySubmission', () => {

    test('deve retornar lista de sugestões ordenadas por data', async () => {
      const suggestions = [mockSuggestion, { ...mockSuggestion, id: 'outra-id' }];
      mockDb.query.mockResolvedValueOnce({ rows: suggestions });

      const result = await service.getSuggestionsBySubmission(SUBMISSION_ID);

      expect(result).toHaveLength(2);
      expect(result[0].submission_id).toBe(SUBMISSION_ID);

      const sql = mockDb.query.mock.calls[0][0];
      expect(sql).toContain('ORDER BY');
      expect(sql).toContain('created_at');
    });

    test('deve retornar array vazio quando não há sugestões', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.getSuggestionsBySubmission(SUBMISSION_ID);

      expect(result).toEqual([]);
    });

    test('deve incluir nome do admin no JOIN', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockSuggestion] });

      await service.getSuggestionsBySubmission(SUBMISSION_ID);

      const sql = mockDb.query.mock.calls[0][0];
      expect(sql).toContain('admins');
      expect(sql).toContain('admin_name');
    });

    test('deve lançar DatabaseException em erro do banco', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('timeout'));

      await expect(
        service.getSuggestionsBySubmission(SUBMISSION_ID)
      ).rejects.toMatchObject({ name: 'DatabaseException' });
    });
  });

  // ── getPendingSuggestion ─────────────────────────────────────────────────────

  describe('getPendingSuggestion', () => {

    test('deve retornar a sugestão pendente mais recente', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockSuggestion] });

      const result = await service.getPendingSuggestion(SUBMISSION_ID);

      expect(result).toEqual(mockSuggestion);
      expect(result?.status).toBe('pending');

      const sql = mockDb.query.mock.calls[0][0];
      expect(sql).toContain("status = 'pending'");
      expect(sql).toContain('LIMIT 1');
    });

    test('deve retornar null quando não há sugestão pendente', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.getPendingSuggestion(SUBMISSION_ID);

      expect(result).toBeNull();
    });

    test('deve lançar DatabaseException em erro do banco', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('db error'));

      await expect(
        service.getPendingSuggestion(SUBMISSION_ID)
      ).rejects.toMatchObject({ name: 'DatabaseException' });
    });
  });

  // ── getSubmissionForReview ───────────────────────────────────────────────────

  describe('getSubmissionForReview', () => {

    test('deve retornar submissão com sugestão pendente', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ ...mockSubmissionRow, title: 'Artigo Teste' }] }) // submissão
        .mockResolvedValueOnce({ rows: [mockSuggestion] }); // sugestão pendente

      const result = await service.getSubmissionForReview(SUBMISSION_ID);

      expect(result.submission.id).toBe(SUBMISSION_ID);
      expect(result.pendingSuggestion).toEqual(mockSuggestion);
    });

    test('deve retornar submissão com pendingSuggestion null quando não há sugestão', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ ...mockSubmissionRow, title: 'Artigo Teste' }] })
        .mockResolvedValueOnce({ rows: [] }); // sem sugestão pendente

      const result = await service.getSubmissionForReview(SUBMISSION_ID);

      expect(result.submission.id).toBe(SUBMISSION_ID);
      expect(result.pendingSuggestion).toBeNull();
    });

    test('deve lançar SubmissionNotFoundException quando submissão não existe', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.getSubmissionForReview('id-inexistente')
      ).rejects.toMatchObject({ name: 'SubmissionNotFoundException' });
    });

    test('deve incluir nome do admin responsável no JOIN', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockSubmissionRow] })
        .mockResolvedValueOnce({ rows: [] });

      await service.getSubmissionForReview(SUBMISSION_ID);

      const sql = mockDb.query.mock.calls[0][0];
      expect(sql).toContain('admins');
      expect(sql).toContain('assigned_admin_name');
    });

    test('deve lançar DatabaseException em erro inesperado', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('db offline'));

      await expect(
        service.getSubmissionForReview(SUBMISSION_ID)
      ).rejects.toMatchObject({ name: 'DatabaseException' });
    });
  });
});