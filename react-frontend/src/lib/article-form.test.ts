import { describe, expect, it } from 'vitest';
import { buildSubmissionPayload } from './article-form';

describe('buildSubmissionPayload', () => {
  it('preserves metadata generated from the form while keeping bibliography and media fields', () => {
    const payload = buildSubmissionPayload({
      title: 'Maria Silva',
      summary: 'Resumo muito bom para testar o artigo e garantir que o payload saia correto.',
      category: 'pessoa',
      author_name: 'João Almeida',
      author_email: 'joao@example.com',
      author_institution: 'USP',
      content: 'Conteúdo do artigo com mais de cem caracteres para passar na validação do formulário e cobrir a geração do payload.',
      keywords: ['história', 'educação'],
      bibliography: [{ title: 'Livro', year: '2024' }],
      metadata: {
        birth: '1990',
        death: '2024',
      },
      media: {
        type: 'image',
        data: {
          url: 'https://example.com/image.jpg',
          caption: 'Legenda',
          alternativeText: 'Foto da autora',
        },
      },
    });

    expect(payload.metadata).toMatchObject({
      slug: 'maria-silva',
      type: 'pessoa',
      themes: ['história', 'educação'],
      sections: [],
      source: 'Submissão de Usuário',
      birth: '1990',
      death: '2024',
      bibliography: [{ title: 'Livro', year: '2024' }],
      image: {
        url: 'https://example.com/image.jpg',
        caption: 'Legenda',
        alternativeText: 'Foto da autora',
      },
    });
  });
});
