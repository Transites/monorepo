jest.mock('../../database/client', () => ({
  query: jest.fn(),
}));

jest.mock('../../services/featuredContent', () => {
  const __mockGetFeaturedContent = jest.fn();

  return {
    __mockGetFeaturedContent,
    FeaturedContentService: jest.fn().mockImplementation(() => ({
      getFeaturedContent: __mockGetFeaturedContent,
    })),
  };
});

const db = require('../../database/client');
const { __mockGetFeaturedContent } = require('../../services/featuredContent');
const { getFeaturedContent } = require('../../controllers/featuredContent');

const makeSubmissionRow = (id, title, summary = 'Resumo', category = 'pessoa') => ({
  id,
  title,
  summary,
  category,
  author_name: 'Autor Teste',
  metadata: { source: 'unit-test' },
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  status: 'PUBLISHED',
  content: '<p>Conteúdo</p>',
  keywords: ['teste'],
});

describe('FeaturedContentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve selecionar itens publicados em ordem determinística', async () => {
    const { FeaturedContentService } = jest.requireActual('../../services/featuredContent');
    const rows = [
      makeSubmissionRow('1', 'Primeiro', 'Resumo 1'),
      makeSubmissionRow('2', 'Segundo', 'Resumo 2'),
      makeSubmissionRow('3', 'Terceiro', 'Resumo 3'),
      makeSubmissionRow('4', 'Quarto', 'Resumo 4'),
    ];

    db.query.mockResolvedValue({ rows });

    const service = new FeaturedContentService();
    const result = await service.getFeaturedContent('2024-01-15');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining("s.status = 'PUBLISHED'"));
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      submission_id: expect.any(String),
      submission: expect.objectContaining({
        id: expect.any(String),
        status: 'PUBLISHED',
      }),
    }));
  });

  test('deve lançar erro quando o banco falha', async () => {
    const { FeaturedContentService } = jest.requireActual('../../services/featuredContent');
    db.query.mockRejectedValue(new Error('db down'));

    await expect(new FeaturedContentService().getFeaturedContent('2024-01-15'))
      .rejects
      .toThrow('Failed to fetch featured content');
  });
});

describe('FeaturedContentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar featured content com data válida', async () => {
    __mockGetFeaturedContent.mockResolvedValue([
      {
        id: 'a1',
        display_order: 1,
        submission: {
          id: 'a1',
          title: 'Artigo destaque',
          summary: 'Resumo do destaque',
          category: 'pessoa',
          author_name: 'Autor A',
          metadata: { source: 'api' },
        },
      },
    ]);

    const req = { query: { date: '2024-01-15' } };
    const res = {
      set: jest.fn().mockReturnThis(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getFeaturedContent(req, res);

    expect(res.set).toHaveBeenCalledWith('X-Featured-Seed', '2024-01-15');
    expect(res.json).toHaveBeenCalledWith({
      featured: [{
        id: 'a1',
        title: 'Artigo destaque',
        summary: 'Resumo do destaque',
        category: 'pessoa',
        author_name: 'Autor A',
        metadata: { source: 'api' },
        display_order: 1,
      }],
    });
    expect(__mockGetFeaturedContent).toHaveBeenCalledWith('2024-01-15');
  });

  test('deve tratar erro do serviço com status 500', async () => {
    __mockGetFeaturedContent.mockRejectedValue(new Error('fail'));

    const req = { query: { date: 'invalid' } };
    const res = {
      set: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await getFeaturedContent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Failed to fetch featured content',
    });
  });
});
