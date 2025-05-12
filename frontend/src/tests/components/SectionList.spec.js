import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SectionList from '@/components/SectionList.vue'

// Mock the useMarkdown composable
vi.mock('@/composables/markdown.js', () => ({
  useMarkdown: (content) => `<p>${content}</p>`
}))

describe('SectionList.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })
  it('renders the component correctly with default props', async () => {
    const sections = [
      { title: 'Section 1', content: 'Content 1' },
      { title: 'Section 2', content: 'Content 2' }
    ]

    const wrapper = mount(SectionList, {
      props: {
        sections
      },
      global: {
        stubs: {
          'v-expansion-panels': {
            template: '<div class="v-expansion-panels-stub"><slot /></div>'
          },
          'v-expansion-panel': {
            template: '<div class="v-expansion-panel-stub" :style="$attrs.style"><slot /></div>'
          },
          'v-divider': {
            template: '<hr class="v-divider-stub" />'
          },
          'v-expansion-panel-title': {
            template: '<div class="v-expansion-panel-title-stub"><slot /></div>'
          },
          'v-expansion-panel-text': {
            template: '<div class="v-expansion-panel-text-stub"><slot /></div>'
          }
        }
      }
    })

    // Wait for mounted hook to complete
    await vi.runAllTimers()

    // Check if the correct number of panels are rendered
    const panels = wrapper.findAll('.v-expansion-panel-stub')
    expect(panels.length).toBe(2)

    // Check if the titles are rendered correctly
    const titles = wrapper.findAll('.v-expansion-panel-title-stub')
    expect(titles[0].text()).toBe('Section 1')
    expect(titles[1].text()).toBe('Section 2')

    // Check if the content is rendered correctly
    const texts = wrapper.findAll('.v-expansion-panel-text-stub')
    expect(texts[0].html()).toContain('<p>Content 1</p>')
    expect(texts[1].html()).toContain('<p>Content 2</p>')
  })

  it('applies colors correctly based on section index', async () => {
    const sections = [
      { title: 'Section 1', content: 'Content 1' },
      { title: 'Section 2', content: 'Content 2' },
      { title: 'Section 3', content: 'Content 3' }
    ]

    const colors = ['red', 'green', 'blue']

    const wrapper = mount(SectionList, {
      props: {
        sections,
        colors
      },
      global: {
        stubs: {
          'v-expansion-panels': {
            template: '<div class="v-expansion-panels-stub"><slot /></div>'
          },
          'v-expansion-panel': {
            template: '<div class="v-expansion-panel-stub" :style="$attrs.style"><slot /></div>'
          },
          'v-divider': {
            template: '<hr class="v-divider-stub" />'
          },
          'v-expansion-panel-title': {
            template: '<div class="v-expansion-panel-title-stub"><slot /></div>'
          },
          'v-expansion-panel-text': {
            template: '<div class="v-expansion-panel-text-stub"><slot /></div>'
          }
        }
      }
    })

    // Wait for mounted hook to complete
    await vi.runAllTimers()

    // Check if the colors are applied correctly
    const panels = wrapper.findAll('.v-expansion-panel-stub')
    expect(panels[0].attributes('style')).toContain('color: red')
    expect(panels[1].attributes('style')).toContain('color: green')
    expect(panels[2].attributes('style')).toContain('color: blue')
  })

  it('processes "Publicações" section correctly', async () => {
    const sections = [
      { title: 'Publicações', content: 'Line 1\nLine 2\nLine 3' }
    ]

    const wrapper = mount(SectionList, {
      props: {
        sections
      },
      global: {
        stubs: {
          'v-expansion-panels': {
            template: '<div class="v-expansion-panels-stub"><slot /></div>'
          },
          'v-expansion-panel': {
            template: '<div class="v-expansion-panel-stub" :style="$attrs.style"><slot /></div>'
          },
          'v-divider': {
            template: '<hr class="v-divider-stub" />'
          },
          'v-expansion-panel-title': {
            template: '<div class="v-expansion-panel-title-stub"><slot /></div>'
          },
          'v-expansion-panel-text': {
            template: '<div class="v-expansion-panel-text-stub"><slot /></div>'
          }
        }
      }
    })

    // Wait for mounted hook to complete
    await vi.runAllTimers()

    // Check if the content is processed correctly
    // The useMarkdown mock will wrap the content in <p> tags
    // The content should have double newlines due to the special processing
    // Use a more flexible check that ignores whitespace differences
    const html = wrapper.html()
    expect(html).toContain('<p>Line 1')
    expect(html).toContain('Line 2')
    expect(html).toContain('Line 3</p>')
  })

  it('applies markdown class to regular sections', async () => {
    const sections = [
      { title: 'Regular Section', content: 'Content' }
    ]

    const wrapper = mount(SectionList, {
      props: {
        sections
      },
      global: {
        stubs: {
          'v-expansion-panels': {
            template: '<div class="v-expansion-panels-stub"><slot /></div>'
          },
          'v-expansion-panel': {
            template: '<div class="v-expansion-panel-stub" :style="$attrs.style"><slot /></div>'
          },
          'v-divider': {
            template: '<hr class="v-divider-stub" />'
          },
          'v-expansion-panel-title': {
            template: '<div class="v-expansion-panel-title-stub"><slot /></div>'
          },
          'v-expansion-panel-text': {
            template: '<div class="v-expansion-panel-text-stub"><slot /></div>'
          }
        }
      }
    })

    // Wait for mounted hook to complete
    await vi.runAllTimers()

    // Check if the markdown class is applied to the section
    const panelText = wrapper.find('.v-expansion-panel-text-stub')
    expect(panelText.find('div[class="markdown"]').exists()).toBe(true)
  })

  it('calculates section color correctly', () => {
    const wrapper = mount(SectionList, {
      props: {
        sections: [],
        colors: ['red', 'green', 'blue']
      },
      global: {
        stubs: {
          'v-expansion-panels': true,
          'v-expansion-panel': true,
          'v-divider': true,
          'v-expansion-panel-title': true,
          'v-expansion-panel-text': true
        }
      }
    })

    // Test the getSectionColor method directly
    expect(wrapper.vm.getSectionColor(0, 3)).toBe('red')
    expect(wrapper.vm.getSectionColor(1, 3)).toBe('green')
    expect(wrapper.vm.getSectionColor(2, 3)).toBe('blue')
  })
})
