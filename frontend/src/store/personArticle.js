import personArticleService from '@/services/personArticleService'
// TODO: renomear servico para submissionService
// TODO: renomear esse arquivo para submissionManager.js

const state = {
  draft: null,
  submissionStatus: null,
  submissionError: null,
  isLoading: false,
  lastSubmission: null
}

const getters = {
  hasDraft: state => !!state.draft,
  isDraftEmpty: state => !state.draft || Object.keys(state.draft).length === 0,
  getSubmissionStatus: state => state.submissionStatus,
  getSubmissionError: state => state.submissionError,
  isLoading: state => state.isLoading,
  getLastSubmission: state => state.lastSubmission
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
  },
  SET_LAST_SUBMISSION(state, submission) {
    state.lastSubmission = submission
  }
}

const actions = {
  /**
   * Save draft - uses the service
   */
  async saveArticleDraft({ commit }, formData) {
    commit('SET_LOADING', true)
    commit('SET_SUBMISSION_ERROR', null)

    try {
      console.log('before saveDraft');
      await personArticleService.saveDraft(formData)
      commit('SET_DRAFT', formData)
      return Promise.resolve()
    } catch (error) {
      commit('SET_SUBMISSION_ERROR', error.message)
      return Promise.reject(error)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Load draft - uses the service
   */
  loadArticleDraft({ commit }) {
    try {
      const draft = personArticleService.loadDraft()
      if (draft) {
        commit('SET_DRAFT', draft)
      }
      return Promise.resolve(draft)
    } catch (error) {
      console.error('Error loading draft:', error)
      return Promise.reject(error)
    }
  },

  /**
   * Clear draft
   */
  clearArticleDraft({ commit }) {
    try {
      localStorage.removeItem('personArticleDraft')
      commit('CLEAR_DRAFT')
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  },

  /**
   * Submit article - uses the service
   */
  async submitArticle({ commit, dispatch }, formData) {
    commit('SET_LOADING', true)
    commit('SET_SUBMISSION_ERROR', null)
    commit('SET_SUBMISSION_STATUS', 'submitting')

    try {
      console.log('=== VUEX SUBMIT ACTION ===')

      const result = await personArticleService.submitArticle(formData)
      await uploadMainImage(formData.image)

      // Update state
      commit('SET_SUBMISSION_STATUS', 'success')
      commit('SET_LAST_SUBMISSION', result)

      // TODO: Uncomment when not testing the request.
      // await dispatch('clearArticleDraft')

      return Promise.resolve(result)
    } catch (error) {
      commit('SET_SUBMISSION_STATUS', 'error')
      commit('SET_SUBMISSION_ERROR', error.message || 'Error submitting article')
      return Promise.reject(error)
    } finally {
      commit('SET_LOADING', false)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}