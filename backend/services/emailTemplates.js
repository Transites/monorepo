const config = require('../config/services');

class EmailTemplates {
    /**
     * Template base para todos os emails
     */
    baseTemplate(content, title = 'Enciclopédia Transitos') {
        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6c757d;
            font-size: 16px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 15px 0;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .info-box {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            margin: 15px 0;
        }
        .warning-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 15px;
            margin: 15px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 14px;
            color: #6c757d;
        }
        .small-text {
            font-size: 12px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Transitos</div>
            <div class="subtitle">Enciclopédia de Intelectuais Franceses no Brasil</div>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>Instituto de Estudos Avançados - USP</p>
            <p class="small-text">
                Este é um email automático. Para dúvidas, responda para
                <a href="mailto:${config.email.replyTo}">${config.email.replyTo}</a>
            </p>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Template: Token de submissão
     */
    submissionToken({authorName, submissionTitle, submissionUrl, supportEmail}) {
        const content = `
            <h2>Sua submissão foi criada com sucesso!</h2>
            <p>Olá <strong>${authorName}</strong>,</p>
            <p>Sua submissão "<strong>${submissionTitle}</strong>" foi criada com sucesso e já está na fila de revisão da nossa equipe de curadoria.</p>

            <div class="info-box">
                <p><strong>Acompanhe o status:</strong></p>
                <p>Você pode acompanhar o andamento da revisão ou visualizar o texto enviado acessando o seu painel de autor.</p>
                <a href="${submissionUrl}" class="button">Acessar Minhas Submissões</a>
            </div>

            <h3>Como funciona agora?</h3>
            <ul>
                <li>Um dos nossos curadores lerá o seu texto.</li>
                <li>Você receberá um email caso o curador sugira alterações, ajustes de bibliografia ou revisões no conteúdo.</li>
                <li>Você poderá aceitar as sugestões do curador ou fazer uma contra-proposta diretamente pelo painel.</li>
                <li>Quando tudo estiver alinhado, seu artigo será aprovado e publicado na Enciclopédia!</li>
            </ul>

            <p>Agradecemos a sua contribuição.</p>
            <p>Em caso de dúvidas, entre em contato pelo email <a href="mailto:${supportEmail}">${supportEmail}</a></p>

            <p>Em caso de dúvidas, entre em contato pelo email <a href="mailto:${supportEmail}">${supportEmail}</a></p>
        `;

        return this.baseTemplate(content, 'Submissão Criada - Transitos');
    }

    /**
     * Template: Nova submissão para admin
     */
    adminNewSubmission({submissionTitle, authorName, authorEmail, category, summary, adminUrl, submittedAt}) {
        const submitDate = new Date(submittedAt).toLocaleString('pt-BR');

        const content = `
            <h2>Nova submissão recebida</h2>
            <p>Uma nova submissão foi enviada para revisão:</p>

            <div class="info-box">
                <p><strong>📝 Título:</strong> ${submissionTitle}</p>
                <p><strong>👤 Autor:</strong> ${authorName} (${authorEmail})</p>
                <p><strong>📂 Categoria:</strong> ${category || 'Não informada'}</p>
                <p><strong>📅 Enviado em:</strong> ${submitDate}</p>
            </div>

            <div class="info-box">
                <p><strong>📄 Resumo:</strong></p>
                <p>${summary || 'Resumo não fornecido'}</p>
            </div>

            <a href="${adminUrl}" class="button">Revisar Submissão</a>

            <p><strong>Ações disponíveis:</strong></p>
            <ul>
                <li>Revisar conteúdo completo</li>
                <li>Enviar feedback para correções</li>
                <li>Aprovar para publicação</li>
                <li>Rejeitar submissão</li>
            </ul>
        `;

        return this.baseTemplate(content, 'Nova Submissão - Admin Transitos');
    }

    /**
     * Template: Feedback para autor
     */
    feedbackToAuthor({
        authorName,
        submissionTitle,
        feedbackContent,
        adminName,
        tokenUrl,
        feedbackDate,
        supportEmail,
        status
    }) {
        const date = new Date(feedbackDate).toLocaleDateString('pt-BR');

        // Determine title, message content, and actions based on status
        let title = 'Feedback sobre sua submissão';
        let introMessage = `Recebemos um feedback sobre sua submissão "<strong>${submissionTitle}</strong>".`;
        let nextSteps = `
            <p><strong>Próximos passos:</strong></p>
            <ol>
                <li>Leia atentamente o feedback acima</li>
                <li>Acesse sua submissão para fazer as correções</li>
                <li>Após corrigir, envie novamente para revisão</li>
            </ol>
            <a href="${tokenUrl}" class="button">Editar Submissão</a>
            <p><em>💡 Dica: Você pode editar sua submissão quantas vezes necessário antes de reenviar para revisão.</em></p>
        `;

        // Change content based on status
        if (status === 'rejected') {
            title = 'Sua submissão não foi aprovada';
            introMessage = `Lamentamos informar que sua submissão "<strong>${submissionTitle}</strong>" não foi aprovada para publicação.`;
            nextSteps = `
                <p>Se você quiser compreender melhor esta decisão ou discutir possibilidades futuras,
                entre em contato pelo email <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            `;
        } else if (status === 'changes_requested') {
            title = 'Correções solicitadas em sua submissão';
            introMessage = `Sua submissão "<strong>${submissionTitle}</strong>" foi revisada e precisa de algumas alterações antes de ser aprovada.`;
        }

        const content = `
            <h2>${title}</h2>
            <p>Olá <strong>${authorName}</strong>,</p>
            <p>${introMessage}</p>

            <div class="info-box">
                <p><strong>📝 Feedback de ${adminName} em ${date}:</strong></p>
                <div style="white-space: pre-line; margin-top: 10px; padding: 10px; background-color: white; border-left: 4px solid #007bff;">
                    ${feedbackContent}
                </div>
            </div>

            ${nextSteps}

            <p>Em caso de dúvidas sobre o feedback, entre em contato pelo email <a href="mailto:${supportEmail}">${supportEmail}</a></p>
        `;

        return this.baseTemplate(content, `${title} - Transitos`);
    }

    /**
     * Template: Submissão aprovada
     */
    submissionApproved({authorName, submissionTitle, articleUrl, publishedAt, supportEmail}) {
        const publishDate = new Date(publishedAt).toLocaleDateString('pt-BR');

        const content = `
            <h2>🎉 Parabéns! Sua submissão foi aprovada!</h2>
            <p>Olá <strong>${authorName}</strong>,</p>
            <p>Temos o prazer de informar que sua submissão "<strong>${submissionTitle}</strong>" foi aprovada e publicada na Enciclopédia Transitos!</p>

            <div class="info-box">
                <p><strong>📅 Publicado em:</strong> ${publishDate}</p>
                ${articleUrl ? `<p><strong>🔗 Link do artigo:</strong> <a href="${articleUrl}">Ver artigo publicado</a></p>` : ''}
            </div>

            <p><strong>Obrigado por contribuir com a Enciclopédia Transitos!</strong></p>
            <p>Sua contribuição é valiosa para a divulgação científica e cultural dos intelectuais franceses no Brasil.</p>

            ${articleUrl ? `<a href="${articleUrl}" class="button">Ver Artigo Publicado</a>` : ''}

            <p><strong>Compartilhe sua conquista:</strong></p>
            <p>Sinta-se à vontade para compartilhar seu artigo publicado em suas redes sociais e com colegas da área acadêmica.</p>

            <p>Para futuras submissões ou dúvidas, entre em contato pelo email <a href="mailto:${supportEmail}">${supportEmail}</a></p>
        `;

        return this.baseTemplate(content, 'Submissão Aprovada - Transitos');
    }

    /**
     * Template: Aviso de expiração de token
     */
    tokenExpirationWarning({authorName, submissionTitle, daysRemaining, tokenUrl, expiresAt, supportEmail}) {
        const expiryDate = new Date(expiresAt).toLocaleDateString('pt-BR');

        const content = `
            <h2>⚠️ Seu token expira em ${daysRemaining} dias</h2>
            <p>Olá <strong>${authorName}</strong>,</p>
            <p>Este é um lembrete importante sobre sua submissão "<strong>${submissionTitle}</strong>".</p>

            <div class="warning-box">
                <p><strong>⏰ Seu token de acesso expira em ${daysRemaining} dias (${expiryDate})</strong></p>
                <p>Após a expiração, você não conseguirá mais editar sua submissão.</p>
            </div>

            <p><strong>O que fazer agora:</strong></p>
            <ul>
                <li>Acesse sua submissão usando o link abaixo</li>
                <li>Complete os campos que ainda faltam</li>
                <li>Revise todo o conteúdo</li>
                <li>Envie para revisão o quanto antes</li>
            </ul>

            <a href="${tokenUrl}" class="button">Acessar Submissão</a>

            <p><em>💡 Importante: Após enviar para revisão, o token será automaticamente renovado e você continuará recebendo updates sobre o status da sua submissão.</em></p>

            <p>Em caso de dúvidas, entre em contato pelo email <a href="mailto:${supportEmail}">${supportEmail}</a></p>
        `;

        return this.baseTemplate(content, 'Token Expirando - Transitos');
    }

    /**
     * Template: Token expirado
     */
    tokenExpired({authorName, submissionTitle, recoveryUrl, supportEmail}) {
        const content = `
            <h2>🔒 Token expirado</h2>
            <p>Olá <strong>${authorName}</strong>,</p>
            <p>O token de acesso para sua submissão "<strong>${submissionTitle}</strong>" expirou.</p>

            <div class="warning-box">
                <p><strong>⚠️ Não se preocupe!</strong></p>
                <p>Seus dados estão seguros e você pode solicitar um novo acesso.</p>
            </div>

            <p><strong>Como recuperar o acesso:</strong></p>
            <ol>
                <li>Clique no link abaixo</li>
                <li>Informe seu email e o título da submissão</li>
                <li>Um novo token será enviado para você</li>
            </ol>

            <a href="${recoveryUrl}" class="button">Recuperar Acesso</a>

            <p><strong>Alternativamente:</strong></p>
            <p>Entre em contato conosco pelo email <a href="mailto:${supportEmail}">${supportEmail}</a> informando:</p>
            <ul>
                <li>Seu nome completo</li>
                <li>Email usado na submissão</li>
                <li>Título da submissão</li>
            </ul>

            <p>Entraremos em contato em até 24 horas para reativar seu acesso.</p>
        `;

        return this.baseTemplate(content, 'Token Expirado - Transitos');
    }

    /**
     * Template: Alerta de segurança para admin
     */
    securityAlert({activityType, details, ipAddress, timestamp, adminUrl}) {
        const time = new Date(timestamp).toLocaleString('pt-BR');

        const content = `
            <h2>🚨 Alerta de Segurança</h2>
            <p>Uma atividade suspeita foi detectada no sistema Transitos:</p>

            <div class="warning-box">
                <p><strong>📊 Detalhes do Evento:</strong></p>
                <p><strong>Tipo:</strong> ${activityType}</p>
                <p><strong>IP:</strong> ${ipAddress}</p>
                <p><strong>Timestamp:</strong> ${time}</p>
                <p><strong>Detalhes:</strong> ${details}</p>
            </div>

            <p><strong>Ações recomendadas:</strong></p>
            <ul>
                <li>Verificar logs detalhados no painel admin</li>
                <li>Monitorar atividades subsequentes deste IP</li>
                <li>Considerar bloqueio temporário se necessário</li>
            </ul>

            <a href="${adminUrl}" class="button">Ver Logs Completos</a>

            <p><em>Este alerta foi gerado automaticamente pelo sistema de monitoramento.</em></p>
        `;

        return this.baseTemplate(content, 'Alerta de Segurança - Transitos');
    }

    /**
     * Template: Resumo diário para admin
     */
    dailySummary({date, newSubmissions, pendingReviews, publishedArticles, expiringTokens, adminUrl}) {
        const dateStr = new Date(date).toLocaleDateString('pt-BR');

        const content = `
            <h2>📊 Resumo Diário - ${dateStr}</h2>
            <p>Aqui está o resumo das atividades do dia:</p>

            <div class="info-box">
                <h3>📈 Estatísticas do Dia</h3>
                <p><strong>📝 Novas submissões:</strong> ${newSubmissions}</p>
                <p><strong>⏳ Aguardando revisão:</strong> ${pendingReviews}</p>
                <p><strong>✅ Artigos publicados:</strong> ${publishedArticles}</p>
                <p><strong>⚠️ Tokens expirando (próximos 5 dias):</strong> ${expiringTokens}</p>
            </div>

            ${pendingReviews > 0 ? `
            <div class="warning-box">
                <p><strong>⚠️ Atenção:</strong> Existem ${pendingReviews} submissões aguardando revisão.</p>
            </div>
            ` : ''}

            ${expiringTokens > 0 ? `
            <div class="warning-box">
                <p><strong>⏰ Lembrete:</strong> ${expiringTokens} tokens expiram nos próximos 5 dias.</p>
            </div>
            ` : ''}

            <a href="${adminUrl}" class="button">Acessar Painel Admin</a>

            <p><em>Este resumo é enviado diariamente às 8:00 AM.</em></p>
        `;

        return this.baseTemplate(content, 'Resumo Diário - Transitos');
    }

    /**
     * Template: Email de teste
     */
    testEmail({timestamp, environment}) {
        const time = new Date(timestamp).toLocaleString('pt-BR');

        const content = `
            <h2>✅ Teste de Email</h2>
            <p>Este é um email de teste para verificar a configuração do sistema.</p>

            <div class="info-box">
                <p><strong>🕐 Timestamp:</strong> ${time}</p>
                <p><strong>🌍 Ambiente:</strong> ${environment}</p>
                <p><strong>📧 Serviço:</strong> Resend</p>
                <p><strong>✅ Status:</strong> Configuração funcionando corretamente</p>
            </div>

            <p>Se você recebeu este email, significa que:</p>
            <ul>
                <li>✅ API do Resend está configurada corretamente</li>
                <li>✅ Templates de email estão funcionando</li>
                <li>✅ Sistema de envio está operacional</li>
            </ul>

            <p><em>Este é um email automático de teste do sistema.</em></p>
        `;

        return this.baseTemplate(content, 'Teste de Email - Transitos');
    }

    /**
     * Template: Links de acesso para artigos em progresso
     */
    submissionAccessLinks({authorEmail, submissions, supportEmail}) {
        // Gerar lista de submissões com links
        let submissionsList = '';
        submissions.forEach(submission => {
            const tokenUrl = `${config.app.frontendUrl}/submissao/editar/${submission.token}`;
            const expiryDate = new Date(submission.expires_at).toLocaleDateString('pt-BR');
            const status = submission.status === 'DRAFT' ? 'Rascunho' : 'Correções Solicitadas';

            submissionsList += `
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #dee2e6; border-radius: 4px;">
                    <p><strong>📝 Título:</strong> ${submission.title}</p>
                    <p><strong>📅 Última atualização:</strong> ${new Date(submission.updated_at).toLocaleDateString('pt-BR')}</p>
                    <p><strong>🔄 Status:</strong> ${status}</p>
                    <p><strong>⏰ Expira em:</strong> ${expiryDate}</p>
                    <a href="${tokenUrl}" class="button">Editar Artigo</a>
                </div>
            `;
        });

        const content = `
            <h2>Seus Artigos em Progresso</h2>
            <p>Olá,</p>
            <p>Encontramos os seguintes artigos em progresso associados ao email <strong>${authorEmail}</strong>:</p>

            <div class="info-box">
                <p><strong>🔗 Links de acesso aos seus artigos:</strong></p>
                ${submissionsList}
            </div>

            <p><strong>⚠️ Importante:</strong></p>
            <ul>
                <li>Estes links são pessoais e intransferíveis</li>
                <li>Salve este email para acessar suas submissões</li>
                <li>Você pode editar suas submissões quantas vezes quiser até enviá-las para revisão</li>
            </ul>

            <p>Em caso de dúvidas, entre em contato pelo email <a href="mailto:${supportEmail}">${supportEmail}</a></p>
        `;

        return this.baseTemplate(content, 'Seus Artigos em Progresso - Transitos');
    }
}

module.exports = new EmailTemplates();
