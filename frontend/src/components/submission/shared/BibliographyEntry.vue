<template>
  <div class="bibliography-entry">
    <v-card class="mb-4 pa-4">
      <div class="d-flex align-center mb-4">
        <h3 class="text-subtitle-1 mr-auto">{{ isEditing ? 'Editar Referência' : 'Nova Referência' }}</h3>
        <v-btn v-if="isEditing" icon @click="$emit('remove')" color="error" size="small">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </div>

      <v-select
        v-model="localEntry.type"
        :items="referenceTypes"
        label="Tipo de Referência"
        @update:model-value="updateFields"
        :rules="[v => !!v || 'Tipo de referência é obrigatório']"
      ></v-select>

      <!-- Dynamic fields based on reference type -->
      <template v-for="field in activeFields" :key="field.key">
        <v-text-field
          v-if="field.type === 'text'"
          v-model="localEntry[field.key]"
          :label="field.label"
          :placeholder="field.placeholder"
          :hint="field.hint"
          :rules="field.required ? [v => !!v || `${field.label} é obrigatório`] : []"
        ></v-text-field>
        
        <v-textarea
          v-else-if="field.type === 'textarea'"
          v-model="localEntry[field.key]"
          :label="field.label"
          :placeholder="field.placeholder"
          :hint="field.hint"
          :rules="field.required ? [v => !!v || `${field.label} é obrigatório`] : []"
          rows="2"
        ></v-textarea>
        
        <v-text-field
          v-else-if="field.type === 'number'"
          v-model="localEntry[field.key]"
          :label="field.label"
          :placeholder="field.placeholder"
          :hint="field.hint"
          type="number"
          :rules="field.required ? [v => !!v || `${field.label} é obrigatório`] : []"
        ></v-text-field>
        
        <v-text-field
          v-else-if="field.type === 'url'"
          v-model="localEntry[field.key]"
          :label="field.label"
          :placeholder="field.placeholder"
          :hint="field.hint"
          type="url"
          :rules="field.required ? [
            v => !!v || `${field.label} é obrigatório`,
            v => !v || /^https?:\/\//.test(v) || 'URL deve começar com http:// ou https://'
          ] : []"
        ></v-text-field>
        
        <v-text-field
          v-else-if="field.type === 'date'"
          v-model="localEntry[field.key]"
          :label="field.label"
          :placeholder="field.placeholder"
          :hint="field.hint"
          type="date"
          :rules="field.required ? [v => !!v || `${field.label} é obrigatório`] : []"
        ></v-text-field>
      </template>

      <div class="d-flex justify-end mt-4">
        <v-btn
          v-if="isEditing"
          color="grey"
          variant="text"
          class="mr-2"
          @click="$emit('cancel')"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="var(--transites-gray-purple)"
          class="text-white"
          @click="saveEntry"
        >
          {{ isEditing ? 'Atualizar' : 'Adicionar' }}
        </v-btn>
      </div>
    </v-card>

    <!-- Preview of formatted reference -->
    <div v-if="showPreview && localEntry.type" class="reference-preview mt-4">
      <h3 class="text-subtitle-1 mb-2">Visualização da Referência</h3>
      <div class="preview-content pa-3">
        <p v-html="formattedReference"></p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BibliographyEntry',
  props: {
    entry: {
      type: Object,
      default: () => ({
        type: '',
        authors: '',
        title: '',
        publisher: '',
        year: '',
        location: '',
        pages: '',
        url: '',
        accessDate: ''
      })
    },
    isEditing: {
      type: Boolean,
      default: false
    },
    showPreview: {
      type: Boolean,
      default: true
    }
  },
  emits: ['save', 'remove', 'cancel'],
  data() {
    return {
      localEntry: { ...this.entry },
      referenceTypes: [
        { title: 'Livro', value: 'book' },
        { title: 'Artigo de Periódico', value: 'article' },
        { title: 'Capítulo de Livro', value: 'bookChapter' },
        { title: 'Tese/Dissertação', value: 'thesis' },
        { title: 'Site/Página Web', value: 'website' },
        { title: 'Documento de Arquivo', value: 'archiveDocument' }
      ],
      fieldDefinitions: {
        book: [
          { key: 'authors', label: 'Autor(es)', placeholder: 'SOBRENOME, Nome; SOBRENOME, Nome', type: 'text', required: true, hint: 'Separe múltiplos autores com ponto e vírgula' },
          { key: 'title', label: 'Título', placeholder: 'Título do livro', type: 'text', required: true },
          { key: 'publisher', label: 'Editora', placeholder: 'Nome da editora', type: 'text', required: true },
          { key: 'location', label: 'Local de Publicação', placeholder: 'Cidade, País', type: 'text', required: true },
          { key: 'year', label: 'Ano', placeholder: '2023', type: 'number', required: true },
          { key: 'edition', label: 'Edição', placeholder: '2ª ed.', type: 'text', required: false }
        ],
        article: [
          { key: 'authors', label: 'Autor(es)', placeholder: 'SOBRENOME, Nome; SOBRENOME, Nome', type: 'text', required: true, hint: 'Separe múltiplos autores com ponto e vírgula' },
          { key: 'title', label: 'Título do Artigo', placeholder: 'Título do artigo', type: 'text', required: true },
          { key: 'journal', label: 'Nome do Periódico', placeholder: 'Nome do periódico', type: 'text', required: true },
          { key: 'volume', label: 'Volume', placeholder: 'Vol. 10', type: 'text', required: false },
          { key: 'number', label: 'Número', placeholder: 'n. 2', type: 'text', required: false },
          { key: 'pages', label: 'Páginas', placeholder: 'p. 45-67', type: 'text', required: true },
          { key: 'year', label: 'Ano', placeholder: '2023', type: 'number', required: true },
          { key: 'doi', label: 'DOI', placeholder: '10.1000/xyz123', type: 'text', required: false }
        ],
        bookChapter: [
          { key: 'authors', label: 'Autor(es) do Capítulo', placeholder: 'SOBRENOME, Nome; SOBRENOME, Nome', type: 'text', required: true, hint: 'Separe múltiplos autores com ponto e vírgula' },
          { key: 'title', label: 'Título do Capítulo', placeholder: 'Título do capítulo', type: 'text', required: true },
          { key: 'bookTitle', label: 'Título do Livro', placeholder: 'Título do livro', type: 'text', required: true },
          { key: 'editors', label: 'Editor(es)', placeholder: 'SOBRENOME, Nome (Ed.)', type: 'text', required: true },
          { key: 'publisher', label: 'Editora', placeholder: 'Nome da editora', type: 'text', required: true },
          { key: 'location', label: 'Local de Publicação', placeholder: 'Cidade, País', type: 'text', required: true },
          { key: 'year', label: 'Ano', placeholder: '2023', type: 'number', required: true },
          { key: 'pages', label: 'Páginas', placeholder: 'p. 45-67', type: 'text', required: true }
        ],
        thesis: [
          { key: 'authors', label: 'Autor', placeholder: 'SOBRENOME, Nome', type: 'text', required: true },
          { key: 'title', label: 'Título', placeholder: 'Título da tese/dissertação', type: 'text', required: true },
          { key: 'thesisType', label: 'Tipo', placeholder: 'Tese (Doutorado) ou Dissertação (Mestrado)', type: 'text', required: true },
          { key: 'institution', label: 'Instituição', placeholder: 'Nome da universidade', type: 'text', required: true },
          { key: 'location', label: 'Local', placeholder: 'Cidade, País', type: 'text', required: true },
          { key: 'year', label: 'Ano', placeholder: '2023', type: 'number', required: true }
        ],
        website: [
          { key: 'authors', label: 'Autor(es) ou Instituição', placeholder: 'SOBRENOME, Nome ou INSTITUIÇÃO', type: 'text', required: true },
          { key: 'title', label: 'Título da Página', placeholder: 'Título da página ou artigo', type: 'text', required: true },
          { key: 'websiteTitle', label: 'Nome do Site', placeholder: 'Nome do site ou portal', type: 'text', required: false },
          { key: 'year', label: 'Ano de Publicação', placeholder: '2023', type: 'number', required: false },
          { key: 'url', label: 'URL', placeholder: 'https://www.exemplo.com/pagina', type: 'url', required: true },
          { key: 'accessDate', label: 'Data de Acesso', placeholder: '', type: 'date', required: true, hint: 'Data em que você acessou o site' }
        ],
        archiveDocument: [
          { key: 'title', label: 'Título do Documento', placeholder: 'Título ou descrição do documento', type: 'text', required: true },
          { key: 'documentType', label: 'Tipo de Documento', placeholder: 'Carta, manuscrito, etc.', type: 'text', required: true },
          { key: 'archive', label: 'Arquivo/Instituição', placeholder: 'Nome do arquivo ou instituição', type: 'text', required: true },
          { key: 'collection', label: 'Coleção/Fundo', placeholder: 'Nome da coleção ou fundo', type: 'text', required: true },
          { key: 'identifier', label: 'Identificador/Código', placeholder: 'Código de referência', type: 'text', required: true },
          { key: 'location', label: 'Local', placeholder: 'Cidade, País', type: 'text', required: true },
          { key: 'date', label: 'Data do Documento', placeholder: '', type: 'date', required: false }
        ]
      }
    }
  },
  computed: {
    activeFields() {
      return this.localEntry.type ? this.fieldDefinitions[this.localEntry.type] : []
    },
    formattedReference() {
      if (!this.localEntry.type) return ''
      
      // Format reference based on type
      switch (this.localEntry.type) {
        case 'book':
          return this.formatBook()
        case 'article':
          return this.formatArticle()
        case 'bookChapter':
          return this.formatBookChapter()
        case 'thesis':
          return this.formatThesis()
        case 'website':
          return this.formatWebsite()
        case 'archiveDocument':
          return this.formatArchiveDocument()
        default:
          return ''
      }
    }
  },
  watch: {
    entry: {
      handler(newVal) {
        this.localEntry = { ...newVal }
      },
      deep: true
    }
  },
  methods: {
    updateFields() {
      // Reset fields not used by the current type
      const newEntry = { type: this.localEntry.type }
      this.activeFields.forEach(field => {
        newEntry[field.key] = this.localEntry[field.key] || ''
      })
      this.localEntry = newEntry
    },
    saveEntry() {
      // Validate required fields
      const missingFields = this.activeFields
        .filter(field => field.required && !this.localEntry[field.key])
        .map(field => field.label)
      
      if (missingFields.length > 0) {
        // Handle validation error
        this.$emit('validation-error', `Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`)
        return
      }
      
      this.$emit('save', { ...this.localEntry })
      
      if (!this.isEditing) {
        // Reset form if adding new entry
        this.localEntry = { type: '' }
      }
    },
    formatBook() {
      const { authors, title, publisher, location, year, edition } = this.localEntry
      let formatted = `<strong>${authors}</strong>. <em>${title}</em>. `
      
      if (edition) formatted += `${edition}. `
      
      formatted += `${location}: ${publisher}, ${year}.`
      
      return formatted
    },
    formatArticle() {
      const { authors, title, journal, volume, number, pages, year, doi } = this.localEntry
      let formatted = `<strong>${authors}</strong>. ${title}. <em>${journal}</em>, `
      
      if (volume) formatted += `v. ${volume}, `
      if (number) formatted += `n. ${number}, `
      
      formatted += `p. ${pages}, ${year}.`
      
      if (doi) formatted += ` DOI: ${doi}`
      
      return formatted
    },
    formatBookChapter() {
      const { authors, title, bookTitle, editors, publisher, location, year, pages } = this.localEntry
      return `<strong>${authors}</strong>. ${title}. In: ${editors}, <em>${bookTitle}</em>. ${location}: ${publisher}, ${year}. p. ${pages}.`
    },
    formatThesis() {
      const { authors, title, thesisType, institution, location, year } = this.localEntry
      return `<strong>${authors}</strong>. <em>${title}</em>. ${year}. ${thesisType} - ${institution}, ${location}, ${year}.`
    },
    formatWebsite() {
      const { authors, title, websiteTitle, year, url, accessDate } = this.localEntry
      let formatted = `<strong>${authors}</strong>. ${title}. `
      
      if (websiteTitle) formatted += `<em>${websiteTitle}</em>, `
      if (year) formatted += `${year}. `
      
      const formattedDate = accessDate ? new Date(accessDate).toLocaleDateString('pt-BR') : ''
      
      formatted += `Disponível em: ${url}. Acesso em: ${formattedDate}.`
      
      return formatted
    },
    formatArchiveDocument() {
      const { title, documentType, archive, collection, identifier, location, date } = this.localEntry
      let formatted = `<strong>${title}</strong> [${documentType}]. ${archive}, ${collection}, ${identifier}. ${location}`
      
      if (date) {
        const formattedDate = new Date(date).toLocaleDateString('pt-BR')
        formatted += `, ${formattedDate}`
      }
      
      formatted += `.`
      
      return formatted
    }
  }
}
</script>

<style scoped>
.bibliography-entry {
  margin-bottom: 16px;
}

.preview-content {
  background-color: #f5f5f5;
  border-radius: 4px;
  border-left: 3px solid var(--transites-gray-purple);
}
</style>