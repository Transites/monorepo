jest.mock('../../database/client', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
  findById: jest.fn(),
  close: jest.fn(),
}));

const db = require('../../database/client');
const mockedQuery = /** @type {jest.Mock} */ (db.query);

const articlesService = require('../../services/articles').default;

describe('ArticlesService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listArticles', () => {

    test('deve listar artigos publicados com paginação padrão', async () => {
      mockedQuery
        .mockResolvedValueOnce({
          rows: [{
            id: 'uuid-1',
            title: 'Artigo Teste',
            summary: 'Resumo teste',
            author_name: 'Autor',
            category: 'pessoa',
            keywords: ['teste'],
            created_at: new Date(),
          }]
        })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [{ category: 'pessoa' }] });

      const result = await articlesService.listArticles({ page: 1, limit: 12 });

      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].title).toBe('Artigo Teste');
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.categories).toEqual(['pessoa']);
    });

    test('deve filtrar artigos por busca', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await articlesService.listArticles({
        search: 'termo inexistente',
        page: 1,
        limit: 12,
      });

      expect(mockedQuery).toHaveBeenCalled();
      expect(result.articles).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    test('deve filtrar artigos por categoria', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 'uuid-1', title: 'Evento', category: 'evento' }] })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [{ category: 'evento' }] });

      const result = await articlesService.listArticles({
        category: 'evento',
        page: 1,
        limit: 12,
      });

      expect(result.articles[0].category).toBe('evento');
    });

    test('deve calcular paginação corretamente', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: Array(12).fill({ id: 'x', title: 'A' }) })
        .mockResolvedValueOnce({ rows: [{ total: '25' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await articlesService.listArticles({ page: 1, limit: 12 });

      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrevious).toBe(false);
    });

    test('deve retornar hasNext false na última página', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: 'x', title: 'A' }] })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await articlesService.listArticles({ page: 1, limit: 12 });

      expect(result.pagination.hasNext).toBe(false);
    });
  });

  describe('getArticleById', () => {

    test('deve retornar artigo quando encontrado', async () => {
      const mockArticle = {
        id: 'uuid-123',
        title: 'Artigo Encontrado',
        status: 'PUBLISHED',
        category: 'pessoa',
      };

      mockedQuery.mockResolvedValueOnce({ rows: [mockArticle] });

      const result = await articlesService.getArticleById('uuid-123');

      expect(result).toEqual(mockArticle);
      expect(mockedQuery).toHaveBeenCalledTimes(1);
    });

    test('deve retornar null quando artigo não encontrado', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] });

      const result = await articlesService.getArticleById('uuid-inexistente');

      expect(result).toBeNull();
    });

    test('deve buscar apenas artigos PUBLISHED', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] });

      await articlesService.getArticleById('uuid-123');

      const sqlCalled = mockedQuery.mock.calls[0][0];
      expect(sqlCalled).toContain('PUBLISHED');
    });
  });

  describe('updateArticle', () => {

    test('deve atualizar título do artigo', async () => {
      const mockUpdated = {
        id: 'uuid-123',
        title: 'Título Novo',
        updated_at: new Date(),
      };

      mockedQuery.mockResolvedValueOnce({ rows: [mockUpdated] });

      const result = await articlesService.updateArticle('uuid-123', {
        title: 'Título Novo',
      });

      expect(result.title).toBe('Título Novo');
    });

    test('deve lançar erro quando nenhum campo é enviado', async () => {
      await expect(
        articlesService.updateArticle('uuid-123', {})
      ).rejects.toThrow('Nenhum campo para atualizar');

      expect(mockedQuery).not.toHaveBeenCalled();
    });

    test('deve lançar erro quando artigo não encontrado', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        articlesService.updateArticle('uuid-inexistente', { title: 'Teste' })
      ).rejects.toThrow('Artigo não encontrado');
    });

    test('não deve atualizar campos não permitidos', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ id: 'uuid-123', title: 'Teste', status: 'PUBLISHED' }]
      });

      await articlesService.updateArticle('uuid-123', {
        title:  'Título OK',
        status: 'DRAFT',
        token:  'hack',
      });

      const sqlCalled = mockedQuery.mock.calls[0][0];
      expect(sqlCalled).not.toContain('status =');
      expect(sqlCalled).not.toContain('token =');
      expect(sqlCalled).toContain('title =');
    });

    test('deve atualizar metadata preservando campos existentes', async () => {
      const metadataCompleta = {
        image:       { url: 'https://cloudinary.com/foto.jpg' },
        birth:       { date: '1900-01-01' },
        bibliography: [{ year: '2020', title: 'Livro Novo', author: 'Autor' }],
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [{ id: 'uuid-123', metadata: metadataCompleta }]
      });

      const result = await articlesService.updateArticle('uuid-123', {
        metadata: metadataCompleta,
      });

      expect(result.metadata.image).toBeDefined();
      expect(result.metadata.bibliography).toHaveLength(1);
    });
  });
});