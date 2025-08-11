import api from './api'

/**
 * Service for handling banner data
 */
const bannerService = {
    /**
     * Fetch banner data from the backend
     */
    async getBannerData() {
        try {
            // Fetch submissions for the banner
            const response = await api.get('/submissions', {
                params: {
                    top: 10,
                    skip: 0
                }
            })
            const submissions = response.data.data.submissions;

            // Transform the data to match the format expected by the Banner component
            const bannerItems = submissions.map(item => {
                // Get the image URL from metadata if available
                let imageUrl = ''
                if (item.metadata && item.metadata.imageUrl) {
                    const url = item.metadata.imageUrl
                    // If the URL starts with a slash, it's a relative URL and we need to add the domain
                    if (url.startsWith('/')) {
                        const baseUrl = api.defaults.baseURL.replace('/api', '')
                        imageUrl = baseUrl + url
                    } else {
                        imageUrl = url
                    }
                }

                return {
                    id: item.id,
                    src: imageUrl,
                    title: item.title,
                    subtitle: item.category || '',
                    text: item.summary || ''
                }
            })

            return bannerItems
        } catch (error) {
            console.error('Error fetching banner data:', error)
            throw error
        }
    }
}

export default bannerService
