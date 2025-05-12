import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChipList from '@/components/ChipList.vue'

describe('ChipList.vue', () => {
  it('renders chips when passed', async () => {
    const chips = [
      { name: 'Chip 1', callback: () => {} },
      { name: 'Chip 2', callback: () => {} }
    ]

    const wrapper = mount(ChipList, {
      props: {
        chips
      },
      global: {
        stubs: {
          'v-chip-group': {
            template: '<div><slot /></div>'
          },
          'v-chip': {
            template: '<div class="v-chip-stub"><slot /></div>'
          }
        }
      }
    })

    // Check if the component renders the correct number of chips
    const chipElements = wrapper.findAll('.v-chip-stub')
    expect(chipElements.length).toBe(2)

    // Check if the chip text is correct
    expect(chipElements[0].text()).toContain('Chip 1')
    expect(chipElements[1].text()).toContain('Chip 2')
  })

  it('computes colors correctly', async () => {
    const wrapper = mount(ChipList, {
      props: {
        chips: [{ name: 'Test', callback: () => {} }],
        colors: ['red', 'blue', 'green']
      },
      global: {
        stubs: {
          'v-chip-group': true,
          'v-chip': true
        }
      }
    })

    // Test the computedColors computed property
    expect(wrapper.vm.computedColors).toEqual(['red', 'blue', 'green'])

    // Test with a single color
    await wrapper.setProps({ color: 'purple' })
    expect(wrapper.vm.computedColors).toEqual(['purple'])
  })

  it('calculates chip color based on index', () => {
    const wrapper = mount(ChipList, {
      props: {
        chips: [{ name: 'Test', callback: () => {} }],
        colors: ['red', 'blue', 'green']
      },
      global: {
        stubs: {
          'v-chip-group': true,
          'v-chip': true
        }
      }
    })

    // Test the getChipColor method
    expect(wrapper.vm.getChipColor(0, 3)).toBe('red')
    expect(wrapper.vm.getChipColor(1, 3)).toBe('blue')
    expect(wrapper.vm.getChipColor(2, 3)).toBe('green')
  })
})
