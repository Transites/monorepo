// Extensão dos templates de email para o sistema de comunicação
const emailTemplates = require('./emailTemplates');

// Adicionar novos métodos ao objeto emailTemplates
// Estes métodos serão usados pelo serviço de comunicação

/**
 * Template: Token reenviado
 */
emailTemplates.sendTokenResend = function({ authorName, submissionTitle, tokenUrl, customMessage, submissionStatus, lastUpdate, expiresAt, supportEmail, adminNote }) {
    const expiryDate = new Date(expiresAt).toLocaleDateString('pt-BR');
    const updateDate = new Date(lastUpdate).toLocaleDateString('pt-BR');

    const content = `
        <h2>🔗 Link de Acesso Reenviado</h2>
        <p>Olá <strong>${authorName}</strong>,</p>

        <p>Conforme solicitado, estamos reenviando o link de acesso para sua submissão:</p>

        <div class="info-box">
            <p><strong>📝 Artigo:</strong> ${submissionTitle}</p>
            <p><strong>📊 Status:</strong> ${submissionStatus}</p>
            <p><strong>📅 Última atualização:</strong> ${updateDate}</p>
            <p><strong>⏰ Expira em:</strong> ${expiryDate}</p>
        </div>

        ${customMessage ? `
        <div class="info-box">
            <p><strong>${adminNote}</strong></p>
            <p>${customMessage}</p>
        </div>
        ` : ''}

        <a href="${tokenUrl}" class="button">Acessar Submissão</a>

        <p><strong>Próximos passos:</strong></p>
        <ul>
            <li>Clique no botão acima para acessar sua submissão</li>
            <li>Revise e edite conforme necessário</li>
            <li>Salve suas alterações</li>
            <li>Aguarde o feedback da revisão</li>
        </ul>

        <p>Se você não solicitou este reenvio, pode ignorar este email com segurança.</p>

        <p>Dúvidas? Entre em contato: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
    `;

    return this.baseTemplate(content, 'Link Reenviado - Transitos');
};

/**
 * Template: Token regenerado
 */
emailTemplates.sendTokenRegenerated = function({ authorName, submissionTitle, tokenUrl, reason, oldTokenInvalidated, newExpiryDate, supportEmail, securityNote }) {
    const expiryDate = new Date(newExpiryDate).toLocaleDateString('pt-BR');

    const content = `
        <h2>🔐 Novo Link de Acesso Gerado</h2>
        <p>Olá <strong>${authorName}</strong>,</p>

        <p>Um novo link de acesso foi gerado para sua submissão por motivos de segurança:</p>

        <div class="info-box">
            <p><strong>📝 Artigo:</strong> ${submissionTitle}</p>
            ${reason ? `<p><strong>💭 Motivo:</strong> ${reason}</p>` : ''}
            <p><strong>⏰ Novo prazo:</strong> ${expiryDate}</p>
        </div>

        <div class="warning-box">
            <p><strong>⚠️ Importante:</strong> ${securityNote}</p>
        </div>

        <a href="${tokenUrl}" class="button">Acessar com Novo Link</a>

        <p><strong>Ações necessárias:</strong></p>
        <ul>
            <li>Use apenas o novo link acima</li>
            <li>Atualize seus favoritos se necessário</li>
            <li>O link anterior não funciona mais</li>
            <li>Continue editando normalmente</li>
        </ul>

        <p>Esta é uma medida de segurança automática do sistema.</p>

        <p>Dúvidas? Entre em contato: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
    `;

    return this.baseTemplate(content, 'Novo Link de Acesso - Transitos');
};

/**
 * Template: Submissão reativada
 */
