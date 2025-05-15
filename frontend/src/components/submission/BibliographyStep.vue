<template>
  <v-container class="pa-6">
    <h2 class="text-h5 mb-4">Bibliografia</h2>
    <p class="text-body-1 mb-6">
      Adicione as referências bibliográficas utilizadas no seu verbete. 
      É importante incluir todas as fontes citadas no texto.
    </p>

    <v-form ref="form" @submit.prevent>
      <!-- Lista de referências bibliográficas -->
      <div v-if="localData.bibliography.length > 0" class="mb-6">
        <h3 class="text-subtitle-1 mb-3">Referências Adicionadas ({{ localData.bibliography.length }})</h3>
        
        <v-expansion-panels>
          <v-expansion-panel
            v-for="(entry, index) in localData.bibliography"
            :key="index"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <div class="text-truncate">
                  <strong>{{ getBibliographyTypeLabel(entry.type) }}:</strong> 
                  {{ entry.title || 'Sem título' }}
                </div>
              </div>
            </v-expansion-panel-title>
            
            <v-expansion-panel-text>
              <div class="mb-2" v-html="formatBibliographyEntry(entry)"></div>
              
              <div class="d-flex justify-end">
                <v-btn
                  color="grey"
                  variant="text"
                  class="mr-2"
                  @click="editEntry(index)"
                >
                  Editar
                </v-btn>
                <v-btn
                  color="error"
                  variant="text"
                  @click="removeEntry(index)"
                >
                  Remover
                </v-btn>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- Formulário para adicionar/editar referência -->
      <div v-if="showEntryForm">
        <h3 class="text-subtitle-1 mb-3">
          {{ editingIndex !== null ? 'Editar Referência' : 'Adicionar Nova Referência' }}
        </h3>
        
        <bibliography-entry
          :entry="currentEntry"
          :is-editing="editingIndex !== null"
          @save="saveEntry"
          @remove="removeCurrentEntry"
          @cancel="cancelEdit"
          @validation-error="handleValidationError"
        ></bibliography-entry>
      </div>
      
      <!-- Botão para adicionar nova referência -->
      <v-btn
        v-if="!showEntryForm"
        color="var(--transites-gray-purple)"
        class="text-white mt-4"
        prepend-icon="mdi-plus"
        @click="addNewEntry"
      >
        Adicionar Referência Bibliográfica
      </v-btn>

      <!-- Validação -->
      <v-alert
        v-if="validationErrors.length > 0"
        type="warning"
        variant="tonal"
        class="mt-6"
      >
        <h3 class="text-subtitle-1">Por favor, corrija os seguintes problemas:</h3>
        <ul class="pl-4 mt-2">
          <li v-for="(error, index) in validationErrors" :key="index">
            {{ error }}
          </li>
        </ul>
      </v-alert>
    </v-form>
  </v-container>
</template>

<script>
import BibliographyEntry from './shared/BibliographyEntry.vue'

