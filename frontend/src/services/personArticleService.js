import api from './api'

/**
 * Service for handling person articles
 */
const personArticleService = {

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

            console.log('3. Final payload:', articleData)
            console.log('4. Default headers:', api.defaults.headers)

            // Make the request to the person-articles endpoint
            const response = await api.post('/submissions', articleData)
            console.log('5. API response:', response.data)
            console.log('6. Complete URL:', api.defaults.baseURL + '/submissions')

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
            console.log('saveDraft input:', formData)
            localStorage.setItem('personArticleDraft', JSON.stringify(formData))
            return {success: true}
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
        console.log('all input properties: ')
        console.log(Object.keys(formData).map(key => `${key}: ${formData[key]}`))

        const data = {
            author_name: formData.authorName,
            author_email: formData.authorEmail,
            author_institution: formData.authorInstitution || '',
            title: formData.title,
            summary: formData.summary,
            content: formData.content,
            keywords: formData.tags || [],
            category: formData.category,
        }

        const metadata = {type: formData.type};

        switch (formData.type) {
            case 'person':
                metadata.birth = {
                    date: formData.birth || '',
                    location: formData.birthLocation || ''
                };
                break;
            case 'institution':
                metadata.institution = {
                    ...formData.foundation
                };
                break;
            case 'work':
                metadata.work = {
                    creation: {
                        date: formData.creation || '',
                        location: formData.creationLocation || '',
                        author: formData.author || ''
                    },
                };
                break;
            case 'event':
                metadata.event = {
                    start: {
                        date: formData.start || '',
                        location: formData.startLocation || ''
                    },
                    end: {
                        date: formData.end || '',
                        location: formData.endLocation || ''
                    },
                    organizer: formData.organizer || ''
                };
                break;

        }

        if (formData.bibliography) {
            metadata.bibliography = typeof formData.bibliography === 'string'
                ? formData.bibliography
                : JSON.stringify(formData.bibliography)
        }

        data.metadata = metadata;
        console.log('prepareArticleData output:', data)
        return data
    }
}

export default personArticleService