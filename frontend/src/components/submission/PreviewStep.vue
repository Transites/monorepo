<!-- Implementação do preview usando o componente Article.vue -->
<template>
  <v-container class="pa-6">
    <h2 class="text-h5 mb-4">Pré-visualização do Verbete</h2>
    <p class="text-body-1 mb-6">
      Revise seu verbete antes de enviá-lo. Verifique se todas as informações estão corretas e completas.
      Se precisar fazer alterações, volte às etapas anteriores usando os botões de navegação.
    </p>

    <!-- Validation issues summary -->
    <v-alert
      v-if="hasValidationIssues"
      type="warning"
      variant="tonal"
      class="mb-6"
    >
      <h3 class="text-subtitle-1">Problemas encontrados:</h3>
      <p class="text-body-2 mb-2">
        Seu verbete possui os seguintes problemas que precisam ser corrigidos antes do envio:
      </p>

      <v-expansion-panels variant="accordion">
        <v-expansion-panel v-if="validationIssues.basicInfo && validationIssues.basicInfo.length > 0">
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
              <span>Informações Básicas ({{ validationIssues.basicInfo.length }})</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <ul class="pl-4">
              <li v-for="(issue, index) in validationIssues.basicInfo" :key="index" class="text-body-2">
                {{ issue }}
              </li>
            </ul>
            <v-btn
              color="var(--transites-gray-purple)"
              class="text-white mt-2"
              @click="goToStep(0)"
            >
              Corrigir Informações Básicas
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel v-if="validationIssues.content && validationIssues.content.length > 0">
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
              <span>Conteúdo ({{ validationIssues.content.length }})</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <ul class="pl-4">
              <li v-for="(issue, index) in validationIssues.content" :key="index" class="text-body-2">
                {{ issue }}
              </li>
            </ul>
            <v-btn
              color="var(--transites-gray-purple)"
              class="text-white mt-2"
              @click="goToStep(1)"
            >
              Corrigir Conteúdo
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel v-if="validationIssues.bibliography && validationIssues.bibliography.length > 0">
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
              <span>Bibliografia ({{ validationIssues.bibliography.length }})</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <ul class="pl-4">
              <li v-for="(issue, index) in validationIssues.bibliography" :key="index" class="text-body-2">
                {{ issue }}
              </li>
            </ul>
            <v-btn
              color="var(--transites-gray-purple)"
              class="text-white mt-2"
              @click="goToStep(2)"
            >
              Corrigir Bibliografia
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel v-if="validationIssues.media && validationIssues.media.length > 0">
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
              <span>Imagens e Mídia ({{ validationIssues.media.length }})</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <ul class="pl-4">
              <li v-for="(issue, index) in validationIssues.media" :key="index" class="text-body-2">
                {{ issue }}
              </li>
            </ul>
            <v-btn
              color="var(--transites-gray-purple)"
              class="text-white mt-2"
              @click="goToStep(3)"
            >
              Corrigir Imagens e Mídia
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-alert>

    <!-- Article preview using Article component -->
    <Article :article="mappedArticleData" :preview-mode="true" />
  </v-container>
</template>

<script>
import Article from '@/views/Article.vue'

export default {
  name: 'PreviewStep',
  components: {
    Article
  },
  props: {
    formData: {
      type: Object,
      required: true
    },
    validationIssues: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['validate', 'go-to-step'],
  computed: {
    hasValidationIssues() {
      return (
        (this.validationIssues.basicInfo && this.validationIssues.basicInfo.length > 0) ||
        (this.validationIssues.content && this.validationIssues.content.length > 0) ||
        (this.validationIssues.bibliography && this.validationIssues.bibliography.length > 0) ||
        (this.validationIssues.media && this.validationIssues.media.length > 0)
      )
    },
    mappedArticleData() {
      // Map formData to the structure expected by Article component
      return {
        attributes: {
          title: this.formData.title || 'Título do Verbete',
          summary: this.formData.summary || '',
          Artigo: this.formData.content || '',
          Bibliografia: this.formatBibliographyForArticle(),
          Obras: this.formData.sections?.find(s => s.title === 'Obras')?.content || '',
          birth: {
            data: this.formData.birth?.date || null,
            local: this.formData.birth?.place || ''
          },
          death: {
            data: this.formData.death?.date || null,
            local: this.formData.death?.place || ''
          },
          Image: {
            data: this.mapImages()
          },
          updatedAt: new Date().toISOString(),
          authors: {
            data: [
              { 
                id: 1, 
                attributes: { 
                  name: 'Autor do Verbete', 
                  institution: 'Instituição do Autor' 
                } 
              }
            ]
          }
        }
      }
    }
  },
  methods: {
    goToStep(step) {
      this.$emit('go-to-step', step)
    },
    formatDate(dateString) {
      if (!dateString) return ''

      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR')
      } catch (e) {
        return dateString
      }
    },
    mapImages() {
      const images = []

      // Add main image if exists
      if (this.formData.mainImage && this.formData.mainImage.preview) {
        images.push({
          attributes: {
            url: this.formData.mainImage.preview,
            alternativeText: this.formData.mainImage.title || '',
            caption: this.formData.mainImage.caption || '',
            formats: {
              small: {
                url: this.formData.mainImage.preview
              }
            }
          }
        })
      }

      // Add additional images if exist
      if (this.formData.additionalImages && this.formData.additionalImages.length > 0) {
        this.formData.additionalImages.forEach(img => {
          if (img.preview) {
            images.push({
              attributes: {
                url: img.preview,
                alternativeText: img.title || '',
                caption: img.caption || '',
                formats: {
                  small: {
                    url: img.preview
                  }
                }
              }
            })
          }
        })
      }

      return images
    },
    formatBibliographyForArticle() {
      if (!this.formData.bibliography || this.formData.bibliography.length === 0) {
        return ''
      }

      return this.formData.bibliography.map(entry => {
        return this.formatBibliographyEntry(entry)
      }).join('<br>')
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
    validate() {
      // The preview step doesn't have its own validation
      // It just shows validation issues from other steps
      this.$emit('validate', 4, [])
      return !this.hasValidationIssues
    }
  }
}
</script>