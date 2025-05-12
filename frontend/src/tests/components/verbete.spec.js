import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Verbete from '@/components/verbete.vue'
import axios from 'axios'

// Mock axios
vi.mock('axios')

// Mock import.meta.env
vi.mock('import.meta', () => ({
  env: {
    VITE_STRAPI_BASE_URL: 'http://test-api.com'
  }
}))

describe('verbete.vue', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup fake timers
    vi.useFakeTimers()

    // Mock axios response
    axios.get.mockResolvedValue({
      data: {
        data: {
          id: 1,
          attributes: {
            title: 'Test Verbete',
            summary: '<p>This is a test summary</p>',
            image: {
              data: {
                attributes: {
                  url: 'http://test-api.com/uploads/test-image.jpg'
                }
              }
            },
            categories: {
              data: [
                {
                  attributes: {
                    name: 'Test Category'
                  }
                }
              ]
            },
            authors: {
              data: [
                {
                  id: 1,
                  attributes: {
                    name: 'Test Author'
                  }
                }
              ]
            },
            tags: {
              data: [
                {
                  id: 1,
                  attributes: {
                    name: 'Test Tag'
                  }
                }
              ]
            },
            sections: [
              {
                id: 1,
                __component: 'section.text',
                content: 'Test Section Content'
              }
            ]
          }
        }
      }
    })
  })

  it('renders the component correctly with fetched data', async () => {
    const wrapper = mount(Verbete, {
      props: {
        id: '1'
      },
      global: {
        stubs: {
          'v-container': {
            template: '<div class="v-container-stub"><slot /></div>'
          },
          'v-row': {
            template: '<div class="v-row-stub"><slot /></div>'
          },
          'v-col': {
            template: '<div class="v-col-stub"><slot /></div>',
            props: ['cols', 'md']
          },
          'v-card': {
            template: '<div class="v-card-stub"><slot /></div>'
          },
          'v-img': {
            template: '<div class="v-img-stub" :src="src"><slot /></div>',
            props: ['src']
          },
          'v-card-title': {
            template: '<div class="v-card-title-stub"><slot /></div>'
          },
          'v-card-subtitle': {
            template: '<div class="v-card-subtitle-stub"><slot /></div>'
          },
          'v-card-text': {
            template: '<div class="v-card-text-stub"><slot /></div>'
          },
          'v-divider': {
            template: '<hr class="v-divider-stub" />'
          },
          'v-list': {
            template: '<div class="v-list-stub"><slot /></div>'
          },
          'v-list-item': {
            template: '<div class="v-list-item-stub"><slot /></div>'
          },
          'v-list-item-content': {
            template: '<div class="v-list-item-content-stub"><slot /></div>'
          },
          'v-list-item-title': {
            template: '<div class="v-list-item-title-stub"><slot /></div>'
          },
          'component': true
        }
      }
    })

    // Wait for mounted hook to complete
    await vi.runAllTimers()

    // Check if the API call was made
    expect(axios.get).toHaveBeenCalled()

    // Check if the title is set correctly in the component data
    expect(wrapper.vm.verbete.title).toBe('Test Verbete')

    // Check if the category is set correctly in the component data
    expect(wrapper.vm.verbete.category).toBe('Test Category')

    // Check if the summary is set correctly in the component data
    expect(wrapper.vm.verbete.summary).toBe('<p>This is a test summary</p>')

    // Check if the image URL is set correctly in the component data
    expect(wrapper.vm.verbete.imageUrl).toBe('http://test-api.com/uploads/test-image.jpg')

    // Check if the authors are set correctly in the component data
    expect(wrapper.vm.verbete.authors.length).toBe(1)
    expect(wrapper.vm.verbete.authors[0].attributes.name).toBe('Test Author')

    // Check if the tags are set correctly in the component data
    expect(wrapper.vm.verbete.tags.length).toBe(1)
    expect(wrapper.vm.verbete.tags[0].attributes.name).toBe('Test Tag')
  })

  it('handles missing image data', async () => {
    // Mock axios response with missing image data
    axios.get.mockResolvedValue({
      data: {
        data: {
          id: 1,
          attributes: {
            title: 'Test Verbete',
            summary: '<p>This is a test summary</p>',
            image: {
              data: null
            },
            categories: {
              data: [
                {
                  attributes: {
                    name: 'Test Category'
                  }
                }
              ]
            },
            authors: {
              data: []
            },
            tags: {
              data: []
            },
            sections: []
          }
        }
      }
    })

    const wrapper = mount(Verbete, {
      props: {
        id: '1'
      },
      global: {
        stubs: {
          'v-container': true,
          'v-row': true,
          'v-col': true,
          'v-card': true,
          'v-img': {
            template: '<div class="v-img-stub" :src="src"><slot /></div>',
            props: ['src']
          },
          'v-card-title': true,
          'v-card-subtitle': true,
          'v-card-text': true,
          'v-divider': true,
          'v-list': true,
          'v-list-item': true,
          'v-list-item-content': true,
          'v-list-item-title': true,
          'component': true
        }
      }
    })

    // Wait for mounted hook to complete
    await vi.runAllTimers()

    // Check if the image URL is empty in the component data
    expect(wrapper.vm.verbete.imageUrl).toBe('')
  })

  it('handles missing category data', async () => {
    // Mock axios response with missing category data
    axios.get.mockResolvedValue({
      data: {
        data: {
          id: 1,
          attributes: {
            title: 'Test Verbete',
            summary: '<p>This is a test summary</p>',
            image: {
              data: {
                attributes: {
                  url: 'http://test-api.com/uploads/test-image.jpg'
                }
              }
            },
            categories: {
              data: []
            },
            authors: {
              data: []
            },
            tags: {
              data: []
            },
            sections: []
          }
        }
      }
    })

    const wrapper = mount(Verbete, {
      props: {
        id: '1'
      },
      global: {
        stubs: {
          'v-container': true,
          'v-row': true,
          'v-col': true,
          'v-card': true,
          'v-img': true,
          'v-card-title': true,
          'v-card-subtitle': {
            template: '<div class="v-card-subtitle-stub"><slot /></div>'
          },
          'v-card-text': true,
          'v-divider': true,
          'v-list': true,
          'v-list-item': true,
          'v-list-item-content': true,
          'v-list-item-title': true,
          'component': true
        }
      }
    })

    // Wait for mounted hook to complete
    await vi.runAllTimers()

    // Check if the category is set to 'Uncategorized'
    expect(wrapper.vm.verbete.category).toBe('Uncategorized')
  })

  it('handles API errors gracefully', async () => {
    // Mock console.error to prevent actual error output during tests
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Mock axios to throw an error
    axios.get.mockRejectedValue(new Error('API error'))

    const wrapper = mount(Verbete, {
      props: {
        id: '1'
      },
      global: {
        stubs: {
          'v-container': true,
          'v-row': true,
          'v-col': true,
          'v-card': true,
          'v-img': true,
          'v-card-title': true,
          'v-card-subtitle': true,
          'v-card-text': true,
          'v-divider': true,
          'v-list': true,
          'v-list-item': true,
          'v-list-item-content': true,
          'v-list-item-title': true,
          'component': true
        }
      }
    })

    // Wait for mounted hook to complete
    await vi.runAllTimers()

    // Check if console.error was called with the error
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching verbete:', expect.any(Error))

    // Check if the verbete data remains in its initial state
    expect(wrapper.vm.verbete.title).toBe('')
    expect(wrapper.vm.verbete.summary).toBe('')
    expect(wrapper.vm.verbete.imageUrl).toBe('')
    expect(wrapper.vm.verbete.category).toBe('')
    expect(wrapper.vm.verbete.authors).toEqual([])
    expect(wrapper.vm.verbete.tags).toEqual([])
    expect(wrapper.vm.verbete.sections).toEqual([])

    // Clean up
    consoleErrorSpy.mockRestore()
  })
})
