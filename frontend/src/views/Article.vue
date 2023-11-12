<template>
  <div style="padding: 60px 30px 0 30px" v-if="!!article">
    <div style="color: var(--transites-red); padding-bottom: 20px">
      <div>
        <h1>{{ article.attributes.title }}</h1>
        <h2>{{ article.attributes.alternativeTitles }}</h2>
        <h3>
          Author:
          <span v-for="(author, index) in article.attributes.authors.data">
            <span>{{ author.attributes.name }}</span>
            <span v-if="index + 1 < article.attributes.authors.data.length">, </span>
          </span>
        </h3>
        <p>
          Publicado em: {{ formatDateToLocale(article.attributes.publishedAt) }} | Atualizado em:
          {{ formatDateToLocale(article.attributes.updatedAt) }}
        </p>
      </div>

      <v-divider thickness="5" class="border-opacity-100" style="margin: 10px 0 5px"></v-divider>

      <div>
        <v-btn
          class="tags text-white"
          v-for="tag in article.attributes.tags.data"
          :key="tag"
          color="var(--transites-red)"
          rounded
          style="margin: 5px 10px 5px 0px"
        >
          {{ tag.attributes.name }}
        </v-btn>
      </div>

      <v-divider thickness="5" class="border-opacity-100" style="margin: 5px 0 10px"></v-divider>

      <div>
        <h3 v-if="!!article.attributes.birth">
          Nascimento: {{ article.attributes.birth.place }}, {{ article.attributes.birth.date }}
        </h3>
        <h3 v-if="!!article.attributes.death">
          Falecimento: {{ article.attributes.death.place }}, {{ article.attributes.death.date }}
        </h3>
      </div>
    </div>

    <v-container style="color: var(--transites-red)">
      <v-row>
        <v-col cols="12" sm="6" align="center">
          <v-img
            :src="getUrlToStrapiImage(article.attributes.image.data.attributes.url)"
            aspect-ratio="16/9"
            max-width="300"
          ></v-img>
          <p>{{ article.attributes.image.data.attributes.caption }}</p>
        </v-col>
        <v-col cols="12" sm="6">
          <p>
            {{ article.attributes.summary }}
          </p>
        </v-col>
      </v-row>
    </v-container>

    <div>
      <v-expansion-panels>
        <v-expansion-panel
          class="section"
          v-for="(section, index) in article.attributes.sections"
          :key="section"
          :style="{ color: getPanelColor(index, article.attributes.sections.length) }"
        >
          <v-divider thickness="5" class="border-opacity-100"></v-divider>
          <v-expansion-panel-title style="font-size: x-large">{{
            section.title
          }}</v-expansion-panel-title>
          <v-expansion-panel-text>{{ section.content }}</v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>

<script>
import { useRoute } from 'vue-router'
import axios from 'axios'

export default {
  setup() {
    return {
      route: useRoute()
    }
  },
  mounted() {
    const id = this.route.params.id
    const type = this.route.params.type
    const base_url = import.meta.env.VITE_STRAPI_BASE_URL

    try {
      axios.get(`${base_url}/api/${type}-articles/${id}?populate=*`).then((response) => {
        this.article = response.data.data
      })
    } catch (error) {
      this.error = error
    }
  },
  data() {
    return {
      article: null,
      panelColors: [
        '--transites-light-red',
        '--transites-yellow',
        '--transites-blue',
        '--transites-gray-purple'
      ] // Define an array of colors
    }
  },
  methods: {
    getPanelColor(index, length) {
      // Dynamically select a color from the panelColors array based on the index
      const panelColorIndex = Math.floor((this.panelColors.length * index) / length)
      return `var(${this.panelColors[panelColorIndex]})`
    },

    formatDateToLocale(date_text) {
      const date = new Date(date_text)
      return date.toLocaleString([], {
        hour12: false
      })
    },

    getUrlToStrapiImage(path) {
      const base_url = import.meta.env.VITE_STRAPI_BASE_URL
      return `${base_url}${path}`
    }
  }
}
</script>

<style scoped>
.tags {
  flex-wrap: wrap;
  flex-direction: column;
  color: white;
}

.section {
  flex-wrap: wrap;
  flex-direction: column;
  margin: 10px;
}
</style>
