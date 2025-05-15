/**
 * Validation service for article submissions
 * Provides centralized validation logic for all steps of the submission form
 */

/**
 * Validates the basic information step
 * @param {Object} data - The form data for the basic info step
 * @returns {Array} - Array of validation error messages
 */
export function validateBasicInfo(data) {
  const errors = []
  
  // Required fields
  if (!data.title) errors.push('Título é obrigatório')
  if (!data.type) errors.push('Tipo de verbete é obrigatório')
  if (!data.summary) errors.push('Resumo é obrigatório')
  
  // Summary length
  if (data.summary && data.summary.length > 300) {
    errors.push('O resumo deve ter no máximo 300 caracteres')
  }
  
  // Type-specific fields
  if (data.type === 'person') {
    if (!data.birth?.date) errors.push('Data de nascimento é obrigatória')
    if (!data.birth?.place) errors.push('Local de nascimento é obrigatório')
  } else if (data.type === 'institution') {
    if (!data.foundation?.date) errors.push('Data de fundação é obrigatória')
    if (!data.foundation?.place) errors.push('Local de fundação é obrigatório')
  } else if (data.type === 'work') {
    if (!data.creation?.date) errors.push('Data de publicação/criação é obrigatória')
    if (!data.creation?.place) errors.push('Local de publicação/criação é obrigatório')
    if (!data.author) errors.push('Autor/criador é obrigatório')
  } else if (data.type === 'event') {
    if (!data.start?.date) errors.push('Data de início é obrigatória')
    if (!data.start?.place) errors.push('Local do evento é obrigatório')
    if (!data.end?.date) errors.push('Data de término é obrigatória')
    if (!data.organizer) errors.push('Organizador é obrigatório')
  }
  
  // Categories and tags
  if (!data.categories || data.categories.length === 0) {
    errors.push('Selecione pelo menos uma categoria')
  }
  
  if (!data.tags || data.tags.length === 0) {
    errors.push('Adicione pelo menos uma tag')
  } else if (data.tags.length < 3) {
    errors.push('Adicione pelo menos três tags')
  }
  
  return errors
}

/**
 * Validates the content step
 * @param {Object} data - The form data for the content step
 * @returns {Array} - Array of validation error messages
 */
export function validateContent(data) {
  const errors = []
  
  // Required fields
  if (!data.content) {
    errors.push('O conteúdo principal é obrigatório')
  } else {
    // Check content length (plain text, not HTML)
    const contentText = stripHtml(data.content)
    if (contentText.length < 3000) {
      errors.push('O conteúdo principal deve ter pelo menos 3.000 caracteres')
    }
    if (contentText.length > 20000) {
      errors.push('O conteúdo principal não deve exceder 20.000 caracteres')
    }
  }
  
  // Validate sections
  if (data.sections && data.sections.length > 0) {
    data.sections.forEach((section, index) => {
      if (!section.title) {
        errors.push(`Seção ${index + 1}: Título é obrigatório`)
      }
      if (!section.content) {
        errors.push(`Seção ${index + 1}: Conteúdo é obrigatório`)
      }
    })
  }
  
  return errors
}

/**
 * Validates the bibliography step
 * @param {Object} data - The form data for the bibliography step
 * @returns {Array} - Array of validation error messages
 */
export function validateBibliography(data) {
  const errors = []
  
  // Check if there's at least one entry
  if (!data.bibliography || data.bibliography.length === 0) {
    errors.push('Adicione pelo menos uma referência bibliográfica')
  } else {
    // Validate each entry
    data.bibliography.forEach((entry, index) => {
      if (!entry.type) {
        errors.push(`Referência ${index + 1}: Tipo de referência é obrigatório`)
      }
      
      // Type-specific validation
      switch (entry.type) {
        case 'book':
          if (!entry.authors) errors.push(`Referência ${index + 1}: Autor(es) é obrigatório`)
          if (!entry.title) errors.push(`Referência ${index + 1}: Título é obrigatório`)
          if (!entry.publisher) errors.push(`Referência ${index + 1}: Editora é obrigatória`)
          if (!entry.location) errors.push(`Referência ${index + 1}: Local de publicação é obrigatório`)
          if (!entry.year) errors.push(`Referência ${index + 1}: Ano é obrigatório`)
          break
          
        case 'article':
          if (!entry.authors) errors.push(`Referência ${index + 1}: Autor(es) é obrigatório`)
          if (!entry.title) errors.push(`Referência ${index + 1}: Título do artigo é obrigatório`)
          if (!entry.journal) errors.push(`Referência ${index + 1}: Nome do periódico é obrigatório`)
          if (!entry.pages) errors.push(`Referência ${index + 1}: Páginas são obrigatórias`)
          if (!entry.year) errors.push(`Referência ${index + 1}: Ano é obrigatório`)
          break
          
        // Add validation for other reference types as needed
      }
    })
  }
  
  return errors
}

/**
 * Validates the media step
 * @param {Object} data - The form data for the media step
 * @returns {Array} - Array of validation error messages
 */
export function validateMedia(data) {
  const errors = []
  
  // Validate main image
  if (!data.mainImage || !data.mainImage.file) {
    errors.push('Selecione uma imagem principal para o verbete')
  } else {
    if (!data.mainImage.title) {
      errors.push('Adicione um título para a imagem principal')
    }
    if (!data.mainImage.caption) {
      errors.push('Adicione uma legenda para a imagem principal')
    }
    if (!data.mainImage.credits) {
      errors.push('Adicione os créditos para a imagem principal')
    }
  }
  
  // Validate additional images
  if (data.additionalImages && data.additionalImages.length > 0) {
    data.additionalImages.forEach((image, index) => {
      if (!image.title) {
        errors.push(`Imagem adicional ${index + 1}: Título é obrigatório`)
      }
      if (!image.caption) {
        errors.push(`Imagem adicional ${index + 1}: Legenda é obrigatória`)
      }
      if (!image.credits) {
        errors.push(`Imagem adicional ${index + 1}: Créditos são obrigatórios`)
      }
    })
  }
  
  return errors
}

/**
 * Validates the entire submission form
 * @param {Object} data - The complete form data
 * @returns {Object} - Object with validation errors for each step
 */
export function validateSubmission(data) {
  return {
    basicInfo: validateBasicInfo(data),
    content: validateContent(data),
    bibliography: validateBibliography(data),
    media: validateMedia(data)
  }
}

/**
 * Helper function to strip HTML tags from a string
 * @param {string} html - HTML string
 * @returns {string} - Plain text without HTML tags
 */
function stripHtml(html) {
  if (!html) return ''
  
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

export default {
  validateBasicInfo,
  validateContent,
  validateBibliography,
  validateMedia,
  validateSubmission
}