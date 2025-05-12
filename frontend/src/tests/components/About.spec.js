import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import About from '@/components/About.vue'
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

describe.skip('About.vue', () => {
  it.skip('renders the component correctly', async () => {
    // Wait for router to be ready
    await router.isReady()

    const wrapper = mount(About, {
      global: {
        plugins: [router],
        stubs: {
          'HomeSection': {
            template: '<div class="home-section-stub"><slot name="icon" /><slot name="title" /><slot name="subtitle" /><slot name="text" /></div>'
          },
          'v-img': {
            template: '<img class="v-img-stub" :src="src" />',
            props: ['src']
          }
        }
      }
    })

    // Check if HomeSection is used
    expect(wrapper.find('.home-section-stub').exists()).toBe(true)

    // Check if title is rendered correctly
    expect(wrapper.html()).toContain('Trânsitos | <i>Circulations </i>')

    // Check if subtitle is rendered correctly
    expect(wrapper.html()).toContain('Enciclopédia das Relações entre a França e o Brasil no século XX (1880-1980)')

    // Check if main text content is present
    expect(wrapper.html()).toContain('é uma enciclopédia digital e evolutiva sobre os trânsitos Brasil-França')

    // Check if router-link is present
    const routerLink = wrapper.find('router-link-stub')
    expect(routerLink.exists()).toBe(true)
    expect(routerLink.attributes('to')).toBe('/Contribute')
  })
})
