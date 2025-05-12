import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeSection from '@/components/HomeSection.vue'

describe('HomeSection.vue', () => {
  it('renders all slots correctly', () => {
    const wrapper = mount(HomeSection, {
      slots: {
        icon: '<div class="test-icon">Icon Content</div>',
        title: '<div class="test-title">Title Content</div>',
        subtitle: '<div class="test-subtitle">Subtitle Content</div>',
        text: '<div class="test-text">Text Content</div>'
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
            props: ['cols', 'md', 'sm', 'align']
          }
        },
        mocks: {
          $vuetify: {
            display: {
              smAndUp: true
            }
          }
        }
      }
    })

    // Check if all slots are rendered
    expect(wrapper.find('.test-icon').exists()).toBe(true)
    expect(wrapper.find('.test-title').exists()).toBe(true)
    expect(wrapper.find('.test-subtitle').exists()).toBe(true)
    expect(wrapper.find('.test-text').exists()).toBe(true)

    // Check if the content is correct
    expect(wrapper.find('.test-icon').text()).toBe('Icon Content')
    expect(wrapper.find('.test-title').text()).toBe('Title Content')
    expect(wrapper.find('.test-subtitle').text()).toBe('Subtitle Content')
    expect(wrapper.find('.test-text').text()).toBe('Text Content')
  })

  it('handles responsive layout correctly for desktop', () => {
    const wrapper = mount(HomeSection, {
      slots: {
        icon: '<div class="test-icon">Icon</div>',
        title: '<div class="test-title">Title</div>'
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
            props: ['cols', 'md', 'sm', 'align']
          }
        },
        mocks: {
          $vuetify: {
            display: {
              smAndUp: true
            }
          }
        }
      }
    })

    // For desktop, we just verify that the slots are rendered
    expect(wrapper.html()).toContain('Icon')
    expect(wrapper.html()).toContain('Title')
  })

  it('handles responsive layout correctly for mobile', () => {
    const wrapper = mount(HomeSection, {
      slots: {
        icon: '<div class="test-icon">Icon</div>',
        title: '<div class="test-title">Title</div>'
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
            props: ['cols', 'md', 'sm', 'align']
          }
        },
        mocks: {
          $vuetify: {
            display: {
              smAndUp: false
            }
          }
        }
      }
    })

    // For mobile, we just verify that the slots are rendered
    expect(wrapper.html()).toContain('Icon')
    expect(wrapper.html()).toContain('Title')
  })
})
