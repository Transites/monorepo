<template>
  <div style="padding: 0 30px 0 30px" v-if="!!article">
    <div style="color: var(--transites-red)">
      <div>
        <h1>{{ article.attributes.title }}</h1>
        <h2>{{ article.attributes.alternativeTitles }}</h2>
        <h3 v-if="article.attributes.authors.data.length > 0">
          Author:
          <span v-for="(author, index) in article.attributes.authors.data" :key="author">
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
          v-for="category in article.attributes.categories.data"
          :key="category"
          color="var(--transites-red)"
          rounded
          style="margin: 5px 10px 5px 0px"
        >
          {{ category.attributes.name }}
        </v-btn>
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

    <v-container style="color: var(--transites-red)" fluid>
      <v-row>
        <v-card
          style="border-width: 4px; margin: 20px"
          variant="outlined"
          width="min(400px, 100%)"
          class="rounded-lg"
          v-if="!!article.attributes.image.data"
        >
          <v-img :src="articleImage" cover></v-img>
          <v-card-title>
            {{ article.attributes.image.data.attributes.caption }}
          </v-card-title>
        </v-card>
        <v-col cols="12" md="6" style="padding: 20px" v-if="!!article.attributes.summary">
          <div v-html="markdown.render(article.attributes.summary)"></div>
        </v-col>
      </v-row>
    </v-container>

    <div>
      <v-expansion-panels multiple>
        <v-expansion-panel
          class="section"
          v-for="(section, index) in article.attributes.sections"
          :key="section"
          :style="{ color: getPanelColor(index, article.attributes.sections.length) }"
        >
          <v-divider thickness="5" class="border-opacity-100"></v-divider>
          <v-expansion-panel-title style="font-size: x-large">
            {{ section.title }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div
              :class="{ markdown: section.title === 'Artigo' }"
              v-html="markdown.render(section.content)"
            ></div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>

<script>
import { useRoute } from 'vue-router'
import axios from 'axios'
import markdownIt from 'markdown-it'

export default {
  setup() {
    return {
      route: useRoute(),
      markdown: markdownIt()
    }
  },
  mounted() {
    this.fetchDataFromStrapi()
  },
  computed: {
    articleImage() {
      if (!this.article.attributes.image.data) return "";

      const formats = this.article.attributes.image.data.attributes.formats;
      const key = Object.keys(formats)[0];

      return formats[key].url;
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
      ]
    }
  },
  methods: {
    getPanelColor(index, length) {
      const panelColorIndex = Math.floor((this.panelColors.length * index) / length)
      return `var(${this.panelColors[panelColorIndex]})`
    },

    formatDateToLocale(date_text) {
      const date = new Date(date_text)
      return date.toLocaleString([], {
        hour12: false
      })
    },

    fetchDataFromStrapi() {
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

.markdown > :deep(p:first-of-type) {
  text-indent: 0px !important;
}

.markdown > :deep(p) {
  text-indent: 4em;
  margin-bottom: 1.3em;
}
</style>