emailTemplates.sendSubmissionReactivated = function({ authorName, submissionTitle, tokenUrl, reactivatedBy, newExpiryDate, previousStatus, currentStatus, supportEmail, welcomeBackMessage }) {
    const expiryDate = new Date(newExpiryDate).toLocaleDateString('pt-BR');

    const content = `
        <h2>✅ Submissão Reativada</h2>
        <p>Olá <strong>${authorName}</strong>,</p>

        <p><strong>${welcomeBackMessage}</strong></p>

        <div class="info-box">
            <p><strong>📝 Artigo:</strong> ${submissionTitle}</p>
            <p><strong>👤 Reativado por:</strong> ${reactivatedBy}</p>
            <p><strong>📊 Status anterior:</strong> ${previousStatus}</p>
            <p><strong>📊 Status atual:</strong> ${currentStatus}</p>
            <p><strong>⏰ Nova data limite:</strong> ${expiryDate}</p>
        </div>

        <a href="${tokenUrl}" class="button">Continuar Editando</a>

        <p><strong>O que você pode fazer agora:</strong></p>
        <ul>
            <li>Acessar sua submissão normalmente</li>
            <li>Continuar editando onde parou</li>
            <li>Revisar comentários anteriores</li>
            <li>Salvar suas alterações</li>
        </ul>

        <p>Ficamos felizes em tê-lo de volta!</p>

        <p>Dúvidas? Entre em contato: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
    `;

    return this.baseTemplate(content, 'Submissão Reativada - Transitos');
};

/**
 * Template: Alerta de expiração
 */
emailTemplates.sendExpirationAlert = function({ authorName, submissionTitle, daysToExpiry, urgency, tokenUrl, expiresAt, supportEmail, lastUpdate, feedbackCount }) {
    const expiryDate = new Date(expiresAt).toLocaleDateString('pt-BR');
    const updateDate = new Date(lastUpdate).toLocaleDateString('pt-BR');

    const urgencyConfig = {
        urgent: { color: '#dc3545', icon: '🚨', title: 'URGENTE' },
        high: { color: '#ffc107', icon: '⚠️', title: 'ATENÇÃO' },
        normal: { color: '#17a2b8', icon: '⏰', title: 'LEMBRETE' }
    };

    const config = urgencyConfig[urgency] || urgencyConfig.normal;

    const content = `
        <h2 style="color: ${config.color};">${config.icon} ${config.title}: Submissão Expira em ${daysToExpiry} ${daysToExpiry === 1 ? 'Dia' : 'Dias'}</h2>
        <p>Olá <strong>${authorName}</strong>,</p>

        <p>Sua submissão está próxima do prazo de expiração e precisa de atenção:</p>

        <div class="warning-box" style="border-left: 4px solid ${config.color};">
            <p><strong>📝 Artigo:</strong> ${submissionTitle}</p>
            <p><strong>⏰ Expira em:</strong> ${expiryDate} (${daysToExpiry} ${daysToExpiry === 1 ? 'dia' : 'dias'})</p>
            <p><strong>📅 Última atualização:</strong> ${updateDate}</p>
            ${feedbackCount > 0 ? `<p><strong>💬 Feedback pendente:</strong> ${feedbackCount} comentário${feedbackCount > 1 ? 's' : ''}</p>` : ''}
        </div>

        <a href="${tokenUrl}" class="button" style="background-color: ${config.color};">Acessar Agora</a>

        <p><strong>Ações recomendadas:</strong></p>
        <ul>
            <li>Acesse sua submissão imediatamente</li>
            ${feedbackCount > 0 ? '<li>Revise e responda aos comentários</li>' : ''}
            <li>Faça as correções necessárias</li>
            <li>Salve suas alterações</li>
            <li>Entre em contato se precisar de mais tempo</li>
        </ul>

        ${daysToExpiry === 1 ? `
        <div class="warning-box">
            <p><strong>⚠️ Último dia:</strong> Este é seu último dia para editar antes que a submissão expire.</p>
        </div>
        ` : ''}

        <p>Precisa de mais tempo? Entre em contato: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
    `;

    return this.baseTemplate(content, `${config.title}: Submissão Expira em ${daysToExpiry} ${daysToExpiry === 1 ? 'Dia' : 'Dias'} - Transitos`);
};

/**
 * Template: Submissão expirou
 */
