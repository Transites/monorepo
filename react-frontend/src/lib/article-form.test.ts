import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import ArticleContent from '../components/ArticleContent';
import { buildSubmissionPayload, validateSubmissionForm } from './article-form';

vi.mock('dompurify', () => ({
  default: {
    sanitize: (value: string) => value,
  },
}));

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
    const summary = 'a'.repeat(501);
    const content = 'b'.repeat(8001);
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
      works: [],
      metadata: {},
    });

    expect(errors).toContain('Resumo pode ter no máximo 500 caracteres.');
    expect(errors).toContain('Máximo de 6 palavras-chave.');
    expect(errors).toContain('Conteúdo pode ter no máximo 8.000 caracteres.');
  });

  it('keeps principal works and bibliography as free-form metadata entries', () => {
    const payload = buildSubmissionPayload({
      title: 'Maria Silva',
      summary: 'Resumo muito bom para testar o artigo e garantir que o payload saia correto.',
      category: 'pessoa',
      author_name: 'João Almeida',
      author_email: 'joao@example.com',
      author_institution: 'USP',
      content: 'Conteúdo do artigo com mais de cem caracteres para passar na validação do formulário e cobrir a geração do payload.',
      keywords: ['história', 'educação'],
      bibliography: [{ text: 'LIMA, H. A. (2020). Texto livre de bibliografia.' }],
      works: [{ text: 'BETIM, A. (1910). Obra principal de referência.' }],
      sources: [{ text: 'Entrevista concedida em 2024.' }],
      metadata: {},
    });

    expect(payload.metadata).toMatchObject({
      works: [{ text: 'BETIM, A. (1910). Obra principal de referência.' }],
      bibliography: [{ text: 'LIMA, H. A. (2020). Texto livre de bibliografia.' }],
      sources: [{ text: 'Entrevista concedida em 2024.' }],
    });
  });

  it('renders the institution and sources section on the final article page', () => {
    (globalThis as any).DOMParser = class {
      parseFromString(html: string) {
        return {
          querySelectorAll: () => [],
          body: { innerHTML: html },
        };
      }
    };

    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(ArticleContent, {
          article: {
            id: '1',
            title: 'Maria Silva',
            category: 'pessoa',
            status: 'published',
            created_at: '2024-01-01',
            updated_at: '2024-01-02',
            expires_at: '2025-01-01',
            author_name: 'João Almeida',
            author_institution: 'USP',
            summary: 'Resumo do verbete.',
            content_html: '<p>Texto do verbete.</p>',
            keywords: ['história'],
            metadata: {
              works: [{ text: 'Obra principal de referência.' }],
              sources: [{ text: 'Entrevista concedida em 2024.' }],
              bibliography: [{ text: 'Bibliografia principal.' }],
            },
          },
        })
      )
    );

    expect(html).toContain('USP');
    expect(html).toContain('Fontes');
  });
});
