import { z } from 'zod';
import { SUBMISSION_CATEGORIES } from './submission-constants';

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const sectionFieldsSchema = z.object({
  title: z.string(),
  content: z.string(),
});

export const articleSubmissionSchema = z.object({
  author_name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255),
  author_email: z.string().email('E-mail inválido').max(255),
  author_institution: z.string().max(255).optional().or(z.literal('')),
  title: z
    .string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200),
  category: z.enum(SUBMISSION_CATEGORIES, {
    required_error: 'Selecione uma categoria',
  }),
  keywords: z
    .string()
    .min(1, 'Informe pelo menos uma palavra-chave')
    .refine(
      (val) => {
        const items = parseKeywords(val);
        return items.length >= 1 && items.length <= 10;
      },
      { message: 'Use entre 1 e 10 palavras-chave, separadas por vírgula' }
    )
    .refine(
      (val) => parseKeywords(val).every((k) => k.length <= 50),
      { message: 'Cada palavra-chave pode ter no máximo 50 caracteres' }
    ),
  summary: z
    .string()
    .min(50, 'Resumo deve ter pelo menos 50 caracteres')
    .max(500, 'Resumo pode ter no máximo 500 caracteres'),
  content: z
    .string()
    .refine((val) => stripHtml(val).length >= 100, {
      message: 'Conteúdo principal deve ter pelo menos 100 caracteres',
    })
    .refine((val) => stripHtml(val).length <= 50000, {
      message: 'Conteúdo principal excede o limite de 50.000 caracteres',
    }),
  sections: z
    .array(sectionFieldsSchema)
    .optional()
    .superRefine((sections, ctx) => {
      if (!sections) return;
      sections.forEach((section, index) => {
        const title = section.title.trim();
        const plainContent = stripHtml(section.content);
        if (!title && plainContent.length === 0) return;

        if (!title) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Título da seção é obrigatório',
            path: [index, 'title'],
          });
        } else if (title.length > 200) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Título da seção pode ter no máximo 200 caracteres',
            path: [index, 'title'],
          });
        }

        if (plainContent.length < 20) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Conteúdo da seção deve ter pelo menos 20 caracteres',
            path: [index, 'content'],
          });
        }
      });
    }),
});

export type ArticleSubmissionFormValues = z.infer<typeof articleSubmissionSchema>;

export function parseKeywords(raw: string): string[] {
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

export function formValuesToPayload(values: ArticleSubmissionFormValues) {
  const sections =
    values.sections?.filter((s) => s.title.trim() || stripHtml(s.content).length > 0) ??
    [];

  return {
    author_name: values.author_name.trim(),
    author_email: values.author_email.trim(),
    author_institution: values.author_institution?.trim() || undefined,
    title: values.title.trim(),
    category: values.category,
    keywords: parseKeywords(values.keywords),
    summary: values.summary.trim(),
    content: values.content,
    metadata:
      sections.length > 0
        ? { sections: sections.map((s) => ({ title: s.title.trim(), content: s.content })) }
        : undefined,
  };
}
