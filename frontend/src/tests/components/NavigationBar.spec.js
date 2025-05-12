import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NavigationBar from '@/components/NavigationBar.vue'
import { createStore } from 'vuex'
import axios from 'axios'

// Mock axios
vi.mock('axios')

// Mock api
vi.mock('@/services/api', () => ({
  default: {
    getUri: () => 'http://test-api.com'
  }
}))

// Mock Vuex store
const createVuexStore = () => {
  const store = createStore({
    modules: {
      search: {
        namespaced: true,
        state: {
          searchQuery: '',
          searchResults: []
        },
        actions: {
          setSearchQuery: vi.fn(),
          performSearch: vi.fn()
        }
      }
    }
  })

  // Spy on the dispatch method
  store.dispatch = vi.fn(store.dispatch)

  return store
}

describe('NavigationBar.vue', () => {
  let store
  let router

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup fake timers
    vi.useFakeTimers()

    // Create fresh store for each test
    store = createVuexStore()

    // Mock router
    router = {
      push: vi.fn()
    }

    // Mock axios response
    axios.get.mockResolvedValue({
      data: {
        data: [
          { id: 1, attributes: { title: 'Article 1' } },
          { id: 2, attributes: { title: 'Article 2' } }
        ]
      }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the component correctly', async () => {
    const wrapper = mount(NavigationBar, {
      global: {
        mocks: {
          $store: store,
          $router: router
        },
        stubs: {
          'v-app-bar': {
            template: '<div class="v-app-bar-stub"><slot /></div>'
          },
          'v-app-bar-nav-icon': {
            template: '<button class="v-app-bar-nav-icon-stub"></button>'
          },
          'v-toolbar-title': {
            template: '<div class="v-toolbar-title-stub"><slot /></div>'
          },
          'v-spacer': {
            template: '<div class="v-spacer-stub"></div>'
          },
          'v-text-field': {
            template: '<input class="v-text-field-stub" v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown="$emit(\'keydown\', $event)" />',
            props: ['modelValue']
          }
        }
      }
    })

    // Wait for created hook to complete
    await vi.runAllTimers()

    // Check if the component renders the logo
    expect(wrapper.find('img').exists()).toBe(true)

    // Check if the title is rendered correctly
    expect(wrapper.find('.title').text()).toContain('Trânsitos | Circulations')

    // Check if the search field is rendered
    expect(wrapper.find('.v-text-field-stub').exists()).toBe(true)
  })

  it('fetches games on creation', async () => {
    const wrapper = mount(NavigationBar, {
      global: {
        mocks: {
          $store: store,
          $router: router
        },
        stubs: {
          'v-app-bar': true,
          'v-app-bar-nav-icon': true,
          'v-toolbar-title': true,
          'v-spacer': true,
          'v-text-field': true
        }
      }
    })

    // Wait for created hook to complete
    await vi.runAllTimers()

    // Check if axios.get was called with the correct URL
    expect(axios.get).toHaveBeenCalled()

    // Check if games were set correctly
    expect(wrapper.vm.games.length).toBe(2)
    expect(wrapper.vm.games[0].title).toBe('Article 1')
    expect(wrapper.vm.games[1].title).toBe('Article 2')
  })

  it('performs search when enter key is pressed', async () => {
    const wrapper = mount(NavigationBar, {
      global: {
        mocks: {
          $store: store,
          $router: router
        },
        stubs: {
          'v-app-bar': {
            template: '<div class="v-app-bar-stub"><slot /></div>'
          },
          'v-app-bar-nav-icon': {
            template: '<button class="v-app-bar-nav-icon-stub"></button>'
          },
          'v-toolbar-title': {
            template: '<div class="v-toolbar-title-stub"><slot /></div>'
          },
          'v-spacer': {
            template: '<div class="v-spacer-stub"></div>'
          },
          'v-text-field': {
            template: '<input class="v-text-field-stub" v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown="$emit(\'keydown\', $event)" />',
            props: ['modelValue']
          }
        }
      }
    })

    // Set search query
    await wrapper.setData({ searchQuery: 'test query' })

    // Simulate enter key press
    const searchField = wrapper.find('.v-text-field-stub')
    await searchField.trigger('keydown.enter')

    // Check if store actions were dispatched
    expect(store.dispatch).toHaveBeenCalledWith('search/setSearchQuery', 'test query')
    expect(store.dispatch).toHaveBeenCalledWith('search/performSearch')

    // Check if router.push was called with the correct route
    expect(router.push).toHaveBeenCalledWith({
      name: 'Results',
      query: { q: 'test query' }
    })
  })

  it('navigates to home when logo is clicked', async () => {
    const wrapper = mount(NavigationBar, {
      global: {
        mocks: {
          $store: store,
          $router: router
        },
        stubs: {
          'v-app-bar': {
            template: '<div class="v-app-bar-stub"><slot /></div>'
          },
          'v-app-bar-nav-icon': {
            template: '<button class="v-app-bar-nav-icon-stub"></button>'
          },
          'v-toolbar-title': {
            template: '<div class="v-toolbar-title-stub"><slot /></div>'
          },
          'v-spacer': {
            template: '<div class="v-spacer-stub"></div>'
          },
          'v-text-field': {
            template: '<input class="v-text-field-stub" />'
          }
        }
      }
    })

    // Click on the logo
    await wrapper.find('.titleIcon').trigger('click')

    // Check if router.push was called with the home route
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('toggles drawer when nav icon is clicked', async () => {
    const wrapper = mount(NavigationBar, {
      global: {
        mocks: {
          $store: store,
          $router: router
        },
        stubs: {
          'v-app-bar': {
            template: '<div class="v-app-bar-stub"><slot /></div>'
          },
          'v-app-bar-nav-icon': {
            template: '<button class="v-app-bar-nav-icon-stub"></button>'
          },
          'v-toolbar-title': true,
          'v-spacer': true,
          'v-text-field': true
        }
      }
    })

    // Initial drawer state should be undefined or false
    expect(wrapper.vm.drawer).toBeFalsy()

    // Click on the nav icon
    await wrapper.find('.v-app-bar-nav-icon-stub').trigger('click')

    // Drawer should now be true
    expect(wrapper.vm.drawer).toBe(true)

    // Click again to toggle off
    await wrapper.find('.v-app-bar-nav-icon-stub').trigger('click')

    // Drawer should now be false
    expect(wrapper.vm.drawer).toBe(false)
  })
})
