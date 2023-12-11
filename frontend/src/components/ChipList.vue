<template>
  <v-chip-group>
    <v-chip
      v-for="(chip, index) in chips"
      :key="chip"
      size="large"
      variant="flat"
      @click="chip.callback"
      :style="{ background: getChipColor(index, chips.length), color: 'white' }"
    >
      {{ chip.name }}
    </v-chip>
  </v-chip-group>
</template>

<script>
export default {
  props: {
    chips: {
      type: Array,
      default: () => []
      // [ { name: String, callback: Method }, ... ]
    },
    colors: {
      type: Array,
      default: () => [
        'var(--transites-red)',
        'var(--transites-light-red)',
        'var(--transites-yellow)',
        'var(--transites-blue)',
        'var(--transites-gray-purple)'
      ]
    },
    color: {
      default: null
    }
  },
  methods: {
    getChipColor(index, length) {
      const colors = this.computedColors
      const colorIndex = Math.floor((colors.length * index) / length)
      return colors[colorIndex]
    }
  },
  computed: {
    computedColors() {
      if (this.color) {
        return [this.color]
      } else {
        return this.colors
      }
    }
  }
}
</script>

<style scoped></style>
