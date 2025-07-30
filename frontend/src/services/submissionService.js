import api from './api'

/**
 * Serviço atualizado para handling de submissões com as novas APIs
 */
const submissionService = {
    /**
     * Verificar artigos em progresso por email
     */
    async checkInProgressArticles(email) {
        try {
            const response = await api.post('/submissions/edit', {email});
            console.log('In-progress articles response:', response)
            return response.data;
        } catch (error) {
        if (error.response.status === 404) {
                throw error;
            }
            console.error('Error checking in-progress articles:', error);
            this.handleApiError(error);
            throw error;
        }
    },

    /**
     * Criar submissão
     */
    async createSubmission(formData) {
        try {
            console.log('Creating submission with data:', formData)

            // Preparar dados para API conforme Conjunto 7
            const submissionData = {
                author_name: formData.authorName,
                author_email: formData.authorEmail,
                author_institution: formData.authorInstitution || '',
                title: formData.title,
                summary: formData.summary,
                content: formData.content,
                keywords: formData.keywords || [],
                category: formData.category,
                metadata: {
                    verbeteType: formData.verbeteType,
                    birthDate: formData.birth?.date,
                    birthPlace: formData.birth?.place,
                    deathDate: formData.death?.date,
                    deathPlace: formData.death?.place,
                    sections: formData.sections || [],
                    bibliography: formData.bibliography || []
                }
            }

            const response = await api.post('/submissions', submissionData)

            console.log('Submission created successfully:', response.data)
            return response.data

        } catch (error) {
            console.error('Error creating submission:', error)
            this.handleApiError(error)
            throw error
        }
    },

    /**
     * Buscar submissão por token (para edição)
     */
    async getSubmissionByToken(token) {
        try {
            const response = await api.get(`/submissions/${token}`)
            return response.data
        } catch (error) {
            console.error('Error fetching submission by token:', error)
            this.handleApiError(error)
            throw error
        }
    },

    /**
     * Atualizar submissão via token
     */
    async updateSubmission(token, formData, authorEmail) {
        try {
            console.log('Updating submission:', {token, authorEmail})

            const submissionData = {
                author_email: authorEmail, // Obrigatório para validação
                title: formData.title,
                summary: formData.summary,
                content: formData.content,
                keywords: formData.keywords || [],
                category: formData.category,
                metadata: {
                    verbeteType: formData.verbeteType,
                    birthDate: formData.birth?.date,
                    birthPlace: formData.birth?.place,
                    deathDate: formData.death?.date,
                    deathPlace: formData.death?.place,
                    sections: formData.sections || [],
                    bibliography: formData.bibliography || []
                }
            }

            const response = await api.put(`/submissions/${token}`, submissionData)

            console.log('Submission updated successfully:', response.data)
            return response.data

        } catch (error) {
            console.error('Error updating submission:', error)
            this.handleApiError(error)
            throw error
        }
    },

    /**
     * Auto-save (salvamento automático)
     */
    async autoSave(token, formData, authorEmail) {
        try {
            const submissionData = {
                author_email: authorEmail,
                title: formData.title,
                summary: formData.summary,
                content: formData.content,
                keywords: formData.keywords || [],
                category: formData.category,
                metadata: formData.metadata || {}
            }

            const response = await api.post(`/submissions/${token}/auto-save`, submissionData)
            return response.data

        } catch (error) {
            console.error('Error auto-saving submission:', error)
            // Auto-save não deve quebrar a interface, apenas log
            return {success: false, error: error.message}
        }
    },

    /**
     * Buscar feedback de uma submissão
     */
    async getSubmissionFeedback(token) {
        try {
            const response = await api.get(`/submissions/${token}/feedback`)
            return response.data
        } catch (error) {
            console.error('Error fetching feedback:', error)
            return {feedback: []}
        }
    },

    /**
     * Marcar feedback como lido
     */
    async markFeedbackAsRead(token, feedbackId, authorEmail) {
        try {
            const response = await api.post(`/submissions/${token}/feedback/${feedbackId}/read`, {
                author_email: authorEmail
            })
            return response.data
        } catch (error) {
            console.error('Error marking feedback as read:', error)
            throw error
        }
    },

    /**
     * Upload de arquivo
     */
    async uploadFile(file, submissionToken, authorEmail) {
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('submissionToken', submissionToken)
            formData.append('authorEmail', authorEmail)

            // Detectar tipo de arquivo
            const isImage = file.type.startsWith('image/')
            const endpoint = isImage ? '/upload/image' : '/upload/document'

            const response = await api.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 30000 // 30 segundos para upload
            })

            return response.data

        } catch (error) {
            console.error('Error uploading file:', error)
            this.handleApiError(error)
            throw error
        }
    },

    /**
     * Upload múltiplo
     */
    async uploadMultipleFiles(files, submissionToken, authorEmail) {
        try {
            const formData = new FormData()

            files.forEach(file => {
                formData.append('files', file)
            })
            formData.append('submissionToken', submissionToken)
            formData.append('authorEmail', authorEmail)

            const response = await api.post('/upload/multiple', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 60000 // 60 segundos para upload múltiplo
            })

            return response.data

        } catch (error) {
            console.error('Error uploading multiple files:', error)
            this.handleApiError(error)
            throw error
        }
    },

    /**
     * Deletar arquivo
     */
    async deleteFile(fileId, authorEmail) {
        try {
            const response = await api.delete(`/upload/${fileId}`, {
                data: {authorEmail}
            })
            return response.data
        } catch (error) {
            console.error('Error deleting file:', error)
            this.handleApiError(error)
            throw error
        }
    },

    /**
     * Buscar tipos de verbete do backend
     */
    async getVerbeteTypes() {
        try {
            const response = await api.get('/submissions/verbete-types')
            return response.data.verbeteTypes || []
        } catch (error) {
            console.error('Error fetching verbete types:', error)
            // Fallback para tipos padrão
            return ['Pessoa', 'Conceito', 'Lugar', 'Evento', 'Obra']
        }
    },

    /**
     * Buscar categorias do backend
     */
    async getCategories() {
        try {
            const response = await api.get('/categories')
            return response.data.categories || []
        } catch (error) {
            console.error('Error fetching categories:', error)
            // Fallback para categorias padrão
            return [
                'História', 'Política', 'Sociedade', 'Cultura', 'Economia',
                'Arte', 'Literatura', 'Filosofia', 'Ciência', 'Religião'
            ]
        }
    },

    /**
     * Buscar tags do backend
     */
    async getTags() {
        try {
            const response = await api.get('/tags')
            return response.data.tags || []
        } catch (error) {
            console.error('Error fetching tags:', error)
            return []
        }
    },

    /**
     * Salvar rascunho local
     */
    saveDraftLocally(formData, token = null) {
        try {
            const draftData = {
                formData,
                token,
                timestamp: new Date().toISOString(),
                version: '2.0'
            }

            const key = token ? `submission_draft_${token}` : 'submission_draft_new'
            localStorage.setItem(key, JSON.stringify(draftData))

            return {success: true}
        } catch (error) {
            console.error('Error saving draft locally:', error)
            return {success: false, error: error.message}
        }
    },

    /**
     * Carregar rascunho local
     */
    loadDraftLocally(token = null) {
        try {
            const key = token ? `submission_draft_${token}` : 'submission_draft_new'
            const draft = localStorage.getItem(key)

            if (!draft) return null

            const draftData = JSON.parse(draft)

            // Verificar se o rascunho não é muito antigo (7 dias)
            const draftAge = Date.now() - new Date(draftData.timestamp).getTime()
            const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 dias

            if (draftAge > maxAge) {
                this.clearDraftLocally(token)
                return null
            }

            return draftData.formData
        } catch (error) {
            console.error('Error loading draft locally:', error)
            return null
        }
    },

    /**
     * Limpar rascunho local
     */
    clearDraftLocally(token = null) {
        try {
            const key = token ? `submission_draft_${token}` : 'submission_draft_new'
            localStorage.removeItem(key)
        } catch (error) {
            console.error('Error clearing draft locally:', error)
        }
    },

    /**
     * Verificar status do token
     */
    async checkTokenStatus(token) {
        try {
            const response = await api.get(`/tokens/${token}/status`)
            return response.data
        } catch (error) {
            console.error('Error checking token status:', error)
            return {valid: false, error: error.message}
        }
    },

    /**
     * Tratar erros da API
     */
    handleApiError(error) {
        if (error.response) {
            const status = error.response.status
            const data = error.response.data

            console.error(`API Error ${status}:`, data)

            // Erros específicos
            if (status === 401) {
                throw new Error('Token inválido ou expirado')
            } else if (status === 403) {
                throw new Error('Acesso negado. Verifique seu email.')
            } else if (status === 404) {
                throw new Error('Submissão não encontrada')
            } else if (status === 429) {
                throw new Error('Muitas tentativas. Tente novamente em alguns minutos.')
            } else if (data?.error) {
                throw new Error(data.error)
            }
        }

        throw new Error(error.message || 'Erro de conexão com o servidor')
    }
}

export default submissionService