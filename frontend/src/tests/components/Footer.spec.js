import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Footer from '@/components/Footer.vue'

describe('Footer.vue', () => {
  it('renders the footer correctly', () => {
    const wrapper = mount(Footer, {
      global: {
        stubs: {
          'v-footer': {
            template: '<div class="v-footer-stub"><slot /></div>'
          }
        }
      }
    })

    // Check if the component renders the footer
    const footer = wrapper.find('.v-footer-stub')
    expect(footer.exists()).toBe(true)

    // Check if the heading is rendered
    const heading = wrapper.find('h2')
    expect(heading.text()).toBe('Sobre nós')

    // Check if the paragraph is rendered
    const paragraph = wrapper.find('p')
    expect(paragraph.exists()).toBe(true)
    expect(paragraph.text()).toContain('O projeto é coordenado por')
  })

  it('has the correct CSS classes', () => {
    const wrapper = mount(Footer, {
      global: {
        stubs: {
          'v-footer': {
            template: '<div class="v-footer-stub"><slot /></div>'
          }
        }
      }
    })

    // Check if the footer has the correct class
    const footer = wrapper.find('.v-footer-stub')
    expect(footer.classes()).toContain('footer')
  })
})
