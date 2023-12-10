<template>
  <v-expansion-panels multiple>
    <v-expansion-panel
      class="mb-5"
      v-for="(section, index) in sections"
      :key="section"
      :style="{ color: getSectionColor(index, sections.length) }"
    >
      <v-divider thickness="5" class="border-opacity-100"></v-divider>
      <v-expansion-panel-title style="font-size: x-large">
        {{ section.title }}
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <div
          :class="{ markdown }"
          v-html="markdown.render(section.content)"
        ></div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
import markdownIt from 'markdown-it'
export default {
  setup() {
    return {
      markdown: markdownIt()
    }
  },
  props: {
    sections: {
      type: Object, // [ { title: String, content: String }, ... ]
      default: []
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
    }
  },
  methods: {
    getSectionColor(index, length) {
      const colorIndex = Math.floor((this.colors.length * index) / length)
      return `var(${this.colors[colorIndex]})`
    }
  }
}
</script>

<style scoped>

.markdown > :deep(p) {
  margin-bottom: 1.3em;
}
</style>
