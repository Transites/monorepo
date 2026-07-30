const templates = require('../../services/emailTemplates');

describe('EmailTemplates', () => {
    it('baseTemplate wraps content and contains title', () => {
        const out = templates.baseTemplate('<p>hi</p>', 'Titulo X');
        expect(out).toContain('<p>hi</p>');
        expect(out).toContain('<title>Titulo X</title>');
    });

    it('submissionToken contains author and button', () => {
        const html = templates.submissionToken({ authorName: 'Ana', submissionTitle: 'T', submissionUrl: 'http://u', supportEmail: 's@e' });
        expect(html).toContain('Ana');
        expect(html).toContain('Acessar Minhas Submissões');
    });

    it('adminNewSubmission includes summary and adminUrl', () => {
        const html = templates.adminNewSubmission({ submissionTitle: 'T', authorName: 'A', authorEmail: 'a@b', category: 'c', summary: 'resumo', adminUrl: 'http://x', submittedAt: new Date() });
        expect(html).toContain('Nova submissão recebida');
        expect(html).toContain('resumo');
    });

    it('feedbackToAuthor adapts for rejected status', () => {
        const html = templates.feedbackToAuthor({ authorName: 'A', submissionTitle: 'T', feedbackContent: 'conteudo', adminName: 'Admin', tokenUrl: 'u', feedbackDate: new Date(), supportEmail: 's@e', status: 'rejected' });
        expect(html).toContain('não foi aprovada');
    });

    it('submissionApproved includes article link when provided', () => {
        const html = templates.submissionApproved({ authorName: 'A', submissionTitle: 'T', articleUrl: 'http://a', publishedAt: new Date(), supportEmail: 's@e' });
        expect(html).toContain('Ver Artigo Publicado');
    });

    it('tokenExpirationWarning and tokenExpired render', () => {
        const warn = templates.tokenExpirationWarning({ authorName: 'A', submissionTitle: 'T', daysRemaining: 3, tokenUrl: 'u', expiresAt: new Date(), supportEmail: 's@e' });
        expect(warn).toContain('Seu token expira em 3 dias');

        const expired = templates.tokenExpired({ authorName: 'A', submissionTitle: 'T', recoveryUrl: 'u', supportEmail: 's@e' });
        expect(expired).toContain('Token expirado');
    });

    it('securityAlert and dailySummary include dynamic sections', () => {
        const alert = templates.securityAlert({ activityType: 'login', details: 'det', ipAddress: '1.2.3.4', timestamp: new Date(), adminUrl: 'u' });
        expect(alert).toContain('Alerta de Segurança');

        const summary = templates.dailySummary({ date: new Date(), newSubmissions: 2, pendingReviews: 1, publishedArticles: 0, expiringTokens: 1, adminUrl: 'u' });
        expect(summary).toContain('Resumo Diário');
        expect(summary).toContain('Atenção');
    });

    it('testEmail and submissionAccessLinks render list and timestamp', () => {
        const test = templates.testEmail({ timestamp: new Date(), environment: 'test' });
        expect(test).toContain('Teste de Email');

        const subs = [{ title: 'T1', updated_at: new Date(), token: 'tok', expires_at: new Date(), status: 'DRAFT' }];
        const access = templates.submissionAccessLinks({ authorEmail: 'a@b', submissions: subs, supportEmail: 's@e' });
        expect(access).toContain('Seus Artigos em Progresso');
        expect(access).toContain('Editar Artigo');
    });
});