export default {
  name: 'BibliographyStep',
  components: {
    BibliographyEntry
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
        bibliography: []
      },
      showEntryForm: false,
      editingIndex: null,
      currentEntry: {},
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
        bibliography: Array.isArray(this.formData.bibliography) 
          ? [...this.formData.bibliography] 
          : []
      }
    },
    updateData() {
      this.$emit('update:form-data', this.localData)
    },
    addNewEntry() {
      this.editingIndex = null
      this.currentEntry = {}
      this.showEntryForm = true
    },
    editEntry(index) {
      this.editingIndex = index
      this.currentEntry = { ...this.localData.bibliography[index] }
      this.showEntryForm = true
    },
    saveEntry(entry) {
      if (this.editingIndex !== null) {
        // Update existing entry
        this.localData.bibliography.splice(this.editingIndex, 1, entry)
      } else {
        // Add new entry
        this.localData.bibliography.push(entry)
      }
      
      this.updateData()
      this.resetForm()
    },
    removeEntry(index) {
      this.localData.bibliography.splice(index, 1)
      this.updateData()
    },
    removeCurrentEntry() {
      if (this.editingIndex !== null) {
        this.removeEntry(this.editingIndex)
        this.resetForm()
      }
    },
    cancelEdit() {
      this.resetForm()
    },
    resetForm() {
      this.showEntryForm = false
      this.editingIndex = null
      this.currentEntry = {}
    },
    handleValidationError(error) {
      // Show validation error temporarily
      this.validationErrors = [error]
      setTimeout(() => {
        this.validationErrors = this.validationErrors.filter(e => e !== error)
      }, 5000)
    },
    getBibliographyTypeLabel(type) {
      const types = {
        book: 'Livro',
        article: 'Artigo',
        bookChapter: 'Capítulo de Livro',
        thesis: 'Tese/Dissertação',
        website: 'Site/Página Web',
        archiveDocument: 'Documento de Arquivo'
      }
      return types[type] || type
    },
    formatBibliographyEntry(entry) {
      // This is a simplified version - the actual formatting is done in BibliographyEntry.vue
      if (!entry.type) return ''
      
      switch (entry.type) {
        case 'book':
          return this.formatBook(entry)
        case 'article':
          return this.formatArticle(entry)
        case 'bookChapter':
          return this.formatBookChapter(entry)
        case 'thesis':
          return this.formatThesis(entry)
        case 'website':
          return this.formatWebsite(entry)
        case 'archiveDocument':
          return this.formatArchiveDocument(entry)
        default:
          return ''
      }
    },
    formatBook(entry) {
      const { authors, title, publisher, location, year, edition } = entry
      let formatted = `<strong>${authors}</strong>. <em>${title}</em>. `
      
      if (edition) formatted += `${edition}. `
      
      formatted += `${location}: ${publisher}, ${year}.`
      
      return formatted
    },
    formatArticle(entry) {
      const { authors, title, journal, volume, number, pages, year, doi } = entry
      let formatted = `<strong>${authors}</strong>. ${title}. <em>${journal}</em>, `
      
      if (volume) formatted += `v. ${volume}, `
      if (number) formatted += `n. ${number}, `
      
      formatted += `p. ${pages}, ${year}.`
      
      if (doi) formatted += ` DOI: ${doi}`
      
      return formatted
    },
    formatBookChapter(entry) {
      const { authors, title, bookTitle, editors, publisher, location, year, pages } = entry
      return `<strong>${authors}</strong>. ${title}. In: ${editors}, <em>${bookTitle}</em>. ${location}: ${publisher}, ${year}. p. ${pages}.`
    },
    formatThesis(entry) {
      const { authors, title, thesisType, institution, location, year } = entry
      return `<strong>${authors}</strong>. <em>${title}</em>. ${year}. ${thesisType} - ${institution}, ${location}, ${year}.`
    },
    formatWebsite(entry) {
      const { authors, title, websiteTitle, year, url, accessDate } = entry
      let formatted = `<strong>${authors}</strong>. ${title}. `
      
      if (websiteTitle) formatted += `<em>${websiteTitle}</em>, `
      if (year) formatted += `${year}. `
      
      const formattedDate = accessDate ? new Date(accessDate).toLocaleDateString('pt-BR') : ''
      
      formatted += `Disponível em: ${url}. Acesso em: ${formattedDate}.`
      
      return formatted
    },
    formatArchiveDocument(entry) {
      const { title, documentType, archive, collection, identifier, location, date } = entry
      let formatted = `<strong>${title}</strong> [${documentType}]. ${archive}, ${collection}, ${identifier}. ${location}`
      
      if (date) {
        const formattedDate = new Date(date).toLocaleDateString('pt-BR')
        formatted += `, ${formattedDate}`
      }
      
      formatted += `.`
      
      return formatted
    },
    async validate() {
      // For bibliography, we'll just check if there's at least one entry
      const errors = []
      
      if (this.localData.bibliography.length === 0) {
        errors.push('Adicione pelo menos uma referência bibliográfica')
      }
      
      this.validationErrors = errors
      this.$emit('validate', 2, errors)
      
      return errors.length === 0
    }
  }
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>