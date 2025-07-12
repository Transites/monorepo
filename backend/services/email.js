const { Resend } = require('resend');
const logger = require('../middleware/logging');
const config = require('../config/services');
const emailTemplates = require('./emailTemplates');

// TODO: Update to use TypeScript.
// TODO: Update to rely on error response from the API rather than exceptions.
//  Resend responses do not throw exceptions, so it is TERRIBLY wrong to always return success: true when exceptions do not happen.
class EmailService {
    constructor() {
        this.resend = new Resend(config.email.apiKey);
        this.fromEmail = process.env.NODE_ENV !== 'production' ? "onboarding@resend.dev" : config.email.fromEmail;
        this.fromName = process.env.NODE_ENV !== 'production' ? "Acme" : config.email.fromName;
        this.replyTo = config.email.replyTo;
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second base delay
    }

    /**
     * Enviar email com retry automático
     */
    async sendEmail({ to, subject, html, text = null, retryCount = 0 }) {
        try {
            const emailData = {
                from: `${this.fromName} <${this.fromEmail}>`,
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
                reply_to: this.replyTo
            };

            if (text) {
                emailData.text = text;
            }

            const result = await this.resend.emails.send(emailData);

            logger.audit("sendEmail", {
                to: emailData.to,
                subject,
                messageId: result.data?.id,
                retryCount,
                emailId: result?.id ?? null,
                statusCode: result?.error?.statusCode || 200
            })

            return {
                success: true,
                messageId: result.data?.id,
                retryCount
            };

        } catch (error) {
            logger.error('Email sending failed', {
                to,
                subject,
                error: error.message,
                retryCount
            });

            // Retry logic
            // TODO: retry logic only works if exception is thrown. however, resend failures aren't exceptions, they're returned as errors in the response body.
            //  Therefore, this retry mechanism is NOT working!

            if (retryCount < this.retryAttempts) {
                const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff

                logger.info(`Retrying email in ${delay}ms`, {
                    to,
                    subject,
                    retryCount: retryCount + 1
                });

                await this.sleep(delay);
                return this.sendEmail({ to, subject, html, text, retryCount: retryCount + 1 });
            }

            // All retries failed
            logger.error('Email sending failed after all retries', {
                to,
                subject,
                finalError: error.message,
                totalRetries: retryCount
            });

            throw new Error(`Falha ao enviar email após ${retryCount} tentativas: ${error.message}`);
        }
    }

    /**
     * Enviar token de submissão para autor
     */
    async sendSubmissionToken(authorEmail, submission, token) {
        try {
            const tokenUrl = `${config.app.frontendUrl}/submissao/editar/${token}`;

            const html = emailTemplates.submissionToken({
                authorName: submission.author_name,
                submissionTitle: submission.title,
                tokenUrl,
                expiresAt: submission.expires_at,
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
                token: token.substring(0, 8) + '...'
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
            const adminUrl = `${config.app.frontendUrl}/admin/submissoes/${submission.id}`;

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

            const result = await this.sendEmail({
                to: adminEmails,
                subject,
                html
            });

            if (!result.success) {
                logger.error('Failed to send admin notification', {
                    submissionId: submission.id,
                    adminEmails,
                    error: result.errorMessage,
                    statusCode: result.statusCode
                });
                return result;
            }

            logger.audit('Admin notification sent for new submission', {
                submissionId: submission.id,
                adminEmails,
                authorEmail: submission.author_email
            });

            return { success: true };

        } catch (error) {
            logger.error('Failed to send admin notification', {
                submissionId: submission.id,
                adminEmails,
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
                supportEmail: this.replyTo
            });

            const subject = `[Transitos] Feedback para sua submissão - ${submission.title}`;

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
     * Utility: Sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new EmailService();
