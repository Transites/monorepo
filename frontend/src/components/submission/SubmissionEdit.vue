<template>
  <div class="submission-edit">
    <v-container>
      <!-- Header com informações do token -->
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4" :color="tokenStatusColor" dark>
            <v-card-title>
              <v-icon left>{{ tokenStatusIcon }}</v-icon>
              Editando Submissão: {{ submissionData.title || 'Carregando...' }}
            </v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <p class="mb-1">
                    <strong>Status:</strong> {{ getStatusDisplayName(submissionData.status) }}
                  </p>
                  <p class="mb-1">
                    <strong>Autor:</strong> {{ submissionData.author_name }}
                  </p>
                  <p class="mb-0">
                    <strong>Última atualização:</strong> {{ formatDate(submissionData.updated_at) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="mb-1">
                    <strong>Expira em:</strong> {{ daysUntilExpiry }} dias
                  </p>
                  <p class="mb-0">
                    <strong>Auto-save:</strong>
                    <v-chip :color="autoSaveStatus.color" small>
                      {{ autoSaveStatus.text }}
                    </v-chip>
                  </p>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Alertas de Feedback -->
      <v-row v-if="feedbackAlerts.length > 0">
        <v-col cols="12">
          <v-alert
            v-for="alert in feedbackAlerts"
            :key="alert.id"
            :type="alert.type"
            dismissible
            @input="dismissFeedback(alert.id)"
            class="mb-3"
          >
            <div class="d-flex justify-space-between align-center">
              <div>
                <strong>{{ alert.title }}</strong>
                <p class="mb-0 mt-1">{{ alert.content }}</p>
                <small>{{ alert.date }} - {{ alert.adminName }}</small>
              </div>
              <v-btn
                small
                outlined
                @click="markFeedbackAsRead(alert.id)"
                :loading="alert.marking"
              >
                Marcar como Lido
              </v-btn>
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <!-- Formulário de Edição -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <span class="text-h5">Editar Submissão</span>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                @click="saveSubmission"
                :loading="saving"
                :disabled="!canEdit"
              >
                <v-icon left>mdi-content-save</v-icon>
                Salvar
              </v-btn>
            </v-card-title>
            
            <v-card-text>
              <submission-form
                ref="submissionForm"
                :form-data="formData"
                :is-editing="true"
                :token="token"
                :readonly="!canEdit"
                @update-form-data="handleFormDataUpdate"
                @auto-save="handleAutoSave"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Histórico de Versões -->
      <v-row v-if="versions.length > 0">
        <v-col cols="12">
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-header>
                <strong>Histórico de Versões ({{ versions.length }})</strong>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-timeline dense>
                  <v-timeline-item
                    v-for="version in versions"
                    :key="version.id"
                    :color="version.color"
                    small
                  >
                    <v-card>
                      <v-card-title class="text-h6">
                        {{ version.title }}
                        <v-spacer></v-spacer>
                        <small>{{ formatDate(version.created_at) }}</small>
                      </v-card-title>
                      <v-card-text>
                        <p>{{ version.description }}</p>
                        <v-chip v-if="version.admin_name" small>
                          {{ version.admin_name }}
                        </v-chip>
                      </v-card-text>
                    </v-card>
                  </v-timeline-item>
                </v-timeline>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>
    </v-container>

    <!-- Dialog de Confirmação -->
    <v-dialog v-model="confirmDialog.show" max-width="500">
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="confirmDialog.show = false">Cancelar</v-btn>
          <v-btn color="primary" @click="confirmDialog.action">Confirmar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import SubmissionForm from './SubmissionForm.vue'
import submissionService from '@/services/submissionService'

export default {
  name: 'SubmissionEdit',
  components: {
    SubmissionForm
  },
  props: {
    token: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      submissionData: {},
      formData: {},
      feedback: [],
      versions: [],
      loading: true,
      saving: false,
      autoSaving: false,
      lastAutoSave: null,
      autoSaveTimer: null,
      confirmDialog: {
        show: false,
        title: '',
        message: '',
        action: null
      },
      feedbackAlerts: []
    }
  },
  computed: {
    canEdit() {
      const editableStatuses = ['DRAFT', 'CHANGES_REQUESTED']
      return editableStatuses.includes(this.submissionData.status)
    },
    daysUntilExpiry() {
      if (!this.submissionData.expires_at) return 'N/A'
      
      const expiryDate = new Date(this.submissionData.expires_at)
      const now = new Date()
      const diffTime = expiryDate - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return Math.max(0, diffDays)
    },
    tokenStatusColor() {
      if (!this.canEdit) return 'grey'
      if (this.daysUntilExpiry <= 1) return 'red'
      if (this.daysUntilExpiry <= 5) return 'orange'
      return 'green'
    },
    tokenStatusIcon() {
      if (!this.canEdit) return 'mdi-lock'
      if (this.daysUntilExpiry <= 1) return 'mdi-alert'
      if (this.daysUntilExpiry <= 5) return 'mdi-clock-alert'
      return 'mdi-check-circle'
    },
    autoSaveStatus() {
      if (this.autoSaving) {
        return { color: 'orange', text: 'Salvando...' }
      } else if (this.lastAutoSave) {
        const diffMinutes = Math.floor((Date.now() - this.lastAutoSave) / 60000)
        if (diffMinutes < 1) {
          return { color: 'green', text: 'Salvo agora' }
        } else {
          return { color: 'grey', text: `Salvo há ${diffMinutes}min` }
        }
      }
      return { color: 'grey', text: 'Não salvo' }
    }
  },
  async created() {
    await this.loadSubmission()
    await this.loadFeedback()
    this.setupAutoSave()
  },
  beforeUnmount() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }
  },
  methods: {
    async loadSubmission() {
      try {
        this.loading = true
        
        const response = await submissionService.getSubmissionByToken(this.token)
        this.submissionData = response.submission
        
        // Converter dados para formato do formulário
        this.formData = this.convertToFormData(this.submissionData)
        
        // Carregar rascunho local se existir
        const localDraft = submissionService.loadDraftLocally(this.token)
        if (localDraft && this.isLocalDraftNewer(localDraft)) {
          this.showDraftDialog(localDraft)
        }
        
      } catch (error) {
        console.error('Error loading submission:', error)
        this.$router.push('/submission-error')
      } finally {
        this.loading = false
      }
    },

    async loadFeedback() {
      try {
        const response = await submissionService.getSubmissionFeedback(this.token)
        this.feedback = response.feedback || []
        
        // Converter feedback para alertas
        this.feedbackAlerts = this.feedback
          .filter(f => f.status === 'pending')
          .map(f => ({
            id: f.id,
            type: this.getFeedbackAlertType(f),
            title: 'Novo Feedback do Revisor',
            content: f.content,
            date: this.formatDate(f.created_at),
            adminName: f.admin_name,
            marking: false
          }))
        
      } catch (error) {
        console.error('Error loading feedback:', error)
      }
    },

    convertToFormData(submissionData) {
      return {
        authorName: submissionData.author_name,
        authorEmail: submissionData.author_email,
        authorInstitution: submissionData.author_institution,
        title: submissionData.title,
        summary: submissionData.summary,
        content: submissionData.content,
        keywords: submissionData.keywords || [],
        category: submissionData.category,
        verbeteType: submissionData.metadata?.verbeteType,
        birth: {
          date: submissionData.metadata?.birthDate,
          place: submissionData.metadata?.birthPlace
        },
        death: {
          date: submissionData.metadata?.deathDate,
          place: submissionData.metadata?.deathPlace
        },
        sections: submissionData.metadata?.sections || [],
        bibliography: submissionData.metadata?.bibliography || []
      }
    },

    handleFormDataUpdate(newFormData) {
      this.formData = { ...newFormData }
      
      // Salvar rascunho local
      submissionService.saveDraftLocally(this.formData, this.token)
    },

    async handleAutoSave() {
      if (!this.canEdit || this.autoSaving) return
      
      try {
        this.autoSaving = true
        
        await submissionService.autoSave(
          this.token,
          this.formData,
          this.formData.authorEmail
        )
        
        this.lastAutoSave = Date.now()
        
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        this.autoSaving = false
      }
    },

    async saveSubmission() {
      if (!this.canEdit) return
      
      try {
        this.saving = true
        
        await submissionService.updateSubmission(
          this.token,
          this.formData,
          this.formData.authorEmail
        )
        
        // Limpar rascunho local após salvar
        submissionService.clearDraftLocally(this.token)
        
        this.$emit('submission-saved')
        
        // Mostrar mensagem de sucesso
        this.$toast.success('Submissão salva com sucesso!')
        
        // Recarregar dados
        await this.loadSubmission()
        
      } catch (error) {
        console.error('Error saving submission:', error)
        this.$toast.error('Erro ao salvar submissão: ' + error.message)
      } finally {
        this.saving = false
      }
    },

    async markFeedbackAsRead(feedbackId) {
      try {
        const alert = this.feedbackAlerts.find(a => a.id === feedbackId)
        if (alert) alert.marking = true
        
        await submissionService.markFeedbackAsRead(
          this.token,
          feedbackId,
          this.formData.authorEmail
        )
        
        // Remover da lista de alertas
        this.feedbackAlerts = this.feedbackAlerts.filter(a => a.id !== feedbackId)
        
        this.$toast.success('Feedback marcado como lido')
        
      } catch (error) {
        console.error('Error marking feedback as read:', error)
        this.$toast.error('Erro ao marcar feedback como lido')
      }
    },

    dismissFeedback(feedbackId) {
      this.feedbackAlerts = this.feedbackAlerts.filter(a => a.id !== feedbackId)
    },

    setupAutoSave() {
      // Auto-save a cada 2 minutos se houver mudanças
      this.autoSaveTimer = setInterval(() => {
        if (this.canEdit && !this.autoSaving) {
          this.handleAutoSave()
        }
      }, 120000) // 2 minutos
    },

    isLocalDraftNewer(localDraft) {
      // Verificar se o rascunho local é mais recente que a submissão
      if (!this.submissionData.updated_at) return true
      
      const submissionDate = new Date(this.submissionData.updated_at)
      const draftDate = new Date(localDraft.timestamp || 0)
      
      return draftDate > submissionDate
    },

    showDraftDialog(localDraft) {
      this.confirmDialog = {
        show: true,
        title: 'Rascunho Local Encontrado',
        message: 'Encontramos um rascunho mais recente salvo localmente. Deseja carregá-lo?',
        action: () => {
          this.formData = { ...localDraft }
          this.confirmDialog.show = false
        }
      }
    },

    getStatusDisplayName(status) {
      const statusMap = {
        'DRAFT': 'Rascunho',
        'UNDER_REVIEW': 'Em Revisão',
        'CHANGES_REQUESTED': 'Correções Solicitadas',
        'APPROVED': 'Aprovado',
        'PUBLISHED': 'Publicado',
        'REJECTED': 'Rejeitado',
        'EXPIRED': 'Expirado'
      }
      return statusMap[status] || status
    },

    getFeedbackAlertType(feedback) {
      const content = feedback.content.toLowerCase()
      if (content.includes('aprovado')) return 'success'
      if (content.includes('rejeitado') || content.includes('problema')) return 'error'
      return 'warning'
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleString('pt-BR')
    }
  }
}
</script>

<style scoped>
.submission-edit {
  padding: 20px 0;
}

.v-timeline-item >>> .v-timeline-item__body {
  padding-left: 24px;
}
</style>