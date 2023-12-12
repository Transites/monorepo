<template>
  <v-progress-linear indeterminate v-if="!article && !error" color="var(--transites-red)"></v-progress-linear>
  <NotFound v-if="error" height="100%" />
  <v-container v-if="!!article">
    <h1>{{ article.attributes.title }}</h1>
    <h3><AuthorList :authors="authors" /></h3>
    <p>
      Publicado em: {{ formatDateToLocale(article.attributes.publishedAt) }} | Atualizado em:
      {{ formatDateToLocale(article.attributes.updatedAt) }}
    </p>

    <div style="color: var(--transites-red)">
      <v-divider thickness="3" class="border-opacity-100 mt-2" color="var(--transites-red)"></v-divider>
      <ChipList :chips="categories" />
      <v-divider
        v-if="categories.length > 0"
        thickness="3" class="border-opacity-100" color="var(--transites-red)"
      ></v-divider>
    </div>

    <ArticleBody>

      <template #side-panel-header v-if="!!article.attributes.image.data">
        <v-card
          max-width="400px"
          variant="flat"
        >
          <v-img :src="articleImage" class="rounded-lg" cover></v-img>
          <v-card-subtitle class="py-2 px-1 text-subtitle-1">
            {{ article.attributes.image.data.attributes.caption }}
          </v-card-subtitle>
        </v-card>
      </template>

      <template #side-panel-body>
        <div class="side-info-container" v-if="!!article.attributes.alternativeTitles">
          <p class="side-info-title">Outras grafias de nome</p>
          <p>{{ article.attributes.alternativeTitles }}</p>
        </div>
        <div class="side-info-container" v-if="!!article.attributes.birth">
          <p class="side-info-title">Nascimento</p>
          <p> {{ article.attributes.birth.place }}, {{ article.attributes.birth.date }}</p>
        </div>
        <div class="side-info-container" v-if="!!article.attributes.death">
          <p class="side-info-title">Falecimento</p>
          <p> {{ article.attributes.death.place }}, {{ article.attributes.death.date }}</p>
        </div>
        <div class="side-info-container" v-if="tags.length > 0">
          <p class="side-info-title">Tags</p>
          <ChipList :chips="tags" />
        </div>
      </template>

      <div v-if="article.attributes.summary" class="mb-6" v-html="useMarkdown(article.attributes.summary)"></div>
      <SectionList :sections="article.attributes.sections" :colors="sectionColors" />

    </ArticleBody>
  </v-container>
</template>

<script>
import NotFound from '@/components/NotFound.vue'
import SectionList from '@/components/SectionList.vue'
import ChipList from '@/components/ChipList.vue'
import AuthorList from '@/components/AuthorList.vue'
import ArticleBody from '@/components/ArticleBody.vue'

import { useRoute } from 'vue-router'
import axios from 'axios'
import { useMarkdown } from '@/composables/markdown.js';

function createChipList(list) {
  return list.map(item => {
    return {
      id: item.id,
      name: item.attributes.name
    }
  })
}

function createAuthorList(authors) {
  return authors.map(author => {
    return {
      id: author.id,
      name: author.attributes.name,
      institution: author.attributes.institution,
      description: author.attributes.description
    }
  });
}

export default {
  setup() {
    return {
      route: useRoute(),
      useMarkdown: useMarkdown
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
      sectionColors: [
        'var(--transites-light-red)',
        'var(--transites-yellow)',
        'var(--transites-blue)',
        'var(--transites-gray-purple)'
      ],
      error: false
    }
  },
  methods: {
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

      axios.get(`${base_url}/api/${type}-articles/${id}?populate=*`).then((response) => {
        this.article = response.data.data;
        this.categories = createChipList(this.article.attributes.categories.data);
        this.tags = createChipList(this.article.attributes.tags.data);
        this.authors = createAuthorList(this.article.attributes.authors.data);
      }).catch(error => {
        console.log(error);
        this.error = true;
      });
    }
  },
  components: {
    NotFound: NotFound,
    SectionList: SectionList,
    ChipList: ChipList,
    AuthorList: AuthorList,
    ArticleBody: ArticleBody
  }
}
</script>

<style scoped>
.side-info-title {
  font-weight: bold;
}

.side-info-container {
  margin-bottom: 1.25em;
}
</style>
