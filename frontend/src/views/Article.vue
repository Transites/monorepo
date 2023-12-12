<template>
  <v-progress-linear indeterminate v-if="!article && !error" color="var(--transites-red)"></v-progress-linear>
  <NotFound v-if="error" height="100%" />
  <v-container>
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

        <ChipList :chips="categoriesAndTags" color="var(--transites-red)" />

        <v-divider thickness="5" class="border-opacity-100" style="margin: 5px 0 10px"></v-divider>
      </div>

      <v-container class="px-0">
        <v-row>
          <v-col cols="12" md="4" v-if="!!article.attributes.image.data">
            <v-row>
              <v-col cols="12" sm="5" md="12" class="pb-1">
                <v-card
                  max-width="400px"
                  variant="flat"
                >
                  <v-img :src="articleImage" class="rounded-lg" cover></v-img>
                  <v-card-subtitle class="py-2 px-1 text-subtitle-1">
                    {{ article.attributes.image.data.attributes.caption }}
                  </v-card-subtitle>
                </v-card>
              </v-col>
              <v-col cols="12" sm md="12" class="pt-1">
                <div class="side-info-container" v-if="!!article.attributes.birth">
                  <p class="side-info-title">Nascimento</p>
                  <p> {{ article.attributes.birth.place }}, {{ article.attributes.birth.date }}</p>
                </div>
                <div class="side-info-container" v-if="!!article.attributes.death">
                  <p class="side-info-title">Falecimento</p>
                  <p> {{ article.attributes.death.place }}, {{ article.attributes.death.date }}</p>
                </div>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" md v-if="!!article.attributes.summary">
            <div class="mb-6" v-html="useMarkdown(article.attributes.summary)"></div>
            <SectionList :sections="article.attributes.sections" :colors="sectionColors" />
          </v-col>
        </v-row>
      </v-container>
    </div>
  </v-container>
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
.side-info-title {
  font-weight: bold;
}

.side-info-container {
  margin-bottom: 1.25em;
}
</style>
