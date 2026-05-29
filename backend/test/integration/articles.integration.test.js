jest.mock('../../database/client', () => ({
  query:       jest.fn(),
  transaction: jest.fn(),
  findById:    jest.fn(),
  healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }),
  close:       jest.fn(),
}));

jest.mock('../../config/services', () => ({
  database: { url: 'mock', ssl: false },
  core: { port: 3000, corsOrigin: '', rateLimitWindow: 900000, rateLimitMax: 100 },
}));

const request = require('supertest');
const db      = require('../../database/client');
const app     = require('../../app');

// Cast pra cada função mockada
const mockedQuery = /** @type {jest.Mock} */ (db.query);

const mockArticle = {
  id:                 'be197e0e-b498-4759-abfa-a419061b49bb',
  title:              'Émile Levasseur',
  summary:            'Historiador e geógrafo francês.',
  status:             'PUBLISHED',
  category:           'pessoa',
  author_name:        'Larissa Alves de Lira',
  author_institution: 'Universidade de São Paulo (USP)',
  keywords:           ['história', 'geografia', 'França'],
  content:            'Conteúdo do artigo...',
  content_html:       '<p>Conteúdo do artigo...</p>',
  metadata: {
    image:       { url: 'https://res.cloudinary.com/transites/foto.jpg' },
    birth:       { date: '1828-12-08', formatted: '8 de dezembro de 1828' },
    bibliography: [{ year: '1858', title: "La question d'or", author: 'LEVASSEUR, Émile' }],
    occupation:  ['historiador', 'geógrafo'],
  },
  created_at: '2025-09-14T23:40:37.097Z',
  updated_at: '2026-05-28T04:05:09.161Z',
};

describe('Articles Integration Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/articles — Catálogo', () => {

    test('deve retornar catálogo completo com paginação', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [mockArticle] })
        .mockResolvedValueOnce({ rows: [{ total: '103' }] })
        .mockResolvedValueOnce({ rows: [{ category: 'pessoa' }, { category: 'evento' }] });

      const response = await request(app).get('/api/articles');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.articles).toBeDefined();
      expect(response.body.data.pagination.total).toBe(103);
      expect(response.body.data.categories).toContain('pessoa');
    });

    test('deve filtrar por categoria', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [mockArticle] })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [{ category: 'pessoa' }] });

      const response = await request(app).get('/api/articles?category=pessoa');

      expect(response.status).toBe(200);
      const sqlChamado = mockedQuery.mock.calls[0][0];
      expect(sqlChamado).toContain('category');
    });

    test('deve buscar por termo de texto', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [mockArticle] })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/articles?search=Levasseur');

      expect(response.status).toBe(200);
      expect(response.body.data.articles).toHaveLength(1);
    });

    test('deve retornar lista vazia quando não há resultados', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/articles?search=termoinexistente');

      expect(response.status).toBe(200);
      expect(response.body.data.articles).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    test('deve respeitar limite por página', async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: Array(6).fill(mockArticle) })
        .mockResolvedValueOnce({ rows: [{ total: '50' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/articles?limit=6&page=1');

      expect(response.status).toBe(200);
      expect(response.body.data.articles).toHaveLength(6);
      expect(response.body.data.pagination.hasNext).toBe(true);
    });
  });

  describe('GET /api/articles/id/:id — Artigo individual', () => {

    test('deve retornar artigo completo', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [mockArticle] });

      const response = await request(app).get(`/api/articles/id/${mockArticle.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.article.title).toBe('Émile Levasseur');
      expect(response.body.data.article.metadata.bibliography).toHaveLength(1);
    });

    test('deve retornar 400 para ID não-UUID', async () => {
      const response = await request(app).get('/api/articles/id/nao-e-um-uuid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('deve retornar 404 para artigo inexistente', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/articles/id/00000000-0000-1000-8000-000000000000');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/articles/:id — Edição', () => {

    test('deve atualizar título com sucesso', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ ...mockArticle, title: 'Novo Título' }]
      });

      const response = await request(app)
        .patch(`/api/articles/${mockArticle.id}`)
        .send({ title: 'Novo Título' });

      expect(response.status).toBe(200);
      expect(response.body.data.submission.title).toBe('Novo Título');
    });

    test('deve atualizar múltiplos campos simultaneamente', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ ...mockArticle, title: 'Atualizado', category: 'evento' }]
      });

      const response = await request(app)
        .patch(`/api/articles/${mockArticle.id}`)
        .send({ title: 'Atualizado', category: 'evento' });

      expect(response.status).toBe(200);
      expect(response.body.data.submission.category).toBe('evento');
    });

    test('deve atualizar keywords', async () => {
      const novasKeywords = ['história', 'nova keyword'];

      mockedQuery.mockResolvedValueOnce({
        rows: [{ ...mockArticle, keywords: novasKeywords }]
      });

      const response = await request(app)
        .patch(`/api/articles/${mockArticle.id}`)
        .send({ keywords: novasKeywords });

      expect(response.status).toBe(200);
      expect(response.body.data.submission.keywords).toContain('nova keyword');
    });

    test('deve atualizar bibliografia no metadata', async () => {
      const novaBibliografia = [
        { year: '2024', title: 'Livro Novo', author: 'Autor Novo' }
      ];

      mockedQuery.mockResolvedValueOnce({
        rows: [{
          ...mockArticle,
          metadata: { ...mockArticle.metadata, bibliography: novaBibliografia }
        }]
      });

      const response = await request(app)
        .patch(`/api/articles/${mockArticle.id}`)
        .send({ metadata: { ...mockArticle.metadata, bibliography: novaBibliografia } });

      expect(response.status).toBe(200);
      expect(response.body.data.submission.metadata.bibliography[0].title)
        .toBe('Livro Novo');
    });

    test('deve retornar 400 para UUID inválido', async () => {
      const response = await request(app)
        .patch('/api/articles/uuid-invalido')
        .send({ title: 'Teste' });

      expect(response.status).toBe(400);
    });
  });
});