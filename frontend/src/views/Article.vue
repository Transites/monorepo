<template>
  <div id="article-view" class="article-container">
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <div v-else-if="loading" class="loading">
      Carregando...
    </div>
    <div v-else-if="!displayArticle?.attributes?.content" class="error">
      Erro: conteúdo do artigo não encontrado.
    </div>
    <div v-else class="article-content">
      <h1 class="article-title">{{ displayArticle.attributes.title }}</h1>

      <div class="image-and-info">
        <!-- Imagem e legenda -->
        <div v-if="displayArticle.attributes.image" class="article-images">
          <div class="image-container">
            <img
                :src="displayArticle.attributes.image.url"
                :alt="displayArticle.attributes.image.alternativeText || 'Imagem do artigo'"
                class="article-image"
            />
            <p v-if="displayArticle.attributes.image.caption" class="image-caption">
              {{ displayArticle.attributes.image.caption }}</p>
            <p v-if="displayArticle.attributes.image.credit" class="image-credit">
              {{ displayArticle.attributes.image.credit }}</p>
          </div>
        </div>

        <!-- Informações ao lado da imagem -->
        <div class="article-info">
          <!-- Birth and Death -->
          <p v-if="displayArticle.attributes.birth && displayArticle.attributes.birth.date">
            <strong>Nascimento:</strong>
            {{ displayArticle.attributes.birth.formatted || formatDate(displayArticle.attributes.birth.date) }}
            <span v-if="displayArticle.attributes.birth.place">, {{ displayArticle.attributes.birth.place }}</span>
          </p>

          <p v-if="displayArticle.attributes.death && displayArticle.attributes.death.date">
            <strong>Falecimento:</strong>
            {{ displayArticle.attributes.death.formatted || formatDate(displayArticle.attributes.death.date) }}
            <span v-if="displayArticle.attributes.death.place">, {{ displayArticle.attributes.death.place }}</span>
          </p>

          <p v-if="displayArticle.attributes.summary" class="mt-10">
            {{ displayArticle.attributes.summary }}
          </p>

          <!-- Keywords -->
          <div v-if="displayArticle.attributes.keywords && displayArticle.attributes.keywords.length" class="mt-5">
            <strong>Palavras-chave:</strong>
            <span class="ml-2">
              <span v-for="(keyword, index) in displayArticle.attributes.keywords" :key="index" class="keyword">
                {{ keyword }}<span v-if="index < displayArticle.attributes.keywords.length - 1">, </span><span
                  v-if="index === displayArticle.attributes.keywords.length - 1">.</span>
              </span>
            </span>
          </div>

          <!-- Occupation -->
          <div v-if="displayArticle.attributes.occupation && displayArticle.attributes.occupation.length" class="mt-5">
            <strong>Ocupação:</strong>
            <span class="ml-2">
              <span v-for="(occupation, index) in displayArticle.attributes.occupation" :key="index" class="occupation">
                {{ occupation }}<span v-if="index < displayArticle.attributes.occupation.length - 1">, </span><span
                  v-if="index === displayArticle.attributes.occupation.length - 1">.</span>
              </span>
            </span>
          </div>

          <!-- Organizations -->
          <div v-if="displayArticle.attributes.organizations && displayArticle.attributes.organizations.length"
               class="mt-5">
            <strong>Organizações:</strong>
            <ul>
              <li v-for="(org, index) in displayArticle.attributes.organizations" :key="index">
                {{ org }}
              </li>
            </ul>
          </div>

          <!-- Alternative Names -->
          <div v-if="displayArticle.attributes.alternativeNames && displayArticle.attributes.alternativeNames.length"
               class="mt-5">
            <strong>Nomes alternativos:</strong>
            <span class="ml-2">
              <span v-for="(name, index) in displayArticle.attributes.alternativeNames" :key="index" class="alt-name">
                {{ name }}<span v-if="index < displayArticle.attributes.alternativeNames.length - 1">, </span><span
                  v-if="index === displayArticle.attributes.alternativeNames.length - 1">.</span>
              </span>
            </span>
          </div>

          <!-- Themes -->
          <div v-if="displayArticle.attributes.themes && displayArticle.attributes.themes.length" class="mt-5">
            <strong>Temas:</strong>
            <ul>
              <li v-for="(theme, index) in displayArticle.attributes.themes" :key="index">
                {{ theme }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div v-if="displayArticle.attributes.content" class="mt-20">
        <h2 class="section-title">Artigo</h2>
        <div class="article-content-text">
          <!-- Usar função que limpa e processa o conteúdo -->
          <div v-html="processContent(displayArticle.attributes.content)" class="markdown-content"></div>
        </div>
      </div>
      <!-- Works -->
      <div v-if="displayArticle.attributes.works && displayArticle.attributes.works.length" class="mt-20">
        <h2 class="section-title">Obras</h2>
        <ul class="works-list ml-20">
          <li v-for="(work, index) in displayArticle.attributes.works" :key="index" class="work-item mb-10">
            <strong>{{ work.title }}</strong> ({{ work.year }})
            <span v-if="work.location || work.publisher">
              - {{ work.location }}<span v-if="work.location && work.publisher">: </span>{{ work.publisher }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Bibliography -->
      <div v-if="displayArticle.attributes.bibliography && displayArticle.attributes.bibliography.length"
           class="section">
        <h2 class="section-title">Bibliografia</h2>
        <ul class="ml-20">
          <li v-for="(ref, index) in displayArticle.attributes.bibliography" :key="index" class="mb-10">
            {{ ref.author }} ({{ ref.year }}). <em>{{ ref.title }}</em>. {{ ref.location }}: {{ ref.publisher }}.
          </li>
        </ul>
      </div>

      <!-- Authors -->
      <div v-if="displayArticle.attributes.authors && displayArticle.attributes.authors.length" class="article-authors">
        <h2 class="section-title">Autor(es):</h2>
        <ul class="author-list">
          <li v-for="(author, index) in displayArticle.attributes.authors" :key="index"
              style="margin-left: 20px; margin-bottom: 5px;">
            {{ author.name }}
            <span v-if="author.institution"> - {{ author.institution }}</span>
          </li>
        </ul>
      </div>

      <p class="updated">Última atualização: {{ formatDate(displayArticle.attributes.updatedAt) }}</p>
      <p v-if="displayArticle.attributes.createdAt" class="created">Criado em:
        {{ formatDate(displayArticle.attributes.createdAt) }}</p>
    </div>
  </div>
</template>

<script>
import api from '@/services/api';
import {useMarkdown} from "@/composables/markdown.js";

export default {
  name: 'Article',
  props: {
    article: {
      type: Object,
      default: null
    },
    previewMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loadedArticle: null,
      error: null,
      loading: !this.previewMode && !this.article,
    };
  },
  computed: {
    displayArticle() {
      return this.article || this.loadedArticle;
    },
  },
  async mounted() {
    if (this.previewMode || this.article) {
      // If in preview mode or article is provided via props, use that
      this.loading = false;
      return;
    }

    const {id} = this.$route.params;
    try {
      const response = await api.get(`/submissions/id/${id}`);

      // This submission is the response schema printed in the comments down below.
      const submission = response.data.data.submission;
      const metadata = submission.metadata || {};

      this.loadedArticle = {
        id: submission.id,
        attributes: {
          title: submission.title,
          summary: submission.summary,
          content: submission.content,
          updatedAt: submission.updated_at,
          createdAt: submission.created_at,
          category: submission.category,
          keywords: submission.keywords || [],

          // Handle authors - convert from single author to array
          authors: submission.author_name ? [{
            name: submission.author_name,
            institution: submission.author_institution
          }] : [],

          // Handle image from metadata
          image: metadata.image ? {
            url: metadata.image.url,
            alternativeText: metadata.image.alt || '',
            caption: metadata.image.caption || '',
            credit: metadata.image.credit || ''
          } : null,

          // Map metadata fields correctly
          birth: metadata.birth,
          death: metadata.death,
          works: metadata.works || [],
          bibliography: metadata.bibliography || [],
          themes: metadata.themes || [],
          occupation: metadata.occupation || [],
          organizations: metadata.organizations || [],
          alternativeNames: metadata.alternativeNames || [],
          periods: metadata.periods,
          sections: metadata.sections || []
        }
      };
    } catch (error) {
      console.error('Error loading article:', error);
      this.error = 'Não foi possível carregar o verbete.';
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
    processContent(content) {
      if (!content) return '';

      // Limpar o conteúdo primeiro
      let cleanContent = content
          // Remover espaços extras antes dos headers
          .replace(/^\s*## /gm, '## ')
          // Normalizar quebras de linha
          .replace(/\n\s*\n/g, '\n\n')
          // Remover espaços em excesso no início das linhas
          .replace(/^\s+/gm, '')
          // Garantir que headers tenham espaço antes e depois
          .replace(/## /g, '\n\n## ')
          // Limpar múltiplas quebras de linha consecutivas
          .replace(/\n{3,}/g, '\n\n')
          // Remover espaços no início e fim
          .trim();

      // Processar com markdown
      return useMarkdown(cleanContent);
    },
    useMarkdown,
  },
};
</script>

<style scoped>
/* Estilo geral */
html, body {
  background-color: var(--color-background-soft);
  margin: 0;
  height: 100%;
}

body {
  font-family: 'Open Sans', sans-serif;
  color: var(--color-text);
}

#app {
  min-height: 100vh;
}

.article-container {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 5px solid var(--transites-light-red);
}

.article-title {
  font-size: 3rem;
  margin-bottom: 15px;
  color: var(--color-heading);
  text-align: left;
  font-weight: bold;
}

.image-and-info {
  display: flex;
  align-items: flex-start;
}

.article-images {
  flex: 1;
  margin-right: 20px;
}

.article-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  object-fit: cover;
}

.image-caption {
  font-size: 0.7rem;
  color: var(--color-text);
  margin-top: 5px;
  text-align: center;
}

.image-credit {
  font-size: 0.6rem;
  color: var(--color-text);
  opacity: 0.7;
  margin-top: 3px;
  text-align: center;
  font-style: italic;
}

.article-info {
  flex: 1;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text);
}

.created {
  font-size: 0.9rem;
  color: var(--color-text);
  margin-top: 5px;
  text-align: right;
}

.section-title {
  font-size: 1.6rem;
  margin-bottom: 10px;
  color: var(--color-heading);
  border-bottom: 2px solid var(--color-heading);
  padding-bottom: 5px;
}

.updated {
  font-size: 0.9rem;
  color: var(--color-text);
  margin-top: 20px;
  text-align: right;
}

.error {
  color: var(--transites-red);
  font-size: 1.2rem;
  text-align: center;
}

.loading {
  font-size: 1.2rem;
  text-align: center;
  color: var(--color-heading);
}

.article-content-text {
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 20px;
  color: var(--color-text);
  text-align: justify;
}
</style>
