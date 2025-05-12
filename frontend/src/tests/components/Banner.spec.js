import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Banner from '@/components/Banner.vue'

describe('Banner.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(Banner, {
      global: {
        stubs: {
          'v-card': {
            template: '<div class="v-card-stub"><slot /></div>'
          },
          'v-row': {
            template: '<div class="v-row-stub"><slot /></div>'
          },
          'v-col': {
            template: '<div class="v-col-stub"><slot /></div>'
          },
          'v-carousel': {
            template: '<div class="v-carousel-stub"><slot /><slot name="prev" /><slot name="next" /></div>'
          },
          'v-carousel-item': {
            template: '<div class="v-carousel-item-stub"><slot /></div>',
            props: ['src']
          },
          'v-btn': {
            template: '<button class="v-btn-stub"><slot /></button>',
            props: ['icon', 'color']
          },
          'v-icon': {
            template: '<i class="v-icon-stub"><slot /></i>'
          },
          'v-card-title': {
            template: '<div class="v-card-title-stub"><slot /></div>'
          },
          'v-card-subtitle': {
            template: '<div class="v-card-subtitle-stub"><slot /></div>'
          },
          'v-card-text': {
            template: '<div class="v-card-text-stub"><slot /></div>'
          }
        },
        mocks: {
          $vuetify: {
            display: {
              smAndDown: false
            }
          }
        }
      }
    });
  });

  it('renders the banner correctly', () => {
    // Check if the component renders the carousel
    const carousel = wrapper.find('.v-carousel-stub');
    expect(carousel.exists()).toBe(true);

    // Check if the component renders the carousel items
    const carouselItems = wrapper.findAll('.v-carousel-item-stub');
    expect(carouselItems.length).toBe(3); // There are 3 items in the data
  });

  it('has the correct default props', () => {
    expect(wrapper.props('color')).toBe('var(--transites-red)');
    expect(wrapper.props('padding')).toBe('70px 5% 30px 5%');
  });

  it('computes propStyle correctly', () => {
    expect(wrapper.vm.propStyle).toEqual({
      '--prop-color': 'var(--transites-red)',
      '--prop-padding': '70px 5% 30px 5%'
    });

    // Test with custom props
    wrapper = mount(Banner, {
      props: {
        color: 'blue',
        padding: '10px'
      },
      global: {
        stubs: {
          'v-card': {
            template: '<div class="v-card-stub"><slot /></div>'
          },
          'v-row': {
            template: '<div class="v-row-stub"><slot /></div>'
          },
          'v-col': {
            template: '<div class="v-col-stub"><slot /></div>'
          },
          'v-carousel': {
            template: '<div class="v-carousel-stub"><slot /><slot name="prev" /><slot name="next" /></div>'
          },
          'v-carousel-item': {
            template: '<div class="v-carousel-item-stub"><slot /></div>',
            props: ['src']
          },
          'v-btn': {
            template: '<button class="v-btn-stub"><slot /></button>',
            props: ['icon', 'color']
          },
          'v-icon': {
            template: '<i class="v-icon-stub"><slot /></i>'
          },
          'v-card-title': {
            template: '<div class="v-card-title-stub"><slot /></div>'
          },
          'v-card-subtitle': {
            template: '<div class="v-card-subtitle-stub"><slot /></div>'
          },
          'v-card-text': {
            template: '<div class="v-card-text-stub"><slot /></div>'
          }
        },
        mocks: {
          $vuetify: {
            display: {
              smAndDown: false
            }
          }
        }
      }
    });

    expect(wrapper.vm.propStyle).toEqual({
      '--prop-color': 'blue',
      '--prop-padding': '10px'
    });
  });

  it('navigates slides correctly', async () => {
    // Initial counter value is 2
    expect(wrapper.vm.counter).toBe(2);

    // Test nextSlide method
    wrapper.vm.nextSlide();
    expect(wrapper.vm.counter).toBe(0); // Should wrap around to 0

    // Test prevSlide method
    wrapper.vm.prevSlide();
    expect(wrapper.vm.counter).toBe(2); // Should wrap around to 2

    // Test multiple next slides
    wrapper.vm.nextSlide();
    wrapper.vm.nextSlide();
    expect(wrapper.vm.counter).toBe(1);
  });

  it('displays the correct item text based on counter', async () => {
    // Initial counter value is 2
    const textElement = wrapper.find('.bannerText');
    expect(textElement.text()).toContain('Ignacy Sachs nasceu em Varsóvia em 1927');

    // Change counter and check text
    await wrapper.setData({ counter: 0 });
    expect(wrapper.find('.bannerText').text()).toContain('Em 1987, dois anos após a fundação');

    await wrapper.setData({ counter: 1 });
    expect(wrapper.find('.bannerText').text()).toContain('Lucía Tosi foi uma cientista natural');
  });
});
