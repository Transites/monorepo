import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ArticleBody from '@/components/ArticleBody.vue'

describe('ArticleBody.vue', () => {
  it('renders the component correctly with all slots', async () => {
    const wrapper = mount(ArticleBody, {
      slots: {
        'side-panel-header': '<div class="test-header">Header Content</div>',
        'side-panel-body': '<div class="test-body">Body Content</div>',
        default: '<div class="test-default">Default Content</div>'
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
            props: ['cols', 'md', 'lg', 'sm']
          },
          'v-divider': {
            template: '<hr class="v-divider-stub" />',
            props: ['thickness', 'color']
          }
        }
      }
    })

    // Wait for the mounted hook to complete
    await wrapper.vm.$nextTick()

    // Check if all slots are rendered
    expect(wrapper.find('.test-header').exists()).toBe(true)
    expect(wrapper.find('.test-body').exists()).toBe(true)
    expect(wrapper.find('.test-default').exists()).toBe(true)

    // Check if the divider is shown when side panel has content
    expect(wrapper.find('.v-divider-stub').exists()).toBe(true)
  })

  it('does not show divider when side panel is empty', async () => {
    const wrapper = mount(ArticleBody, {
      slots: {
        'side-panel-header': '<div class="test-header">Header Content</div>',
        'side-panel-body': '',  // Empty side panel body
        default: '<div class="test-default">Default Content</div>'
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
            props: ['cols', 'md', 'lg', 'sm']
          },
          'v-divider': {
            template: '<hr class="v-divider-stub" />',
            props: ['thickness', 'color']
          }
        }
      }
    })

    // Check if the divider is not shown when side panel is empty
    expect(wrapper.find('.v-divider-stub').exists()).toBe(false)
  })

  it('renders without side-panel-header slot', async () => {
    const wrapper = mount(ArticleBody, {
      slots: {
        'side-panel-body': '<div class="test-body">Body Content</div>',
        default: '<div class="test-default">Default Content</div>'
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
            props: ['cols', 'md', 'lg', 'sm']
          },
          'v-divider': {
            template: '<hr class="v-divider-stub" />',
            props: ['thickness', 'color']
          }
        }
      }
    })

    // Check if the component renders without the side-panel-header slot
    expect(wrapper.find('.test-header').exists()).toBe(false)
    expect(wrapper.find('.test-body').exists()).toBe(true)
    expect(wrapper.find('.test-default').exists()).toBe(true)
  })
})
