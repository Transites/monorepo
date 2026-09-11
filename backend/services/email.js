const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const logger = require('../middleware/logging');
const config = require('../config/services');
const emailTemplates = require('./emailTemplates');

class EmailService {
    constructor() {
        this.resend = config.email.apiKey ? new Resend(config.email.apiKey) : null;
        this.fromEmail = config.email.fromEmail || 'enciclopedia.iea.usp@gmail.com';
        this.smtpFromEmail = config.email.smtpFromEmail || this.fromEmail;
        this.resendFromEmail = config.email.resendFromEmail || 'noreply@enciclopedia.iea.usp.br';
        this.fromName = config.email.fromName || 'Enciclopédia Transitos';
        this.replyTo = config.email.replyTo;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        this.smtpAccounts = this.buildSmtpAccounts();
    }

    buildSmtpAccounts() {
        const smtpConfig = config.email.smtp || {};
        const accounts = (smtpConfig.accounts || []).filter(Boolean);

        return accounts
            .filter((account) => account.user && account.pass)
            .map((account) => ({
                ...account,
                transporter: nodemailer.createTransport({
                    host: smtpConfig.host || 'smtp.gmail.com',
                    port: smtpConfig.port || 587,
                    secure: smtpConfig.secure === true,
                    auth: {
                        user: account.user,
                        pass: account.pass,
                    },
                    tls: {
                        rejectUnauthorized: false,
                    },
                })
            }));
    }

    async sendViaSmtp(emailData) {
        if (!this.smtpAccounts.length) {
            throw new Error('SMTP Gmail não configurado');
        }

        let lastError = null;

        for (const account of this.smtpAccounts) {
            try {
                const smtpPayload = {
                    ...emailData,
                    from: `${this.fromName} <${this.smtpFromEmail || account.user}>`,
                    replyTo: this.replyTo,
                };

                const info = await account.transporter.sendMail(smtpPayload);

                return {
                    success: true,
                    messageId: info?.messageId || null,
                    provider: 'smtp',
                    account: account.user,
                };
            } catch (error) {
                lastError = error;
                logger.warn('SMTP Gmail delivery failed for account', {
                    account: account.user,
                    error: error.message,
                    subject: emailData.subject,
                    recipients: emailData.to,
                });
            }
        }

        throw lastError || new Error('SMTP Gmail indisponível para envio');
    }

    async sendViaResend(emailData) {
        if (!this.resend) {
            throw new Error('Resend não configurado');
        }

        const result = await this.resend.emails.send(emailData);

        if (result?.error) {
            const errorMessage = result.error?.message || 'Erro ao enviar via Resend';
            throw new Error(errorMessage);
        }

        return {
            success: true,
            messageId: result?.data?.id || null,
            provider: 'resend',
        };
    }

    /**
     * Enviar email com retry automático e fallback SMTP -> Resend
     */
    async sendEmail({ to, subject, html, text = null, retryCount = 0 }) {
        try {
            const emailData = {
                from: `${this.fromName} <${this.fromEmail}>`,
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
                reply_to: this.replyTo,
            };

            if (text) {
                emailData.text = text;
            }

            const smtpResult = await this.sendViaSmtp(emailData);

            logger.audit('sendEmail', {
                to: emailData.to,
                subject,
                messageId: smtpResult.messageId,
                provider: 'smtp',
                retryCount,
                statusCode: 200,
            });

            return {
                success: true,
                messageId: smtpResult.messageId,
                retryCount,
                provider: 'smtp',
            };
        } catch (smtpError) {
            logger.error('SMTP Gmail failed, falling back to Resend', {
                to,
                subject,
                error: smtpError.message,
                retryCount,
            });

            try {
                const resendResult = await this.sendViaResend({
                    ...{
                        from: `${this.fromName} <${this.resendFromEmail}>`,
                        to: Array.isArray(to) ? to : [to],
                        subject,
                        html,
                        reply_to: this.replyTo,
                    },
                    ...(text ? { text } : {}),
                });

                logger.audit('sendEmail', {
                    to: Array.isArray(to) ? to : [to],
                    subject,
                    messageId: resendResult.messageId,
                    provider: 'resend',
                    retryCount,
                    statusCode: 200,
                });

                return {
                    success: true,
                    messageId: resendResult.messageId,
                    retryCount,
                    provider: 'resend',
                };
            } catch (resendError) {
                logger.error('Email sending failed via SMTP and Resend', {
                    to,
                    subject,
                    error: resendError.message,
                    retryCount,
                });

                if (retryCount < this.retryAttempts) {
                    const delay = this.retryDelay * Math.pow(2, retryCount);

                    logger.info(`Retrying email in ${delay}ms`, {
                        to,
                        subject,
                        retryCount: retryCount + 1,
                    });

                    await this.sleep(delay);
                    return this.sendEmail({ to, subject, html, text, retryCount: retryCount + 1 });
                }

                throw new Error(`Falha ao enviar email após ${retryCount} tentativas: ${resendError.message}`);
            }
        }
    }

