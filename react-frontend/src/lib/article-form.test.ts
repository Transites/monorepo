import { describe, expect, it } from 'vitest';
import { buildSubmissionPayload, validateSubmissionForm } from './article-form';

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

  it('enforces the new client limits for summary length, keywords count and article body', () => {
    const summary = 'a'.repeat(251);
    const content = 'b'.repeat(7201);
    const errors = validateSubmissionForm({
      title: 'Maria Silva',
      summary,
      category: 'pessoa',
      author_name: 'João Almeida',
      author_email: 'joao@example.com',
      author_institution: 'USP',
      content,
      keywords: ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7'],
      bibliography: [],
      metadata: {},
    });

    expect(errors).toContain('Resumo pode ter no máximo 250 caracteres.');
    expect(errors).toContain('Máximo de 6 palavras-chave.');
    expect(errors).toContain('Conteúdo pode ter no máximo 7.200 caracteres.');
  });
});
