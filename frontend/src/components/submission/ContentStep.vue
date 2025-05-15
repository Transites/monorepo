<template>
  <v-container class="pa-6">
    <h2 class="text-h5 mb-4">Conteúdo do Verbete</h2>
    <p class="text-body-1 mb-6">
      Escreva o conteúdo principal do seu verbete. Utilize as ferramentas de formatação para estruturar seu texto.
      Recomendamos dividir o conteúdo em seções para melhor legibilidade.
    </p>

    <v-form ref="form" @submit.prevent>
      <v-row>
        <v-col cols="12">
          <div class="mb-4">
            <h3 class="text-subtitle-1 mb-2">Conteúdo Principal*</h3>
            <rich-text-editor
              v-model="localData.content"
              :value="localData.content"
              @input="updateContent"
              @validation="handleEditorValidation"
              :max-characters="20000"
              :character-warning-threshold="15000"
              placeholder="Comece a escrever o conteúdo do seu verbete aqui..."
            ></rich-text-editor>
            <div class="text-caption text-grey mt-1">
              O conteúdo deve ter entre 3.000 e 20.000 caracteres.
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <h3 class="text-subtitle-1 mb-2">Seções</h3>
          <p class="text-body-2 mb-4">
            Organize seu verbete em seções para facilitar a leitura. Cada seção deve ter um título e conteúdo.
          </p>

          <div v-for="(section, index) in localData.sections" :key="index" class="section-item mb-6">
            <v-card class="pa-4">
              <div class="d-flex align-center mb-2">
                <h4 class="text-subtitle-2">Seção {{ index + 1 }}</h4>
                <v-spacer></v-spacer>
                <v-btn icon @click="removeSection(index)" color="error" size="small">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>

              <v-text-field
                v-model="section.title"
                label="Título da Seção*"
                :rules="[v => !!v || 'Título da seção é obrigatório']"
                @update:model-value="updateData"
              ></v-text-field>

              <rich-text-editor
                v-model="section.content"
                :value="section.content"
                @input="(value) => updateSectionContent(index, value)"
                @validation="(errors) => handleSectionValidation(index, errors)"
                :max-characters="10000"
                :character-warning-threshold="8000"
                placeholder="Conteúdo da seção..."
              ></rich-text-editor>
            </v-card>
          </div>

          <v-btn
            color="var(--transites-gray-purple)"
            class="text-white mt-2"
            prepend-icon="mdi-plus"
            @click="addSection"
          >
            Adicionar Seção
          </v-btn>
        </v-col>
      </v-row>

      <!-- Validation errors -->
      <v-row v-if="validationErrors.length > 0">
        <v-col cols="12">
          <v-alert
            type="warning"
            variant="tonal"
            title="Por favor, corrija os seguintes problemas:"
            class="mt-4"
          >
            <ul class="pl-4">
              <li v-for="(error, index) in validationErrors" :key="index">
                {{ error }}
              </li>
            </ul>
          </v-alert>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script>
import TipTapEditor from './shared/TiptapEditor.vue'

export default {
  name: 'ContentStep',
  components: {
    'rich-text-editor': TipTapEditor
  },
  props: {
    formData: {
      type: Object,
      required: true
    }
  },
  emits: ['update:form-data', 'validate'],
  data() {
    return {
      localData: {
        content: '',
        sections: []
      },
      editorValidationErrors: [],
      sectionValidationErrors: {},
      validationErrors: []
    }
  },
  created() {
    // Initialize local data with form data
    this.initializeLocalData()
  },
  watch: {
    formData: {
      handler() {
        this.initializeLocalData()
      },
      deep: true
    }
  },
  methods: {
    initializeLocalData() {
      this.localData = {
        content: this.formData.content || '',
        sections: Array.isArray(this.formData.sections) 
          ? [...this.formData.sections] 
          : []
      }
    },
    updateData() {
      this.$emit('update:form-data', this.localData)
    },
    updateContent(content) {
      this.localData.content = content
      this.updateData()
    },
    updateSectionContent(index, content) {
      this.localData.sections[index].content = content
      this.updateData()
    },
    addSection() {
      this.localData.sections.push({
        title: '',
        content: ''
      })
      this.updateData()
    },
    removeSection(index) {
      this.localData.sections.splice(index, 1)
      this.updateData()
    },
    handleEditorValidation(errors) {
      this.editorValidationErrors = errors
      this.validateContent()
    },
    handleSectionValidation(index, errors) {
      this.sectionValidationErrors[index] = errors
      this.validateContent()
    },
    validateContent() {
      this.validationErrors = []

      // Check main content
      if (!this.localData.content) {
        this.validationErrors.push('O conteúdo principal é obrigatório')
      } else {
        // Check content length (plain text, not HTML)
        const contentText = this.stripHtml(this.localData.content)
        if (contentText.length < 3000) {
          this.validationErrors.push('O conteúdo principal deve ter pelo menos 3.000 caracteres')
        }
        if (contentText.length > 20000) {
          this.validationErrors.push('O conteúdo principal não deve exceder 20.000 caracteres')
        }
      }

      // Add editor validation errors
      this.validationErrors.push(...this.editorValidationErrors)

      // Check sections
      this.localData.sections.forEach((section, index) => {
        if (!section.title) {
          this.validationErrors.push(`Seção ${index + 1}: Título é obrigatório`)
        }
        if (!section.content) {
          this.validationErrors.push(`Seção ${index + 1}: Conteúdo é obrigatório`)
        }

        // Add section editor validation errors
        if (this.sectionValidationErrors[index]) {
          this.sectionValidationErrors[index].forEach(error => {
            this.validationErrors.push(`Seção ${index + 1}: ${error}`)
          })
        }
      })
    },
    stripHtml(html) {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      return doc.body.textContent || ''
    },
    async validate() {
      const isValid = await this.$refs.form.validate()

      this.validateContent()

      this.$emit('validate', 1, this.validationErrors)
      return isValid.valid && this.validationErrors.length === 0
    }
  }
}
</script>

<style scoped>
.section-item {
  position: relative;
}
</style>
