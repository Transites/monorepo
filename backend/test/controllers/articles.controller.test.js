jest.mock('../../services/articles', () => ({
  __esModule: true,          
  default: {
    listArticles:   jest.fn(),
    getArticleById: jest.fn(),
    updateArticle:  jest.fn(),
  }
}));

jest.mock('../../middleware/errors', () => ({
  asyncHandler: fn => fn,
}));

const request        = require('supertest');
const express        = require('express');
const articlesRouter =
  /** @type {import('express').Router} */
  (require('../../routes/articles'));
const articlesService = require('../../services/articles').default;

// Cast pra cada função do service
const mockedList   = /** @type {jest.Mock} */ (articlesService.listArticles);
const mockedGetById = /** @type {jest.Mock} */ (articlesService.getArticleById);
const mockedUpdate  = /** @type {jest.Mock} */ (articlesService.updateArticle);

const app = express();
app.use(express.json());
app.use('/api/articles', articlesRouter);

describe('ArticlesController', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/articles', () => {

    test('deve retornar lista de artigos com status 200', async () => {
      mockedList.mockResolvedValue({
        articles: [{ id: 'uuid-1', title: 'Artigo 1', category: 'pessoa' }],
        categories: ['pessoa'],
        pagination: {
          page: 1, limit: 12, total: 1,
          totalPages: 1, hasNext: false, hasPrevious: false,
        },
      });

      const response = await request(app).get('/api/articles');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.articles).toHaveLength(1);
      expect(response.body.data.categories).toContain('pessoa');
    });

    test('deve passar parâmetros de busca pro service', async () => {
      mockedList.mockResolvedValue({
        articles: [], categories: [],
        pagination: { page: 2, limit: 6, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      });

      await request(app)
        .get('/api/articles?search=teste&category=evento&page=2&limit=6');

      expect(mockedList).toHaveBeenCalledWith({
        search:   'teste',
        category: 'evento',
        page:     2,
        limit:    6,
      });
    });

    test('deve usar valores padrão quando parâmetros não são enviados', async () => {
      mockedList.mockResolvedValue({
        articles: [], categories: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      });

      await request(app).get('/api/articles');

      expect(mockedList).toHaveBeenCalledWith({
        search:   undefined,
        category: undefined,
        page:     1,
        limit:    12,
      });
    });
  });

  describe('GET /api/articles/id/:id', () => {

    const validUUID = 'be197e0e-b498-4759-abfa-a419061b49bb';

    test('deve retornar artigo quando encontrado', async () => {
      mockedGetById.mockResolvedValue({
        id: validUUID,
        title: 'Artigo Encontrado',
        status: 'PUBLISHED',
      });

      const response = await request(app).get(`/api/articles/id/${validUUID}`);

      expect(response.status).toBe(200);
      expect(response.body.data.article.title).toBe('Artigo Encontrado');
    });

    test('deve retornar 400 para ID inválido', async () => {
      const response = await request(app).get('/api/articles/id/id-invalido');

      expect(response.status).toBe(400);
      expect(mockedGetById).not.toHaveBeenCalled();
    });

    test('deve retornar 404 quando artigo não encontrado', async () => {
      mockedGetById.mockResolvedValue(null);

      const response = await request(app).get(`/api/articles/id/${validUUID}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/articles/:id', () => {

    const validUUID = 'be197e0e-b498-4759-abfa-a419061b49bb';

    test('deve atualizar artigo e retornar 200', async () => {
      mockedUpdate.mockResolvedValue({
        id: validUUID,
        title: 'Título Atualizado',
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .patch(`/api/articles/${validUUID}`)
        .send({ title: 'Título Atualizado' });

      expect(response.status).toBe(200);
      expect(response.body.data.submission.title).toBe('Título Atualizado');
    });

    test('deve retornar 400 para UUID inválido', async () => {
      const response = await request(app)
        .patch('/api/articles/id-invalido')
        .send({ title: 'Teste' });

      expect(response.status).toBe(400);
      expect(mockedUpdate).not.toHaveBeenCalled();
    });

    test('deve passar o body correto pro service', async () => {
      mockedUpdate.mockResolvedValue({
        id: validUUID, title: 'Novo', summary: 'Resumo novo'
      });

      await request(app)
        .patch(`/api/articles/${validUUID}`)
        .send({ title: 'Novo', summary: 'Resumo novo' });

      expect(mockedUpdate).toHaveBeenCalledWith(
        validUUID,
        { title: 'Novo', summary: 'Resumo novo' }
      );
    });

    test('deve atualizar bibliografia dentro do metadata', async () => {
      const novasBibliografias = [
        { year: '2024', title: 'Livro Novo', author: 'Autor X' }
      ];

      mockedUpdate.mockResolvedValue({
        id: validUUID,
        metadata: { bibliography: novasBibliografias }
      });

      const response = await request(app)
        .patch(`/api/articles/${validUUID}`)
        .send({ metadata: { bibliography: novasBibliografias } });

      expect(response.status).toBe(200);
      expect(mockedUpdate).toHaveBeenCalledWith(
        validUUID,
        expect.objectContaining({
          metadata: expect.objectContaining({
            bibliography: novasBibliografias
          })
        })
      );
    });
  });
});