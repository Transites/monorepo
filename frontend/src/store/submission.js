import api from '@/services/api'

const state = {
  draft: null,
  submissionStatus: null,
  submissionError: null,
  isLoading: false
}

const getters = {
  hasDraft: state => !!state.draft,
  isDraftEmpty: state => !state.draft || Object.keys(state.draft).length === 0,
  getSubmissionStatus: state => state.submissionStatus,
  getSubmissionError: state => state.submissionError,
  isLoading: state => state.isLoading
}

const mutations = {
  SET_DRAFT(state, draft) {
    state.draft = draft
  },
  CLEAR_DRAFT(state) {
    state.draft = null
  },
  SET_SUBMISSION_STATUS(state, status) {
    state.submissionStatus = status
  },
  SET_SUBMISSION_ERROR(state, error) {
    state.submissionError = error
  },
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading
  }
}

const actions = {
  /**
   * Save a draft of the submission to localStorage
   */
  // TODO: where does this commit come from?
  saveSubmissionDraft({ commit }, formData) {
    try {
      localStorage.setItem('submissionDraft', JSON.stringify(formData))
      
      commit('SET_DRAFT', formData)
      
      return Promise.resolve()
    } catch (error) {
      console.error('Error saving draft:', error)
      return Promise.reject(error)
    }
  },
  
  /**
   * Load a draft from localStorage
   */
  loadSubmissionDraft({ commit }) {
    try {
      const draftJson = localStorage.getItem('submissionDraft')
      
      if (draftJson) {
        const draft = JSON.parse(draftJson)
        commit('SET_DRAFT', draft)
        return Promise.resolve(draft)
      }
      
      return Promise.resolve(null)
    } catch (error) {
      console.error('Error loading draft:', error)
      return Promise.reject(error)
    }
  },
  
  /**
   * Clear the current draft
   */
  clearSubmissionDraft({ commit }) {
    try {
      localStorage.removeItem('submissionDraft')
      commit('CLEAR_DRAFT')
      return Promise.resolve()
    } catch (error) {
      console.error('Error clearing draft:', error)
      return Promise.reject(error)
    }
  },
  
  /**
   * Submit the article to the API
   */
  async submitSubmission({ commit, dispatch }, formData) {
    commit('SET_LOADING', true)
    commit('SET_SUBMISSION_ERROR', null)
    commit('SET_SUBMISSION_STATUS', 'submitting')
    
    try {
      // Prepare data for API
      const submissionData = prepareSubmissionData(formData)
      
      // Submit to API
      const response = await api.post('/submissions', {
        data: submissionData
      })
      
      // Handle successful submission
      commit('SET_SUBMISSION_STATUS', 'success')
      
      // Clear draft after successful submission
      await dispatch('clearSubmissionDraft')
      
      return Promise.resolve(response.data)
    } catch (error) {
      console.error('Error submitting article:', error)
      commit('SET_SUBMISSION_STATUS', 'error')
      commit('SET_SUBMISSION_ERROR', error.message || 'Erro ao submeter o verbete')
      return Promise.reject(error)
    } finally {
      commit('SET_LOADING', false)
    }
  }
}

/**
 * Helper function to prepare submission data for the API
 */
function prepareSubmissionData(formData) {
  // Create a deep copy to avoid modifying the original
  const data = JSON.parse(JSON.stringify(formData))
  
  // Handle image uploads
  if (data.mainImage && data.mainImage.file) {
    // In a real implementation, you would upload the file to the server
    // and replace the file object with the URL or ID returned by the server
    // For now, we'll just remove the file object and keep the preview URL
    delete data.mainImage.file
  }
  
  if (data.additionalImages && data.additionalImages.length > 0) {
    data.additionalImages.forEach(image => {
      if (image.file) {
        delete image.file
      }
    })
  }
  
  // Set status to draft
  data.status = 'draft'
  
  return data
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}