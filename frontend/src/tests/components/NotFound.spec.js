import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NotFound from '@/components/NotFound.vue'

describe('NotFound.vue', () => {
  it('renders the component correctly with default props', () => {
    const wrapper = mount(NotFound, {
      global: {
        mocks: {
          $router: {
            push: vi.fn()
          },
          $vuetify: {
            display: {
              xs: false
            }
          }
        },
        stubs: {
          'v-card': {
            template: '<div class="v-card-stub"><slot /></div>'
          },
          'v-card-item': {
            template: '<div class="v-card-item-stub"><slot /></div>'
          },
          'v-card-title': {
            template: '<div class="v-card-title-stub"><slot /></div>'
          },
          'v-card-text': {
            template: '<div class="v-card-text-stub"><slot /></div>'
          },
          'v-card-actions': {
            template: '<div class="v-card-actions-stub"><slot /></div>'
          },
          'v-btn': {
            template: '<button class="v-btn-stub" @click="$emit(\'click\')"><slot /></button>'
          },
          'v-icon': {
            template: '<i class="v-icon-stub"><slot /></i>'
          }
        }
      }
    })

    // Check if the error code is rendered correctly
    expect(wrapper.text()).toContain('404')

    // Check if the error text is rendered correctly
    expect(wrapper.text()).toContain('Página não encontrada')

    // Check if the button text is rendered correctly
    expect(wrapper.text()).toContain('Voltar para a página inicial')

    // Check if the component has the center class
    expect(wrapper.classes()).toContain('center')
  })

  it('renders the component correctly with custom props', () => {
    const wrapper = mount(NotFound, {
      props: {
        color: 'blue',
        icon: 'mdi-error',
        code: 500,
        text: 'Server Error',
        buttonText: 'Try Again',
        center: false
      },
      global: {
        mocks: {
          $router: {
            push: vi.fn()
          },
          $vuetify: {
            display: {
              xs: false
            }
          }
        },
        stubs: {
          'v-card': {
            template: '<div class="v-card-stub"><slot /></div>'
          },
          'v-card-item': {
            template: '<div class="v-card-item-stub"><slot /></div>'
          },
          'v-card-title': {
            template: '<div class="v-card-title-stub"><slot /></div>'
          },
          'v-card-text': {
            template: '<div class="v-card-text-stub"><slot /></div>'
          },
          'v-card-actions': {
            template: '<div class="v-card-actions-stub"><slot /></div>'
          },
          'v-btn': {
            template: '<button class="v-btn-stub" @click="$emit(\'click\')"><slot /></button>'
          },
          'v-icon': {
            template: '<i class="v-icon-stub"><slot /></i>'
          }
        }
      }
    })

    // Check if the error code is rendered correctly
    expect(wrapper.text()).toContain('500')

    // Check if the error text is rendered correctly
    expect(wrapper.text()).toContain('Server Error')

    // Check if the button text is rendered correctly
    expect(wrapper.text()).toContain('Try Again')

    // Check if the component does not have the center class
    expect(wrapper.classes()).not.toContain('center')

    // Check if the color is applied correctly
    expect(wrapper.vm.propStyle['--prop-color']).toBe('blue')
  })

  it('calls the default button callback when button is clicked', async () => {
    const routerPush = vi.fn()

    const wrapper = mount(NotFound, {
      global: {
        mocks: {
          $router: {
            push: routerPush
          },
          $vuetify: {
            display: {
              xs: false
            }
          }
        },
        stubs: {
          'v-card': {
            template: '<div class="v-card-stub"><slot /></div>'
          },
          'v-card-item': {
            template: '<div class="v-card-item-stub"><slot /></div>'
          },
          'v-card-title': {
            template: '<div class="v-card-title-stub"><slot /></div>'
          },
          'v-card-text': {
            template: '<div class="v-card-text-stub"><slot /></div>'
          },
          'v-card-actions': {
            template: '<div class="v-card-actions-stub"><slot /></div>'
          },
          'v-btn': {
            template: '<button class="v-btn-stub" @click="$emit(\'click\')"><slot /></button>'
          },
          'v-icon': {
            template: '<i class="v-icon-stub"><slot /></i>'
          }
        }
      }
    })

    // Click the button
    await wrapper.find('.v-btn-stub').trigger('click')

    // Check if the router.push was called with the correct route
    expect(routerPush).toHaveBeenCalledWith('/')
  })

  it('calls a custom button callback when button is clicked', async () => {
    const customCallback = vi.fn()

    const wrapper = mount(NotFound, {
      props: {
        buttonCallback: customCallback
      },
      global: {
        mocks: {
          $router: {
            push: vi.fn()
          },
          $vuetify: {
            display: {
              xs: false
            }
          }
        },
        stubs: {
          'v-card': {
            template: '<div class="v-card-stub"><slot /></div>'
          },
          'v-card-item': {
            template: '<div class="v-card-item-stub"><slot /></div>'
          },
          'v-card-title': {
            template: '<div class="v-card-title-stub"><slot /></div>'
          },
          'v-card-text': {
            template: '<div class="v-card-text-stub"><slot /></div>'
          },
          'v-card-actions': {
            template: '<div class="v-card-actions-stub"><slot /></div>'
          },
          'v-btn': {
            template: '<button class="v-btn-stub" @click="$emit(\'click\')"><slot /></button>'
          },
          'v-icon': {
            template: '<i class="v-icon-stub"><slot /></i>'
          }
        }
      }
    })

    // Click the button
    await wrapper.find('.v-btn-stub').trigger('click')

    // Check if the custom callback was called
    expect(customCallback).toHaveBeenCalled()
  })

  it('applies responsive classes based on viewport size', () => {
    // Test for desktop
    const wrapperDesktop = mount(NotFound, {
      global: {
        mocks: {
          $router: {
            push: vi.fn()
          },
          $vuetify: {
            display: {
              xs: false
            }
          }
        },
        stubs: {
          'v-card': {
            template: '<div class="v-card-stub"><slot /></div>'
          },
          'v-card-item': {
            template: '<div class="v-card-item-stub"><slot /></div>'
          },
          'v-card-title': {
            template: '<div class="v-card-title-stub" :class="$attrs.class"><slot /></div>'
          },
          'v-card-text': {
            template: '<div class="v-card-text-stub" :class="$attrs.class"><slot /></div>'
          },
          'v-card-actions': {
            template: '<div class="v-card-actions-stub"><slot /></div>'
          },
          'v-btn': {
            template: '<button class="v-btn-stub"><slot /></button>'
          },
          'v-icon': {
            template: '<i class="v-icon-stub"><slot /></i>'
          }
        }
      }
    })

    // Check if desktop classes are applied
    expect(wrapperDesktop.find('.v-card-title-stub').classes()).toContain('text-h2')
    expect(wrapperDesktop.find('.v-card-text-stub').classes()).toContain('text-h4')

    // Test for mobile
    const wrapperMobile = mount(NotFound, {
      global: {
        mocks: {
          $router: {
            push: vi.fn()
          },
          $vuetify: {
            display: {
              xs: true
            }
          }
        },
        stubs: {
          'v-card': {
            template: '<div class="v-card-stub"><slot /></div>'
          },
          'v-card-item': {
            template: '<div class="v-card-item-stub"><slot /></div>'
          },
          'v-card-title': {
            template: '<div class="v-card-title-stub" :class="$attrs.class"><slot /></div>'
          },
          'v-card-text': {
            template: '<div class="v-card-text-stub" :class="$attrs.class"><slot /></div>'
          },
          'v-card-actions': {
            template: '<div class="v-card-actions-stub"><slot /></div>'
          },
          'v-btn': {
            template: '<button class="v-btn-stub"><slot /></button>'
          },
          'v-icon': {
            template: '<i class="v-icon-stub"><slot /></i>'
          }
        }
      }
    })

    // Check if mobile classes are applied
    expect(wrapperMobile.find('.v-card-title-stub').classes()).toContain('text-h4')
    expect(wrapperMobile.find('.v-card-text-stub').classes()).toContain('text-h6')
  })
})
