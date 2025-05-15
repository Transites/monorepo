import api from './api'

/**
 * Service for handling article submissions
 */
const submissionService = {
  /**
   * Save a draft submission to the API
   * @param {Object} data - The submission data
   * @returns {Promise} - Promise that resolves with the API response
   */
  async saveDraft(data) {
    try {
      const submissionData = prepareSubmissionData(data)
      submissionData.status = 'draft'
      
      const response = await api.post('/submissions', {
        data: submissionData
      })
      
      return response.data
    } catch (error) {
      console.error('Error saving draft to API:', error)
      throw error
    }
  },
  
  /**
   * Submit an article for review
   * @param {Object} data - The submission data
   * @returns {Promise} - Promise that resolves with the API response
   */
  async submitArticle(data) {
    try {
      const submissionData = prepareSubmissionData(data)
      submissionData.status = 'submitted'
      
      const response = await api.post('/submissions', {
        data: submissionData
      })
      
      return response.data
    } catch (error) {
      console.error('Error submitting article:', error)
      throw error
    }
  },
  
  /**
   * Get a draft submission by ID
   * @param {string} id - The submission ID
   * @returns {Promise} - Promise that resolves with the API response
   */
  async getDraft(id) {
    try {
      const response = await api.get(`/submissions/${id}`)
      return response.data
    } catch (error) {
      console.error('Error getting draft:', error)
      throw error
    }
  },
  
  /**
   * Get all drafts for the current user
   * @returns {Promise} - Promise that resolves with the API response
   */
  async getUserDrafts() {
    try {
      const response = await api.get('/submissions', {
        params: {
          filters: {
            status: 'draft',
            // The actual filter for the current user would depend on the API
            // and authentication implementation
          }
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error getting user drafts:', error)
      throw error
    }
  },
  
  /**
   * Upload an image file
   * @param {File} file - The image file to upload
   * @param {Object} metadata - Metadata for the image (title, caption, credits)
   * @returns {Promise} - Promise that resolves with the API response
   */
  async uploadImage(file, metadata = {}) {
    try {
      // Create form data for the file upload
      const formData = new FormData()
      formData.append('files', file)
      
      // Upload the file
      const uploadResponse = await api.post('/upload', formData)
      
      // Get the file ID from the response
      const fileId = uploadResponse.data[0].id
      
      // If metadata is provided, create a media entry with the metadata
      if (Object.keys(metadata).length > 0) {
        const mediaResponse = await api.post('/media', {
          data: {
            ...metadata,
            file: fileId
          }
        })
        
        return mediaResponse.data
      }
      
      return uploadResponse.data[0]
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }
}

/**
 * Helper function to prepare submission data for the API
 * @param {Object} data - The submission data
 * @returns {Object} - The prepared data
 */
function prepareSubmissionData(data) {
  // Create a deep copy to avoid modifying the original
  const preparedData = JSON.parse(JSON.stringify(data))
  
  // Handle image uploads
  // In a real implementation, you would upload the images first
  // and then replace the file objects with the IDs returned by the API
  
  // For now, we'll just remove the file objects
  if (preparedData.mainImage && preparedData.mainImage.file) {
    delete preparedData.mainImage.file
  }
  
  if (preparedData.additionalImages && preparedData.additionalImages.length > 0) {
    preparedData.additionalImages.forEach(image => {
      if (image.file) {
        delete image.file
      }
    })
  }
  
  return preparedData
}

export default submissionService