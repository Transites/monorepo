<template>
  <v-chip-group>
    <v-chip
      v-for="(chip, index) in chips"
      :key="chip"
      size="large"
      variant="flat"
      @click="chip.callback"
      :style="{ background: getChipColor(index, chips.length), color: 'white'}"
    >
      {{ chip.name }}
    </v-chip>
  </v-chip-group>
</template>

<script>
export default {
  props: {
    chips: {
      type: Object,
      default: []
      // [ { name: String, callback: Method }, ... ]
    },
    colors: {
      type: Object,
      default: [
        '--transites-red',
        '--transites-light-red',
        '--transites-yellow',
        '--transites-blue',
        '--transites-gray-purple'
      ]
    },
    color: {
      default: null
    }
  },
  methods: {
    getChipColor(index, length) {
      const colors = this.computedColors;
      const colorIndex = Math.floor((colors.length * index) / length)
      return `var(${colors[colorIndex]})`
    }
  },
  computed: {
    computedColors() {
      if (!!this.color) {
        return [this.color]
      } else {
        return this.colors
      }
    }
  }
}
</script>

<style scoped>
</style>
