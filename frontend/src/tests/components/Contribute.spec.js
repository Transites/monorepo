import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Contribute from '@/components/Contribute.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from '@/router'

// Create a mock router
let router;
try {
  router = createRouter({
    history: createWebHistory(),
    routes
  });
} catch (error) {
  console.warn('Error creating router for tests:', error);
  router = { isReady: () => Promise.resolve() };
}

// Mock window.open
const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {})

describe.skip('Contribute.vue', () => {
  beforeEach(() => {
    // Reset the spy before each test
    windowOpenSpy.mockClear()
  })

  it.skip('renders the component correctly', async () => {
    // Wait for router to be ready
    await router.isReady()

    const wrapper = mount(Contribute, {
      global: {
        plugins: [router],
        stubs: {
          'HomeSection': {
            template: '<div class="home-section-stub"><slot name="icon" /><slot name="title" /><slot name="subtitle" /><slot name="text" /></div>'
          },
          'v-icon': {
            template: '<i class="v-icon-stub" :icon="icon" :size="size"></i>',
            props: ['icon', 'size']
          },
          'v-form': {
            template: '<form class="v-form-stub"><slot /></form>'
          },
          'v-text-field': {
            template: '<input class="v-text-field-stub" :label="label" />',
            props: ['label', 'rules']
          },
          'v-textarea': {
            template: '<textarea class="v-textarea-stub" :label="label"></textarea>',
            props: ['label', 'rules']
          },
          'v-btn': {
            template: '<button class="v-btn-stub" :color="color" :type="type"><slot /></button>',
            props: ['color', 'type']
          }
        }
      }
    })

    // Check if HomeSection is used
    expect(wrapper.find('.home-section-stub').exists()).toBe(true)

    // Check if title is rendered correctly
    expect(wrapper.html()).toContain('Contribua com o')
    expect(wrapper.html()).toContain('<b>Trânsitos</b> | <i>Circulations </i>')

    // Check if subtitle is rendered correctly
    expect(wrapper.html()).toContain('Envie sua sugestão, elogio, crítica')

    // Check if form elements are rendered
    expect(wrapper.find('.v-form-stub').exists()).toBe(true)
    expect(wrapper.findAll('.v-text-field-stub').length).toBe(2)
    expect(wrapper.find('.v-textarea-stub').exists()).toBe(true)
    expect(wrapper.find('.v-btn-stub').exists()).toBe(true)

    // Check if router-link is present
    const routerLink = wrapper.find('router-link-stub')
    expect(routerLink.exists()).toBe(true)
    expect(routerLink.attributes('to')).toBe('/normas-de-publicacao')
  })

  it('validates form fields correctly', async () => {
    const wrapper = mount(Contribute, {
      global: {
        stubs: {
          'HomeSection': {
            template: '<div><slot name="text" /></div>'
          },
          'v-icon': true,
          'v-form': {
            template: '<form><slot /></form>'
          },
          'v-text-field': true,
          'v-textarea': true,
          'v-btn': true
        }
      }
    })

    // Test validation rule
    const rule = wrapper.vm.rules[0]
    expect(rule('')).toBe('Campo obrigatório.')
    expect(rule('Some value')).toBe(true)
  })

  it('sends email when form is valid', async () => {
    // Mock the validate method to return { valid: true }
    const validateMock = vi.fn().mockResolvedValue({ valid: true })

    const wrapper = mount(Contribute, {
      global: {
        stubs: {
          'HomeSection': {
            template: '<div><slot name="text" /></div>'
          },
          'v-icon': true,
          'v-form': true,
          'v-text-field': true,
          'v-textarea': true,
          'v-btn': {
            template: '<button @click="$emit(\'click\', $event)"><slot /></button>'
          }
        }
      }
    })

    // Set form values
    await wrapper.setData({
      firstName: 'John Doe',
      subject: 'Test Subject',
      message: 'Test Message'
    })

    // Mock the form validation
    wrapper.vm.$refs.emailForm = { validate: validateMock }

    // Trigger the sendEmail method
    await wrapper.vm.sendEmail()

    // Check if validate was called
    expect(validateMock).toHaveBeenCalled()

    // Check if window.open was called with the correct URL
    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('mailto:')
    )
    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('subject=Test Subject')
    )
    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('body=Test Message')
    )
    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('De: John Doe')
    )
  })

  it('does not send email when form is invalid', async () => {
    // Mock the validate method to return { valid: false }
    const validateMock = vi.fn().mockResolvedValue({ valid: false })

    const wrapper = mount(Contribute, {
      global: {
        stubs: {
          'HomeSection': {
            template: '<div><slot name="text" /></div>'
          },
          'v-icon': true,
          'v-form': true,
          'v-text-field': true,
          'v-textarea': true,
          'v-btn': {
            template: '<button @click="$emit(\'click\', $event)"><slot /></button>'
          }
        }
      }
    })

    // Mock the form validation
    wrapper.vm.$refs.emailForm = { validate: validateMock }

    // Trigger the sendEmail method
    await wrapper.vm.sendEmail()

    // Check if validate was called
    expect(validateMock).toHaveBeenCalled()

    // Check if window.open was not called
    expect(windowOpenSpy).not.toHaveBeenCalled()
  })
})
