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
            @click="saveDraft"
        >
          Salvar Rascunho
        </v-btn>
        <v-btn
            v-if="currentStep < steps.length - 1"
            color="var(--transites-gray-purple)"
            @click="nextStep"
        >
          Próximo
        </v-btn>
<!--        TODO: Quando esse botão eh clicado e da certo ou da erro, não há feedback. ridiculo, arrumar imediatamente. -->
        <v-btn
            v-else
            color="var(--transites-gray-purple)"
            @click="submitArticle"
        >
          Submeter Verbete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import { mapActions } from 'vuex'
import FormProgress from './shared/FormProgress.vue'
import BasicInfoStep from './BasicInfoStep.vue'
import ContentStep from './ContentStep.vue'
import BibliographyStep from './BibliographyStep.vue'
import MediaStep from './MediaStep.vue'
import PreviewStep from './PreviewStep.vue'

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
      formData: {
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
      stepRefs: ['basicInfoStep', 'contentStep', 'bibliographyStep', 'mediaStep', 'previewStep']
    }
  },
  methods: {
    ...mapActions('submission', [
      'saveSubmissionDraft',
      'submitSubmission'
    ]),
    updateFormData(newData) {
      this.formData = {...this.formData, ...newData}
    },
    async validateStep(stepIndex, issues = []) {
      // Update validation issues for the current step
      const stepKeys = ['basicInfo', 'content', 'bibliography', 'media', 'preview']
      this.validationIssues[stepKeys[stepIndex]] = issues

      // Mark step as complete if no issues
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
    },
    async saveDraft() {
      try {
        await this.saveSubmissionDraft(this.formData)
        this.$toast.success('Rascunho salvo com sucesso!')
      } catch (error) {
        this.$toast.error('Erro ao salvar rascunho. Tente novamente.')
        console.error('Error saving draft:', error)
      }
    },
    async submitArticle() {
      // Validate all steps before submission
      let allValid = true
      for (let i = 0; i < this.steps.length; i++) {
        if (this.$refs[this.stepRefs[i]]) {
          const isValid = await this.$refs[this.stepRefs[i]].validate()
          if (!isValid) {
            allValid = false
            // If a step is invalid, go to that step
            if (i !== this.currentStep) {
              this.currentStep = i
              break
            }
          }
        }
      }

      if (allValid) {
        try {
          await this.submitSubmission(this.formData)
          this.$toast.success('Verbete submetido com sucesso!')
          this.$router.push('/')
        } catch (error) {
          this.$toast.error('Erro ao submeter verbete. Tente novamente.')
          console.error('Error submitting article:', error)
        }
      } else {
        this.$toast.warning('Por favor, corrija os erros antes de submeter o verbete.')
      }
    }
  },
  created() {
    // Check if there's a draft in the store
    const draft = this.$store.state.submission?.draft
    if (draft) {
      this.formData = {...this.formData, ...draft}
    }
  }
}
</script>

<style scoped>
.colored {
  color: var(--transites-gray-purple);
}
</style>