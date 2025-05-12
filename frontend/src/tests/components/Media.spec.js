import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Media from '@/components/Media.vue'

describe('Media.vue', () => {
  it('renders the component correctly', () => {
    const wrapper = mount(Media, {
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
            props: ['cols', 'lg']
          }
        }
      }
    })

    // Check if the title is rendered correctly
    const title = wrapper.find('.media-title')
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('Mídias')
    
    // Check if the container has the correct class
    expect(wrapper.find('.media-container').exists()).toBe(true)
  })

  it('renders the correct number of iframes based on videoIds', async () => {
    const wrapper = mount(Media, {
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
            props: ['cols', 'lg']
          }
        }
      }
    })

    // By default, there should be one video
    let iframes = wrapper.findAll('iframe')
    expect(iframes.length).toBe(1)
    
    // Update the videoIds array to have more videos
    await wrapper.setData({
      videoIds: ['70P5mHigQVY', 'anotherVideoId', 'thirdVideoId']
    })
    
    // Now there should be three videos
    iframes = wrapper.findAll('iframe')
    expect(iframes.length).toBe(3)
  })

  it('constructs YouTube embed URLs correctly', async () => {
    const wrapper = mount(Media, {
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
            props: ['cols', 'lg']
          }
        }
      }
    })

    // Check if the iframe src is constructed correctly
    const iframe = wrapper.find('iframe')
    expect(iframe.attributes('src')).toBe('https://www.youtube.com/embed/70P5mHigQVY')
    
    // Update the videoIds array
    await wrapper.setData({
      videoIds: ['newVideoId']
    })
    
    // Check if the iframe src is updated correctly
    expect(wrapper.find('iframe').attributes('src')).toBe('https://www.youtube.com/embed/newVideoId')
  })

  it('has the correct CSS classes and styles', () => {
    const wrapper = mount(Media, {
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
            props: ['cols', 'lg']
          }
        }
      }
    })

    // Check if the iframe has the correct class
    const iframe = wrapper.find('iframe')
    expect(iframe.classes()).toContain('media-iframe')
    
    // Check if the iframe has the allowfullscreen attribute
    expect(iframe.attributes('allowfullscreen')).toBeDefined()
  })
})