emailTemplates.sendSubmissionExpired = function({ authorName, submissionTitle, expiredAt, supportEmail, recoveryInstructions }) {
    const expiredDate = new Date(expiredAt).toLocaleDateString('pt-BR');

    const content = `
        <h2>⏰ Submissão Expirada</h2>
        <p>Olá <strong>${authorName}</strong>,</p>

        <p>Infelizmente, sua submissão expirou e não pode mais ser editada:</p>

        <div class="warning-box">
            <p><strong>📝 Artigo:</strong> ${submissionTitle}</p>
            <p><strong>⏰ Expirou em:</strong> ${expiredDate}</p>
            <p><strong>📊 Status:</strong> Expirado</p>
        </div>

        <p><strong>O que isso significa:</strong></p>
        <ul>
            <li>Seu link de edição não funciona mais</li>
            <li>Não é possível fazer alterações no momento</li>
            <li>Sua submissão não foi perdida</li>
            <li>É possível reativar mediante solicitação</li>
        </ul>

        <p><strong>Como reativar:</strong></p>
        <p>${recoveryInstructions}</p>

        <div class="info-box">
            <p><strong>💡 Para evitar futuras expirações:</strong></p>
            <ul>
                <li>Acesse sua submissão regularmente</li>
                <li>Responda aos feedbacks rapidamente</li>
                <li>Fique atento aos emails de alerta</li>
                <li>Entre em contato se precisar de mais tempo</li>
            </ul>
        </div>

        <p>Entre em contato para reativar: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
    `;

    return this.baseTemplate(content, 'Submissão Expirada - Transitos');
};

/**
 * Template: Lembrete personalizado
 */
emailTemplates.sendCustomReminder = function({ authorName, submissionTitle, customMessage, adminName, urgency, tokenUrl, submissionStatus, lastUpdate, expiresAt, supportEmail, urgencyColors }) {
    const color = urgencyColors[urgency] || urgencyColors.normal;
    const expiryDate = new Date(expiresAt).toLocaleDateString('pt-BR');

    const content = `
        <h2 style="color: ${color};">💌 Lembrete do Administrador</h2>
        <p>Olá <strong>${authorName}</strong>,</p>

        <p><strong>${adminName}</strong> enviou uma mensagem sobre sua submissão:</p>

        <div class="info-box">
            <p><strong>📝 Artigo:</strong> ${submissionTitle}</p>
            <p><strong>📊 Status:</strong> ${submissionStatus}</p>
            <p><strong>⏰ Expira em:</strong> ${expiryDate}</p>
        </div>

        <div class="message-box" style="border-left: 4px solid ${color};">
            <p><strong>Mensagem de ${adminName}:</strong></p>
            <p>${customMessage}</p>
        </div>

        <a href="${tokenUrl}" class="button" style="background-color: ${color};">Acessar Submissão</a>

        <p>Por favor, acesse sua submissão e tome as ações necessárias.</p>

        <p>Dúvidas? Responda este email ou entre em contato: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
    `;

    return this.baseTemplate(content, 'Lembrete do Administrador - Transitos');
};

/**
 * Template: Alerta de expiração em massa
 */
emailTemplates.sendMassExpirationAlert = function({ count, submissions, adminUrl, date }, adminEmail) {
    const dateStr = new Date(date).toLocaleDateString('pt-BR');

    const submissionsList = submissions.map(sub =>
        `<li><strong>${sub.title}</strong> (${sub.author_name}, ${sub.author_email})</li>`
    ).join('');

    const content = `
        <h2>🚨 Alerta: Múltiplas Submissões Expiradas</h2>
        <p>Olá Administrador,</p>

        <p>Hoje (${dateStr}), <strong>${count} submissões</strong> foram marcadas como expiradas automaticamente.</p>

        <div class="warning-box">
            <p><strong>⚠️ Atenção:</strong> Este número é maior que o normal e pode indicar um problema.</p>
        </div>

        <p><strong>Primeiras ${submissions.length} submissões afetadas:</strong></p>
        <ul>
            ${submissionsList}
        </ul>

        <a href="${adminUrl}" class="button">Ver Todas Submissões Expiradas</a>

        <p><strong>Ações recomendadas:</strong></p>
        <ul>
            <li>Verificar se houve algum problema técnico</li>
            <li>Considerar enviar um comunicado aos autores</li>
            <li>Reativar submissões importantes manualmente</li>
        </ul>

        <p>Este é um alerta automático do sistema.</p>
    `;

    return this.baseTemplate(content, 'Alerta: Múltiplas Submissões Expiradas - Transitos');
};

module.exports = emailTemplates;
