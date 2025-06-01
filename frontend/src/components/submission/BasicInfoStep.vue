<template>
  <v-container class="pa-6">
    <h2 class="text-h5 mb-4">Informações Básicas</h2>
    <p class="text-body-1 mb-6">
      Preencha as informações básicas sobre o verbete que você está submetendo.
      Todos os campos marcados com * são obrigatórios.
    </p>

    <v-form ref="form" @submit.prevent>
      <v-row>
        <v-col cols="12">
          <v-text-field
              v-model="localData.title"
              label="Título do Verbete*"
              :rules="[v => !!v || 'Título é obrigatório']"
              hint="Insira o título completo do verbete"
              persistent-hint
              @update:model-value="updateData"
          ></v-text-field>
        </v-col>

        <v-col cols="12">
          <v-select
              v-model="localData.type"
              :items="verbeteTypes"
              label="Tipo de Verbete*"
              :rules="[v => !!v || 'Tipo de verbete é obrigatório']"
              hint="Selecione o tipo de verbete que melhor se adequa ao seu conteúdo"
              persistent-hint
              :loading="isLoading.verbeteTypes"
              :disabled="isLoading.verbeteTypes"
              :error="!!loadingError.verbeteTypes"
              :error-messages="loadingError.verbeteTypes"
              @update:model-value="updateData"
          ></v-select>
        </v-col>

        <v-col cols="12">
          <v-textarea
              v-model="localData.summary"
              label="Resumo*"
              :rules="[
              v => !!v || 'Resumo é obrigatório',
              v => !v || v.length <= SUMMARY_MAX_LENGTH || `O resumo deve ter no máximo ${SUMMARY_MAX_LENGTH} caracteres`
            ]"
              :counter="SUMMARY_MAX_LENGTH"
              :hint="`Um breve resumo do verbete (máximo ${SUMMARY_MAX_LENGTH} caracteres)`"
              persistent-hint
              rows="3"
              @update:model-value="updateData"
          ></v-textarea>
        </v-col>
      </v-row>

      <!-- Campos específicos para pessoa -->
      <v-row v-if="localData.type === 'person'">
        <v-col cols="12" md="6">
          <h3 class="text-subtitle-1 mb-3">Nascimento</h3>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.birth.date"
                  label="Data de Nascimento*"
                  type="date"
                  :rules="[v => !!v || 'Data de nascimento é obrigatória']"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.birth.place"
                  label="Local de Nascimento*"
                  :rules="[v => !!v || 'Local de nascimento é obrigatório']"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" md="6">
          <h3 class="text-subtitle-1 mb-3">Falecimento</h3>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.death.date"
                  label="Data de Falecimento"
                  type="date"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.death.place"
                  label="Local de Falecimento"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- Campos específicos para instituição -->
      <v-row v-if="localData.type === 'institution'">
        <v-col cols="12" md="6">
          <h3 class="text-subtitle-1 mb-3">Fundação</h3>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.foundation.date"
                  label="Data de Fundação*"
                  type="date"
                  :rules="[v => !!v || 'Data de fundação é obrigatória']"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.foundation.place"
                  label="Local de Fundação*"
                  :rules="[v => !!v || 'Local de fundação é obrigatório']"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" md="6">
          <h3 class="text-subtitle-1 mb-3">Encerramento</h3>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.closure.date"
                  label="Data de Encerramento"
                  type="date"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.closure.place"
                  label="Local de Encerramento"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- Campos específicos para obra -->
      <v-row v-if="localData.type === 'work'">
        <v-col cols="12" md="6">
          <h3 class="text-subtitle-1 mb-3">Publicação/Criação</h3>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.creation.date"
                  label="Data de Publicação/Criação*"
                  type="date"
                  :rules="[v => !!v || 'Data de publicação/criação é obrigatória']"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.creation.place"
                  label="Local de Publicação/Criação*"
                  :rules="[v => !!v || 'Local de publicação/criação é obrigatório']"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
              v-model="localData.author"
              label="Autor/Criador*"
              :rules="[v => !!v || 'Autor/criador é obrigatório']"
              @update:model-value="updateData"
          ></v-text-field>
        </v-col>
      </v-row>

      <!-- Campos específicos para evento -->
      <v-row v-if="localData.type === 'event'">
        <v-col cols="12" md="6">
          <h3 class="text-subtitle-1 mb-3">Início</h3>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.start.date"
                  label="Data de Início*"
                  type="date"
                  :rules="[v => !!v || 'Data de início é obrigatória']"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.start.place"
                  label="Local do Evento*"
                  :rules="[v => !!v || 'Local do evento é obrigatório']"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" md="6">
          <h3 class="text-subtitle-1 mb-3">Término</h3>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.end.date"
                  label="Data de Término*"
                  type="date"
                  :rules="[v => !!v || 'Data de término é obrigatória']"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="localData.organizer"
                  label="Organizador*"
                  :rules="[v => !!v || 'Organizador é obrigatório']"
                  @update:model-value="updateData"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <h3 class="text-subtitle-1 mb-3">Categorias e Tags</h3>
          <v-autocomplete
              v-model="localData.categories"
              :items="availableCategories"
              label="Categorias*"
              multiple
              chips
              closable-chips
              :rules="[v => v.length > 0 || 'Selecione pelo menos uma categoria']"
              :loading="isLoading.categories"
              :disabled="isLoading.categories"
              :error="!!loadingError.categories"
              :error-messages="loadingError.categories"
              @update:model-value="updateData"
          ></v-autocomplete>
        </v-col>

        <v-col cols="12">
          <v-combobox
              v-model="localData.tags"
              :items="availableTags"
              label="Tags*"
              multiple
              chips
              closable-chips
              :rules="[v => v.length > 0 || 'Adicione pelo menos uma tag']"
              hint="Digite tags e pressione Enter para adicionar. Mínimo de 3 tags."
              persistent-hint
              :loading="isLoading.tags"
              :disabled="isLoading.tags"
              :error="!!loadingError.tags"
              :error-messages="loadingError.tags"
              @update:model-value="updateData"
          ></v-combobox>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script>
