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
          <v-card max-width="400px" variant="flat">
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
  
  export default {
    components: {
      NotFound,
      SectionList,
      ChipList,
      AuthorList,
      ArticleBody,
    },
    data() {
      return {
        article: null,
        error: false,
        authors: [],
        categories: [],
        tags: [],
        articleImage: '',
        sectionColors: {},
      };
    },
    async mounted() {
      const route = useRoute();
      const { id } = route.params;
  
      try {
        // Use API base URL from environment variable
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const response = await axios.get(`${baseUrl}/api/submissions/${id}`);
        
        // Transform the submission data to match the expected structure
        const submission = response.data.submission;
        const metadata = submission.metadata || {};
        
        // Create a structured article object from the submission data
        this.article = {
          id: submission.id,
          attributes: {
            title: submission.title,
            summary: submission.summary,
            content: submission.content,
            publishedAt: submission.published_at || submission.created_at,
            updatedAt: submission.updated_at,
            
            // Extract metadata fields
            alternativeTitles: metadata.alternativeTitles,
            birth: metadata.birth,
            death: metadata.death,
            
            // Create sections from content if not available in metadata
            sections: metadata.sections || [
              {
                __component: 'sections.text',
                id: 1,
                title: 'Conteúdo',
                content: submission.content
              }
            ],
            
            // Create image structure if available in metadata
            image: metadata.imageUrl ? {
              data: {
                attributes: {
                  url: metadata.imageUrl,
                  caption: metadata.imageCaption || ''
                }
              }
            } : { data: null },
            
            // Create authors structure
            authors: {
              data: [
                {
                  id: 1,
                  attributes: {
                    name: submission.author_name,
                    institution: submission.author_institution
                  }
                }
              ]
            },
            
            // Create categories and tags structures
            categories: {
              data: submission.category ? [
                {
                  id: 1,
                  attributes: {
                    name: submission.category
                  }
                }
              ] : []
            },
            
            tags: {
              data: (submission.keywords || []).map((keyword, index) => ({
                id: index + 1,
                attributes: {
                  name: keyword
                }
              }))
            }
          }
        };
        
        // Extract data for component use
        this.authors = [submission.author_name];
        this.categories = submission.category ? [submission.category] : [];
        this.tags = submission.keywords || [];
        this.articleImage = metadata.imageUrl || '';
      } catch (error) {
        this.error = true;
      }
    },
    methods: {
      formatDateToLocale(date) {
        return new Date(date).toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
      useMarkdown,
    },
  };
  </script>
  