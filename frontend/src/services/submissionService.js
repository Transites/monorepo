import api from './api'

/**
 * Service para handling de submissões de artigos
 */
const submissionService = {
  /**
   * Buscar tipos de verbete do backend
   */
  async getVerbeteTypes() {
    try {
      const response = await api.get('/submissions/verbete-types')
      return response.data.data
    } catch (error) {
      console.error('Erro ao buscar tipos de verbete:', error)
      throw error
    }
  },

  /**
   * Buscar categorias do backend
   */
  async getCategories() {
    try {
      const response = await api.get('/categories')
      return response.data.data.map(item => ({
        title: item.attributes.name,
        value: item.id
      }))
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      throw error
    }
  },

  /**
   * Buscar tags do backend
   */
  async getTags() {
    try {
      const response = await api.get('/tags')
      return response.data.data.map(item => item.attributes.name)
    } catch (error) {
      console.error('Erro ao buscar tags:', error)
      throw error
    }
  },
  /**
   * Submeter um artigo para review
   */
  async submitArticle(formData) {
    try {
      console.log('=== SUBMISSION SERVICE ===')
      console.log('1. Form data recebido:', formData)

      // Preparar dados para a API
      const submissionData = this.prepareSubmissionData(formData)
      console.log('2. Dados preparados:', submissionData)

      const payload = { data: submissionData }
      console.log('3. Payload final:', payload)
      console.log('4. Headers padrão:', api.defaults.headers)

      // Fazer requisição
      const response = await api.post('/submissions', payload)
      console.log('5. Resposta da API:', response.data)
      console.log('6. URL completa:', api.defaults.baseURL + '/submissions')

      return response.data
    } catch (error) {
      console.error('=== ERRO NO SERVICE ===')
      console.error('Error:', error)

      if (error.response) {
        console.error('Status:', error.response.status)
        console.error('Data:', error.response.data)
      }

      throw error
    }
  },

  /**
   * Salvar rascunho (futuramente)
   */
  async saveDraft(formData) {
    // Por enquanto, só localStorage
    try {
      localStorage.setItem('submissionDraft', JSON.stringify(formData))
      return { success: true }
    } catch (error) {
      throw new Error('Erro ao salvar rascunho')
    }
  },

  /**
   * Carregar rascunho
   */
  loadDraft() {
    try {
      const draft = localStorage.getItem('submissionDraft')
      return draft ? JSON.parse(draft) : null
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error)
      return null
    }
  },

  /**
   * Preparar dados para a API
   */
  prepareSubmissionData(formData) {
    console.log('prepareSubmissionData input:', formData)

    // Dados obrigatórios
    const data = {
      title: formData.title || '',
      type: formData.type || '',
      summary: formData.summary || '',
      content: formData.content || '',
      status: 'submitted'
    }

    // Dados opcionais
    if (formData.birth) data.birth = formData.birth
    if (formData.death) data.death = formData.death
    if (formData.categories) data.categories = formData.categories
    // Temporarily removing tags to simplify integration
    // if (formData.tags) data.tags = formData.tags
    if (formData.bibliography) data.bibliography = JSON.stringify(formData.bibliography)

    // Dados de mídia (sem upload por enquanto)
    const mediaFiles = {}

    if (formData.mainImage && formData.mainImage.title) {
      mediaFiles.mainImage = {
        title: formData.mainImage.title,
        caption: formData.mainImage.caption,
        credits: formData.mainImage.credits,
        name: formData.mainImage.name
      }
    }

    if (formData.additionalImages && formData.additionalImages.length > 0) {
      mediaFiles.additionalImages = formData.additionalImages.map(img => ({
        title: img.title,
        caption: img.caption,
        credits: img.credits,
        name: img.name
      }))
    }

    if (Object.keys(mediaFiles).length > 0) {
      data.mediaFiles = mediaFiles
    }

    console.log('prepareSubmissionData output:', data)
    return data
  }
}

export default submissionService
