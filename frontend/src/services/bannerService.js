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
      // Fetch person-articles for the banner
      const response = await api.get('/person-articles', {
        params: {
          populate: ['Image']
        }
      })

      // Transform the data to match the format expected by the Banner component
      const bannerItems = response.data.data.map(item => {
        const attributes = item.attributes

        // Get the image URL and ensure it has the full domain if it's a relative URL
        let imageUrl = ''
        if (attributes.Image && attributes.Image.data && attributes.Image.data.length > 0) {
          const url = attributes.Image.data[0].attributes.url
          // If the URL starts with a slash, it's a relative URL and we need to add the domain
          if (url.startsWith('/')) {
            const baseUrl = api.defaults.baseURL.replace('/api', '')
            imageUrl = baseUrl + url
          } else {
            imageUrl = url
          }
        }

        return {
          src: imageUrl,
          title: attributes.title,
          subtitle: attributes.alternativeTitles || '',
          text: attributes.summary || ''
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
