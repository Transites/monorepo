import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NormasdePublicacao from '@/components/NormasdePublicacao.vue'

describe('NormasdePublicacao.vue', () => {
  it('renders the component correctly', () => {
    const wrapper = mount(NormasdePublicacao, {
      global: {
        stubs: {
          'v-card': {
            template: '<div class="v-card-stub"><slot /></div>'
          }
        }
      }
    })

    // Check if the title is rendered correctly
    const title = wrapper.find('.normasTitle')
    expect(title.exists()).toBe(true)
    expect(title.text()).toContain('Trânsitos | Circulations')

    // Check if the subtitle is rendered correctly
    const subtitle = wrapper.find('.normasSubtitle')
    expect(subtitle.exists()).toBe(true)
    expect(subtitle.text()).toBe('Normas de Publicação')

    // Check if the container has the correct class
    expect(wrapper.find('.normasContainer').exists()).toBe(true)

    // Check if the content sections are rendered
    const textSections = wrapper.findAll('.normasText')
    expect(textSections.length).toBeGreaterThan(0)

    // Check if specific content is present
    expect(wrapper.text()).toContain('Os verbetes terão no máximo 3 páginas')
    expect(wrapper.text()).toContain('O cabeçalho deve conter as seguintes informações')
    expect(wrapper.text()).toContain('Pular uma linha após o cabeçalho')
    expect(wrapper.text()).toContain('ATENÇÃO')
    expect(wrapper.text()).toContain('O modelo de nossos verbetes')
    expect(wrapper.text()).toContain('Padrão de indicação bibliográfica')
  })

  it('applies default padding when no prop is provided', () => {
    const wrapper = mount(NormasdePublicacao, {
      global: {
        stubs: {
          'v-card': {
            template: '<div class="v-card-stub"><slot /></div>'
          }
        }
      }
    })

    // Check if the default padding is applied
    const container = wrapper.find('.normasContainer')
    expect(container.attributes('style')).toContain('padding: 70px 5% 30px 5%')
  })

  it('applies custom padding when prop is provided', () => {
    const customPadding = '20px 10px'
    const wrapper = mount(NormasdePublicacao, {
      props: {
        propPadding: customPadding
      },
      global: {
        stubs: {
          'v-card': {
            template: '<div class="v-card-stub"><slot /></div>'
          }
        }
      }
    })

    // Check if the custom padding is applied
    const container = wrapper.find('.normasContainer')
    expect(container.attributes('style')).toContain(`padding: ${customPadding}`)
  })

  it('has the correct CSS classes and styles', () => {
    const wrapper = mount(NormasdePublicacao, {
      global: {
        stubs: {
          'v-card': {
            template: '<div class="v-card-stub"><slot /></div>'
          }
        }
      }
    })

    // Check if the container has the correct class
    const container = wrapper.find('.normasContainer')
    expect(container.exists()).toBe(true)

    // Check if the card has the correct class
    const card = wrapper.find('.normasCard')
    expect(card.exists()).toBe(true)

    // Check if the content has the correct class
    const content = wrapper.find('.normasContent')
    expect(content.exists()).toBe(true)

    // Check if the title has the correct class
    const title = wrapper.find('.normasTitle')
    expect(title.exists()).toBe(true)

    // Check if the subtitle has the correct class
    const subtitle = wrapper.find('.normasSubtitle')
    expect(subtitle.exists()).toBe(true)

    // Check if the text has the correct class
    const text = wrapper.find('.normasText')
    expect(text.exists()).toBe(true)
  })
})