    /**
     * Enviar token de submissão para autor
     */
    async sendSubmissionToken(authorEmail, submission) {
        try {
            const submissionUrl = `${config.app.frontendUrl}/minhas-submissoes/${submission.id}`;
            const html = emailTemplates.submissionToken({
                authorName: submission.author_name,
                submissionTitle: submission.title,
                submissionUrl,
                supportEmail: this.replyTo
            });

            const subject = `[Transitos] Sua submissão foi criada - ${submission.title}`;

            const result = await this.sendEmail({
                to: authorEmail,
                subject,
                html
            });

            if (!result.success) {
                logger.error('Failed to send submission token email', {
                    submissionId: submission.id,
                    authorEmail,
                    error: result.errorMessage,
                    statusCode: result.statusCode
                });
                return result;
            }

            logger.audit('Submission token email sent', {
                submissionId: submission.id,
                authorEmail,
            });

            return { success: true };

        } catch (error) {
            logger.error('Failed to send submission token email', {
                submissionId: submission.id,
                authorEmail,
                error: error.message
            });
            return { success: false, errorMessage: error.message };
        }
    }

    /**
     * Notificar admin sobre nova submissão
     */
    async notifyAdminNewSubmission(submission, adminEmails) {
        try {
            const adminUrl = `${config.app.frontendUrl}/admin/revisar/${submission.id}`;

            const html = emailTemplates.adminNewSubmission({
                submissionTitle: submission.title,
                authorName: submission.author_name,
                authorEmail: submission.author_email,
                category: submission.category,
                summary: submission.summary,
                adminUrl,
                submittedAt: submission.created_at
            });

            const subject = `[Transitos Admin] Nova submissão: ${submission.title}`;

            // Enviar em paralelo para reduzir o tempo total e não bloquear a resposta da API.
            await Promise.all(adminEmails.map((adminEmail) => this.sendEmail({
                to: adminEmail,
                subject,
                html
            })));

            logger.audit('Admin notifications sent individually', {
                submissionId: submission.id,
                adminCount: adminEmails.length
            });

            return { success: true };

        } catch (error) {
            logger.error('Failed to send admin notification', {
                submissionId: submission.id,
                error: error.message
            });
            return { success: false, errorMessage: error.message };
        }
    }

    /**
     * Enviar feedback para autor
     */
    async sendFeedbackToAuthor(submission, feedback, adminName) {
        try {
            const tokenUrl = `${config.app.frontendUrl}/submissao/editar/${submission.token}`;

            const html = emailTemplates.feedbackToAuthor({
                authorName: submission.author_name,
                submissionTitle: submission.title,
                feedbackContent: feedback.content,
                adminName,
                tokenUrl,
                feedbackDate: feedback.created_at,
                supportEmail: this.replyTo,
                status: feedback.status || 'pending'
            });

            let subject = `[Transitos] Feedback para sua submissão - ${submission.title}`;
            if (feedback.status === 'rejected') {
                subject = `[Transitos] Sua submissão não foi aprovada - ${submission.title}`;
            } else if (feedback.status === 'changes_requested') {
                subject = `[Transitos] Correções solicitadas - ${submission.title}`;
            }

            const result = await this.sendEmail({
                to: submission.author_email,
                subject,
                html
            });

            if (!result.success) {
                logger.error('Failed to send feedback email', {
                    submissionId: submission.id,
                    feedbackId: feedback.id,
                    error: result.errorMessage,
                    statusCode: result.statusCode
                });
                return result;
            }

            logger.audit('Feedback email sent to author', {
                submissionId: submission.id,
                feedbackId: feedback.id,
                authorEmail: submission.author_email,
                adminName
            });

            return { success: true };

        } catch (error) {
            logger.error('Failed to send feedback email', {
                submissionId: submission.id,
                feedbackId: feedback.id,
                error: error.message
            });
            return { success: false, errorMessage: error.message };
        }
    }

