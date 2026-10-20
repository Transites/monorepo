import { describe, expect, it } from 'vitest';
import { SUBMISSION_TERMS_AGREEMENT_LABEL, SUBMISSION_TERMS_TEXT } from './SubmissionTermsDialog';

describe('SubmissionTermsDialog', () => {
  it('contains the project terms and the agreement wording', () => {
    expect(SUBMISSION_TERMS_TEXT).toContain('Enciclopédia Digital das Relações Brasil-França');
    expect(SUBMISSION_TERMS_AGREEMENT_LABEL).toBe('Li e concordo');
  });
});