import personArticleService from '@/services/personArticleService'

export default {
  name: 'BasicInfoStep',
  props: {
    formData: {
      type: Object,
      required: true
    }
  },
  emits: ['update:form-data', 'validate'],
  data() {
    return {
      SUMMARY_MAX_LENGTH: 600,
      localData: {
        title: '',
        type: '',
        summary: '',
        birth: {
          date: '',
          place: ''
        },
        death: {
          date: '',
          place: ''
        },
        foundation: {
          date: '',
          place: ''
        },
        closure: {
          date: '',
          place: ''
        },
        creation: {
          date: '',
          place: ''
        },
        author: '',
        start: {
          date: '',
          place: ''
        },
        end: {
          date: '',
          place: ''
        },
        organizer: '',
        categories: [],
        tags: []
      },
      verbeteTypes: [],
      availableCategories: [],
      availableTags: [],
      // Fallback values in case API fails
      fallbackVerbeteTypes: [
        {title: 'Pessoa', value: 'person'},
        {title: 'Instituição', value: 'institution'},
        {title: 'Obra', value: 'work'},
        {title: 'Evento', value: 'event'}
      ],
      fallbackCategories: [
        {title: 'Arte', value: 'art'},
        {title: 'Ciência', value: 'science'},
        {title: 'Cultura', value: 'culture'},
        {title: 'Educação', value: 'education'},
        {title: 'História', value: 'history'},
        {title: 'Literatura', value: 'literature'},
        {title: 'Política', value: 'politics'}
      ],
      fallbackTags: [
        'Brasil', 'Portugal', 'França', 'Século XIX', 'Século XX',
        'Modernismo', 'Colonialismo', 'Independência', 'Migração',
        'Intelectuais', 'Universidade', 'Livro', 'Revista', 'Jornal',
        'Pintura', 'Escultura', 'Música', 'Teatro', 'Cinema'
      ],
      isLoading: {
        verbeteTypes: false,
        categories: false,
        tags: false
      },
      loadingError: {
        verbeteTypes: null,
        categories: null,
        tags: null
      }
    }
  },
  created() {
    // Initialize local data with form data
    this.initializeLocalData()

    // Fetch data from backend
    this.fetchVerbeteTypes()
    this.fetchCategories()
    this.fetchTags()
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
    // Fetch verbete types from backend
    async fetchVerbeteTypes() {
      this.isLoading.verbeteTypes = true
      this.loadingError.verbeteTypes = null

      try {
        this.verbeteTypes = await personArticleService.getVerbeteTypes()
        console.log('Verbete types loaded:', this.verbeteTypes)
      } catch (error) {
        console.error('Error fetching verbete types:', error)
        this.loadingError.verbeteTypes = 'Erro ao carregar tipos de verbete'
        // Use fallback values
        this.verbeteTypes = [...this.fallbackVerbeteTypes]
      } finally {
        this.isLoading.verbeteTypes = false
      }
    },

    // Fetch categories from backend
    async fetchCategories() {
      this.isLoading.categories = true
      this.loadingError.categories = null

      try {
        this.availableCategories = await personArticleService.getCategories()
        console.log('Categories loaded:', this.availableCategories)
      } catch (error) {
        console.error('Error fetching categories:', error)
        this.loadingError.categories = 'Erro ao carregar categorias'
        // Use fallback values
        this.availableCategories = [...this.fallbackCategories]
      } finally {
        this.isLoading.categories = false
      }
    },

    // Fetch tags from backend
    async fetchTags() {
      this.isLoading.tags = true
      this.loadingError.tags = null

      try {
        this.availableTags = await personArticleService.getTags()
        console.log('Tags loaded:', this.availableTags)
      } catch (error) {
        console.error('Error fetching tags:', error)
        this.loadingError.tags = 'Erro ao carregar tags'
        // Use fallback values
        this.availableTags = [...this.fallbackTags]
      } finally {
        this.isLoading.tags = false
      }
    },

    initializeLocalData() {
      // Copy form data to local data, ensuring all required properties exist
      this.localData = {
        title: this.formData.title || '',
        type: this.formData.type || '',
        summary: this.formData.summary || '',
        birth: {
          date: this.formData.birth?.date || '',
          place: this.formData.birth?.place || ''
        },
        death: {
          date: this.formData.death?.date || '',
          place: this.formData.death?.place || ''
        },
        foundation: {
          date: this.formData.foundation?.date || '',
          place: this.formData.foundation?.place || ''
        },
        closure: {
          date: this.formData.closure?.date || '',
          place: this.formData.closure?.place || ''
        },
        creation: {
          date: this.formData.creation?.date || '',
          place: this.formData.creation?.place || ''
        },
        author: this.formData.author || '',
        start: {
          date: this.formData.start?.date || '',
          place: this.formData.start?.place || ''
        },
        end: {
          date: this.formData.end?.date || '',
          place: this.formData.end?.place || ''
        },
        organizer: this.formData.organizer || '',
        categories: this.formData.categories || [],
        tags: this.formData.tags || []
      }
    },
    updateData() {
      this.$emit('update:form-data', this.localData)
    },
    async validate() {
      const isValid = await this.$refs.form.validate()

      if (!isValid.valid) {
        const errors = []

        if (!this.localData.title) errors.push('Título é obrigatório')
        if (!this.localData.type) errors.push('Tipo de verbete é obrigatório')
        if (!this.localData.summary) errors.push('Resumo é obrigatório')
        if (this.localData.summary && this.localData.summary.length > 300) {
          errors.push('O resumo deve ter no máximo 300 caracteres')
        }

        // Validate type-specific fields
        if (this.localData.type === 'person') {
          if (!this.localData.birth.date) errors.push('Data de nascimento é obrigatória')
          if (!this.localData.birth.place) errors.push('Local de nascimento é obrigatório')
        } else if (this.localData.type === 'institution') {
          if (!this.localData.foundation.date) errors.push('Data de fundação é obrigatória')
          if (!this.localData.foundation.place) errors.push('Local de fundação é obrigatório')
        } else if (this.localData.type === 'work') {
          if (!this.localData.creation.date) errors.push('Data de publicação/criação é obrigatória')
          if (!this.localData.creation.place) errors.push('Local de publicação/criação é obrigatório')
          if (!this.localData.author) errors.push('Autor/criador é obrigatório')
        } else if (this.localData.type === 'event') {
          if (!this.localData.start.date) errors.push('Data de início é obrigatória')
          if (!this.localData.start.place) errors.push('Local do evento é obrigatório')
          if (!this.localData.end.date) errors.push('Data de término é obrigatória')
          if (!this.localData.organizer) errors.push('Organizador é obrigatório')
        }

        if (this.localData.categories.length === 0) errors.push('Selecione pelo menos uma categoria')
        if (this.localData.tags.length === 0) errors.push('Adicione pelo menos uma tag')

        this.$emit('validate', 0, errors)
        return false
      }

      this.$emit('validate', 0, [])
      return true
    }
  }
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