    async sendApprovalNotification(submission, adminName) {
        try {
            const html = `
                <h2>🎉 Sua submissão foi aprovada</h2>
                <p>Olá <strong>${submission.author_name}</strong>,</p>
                <p>Sua submissão <strong>${submission.title}</strong> foi aprovada pelo curador <strong>${adminName}</strong>.</p>
                <p>Agora ela pode seguir para publicação na Enciclopédia Transitos.</p>
                <p>Em caso de dúvidas, entre em contato pelo email <a href="mailto:${this.replyTo}">${this.replyTo}</a>.</p>
            `;

            const result = await this.sendEmail({
                to: submission.author_email,
                subject: `[Transitos] Sua submissão foi aprovada - ${submission.title}`,
                html,
            });

            if (!result.success) {
                logger.error('Failed to send approval notification', {
                    submissionId: submission.id,
                    error: result.errorMessage,
                    statusCode: result.statusCode,
                });
                return result;
            }

            logger.audit('Approval notification sent to author', {
                submissionId: submission.id,
                authorEmail: submission.author_email,
                adminName,
            });

            return { success: true };
        } catch (error) {
            logger.error('Failed to send approval notification', {
                submissionId: submission.id,
                error: error.message,
            });
            return { success: false, errorMessage: error.message };
        }
    }

    async sendRejectionNotification(submission, adminName) {
        try {
            const html = `
                <h2>⚠️ Sua submissão foi recusada</h2>
                <p>Olá <strong>${submission.author_name}</strong>,</p>
                <p>O curador <strong>${adminName}</strong> avaliou sua submissão <strong>${submission.title}</strong> e decidiu não aprová-la neste momento.</p>
                <p>Você pode revisar os comentários e, se necessário, submeter uma nova versão ou entrar em contato com a equipe.</p>
                <p>Para dúvidas, escreva para <a href="mailto:${this.replyTo}">${this.replyTo}</a>.</p>
            `;

            const result = await this.sendEmail({
                to: submission.author_email,
                subject: `[Transitos] Sua submissão não foi aprovada - ${submission.title}`,
                html,
            });

            if (!result.success) {
                logger.error('Failed to send rejection notification', {
                    submissionId: submission.id,
                    error: result.errorMessage,
                    statusCode: result.statusCode,
                });
                return result;
            }

            logger.audit('Rejection notification sent to author', {
                submissionId: submission.id,
                authorEmail: submission.author_email,
                adminName,
            });

            return { success: true };
        } catch (error) {
            logger.error('Failed to send rejection notification', {
                submissionId: submission.id,
                error: error.message,
            });
            return { success: false, errorMessage: error.message };
        }
    }

/**
 * @param {any} submission
 * @param {string} adminEmail
 * @param {string} authorEmail
 * @param {string | null} [suggestionTitle]
 */
    async sendSuggestionAcceptedToAuthor(submission, authorEmail, adminName = 'Curador') {
        try {
            const html = `
                <h2>✅ Sua sugestão foi aceita</h2>
                <p>Olá <strong>${submission.author_name || authorEmail}</strong>,</p>
                <p>Você aceitou a sugestão de revisão enviada pelo curador <strong>${adminName}</strong> para a submissão <strong>${submission.title}</strong>.</p>
                <p>O sistema já aplicou as alterações e a submissão voltou para revisão.</p>
                <p>Se precisar de ajuda, fale com a equipe em <a href="mailto:${this.replyTo}">${this.replyTo}</a>.</p>
            `;

            const result = await this.sendEmail({
                to: authorEmail,
                subject: `[Transitos] Sugestão aceita - ${submission.title}`,
                html,
            });

            if (!result.success) {
                logger.error('Failed to send suggestion accepted email to author', {
                    submissionId: submission.id,
                    authorEmail,
                    error: result.errorMessage,
                    statusCode: result.statusCode,
                });
                return result;
            }

            logger.audit('Suggestion accepted email sent to author', {
                submissionId: submission.id,
                authorEmail,
            });

            return { success: true };
        } catch (error) {
            logger.error('Failed to send suggestion accepted email to author', {
                submissionId: submission.id,
                authorEmail,
                error: error.message,
            });
            return { success: false, errorMessage: error.message };
        }
    }

