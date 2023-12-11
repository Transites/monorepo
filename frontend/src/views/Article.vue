<template>
  <div style="height: 100%">
    <v-progress-linear indeterminate v-if="!article && !error" color="var(--transites-red)"></v-progress-linear>
    <NotFound v-if="error" />
    <div style="padding: 0 30px 0 30px" v-if="!!article">
      <div style="color: var(--transites-red)">
        <div>
          <h1>{{ article.attributes.title }}</h1>
          <h2>{{ article.attributes.alternativeTitles }}</h2>
          <h3>
            <AuthorList :authors="authors" />
          </h3>
          <p>
            Publicado em: {{ formatDateToLocale(article.attributes.publishedAt) }} | Atualizado em:
            {{ formatDateToLocale(article.attributes.updatedAt) }}
          </p>
        </div>

        <v-divider thickness="5" class="border-opacity-100" style="margin: 10px 0 5px"></v-divider>

        <ChipList :chips="categoriesAndTags" color="--transites-red" />

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
            <div v-html="useMarkdown(article.attributes.summary)"></div>
          </v-col>
        </v-row>
      </v-container>

      <SectionList :sections="article.attributes.sections" :colors="sectionColors" />
    </div>
  </div>
</template>

<script>
import NotFound from '@/components/NotFound.vue'
import SectionList from '@/components/SectionList.vue'
import ChipList from '@/components/ChipList.vue'
import AuthorList from '@/components/AuthorList.vue'

import { useRoute } from 'vue-router'
import axios from 'axios'
import { useMarkdown } from '@/composables/markdown.js';

function createChipList(article) {
  const formatChip = (item) => {
    return {
      id: item.id,
      name: item.attributes.name
    }
  }

  const categories = article.attributes.categories.data.map(formatChip);
  const tags = article.attributes.tags.data.map(formatChip);

  return categories.concat(tags);
}

function createAuthorList(article) {
  const authors = article.attributes.authors.data;
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
        this.categoriesAndTags = createChipList(this.article);
        this.authors = createAuthorList(this.article);
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
    AuthorList: AuthorList
  }
}
</script>

<style scoped>
</style>
