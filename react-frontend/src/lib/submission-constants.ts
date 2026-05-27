/** Academic categories aligned with backend `constants.CATEGORIES`. */
export const SUBMISSION_CATEGORIES = [
  'História',
  'Filosofia',
  'Literatura',
  'Arte',
  'Política',
  'Economia',
  'Sociologia',
  'Antropologia',
  'Relações Internacionais',
  'Educação',
  'Outros',
] as const;

export type SubmissionCategory = (typeof SUBMISSION_CATEGORIES)[number];
