import type { BibliographyItem, CreateArticleSubmissionPayload } from './api';

export const ARTICLE_EDITOR_CATEGORIES = [
  'pessoa',
  'evento',
  'instituicao',
  'tema',
  'obra',
] as const;

export type ArticleEditorCategory = (typeof ARTICLE_EDITOR_CATEGORIES)[number];

export const ARTICLE_EDITOR_CATEGORY_LABELS: Record<ArticleEditorCategory, string> = {
  pessoa: 'Pessoa',
  evento: 'Evento',
  instituicao: 'Instituição',
  tema: 'Tema',
  obra: 'Obra',
};

/** Same shape ArticleContent/CatalogCard read from metadata.image / metadata.video. */
export interface ArticleMedia {
  url: string;
  caption?: string;
  alternativeText?: string;
  credit?: string;
  publicId?: string;
}

export interface ArticleFormFields {
  title: string;
  summary: string;
  category: string;
  author_name: string;
  author_institution: string;
  content: string;
  keywords: string[];
  bibliography: BibliographyItem[];
  metadata?: Record<string, any>;
  media?: { type: 'image' | 'video'; data: ArticleMedia };
}

export interface SubmissionFormFields extends ArticleFormFields {
  author_email: string;
}

export function buildArticleMetadata(
  bibliography: BibliographyItem[],
  media?: ArticleFormFields['media']
) {
  return {
    bibliography,
    ...(media ? { [media.type]: media.data } : {}),
  };
}

export function validateSubmissionForm(fields: SubmissionFormFields): string[] {
  const errors: string[] = [];

  if (fields.author_name.trim().length < 2) {
    errors.push('Nome do autor deve ter pelo menos 2 caracteres.');
  }
  if (!fields.author_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.author_email.trim())) {
    errors.push('Informe um e-mail válido.');
  }
  if (fields.title.trim().length < 5) {
    errors.push('Título deve ter pelo menos 5 caracteres.');
  }
  if (fields.summary.trim().length < 50) {
    errors.push('Resumo deve ter pelo menos 50 caracteres.');
  }
  if (fields.summary.trim().length > 500) {
    errors.push('Resumo pode ter no máximo 500 caracteres.');
  }
  if (!ARTICLE_EDITOR_CATEGORIES.includes(fields.category as ArticleEditorCategory)) {
    errors.push('Selecione uma categoria válida.');
  }
  if (fields.keywords.length < 1) {
    errors.push('Adicione pelo menos uma palavra-chave.');
  }
  if (fields.keywords.length > 10) {
    errors.push('Máximo de 10 palavras-chave.');
  }
  if (fields.content.trim().length < 100) {
    errors.push('Conteúdo deve ter pelo menos 100 caracteres.');
  }

  return errors;
}

// ── Função auxiliar para gerar o slug a partir do título ──
function generateSlug(text: string) {
  return text
    .toString()
    .normalize('NFD') // Remove acentos
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Troca espaços por hifens
    .replace(/[^\w-]+/g, '') // Remove caracteres especiais
    .replace(/--+/g, '-'); // Evita hifens duplos
}

export function buildSubmissionPayload(fields: SubmissionFormFields): CreateArticleSubmissionPayload {
  // Pega o metadata que vem do form (nascimento, ocupação, etc) ou cria um padrão
  const baseMetadata = fields.metadata || buildArticleMetadata(fields.bibliography);

  // Monta o JSON completo com os campos estruturais esperados
  const fullMetadata = {
    slug: generateSlug(fields.title),
    type: fields.category,
    themes: fields.keywords, // Usa as palavras-chave como temas
    sections: [], // Inicializa vazio para edição futura
    source: "Submissão de Usuário",
    ...baseMetadata, // Aqui entram a bibliografia, birth, death, etc.
  };

  return {
    title: fields.title.trim(),
    summary: fields.summary.trim(),
    category: fields.category,
    author_name: fields.author_name.trim(),
    author_email: fields.author_email.trim(),
    author_institution: fields.author_institution.trim() || undefined,
    content: fields.content.trim(),
    keywords: fields.keywords,
    metadata: fullMetadata,
    metadata: buildArticleMetadata(fields.bibliography, fields.media),
    submit_for_review: true,
  };
}