    async sendCounterProposalReceivedToAuthor(submission, authorEmail, adminName = 'Curador') {
        try {
            const html = `
                <h2>📝 Sua contra-proposta foi enviada</h2>
                <p>Olá <strong>${submission.author_name || authorEmail}</strong>,</p>
                <p>Sua contra-proposta foi enviada com sucesso para o curador <strong>${adminName}</strong> na submissão <strong>${submission.title}</strong>.</p>
                <p>A equipe vai analisar sua nova versão e responder em seguida.</p>
                <p>Para dúvidas, escreva para <a href="mailto:${this.replyTo}">${this.replyTo}</a>.</p>
            `;

            const result = await this.sendEmail({
                to: authorEmail,
                subject: `[Transitos] Contra-proposta enviada - ${submission.title}`,
                html,
            });

            if (!result.success) {
                logger.error('Failed to send counter proposal confirmation to author', {
                    submissionId: submission.id,
                    authorEmail,
                    error: result.errorMessage,
                    statusCode: result.statusCode,
                });
                return result;
            }

            logger.audit('Counter proposal confirmation sent to author', {
                submissionId: submission.id,
                authorEmail,
            });

            return { success: true };
        } catch (error) {
            logger.error('Failed to send counter proposal confirmation to author', {
                submissionId: submission.id,
                authorEmail,
                error: error.message,
            });
            return { success: false, errorMessage: error.message };
        }
    }

    async notifyCuratorOnSuggestionAccepted(submission, adminEmail, authorEmail, suggestionTitle = null) {
        try {
            const html = `
                <h2>✅ Autor aceitou a sugestão</h2>
                <p>Olá,</p>
                <p>O autor <strong>${authorEmail}</strong> aceitou a sugestão de revisão para a submissão <strong>${submission.title}</strong>.</p>
                ${suggestionTitle ? `<p>Sugestão: <strong>${suggestionTitle}</strong></p>` : ''}
                <p>Você pode acompanhar o andamento no painel da revisão.</p>
            `;

            const result = await this.sendEmail({
                to: adminEmail,
                subject: `[Transitos] Autor aceitou a sugestão - ${submission.title}`,
                html,
            });

            if (!result.success) {
                logger.error('Failed to send author accepted suggestion email', {
                    submissionId: submission.id,
                    adminEmail,
                    error: result.errorMessage,
                    statusCode: result.statusCode,
                });
                return result;
            }

            logger.audit('Author accepted suggestion notification sent to curator', {
                submissionId: submission.id,
                adminEmail,
                authorEmail,
            });

            return { success: true };
        } catch (error) {
            logger.error('Failed to send author accepted suggestion email', {
                submissionId: submission.id,
                error: error.message,
            });
            return { success: false, errorMessage: error.message };
        }
    }

/**
 * @param {any} submission
 * @param {string} adminEmail
 * @param {string} authorEmail
 * @param {string | null} [notes]
 */
    async notifyCuratorOnCounterProposal(submission, adminEmail, authorEmail, notes = null) {
        try {
            const html = `
                <h2>📝 Autor enviou contra-proposta</h2>
                <p>Olá,</p>
                <p>O autor <strong>${authorEmail}</strong> enviou uma contra-proposta para a submissão <strong>${submission.title}</strong>.</p>
                ${notes ? `<div><p><strong>Observações:</strong></p><p>${notes}</p></div>` : ''}
                <p>Por favor, revise a nova versão no painel de curadoria.</p>
            `;

            const result = await this.sendEmail({
                to: adminEmail,
                subject: `[Transitos] Contra-proposta do autor - ${submission.title}`,
                html,
            });

            if (!result.success) {
                logger.error('Failed to send counter proposal email', {
                    submissionId: submission.id,
                    adminEmail,
                    error: result.errorMessage,
                    statusCode: result.statusCode,
                });
                return result;
            }

            logger.audit('Counter proposal notification sent to curator', {
                submissionId: submission.id,
                adminEmail,
                authorEmail,
            });

            return { success: true };
        } catch (error) {
            logger.error('Failed to send counter proposal email', {
                submissionId: submission.id,
                error: error.message,
            });
            return { success: false, errorMessage: error.message };
        }
    }

