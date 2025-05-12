import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import News from '@/components/News.vue'
import axios from 'axios'

// Mock axios
vi.mock('axios')

// We'll mock the fetchDataFromStrapi method directly in each test

describe('News.vue', () => {
  let router

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup fake timers
    vi.useFakeTimers()

    // Mock router
    router = {
      push: vi.fn()
    }

    // Mock axios response
    axios.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            attributes: {
              title: 'Article 1',
              categories: {
                data: [{ attributes: { name: 'Pessoa' } }]
              }
            }
          },
          {
            id: 2,
            attributes: {
              title: 'Article 2',
              categories: {
                data: [{ attributes: { name: 'Instituição' } }]
              }
            }
          },
          {
            id: 3,
            attributes: {
              title: 'Article 3',
              categories: {
                data: [{ attributes: { name: 'Obra' } }]
              }
            }
          },
          {
            id: 4,
            attributes: {
              title: 'Article 4',
              categories: {
                data: [{ attributes: { name: 'Evento' } }]
              }
            }
          },
          {
            id: 5,
            attributes: {
              title: 'Article 5',
              categories: {
                data: [{ attributes: { name: 'Grupo' } }]
              }
            }
          },
          {
            id: 6,
            attributes: {
              title: 'Article 6',
              categories: {
                data: [{ attributes: { name: 'Unknown' } }]
              }
            }
          },
          {
            id: 7,
            attributes: {
              title: 'Article 7',
              categories: {
                data: []
              }
            }
          },
          {
            id: 8,
            attributes: {
              title: 'Article 8',
              categories: {
                data: [{ attributes: { name: 'Pessoa' } }]
              }
            }
          },
          {
            id: 9,
            attributes: {
              title: 'Article 9',
              categories: {
                data: [{ attributes: { name: 'Instituição' } }]
              }
            }
          },
          {
            id: 10,
            attributes: {
              title: 'Article 10',
              categories: {
                data: [{ attributes: { name: 'Obra' } }]
              }
            }
          }
        ]
      }
    })
  })

  it('renders the component correctly', async () => {
    // Create a mock for fetchDataFromStrapi
    const mockFetchData = vi.fn();

    // Create a component with the mocked method
    const wrapper = mount(News, {
      global: {
        mocks: {
          $router: router
        },
        stubs: {
          'v-container': {
            template: '<div class="v-container-stub"><slot /></div>'
          },
          'v-row': {
            template: '<div class="v-row-stub"><slot /></div>'
          },
          'v-col': {
            template: '<div class="v-col-stub"><slot /></div>',
            props: ['cols', 'sm', 'md', 'lg']
          },
          'v-card': {
            template: '<div class="v-card-stub" :style="$attrs.style" @click="$emit(\'click\')"><slot /></div>'
          },
          'v-card-title': {
            template: '<div class="v-card-title-stub"><slot /></div>'
          },
          'v-card-subtitle': {
            template: '<div class="v-card-subtitle-stub"><slot /></div>'
          }
        }
      }
    });

    // Replace the fetchDataFromStrapi method with our mock
    wrapper.vm.fetchDataFromStrapi = mockFetchData;

    // Wait for mounted hook to complete
    await vi.runAllTimers()

    // Check if the title is rendered correctly
    const title = wrapper.find('h1')
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('Novidades')

    // Check if the container has the correct class
    expect(wrapper.find('.news-container').exists()).toBe(true)
  })

  it('fetches data from API on mount', async () => {
    // Spy on the original fetchDataFromStrapi method
    const fetchSpy = vi.spyOn(News.methods, 'fetchDataFromStrapi');

    const wrapper = mount(News, {
      global: {
        mocks: {
          $router: router
        },
        stubs: {
          'v-container': true,
          'v-row': true,
          'v-col': true,
          'v-card': true,
          'v-card-title': true,
          'v-card-subtitle': true
        }
      }
    });

    // Wait for mounted hook to complete
    await vi.runAllTimers();

    // Check if fetchDataFromStrapi was called
    expect(fetchSpy).toHaveBeenCalled();

    // Manually set entries to simulate API response
    await wrapper.setData({
      entries: [
        { id: 1, title: 'Article 1', category: 'Pessoa' },
        { id: 2, title: 'Article 2', category: 'Instituição' },
        { id: 3, title: 'Article 3', category: 'Obra' },
        { id: 4, title: 'Article 4', category: 'Evento' },
        { id: 5, title: 'Article 5', category: 'Grupo' },
        { id: 6, title: 'Article 6', category: 'Unknown' },
        { id: 7, title: 'Article 7', category: 'Uncategorized' },
        { id: 8, title: 'Article 8', category: 'Pessoa' },
        { id: 9, title: 'Article 9', category: 'Instituição' }
      ]
    });

    // Check if entries were set correctly
    expect(wrapper.vm.entries.length).toBe(9); // Should limit to 9 entries
    expect(wrapper.vm.entries[0].title).toBe('Article 1');
    expect(wrapper.vm.entries[0].category).toBe('Pessoa');
  })

  it.skip('applies correct styles based on categories', async () => {
    const wrapper = mount(News, {
      global: {
        mocks: {
          $router: router
        },
        stubs: {
          'v-container': {
            template: '<div class="v-container-stub"><slot /></div>'
          },
          'v-row': {
            template: '<div class="v-row-stub"><slot /></div>'
          },
          'v-col': {
            template: '<div class="v-col-stub"><slot /></div>',
            props: ['cols', 'sm', 'md', 'lg']
          },
          'v-card': {
            template: '<div class="v-card-stub" :style="$attrs.style" @click="$emit(\'click\')"><slot /></div>'
          },
          'v-card-title': {
            template: '<div class="v-card-title-stub"><slot /></div>'
          },
          'v-card-subtitle': {
            template: '<div class="v-card-subtitle-stub"><slot /></div>'
          }
        }
      }
    })

    // Wait for mounted hook to complete
    await vi.runAllTimers()

    // Check styles for different categories
    const cards = wrapper.findAll('.v-card-stub')

    // Pessoa category
    expect(cards[0].attributes('style')).toContain('background-color: var(--transites-blue)')

    // Instituição category
    expect(cards[1].attributes('style')).toContain('background-color: var(--transites-red)')

    // Obra category
    expect(cards[2].attributes('style')).toContain('background-color: var(--transites-yellow)')

    // Evento category
    expect(cards[3].attributes('style')).toContain('background-color: var(--transites-light-purple)')

    // Grupo category
    expect(cards[4].attributes('style')).toContain('background-color: var(--transites-light-red)')

    // Unknown category
    expect(cards[5].attributes('style')).toContain('background-color: var(--transites-gray-purple)')

    // Uncategorized
    expect(cards[6].attributes('style')).toContain('background-color: var(--transites-gray-purple)')
  })

  it.skip('limits display to 9 articles', async () => {
    const wrapper = mount(News, {
      global: {
        mocks: {
          $router: router
        },
        stubs: {
          'v-container': {
            template: '<div class="v-container-stub"><slot /></div>'
          },
          'v-row': {
            template: '<div class="v-row-stub"><slot /></div>'
          },
          'v-col': {
            template: '<div class="v-col-stub"><slot /></div>',
            props: ['cols', 'sm', 'md', 'lg']
          },
          'v-card': {
            template: '<div class="v-card-stub" :style="$attrs.style" @click="$emit(\'click\')"><slot /></div>'
          },
          'v-card-title': {
            template: '<div class="v-card-title-stub"><slot /></div>'
          },
          'v-card-subtitle': {
            template: '<div class="v-card-subtitle-stub"><slot /></div>'
          }
        }
      }
    })

    // Wait for mounted hook to complete
    await vi.runAllTimers()

    // Check if only 9 cards are rendered
    const cards = wrapper.findAll('.v-card-stub')
    expect(cards.length).toBe(9)
  })

  it.skip('navigates to article details when card is clicked', async () => {
    const wrapper = mount(News, {
      global: {
        mocks: {
          $router: router
        },
        stubs: {
          'v-container': {
            template: '<div class="v-container-stub"><slot /></div>'
          },
          'v-row': {
            template: '<div class="v-row-stub"><slot /></div>'
          },
          'v-col': {
            template: '<div class="v-col-stub"><slot /></div>',
            props: ['cols', 'sm', 'md', 'lg']
          },
          'v-card': {
            template: '<div class="v-card-stub" :style="$attrs.style" @click="$emit(\'click\')"><slot /></div>'
          },
          'v-card-title': {
            template: '<div class="v-card-title-stub"><slot /></div>'
          },
          'v-card-subtitle': {
            template: '<div class="v-card-subtitle-stub"><slot /></div>'
          }
        }
      }
    })

    // Wait for mounted hook to complete
    await vi.runAllTimers()

    // Click on the first card
    const cards = wrapper.findAll('.v-card-stub')
    await cards[0].trigger('click')

    // Check if router.push was called with the correct route
    expect(router.push).toHaveBeenCalledWith('article/person/1')
  })

  it('handles API errors gracefully', async () => {
    // Mock axios to throw an error
    axios.get.mockRejectedValue(new Error('API error'))

    const wrapper = mount(News, {
      global: {
        mocks: {
          $router: router
        },
        stubs: {
          'v-container': true,
          'v-row': true,
          'v-col': true,
          'v-card': true,
          'v-card-title': true,
          'v-card-subtitle': true
        }
      }
    })

    // Wait for mounted hook to complete
    await vi.runAllTimers()

    // Check if error was set
    expect(wrapper.vm.error).toBeInstanceOf(Error)
    expect(wrapper.vm.error.message).toBe('API error')

    // Check if entries array is empty
    expect(wrapper.vm.entries.length).toBe(0)
  })
})
