import api from './api'

/**
 * Service for handling person articles
 */
const personArticleService = {
  /**
   * Fetch article types from the backend
   */
  async getVerbeteTypes() {
    try {
      // We'll keep using the same endpoint for verbete types
      const response = await api.get('/submissions/verbete-types')
      return response.data.data
    } catch (error) {
      console.error('Error fetching article types:', error)
      throw error
    }
  },

  /**
   * Fetch categories from the backend
   */
  async getCategories() {
    try {
      const response = await api.get('/categories')
      return response.data.data.map(item => ({
        title: item.attributes.name,
        value: item.id
      }))
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  },

  /**
   * Fetch tags from the backend
   */
  async getTags() {
    try {
      const response = await api.get('/tags')
      return response.data.data.map(item => item.attributes.name)
    } catch (error) {
      console.error('Error fetching tags:', error)
      throw error
    }
  },

  /**
   * Submit a person article for review
   */
  async submitArticle(formData) {
    try {
      console.log('=== PERSON ARTICLE SERVICE ===')
      console.log('1. Form data received:', formData)

      // Prepare data for the API
      const articleData = this.prepareArticleData(formData)
      console.log('2. Data prepared:', articleData)

      const payload = { data: articleData }
      console.log('3. Final payload:', payload)
      console.log('4. Default headers:', api.defaults.headers)

      // Make the request to the person-articles endpoint
      const response = await api.post('/person-articles', payload)
      console.log('5. API response:', response.data)
      console.log('6. Complete URL:', api.defaults.baseURL + '/person-articles')

      return response.data
    } catch (error) {
      console.error('=== ERROR IN SERVICE ===')
      console.error('Error:', error)

      if (error.response) {
        console.error('Status:', error.response.status)
        console.error('Data:', error.response.data)
      }

      throw error
    }
  },

  /**
   * Save draft (currently only in localStorage)
   */
  async saveDraft(formData) {
    try {
      localStorage.setItem('personArticleDraft', JSON.stringify(formData))
      return { success: true }
    } catch (error) {
      throw new Error('Error saving draft')
    }
  },

  /**
   * Load draft from localStorage
   */
  loadDraft() {
    try {
      const draft = localStorage.getItem('personArticleDraft')
      return draft ? JSON.parse(draft) : null
    } catch (error) {
      console.error('Error loading draft:', error)
      return null
    }
  },

  /**
   * Prepare data for the API
   */
  prepareArticleData(formData) {
    console.log('prepareArticleData input:', formData)

    // Required fields
    const data = {
      title: formData.title || '',
      summary: formData.summary || '',
      Artigo: formData.content || '',
      // Set as draft by default (using Strapi's draft/publish feature)
      publishedAt: null
    }

    // Optional fields
    if (formData.type) data.type = formData.type
    
    // Handle birth/death data
    if (formData.birth) {
      data.birth = {
        date: formData.birth,
        location: formData.birthLocation || ''
      }
    }
    
    if (formData.death) {
      data.death = {
        date: formData.death,
        location: formData.deathLocation || ''
      }
    }
    
    // Handle categories as a relation
    if (formData.categories && formData.categories.length > 0) {
      data.categories = {
        connect: formData.categories.map(id => ({ id }))
      }
    }

    // TODO: fix.
    // // Handle tags as a relation
    // if (formData.tags && formData.tags.length > 0) {
    //   // Convert tag names to IDs if needed
    //   data.tags = {
    //     connect: formData.tags.map(tag => {
    //       // If tag is already an ID, use it directly
    //       if (typeof tag === 'number') {
    //         return { id: tag }
    //       }
    //       // Otherwise, we'd need to look up the tag ID by name
    //       // This would require an additional API call
    //       // For now, we'll skip this and assume tags are provided as IDs
    //       return { id: tag }
    //     })
    //   }
    // }
    
    // Handle bibliography
    if (formData.bibliography) {
      data.Bibliografia = typeof formData.bibliography === 'string' 
        ? formData.bibliography 
        : JSON.stringify(formData.bibliography)
    }

    // Media files will be handled separately with upload API
    // This would require additional implementation for file uploads

    console.log('prepareArticleData output:', data)
    return data
  }
}

export default personArticleService