    /**
     * Notificar autor sobre aprovação
     */
    async notifyAuthorApproval(submission, articleUrl = null) {
        try {
            const html = emailTemplates.submissionApproved({
                authorName: submission.author_name,
                submissionTitle: submission.title,
                articleUrl,
                publishedAt: new Date(),
                supportEmail: this.replyTo
            });

            const subject = `[Transitos] Sua submissão foi aprovada! - ${submission.title}`;

            const result = await this.sendEmail({
                to: submission.author_email,
                subject,
                html
            });

            if (!result.success) {
                logger.error('Failed to send approval notification', {
                    submissionId: submission.id,
                    error: result.errorMessage,
                    statusCode: result.statusCode
                });
                return result;
            }

            logger.audit('Approval notification sent to author', {
                submissionId: submission.id,
                authorEmail: submission.author_email,
                articleUrl
            });

            return { success: true };

        } catch (error) {
            logger.error('Failed to send approval notification', {
                submissionId: submission.id,
                error: error.message
            });
            return { success: false, errorMessage: error.message };
        }
    }

    /**
     * Avisar sobre expiração próxima do token
     */
    async sendExpirationWarning(submission, daysRemaining) {
        try {
            const tokenUrl = `${config.app.frontendUrl}/submissao/editar/${submission.token}`;

            const html = emailTemplates.tokenExpirationWarning({
                authorName: submission.author_name,
                submissionTitle: submission.title,
                daysRemaining,
                tokenUrl,
                expiresAt: submission.expires_at,
                supportEmail: this.replyTo
            });

            const subject = `[Transitos] Seu token expira em ${daysRemaining} dias - ${submission.title}`;

            const result = await this.sendEmail({
                to: submission.author_email,
                subject,
                html
            });

            if (!result.success) {
                logger.error('Failed to send expiration warning', {
                    submissionId: submission.id,
                    error: result.errorMessage,
                    statusCode: result.statusCode
                });
                return result;
            }

            logger.audit('Expiration warning sent', {
                submissionId: submission.id,
                authorEmail: submission.author_email,
                daysRemaining
            });

            return { success: true };

        } catch (error) {
            logger.error('Failed to send expiration warning', {
                submissionId: submission.id,
                error: error.message
            });
            return { success: false, errorMessage: error.message };
        }
    }

    /**
     * Notificar sobre token expirado
     */
    async notifyTokenExpired(submission) {
        try {
            const recoveryUrl = `${config.app.frontendUrl}/recuperar-acesso`;

            const html = emailTemplates.tokenExpired({
                authorName: submission.author_name,
                submissionTitle: submission.title,
                recoveryUrl,
                supportEmail: this.replyTo
            });

            const subject = `[Transitos] Token expirado - ${submission.title}`;

            const result = await this.sendEmail({
                to: submission.author_email,
                subject,
                html
            });

            if (!result.success) {
                logger.error('Failed to send token expired notification', {
                    submissionId: submission.id,
                    error: result.errorMessage,
                    statusCode: result.statusCode
                });
                return result;
            }

            logger.audit('Token expired notification sent', {
                submissionId: submission.id,
                authorEmail: submission.author_email
            });

            return { success: true };

        } catch (error) {
            logger.error('Failed to send token expired notification', {
                submissionId: submission.id,
                error: error.message
            });
            return { success: false, errorMessage: error.message };
        }
    }

