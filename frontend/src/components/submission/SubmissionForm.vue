<template>
  <v-container>
    <v-card class="mb-6">
      <v-card-title class="text-h4 colored">
        Submissão de Verbete
      </v-card-title>
      <v-card-subtitle>
        Preencha o formulário abaixo para submeter um novo verbete para o Trânsitos | Circulations
      </v-card-subtitle>

      <!-- Progress indicator -->
      <form-progress :current-step="currentStep" :steps="steps" @step-click="goToStep" />

      <!-- Step content -->
      <v-window v-model="currentStep">
        <v-window-item :value="0">
          <basic-info-step
              :form-data="formData"
              @update:form-data="updateFormData"
              @validate="validateStep"
              ref="basicInfoStep"
          />
        </v-window-item>

        <v-window-item :value="1">
          <content-step
              :form-data="formData"
              @update:form-data="updateFormData"
              @validate="validateStep"
              ref="contentStep"
          />
        </v-window-item>

        <v-window-item :value="2">
          <bibliography-step
              :form-data="formData"
              @update:form-data="updateFormData"
              @validate="validateStep"
              ref="bibliographyStep"
          />
        </v-window-item>

        <v-window-item :value="3">
          <media-step
              :form-data="formData"
              @update:form-data="updateFormData"
              @validate="validateStep"
              ref="mediaStep"
          />
        </v-window-item>

        <v-window-item :value="4">
          <preview-step
              :form-data="formData"
              :validation-issues="validationIssues"
              @validate="validateStep"
              ref="previewStep"
          />
        </v-window-item>
      </v-window>

      <!-- Navigation buttons -->
      <v-card-actions>
        <v-btn
            v-if="currentStep > 0"
            color="grey"
            variant="text"
            @click="prevStep"
        >
          Voltar
        </v-btn>
        <v-spacer></v-spacer>
        <!--        TODO: esse botão deveria redirecionar a pessoa? Salvar rascunho deveria ser implícito? Deveríamos abrir um aviso caso haja tentativa de navegação pré-finalização? -->
        <!--        TODO: Além disso, há falta de feedback quando o botão é clicado. Não dá pra saber se salvou ou se o botão tá quebrado. -->
        <v-btn
            color="grey-darken-1"
            variant="text"
            :loading="isSavingDraft"
            @click="saveDraft"
        >
          {{ isSavingDraft ? 'Salvando...' : 'Salvar Rascunho' }}
        </v-btn>
        <v-btn
            v-if="currentStep < steps.length - 1"
            color="var(--transites-gray-purple)"
            @click="nextStep"
        >
          Próximo
        </v-btn>
        <v-btn
            v-else
            color="var(--transites-gray-purple)"
            :loading="isSubmitting"
            @click="submitArticle"
        >
          {{ isSubmitting ? 'Submetendo...' : 'Submeter Verbete' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import FormProgress from './shared/FormProgress.vue'
import BasicInfoStep from './BasicInfoStep.vue'
import ContentStep from './ContentStep.vue'
import BibliographyStep from './BibliographyStep.vue'
import MediaStep from './MediaStep.vue'
import PreviewStep from './PreviewStep.vue'
import submissionService from "@/services/submissionService"

export default {
  name: 'SubmissionForm',
  components: {
    FormProgress,
    BasicInfoStep,
    ContentStep,
    BibliographyStep,
    MediaStep,
    PreviewStep
  },
  props: {
    // Props para modo de edição
    isEditing: {
      type: Boolean,
      default: false
    },
    token: {
      type: String,
      default: null
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      currentStep: 0,
      steps: [
        {title: 'Informações Básicas', icon: 'mdi-information-outline', complete: false},
        {title: 'Conteúdo', icon: 'mdi-text-box-outline', complete: false},
        {title: 'Bibliografia', icon: 'mdi-book-outline', complete: false},
        {title: 'Mídia', icon: 'mdi-image-outline', complete: false},
        {title: 'Pré-visualização', icon: 'mdi-eye-outline', complete: false}
      ],
      // ✅ ÚNICA fonte de verdade - gerenciada pelo Vuex store
      formData: {
        author_name: '',
        author_email: '',
        author_institution: '',
        title: '',
        type: '',
        summary: '',
        content: '',
        birth: {
          date: '',
          place: ''
        },
        death: {
          date: '',
          place: ''
        },
        tags: [],
        categories: [],
        bibliography: [],
        media: []
      },
      validationIssues: {
        basicInfo: [],
        content: [],
        bibliography: [],
        media: []
      },
      stepRefs: ['basicInfoStep', 'contentStep', 'bibliographyStep', 'mediaStep', 'previewStep'],
      // Estados de loading
      isSavingDraft: false,
      isSubmitting: false,
      autoSaveTimer: null
    }
  },
  async created() {
    console.log('SubmissionForm created - loading initial data')

    if (this.isEditing && this.token) {
      // ✅ Modo edição: carregar dados do token
      await this.loadSubmissionData()
    } else {
      // ✅ Modo criação: carregar rascunho do store
      await this.loadDraftFromStore()
    }

    // Configurar auto-save
    this.setupAutoSave()
  },
  beforeUnmount() {
    this.clearAutoSave()
  },
  methods: {
    // ✅ Função central para atualizar dados
    updateFormData(newData) {
      console.log('Atualizando formData:', newData)
      if (newData.birthDate) {
        console.log('Atualizando data de nascimento:', newData.birthDate)
      }
      if (newData.foundation) {
        console.log('Atualizando fundação:', newData.foundation)
      }
      this.formData = {...this.formData, ...newData}

      // Auto-save apenas em modo criação
      if (!this.isEditing) {
        this.scheduleAutoSave()
      }
    },

    async loadSubmissionData() {
      try {
        const response = await submissionService.getSubmission(this.token)
        this.formData = {...this.formData, ...response.data}
        console.log('Dados de edição carregados:', this.formData)
      } catch (error) {
        console.error('Erro ao carregar submissão:', error)
        this.$toast.error('Erro ao carregar dados da submissão')
      }
    },

    async loadDraftFromStore() {
      try {
        const draft = await this.$store.dispatch('personArticle/loadArticleDraft')
        if (draft) {
          this.formData = {...this.formData, ...draft}
          console.log('Rascunho carregado do store:', this.formData)
        }
      } catch (error) {
        console.error('Erro ao carregar rascunho:', error)
      }
    },

    async saveDraft() {
      this.isSavingDraft = true
      try {
        if (this.isEditing) {
          await submissionService.updateSubmission(this.token, this.formData)
        } else {
          await this.$store.dispatch('personArticle/saveArticleDraft', this.formData)
        }
      } catch (error) {
        console.error('Erro ao salvar rascunho:', error)
      } finally {
        this.isSavingDraft = false
      }
    },

    async submitArticle() {
      // Validar todos os passos
      let allValid = true
      for (let i = 0; i < this.steps.length; i++) {
        if (this.$refs[this.stepRefs[i]]) {
          const isValid = await this.$refs[this.stepRefs[i]].validate()
          if (!isValid) {
            allValid = false
            this.currentStep = i
            break
          }
        }
      }

      if (!allValid) {
        // todo: adicionar feedback visual para o usuário perto do botao e remover esse toast inexistente.
        this.$toast.warning('Por favor, corrija os erros antes de submeter o verbete.')
        return
      }

      this.isSubmitting = true
      try {
        if (this.isEditing) {
          await submissionService.submitForReview(this.token, this.formData)
          this.$toast.success('Verbete atualizado e submetido para revisão!')
        } else {
          await this.$store.dispatch('personArticle/submitArticle', this.formData)
          this.$toast.success('Verbete submetido com sucesso!')
        }

        this.$router.push('/')
      } catch (error) {
        console.error('Erro ao submeter verbete:', error)
        this.$toast.error('Erro ao submeter verbete. Tente novamente.')
      } finally {
        this.isSubmitting = false
      }
    },

    // ✅ Auto-save (apenas modo criação)
    setupAutoSave() {
      if (!this.isEditing) {
        this.scheduleAutoSave()
      }
    },

    scheduleAutoSave() {
      this.clearAutoSave()
      this.autoSaveTimer = setTimeout(async () => {
        try {
          await this.$store.dispatch('personArticle/saveArticleDraft', this.formData)
          console.log('Auto-save executado')
        } catch (error) {
          console.error('Erro no auto-save:', error)
        }
      }, 30000) // 30 segundos
    },

    clearAutoSave() {
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer)
        this.autoSaveTimer = null
      }
    },

    // Métodos de navegação
    async validateStep(stepIndex, issues = []) {
      const stepKeys = ['basicInfo', 'content', 'bibliography', 'media', 'preview']
      this.validationIssues[stepKeys[stepIndex]] = issues
      this.steps[stepIndex].complete = issues.length === 0
      return issues.length === 0
    },

    async validateCurrentStep() {
      if (this.$refs[this.stepRefs[this.currentStep]]) {
        return await this.$refs[this.stepRefs[this.currentStep]].validate()
      }
      return true
    },

    async nextStep() {
      const isValid = await this.validateCurrentStep()
      if (isValid) {
        this.currentStep++
      }
    },

    prevStep() {
      this.currentStep--
    },

    goToStep(step) {
      this.currentStep = step
    }
  },

  computed: {
    isLoading() {
      return this.$store.getters['personArticle/isLoading']
    },
    submissionError() {
      return this.$store.getters['personArticle/getSubmissionError']
    },
    submissionStatus() {
      return this.$store.getters['personArticle/getSubmissionStatus']
    }
  }
}
</script>

<style scoped>
.colored {
  color: var(--transites-gray-purple);
}
</style>