    /**
     * Notificar admin sobre padrões suspeitos
     */
    async alertAdminSuspiciousActivity(activityData, adminEmails) {
        try {
            const html = emailTemplates.securityAlert({
                activityType: activityData.type,
                details: activityData.details,
                ipAddress: activityData.ip,
                timestamp: new Date(),
                adminUrl: `${config.app.frontendUrl}/admin/logs`
            });

            const subject = `[Transitos Security] Atividade suspeita detectada`;

            const result = await this.sendEmail({
                to: adminEmails,
                subject,
                html
            });

            if (!result.success) {
                logger.error('Failed to send security alert', {
                    activityData,
                    error: result.errorMessage,
                    statusCode: result.statusCode
                });
                return result;
            }

            logger.audit('Security alert sent to admins', {
                activityType: activityData.type,
                adminEmails
            });

            return { success: true };

        } catch (error) {
            logger.error('Failed to send security alert', {
                activityData,
                error: error.message
            });
            return { success: false, errorMessage: error.message };
        }
    }

    /**
     * Enviar resumo diário para admin
     */
    async sendDailySummary(summaryData, adminEmails) {
        try {
            const html = emailTemplates.dailySummary({
                date: new Date(),
                newSubmissions: summaryData.newSubmissions,
                pendingReviews: summaryData.pendingReviews,
                publishedArticles: summaryData.publishedArticles,
                expiringTokens: summaryData.expiringTokens,
                adminUrl: `${config.app.frontendUrl}/admin/dashboard`
            });

            const subject = `[Transitos] Resumo diário - ${new Date().toLocaleDateString('pt-BR')}`;

            const result = await this.sendEmail({
                to: adminEmails,
                subject,
                html
            });

            if (!result.success) {
                logger.error('Failed to send daily summary', {
                    summaryData,
                    error: result.errorMessage,
                    statusCode: result.statusCode
                });
                return result;
            }

            logger.audit('Daily summary sent to admins', {
                adminEmails,
                summaryData
            });

            return { success: true };

        } catch (error) {
            logger.error('Failed to send daily summary', {
                summaryData,
                error: error.message
            });
            return { success: false, errorMessage: error.message };
        }
    }

    /**
     * Testar configuração de email
     */
    async testEmailConfiguration(testEmail) {
        try {
            const html = emailTemplates.testEmail({
                timestamp: new Date(),
                environment: process.env.NODE_ENV || 'development'
            });

            const result = await this.sendEmail({
                to: testEmail,
                subject: '[Transitos] Teste de configuração de email',
                html
            });

            return { success: result.success, message: result?.errorMessage ?? 'Email enviado com sucesso' };

        } catch (error) {
            logger.error('Email configuration test failed', {
                testEmail,
                error: error.message
            });
            return { success: false, errorMessage: error.message };
        }
    }

    /**
     * Obter estatísticas de email
     */
    async getEmailStats() {
        // Implementar com dados do Resend API se disponível
        // Por ora, retornar dados básicos dos logs
        return {
            emailsSentToday: 0, // Implementar com query nos logs
            failureRate: 0,
            lastSuccessfulEmail: null,
            lastFailedEmail: null
        };
    }

    /**
     * Enviar links de acesso para artigos em progresso
     */
    async sendSubmissionAccessLinks(authorEmail, submissions) {
        try {
            const html = emailTemplates.submissionAccessLinks({
                authorEmail,
                submissions,
                supportEmail: this.replyTo
            });

            const subject = `[Transitos] Seus artigos em progresso`;

            const result = await this.sendEmail({
                to: authorEmail,
                subject,
                html
            });

            if (!result.success) {
                logger.error('Failed to send submission access links email', {
                    authorEmail,
                    submissionCount: submissions.length,
                    error: result.errorMessage,
                    statusCode: result.statusCode
                });
                return result;
            }

            logger.audit('Submission access links email sent', {
                authorEmail,
                submissionCount: submissions.length
            });

            return { success: true };

        } catch (error) {
            logger.error('Failed to send submission access links email', {
                authorEmail,
                submissionCount: submissions?.length || 0,
                error: error.message
            });
            return { success: false, errorMessage: error.message };
        }
    }

    /**
     * Utility: Sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new EmailService();
