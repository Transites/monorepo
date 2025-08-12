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
      <!-- Título -->
      <h1 class="article-title">{{ displayArticle.attributes.title }}</h1>

      <!-- Linha 1: Imagem + Informações Principais -->
      <div class="linha-1">
        <!-- Imagem -->
        <div class="image-section">
          <div v-if="displayArticle.attributes.image" class="image-container">
            <img
                :src="displayArticle.attributes.image.url"
                :alt="displayArticle.attributes.image.alternativeText || 'Imagem do artigo'"
                class="article-image"
            />
            <p v-if="displayArticle.attributes.image.caption" class="image-caption">
              {{ displayArticle.attributes.image.caption }}
            </p>
            <p v-if="displayArticle.attributes.image.credit" class="image-credit">
              {{ displayArticle.attributes.image.credit }}
            </p>
          </div>
          <div v-else class="image-placeholder">
            <span>Imagem</span>
          </div>
        </div>

        <!-- Informações Principais -->
        <div class="main-info">
          <!-- Nascimento -->
          <div v-if="displayArticle.attributes.birth && displayArticle.attributes.birth.date" class="info-item">
            <strong>Nascimento:</strong>
            {{ displayArticle.attributes.birth.formatted || formatDate(displayArticle.attributes.birth.date) }}
            <span v-if="displayArticle.attributes.birth.place">, {{ displayArticle.attributes.birth.place }}</span>
          </div>

          <!-- Falecimento -->
          <div v-if="displayArticle.attributes.death && displayArticle.attributes.death.date" class="info-item">
            <strong>Falecimento:</strong>
            {{ displayArticle.attributes.death.formatted || formatDate(displayArticle.attributes.death.date) }}
            <span v-if="displayArticle.attributes.death.place">, {{ displayArticle.attributes.death.place }}</span>
          </div>

          <!-- Resumo -->
          <div v-if="displayArticle.attributes.summary" class="info-item resumo">
            <strong>Resumo:</strong>
            <p>{{ displayArticle.attributes.summary }}</p>
          </div>
        </div>
      </div>

      <!-- Linha 2: Informações Adicionais -->
      <div class="linha-2">
        <!-- Palavras-chave -->
        <div v-if="displayArticle.attributes.keywords && displayArticle.attributes.keywords.length" class="info-group">
          <strong>Palavras-chave:</strong>
          <span class="keywords">
            <span v-for="(keyword, index) in displayArticle.attributes.keywords" :key="index">
              {{ keyword }}<span v-if="index < displayArticle.attributes.keywords.length - 1">, </span><span v-if="index === displayArticle.attributes.keywords.length - 1">.</span>
            </span>
          </span>
        </div>

        <!-- Ocupação -->
        <div v-if="displayArticle.attributes.occupation && displayArticle.attributes.occupation.length" class="info-group">
          <strong>Ocupação:</strong>
          <span class="occupations">
            <span v-for="(occupation, index) in displayArticle.attributes.occupation" :key="index">
              {{ occupation }}<span v-if="index < displayArticle.attributes.occupation.length - 1">, </span><span v-if="index === displayArticle.attributes.occupation.length - 1">.</span>
            </span>
          </span>
        </div>

        <!-- Organizações -->
        <div v-if="displayArticle.attributes.organizations && displayArticle.attributes.organizations.length" class="info-group">
          <strong>Organizações:</strong>
          <ul class="organizations-list">
            <li v-for="(org, index) in displayArticle.attributes.organizations" :key="index">
              {{ org }}
            </li>
          </ul>
        </div>

        <!-- Nomes alternativos -->
        <div v-if="displayArticle.attributes.alternativeNames && displayArticle.attributes.alternativeNames.length" class="info-group">
          <strong>Nomes alternativos:</strong>
          <span class="alt-names">
            <span v-for="(name, index) in displayArticle.attributes.alternativeNames" :key="index">
              {{ name }}<span v-if="index < displayArticle.attributes.alternativeNames.length - 1">, </span><span v-if="index === displayArticle.attributes.alternativeNames.length - 1">.</span>
            </span>
          </span>
        </div>

        <!-- Temas -->
        <div v-if="displayArticle.attributes.themes && displayArticle.attributes.themes.length" class="info-group">
          <strong>Temas:</strong>
          <ul class="themes-list">
            <li v-for="(theme, index) in displayArticle.attributes.themes" :key="index">
              {{ theme }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Conteúdo do Artigo -->
      <div v-if="displayArticle.attributes.content" class="article-section">
        <h2 class="section-title">Artigo</h2>
        <div class="article-content-text">
          <div v-html="processContent(displayArticle.attributes.content)" class="markdown-content"></div>
        </div>
      </div>

      <!-- Obras -->
      <div v-if="displayArticle.attributes.works && displayArticle.attributes.works.length" class="article-section">
        <h2 class="section-title">Obras</h2>
        <ul class="works-list">
          <li v-for="(work, index) in displayArticle.attributes.works" :key="index" class="work-item">
            <strong>{{ work.title }}</strong> ({{ work.year }})
            <span v-if="work.location || work.publisher">
              - {{ work.location }}<span v-if="work.location && work.publisher">: </span>{{ work.publisher }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Bibliografia -->
      <div v-if="displayArticle.attributes.bibliography && displayArticle.attributes.bibliography.length" class="article-section">
        <h2 class="section-title">Bibliografia</h2>
        <ul class="bibliography-list">
          <li v-for="(ref, index) in displayArticle.attributes.bibliography" :key="index">
            {{ ref.author }} ({{ ref.year }}). <em>{{ ref.title }}</em>. {{ ref.location }}: {{ ref.publisher }}.
          </li>
        </ul>
      </div>

      <!-- Autores -->
      <div v-if="displayArticle.attributes.authors && displayArticle.attributes.authors.length" class="article-section">
        <h2 class="section-title">Autor(es):</h2>
        <ul class="author-list">
          <li v-for="(author, index) in displayArticle.attributes.authors" :key="index">
            {{ author.name }}
            <span v-if="author.institution"> - {{ author.institution }}</span>
          </li>
        </ul>
      </div>

      <p class="updated">Última atualização: {{ formatDate(displayArticle.attributes.updatedAt) }}</p>
      <p v-if="displayArticle.attributes.createdAt" class="created">Criado em: {{ formatDate(displayArticle.attributes.createdAt) }}</p>
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
      this.loading = false;
      return;
    }

    const {id} = this.$route.params;
    try {
      const response = await api.get(`/submissions/id/${id}`);
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
          authors: submission.author_name ? [{
            name: submission.author_name,
            institution: submission.author_institution
          }] : [],
          image: metadata.image ? {
            url: metadata.image.url,
            alternativeText: metadata.image.alt || '',
            caption: metadata.image.caption || '',
            credit: metadata.image.credit || ''
          } : null,
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
      let cleanContent = content
          .replace(/^\s*## /gm, '## ')
          .replace(/\n\s*\n/g, '\n\n')
          .replace(/^\s+/gm, '')
          .replace(/## /g, '\n\n## ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
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
  max-width: 1000px;
  margin: 20px auto;
  padding: 30px;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 5px solid var(--transites-light-red);
}

/* Título */
.article-title {
  font-size: 3rem;
  margin-bottom: 30px;
  color: var(--color-heading);
  text-align: center;
  font-weight: bold;
  border-bottom: 3px solid var(--transites-light-red);
  padding-bottom: 15px;
}

/* Linha 1: Imagem + Informações Principais */
.linha-1 {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
}

.image-section {
  flex: 1;
  max-width: 300px;
}

.image-container {
  width: 100%;
}

.article-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 200px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #999;
  background-color: #f9f9f9;
}

.image-caption {
  font-size: 0.8rem;
  color: var(--color-text);
  margin-top: 8px;
  text-align: center;
  font-style: italic;
}

.image-credit {
  font-size: 0.7rem;
  color: var(--color-text);
  opacity: 0.7;
  margin-top: 5px;
  text-align: center;
  font-style: italic;
}

.main-info {
  flex: 1;
  padding-left: 20px;
}

.info-item {
  margin-bottom: 15px;
  font-size: 1.1rem;
  line-height: 1.6;
}

.info-item strong {
  color: var(--color-heading);
  margin-right: 10px;
}

.resumo p {
  margin-top: 10px;
  text-align: justify;
  line-height: 1.7;
}

/* Linha 2: Informações Adicionais */
.linha-2 {
  padding: 25px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f8f8f8;
  margin-bottom: 30px;
}

.info-group {
  margin-bottom: 20px;
  font-size: 1rem;
  line-height: 1.6;
}

.info-group:last-child {
  margin-bottom: 0;
}

.info-group strong {
  color: var(--color-heading);
  margin-right: 10px;
  font-weight: 600;
}

.organizations-list,
.themes-list {
  margin: 10px 0 0 20px;
  padding: 0;
}

.organizations-list li,
.themes-list li {
  margin-bottom: 5px;
}

/* Seções do Artigo */
.article-section {
  margin-top: 40px;
}

.section-title {
  font-size: 1.8rem;
  margin-bottom: 15px;
  color: var(--color-heading);
  border-bottom: 2px solid var(--color-heading);
  padding-bottom: 8px;
}

.article-content-text {
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 20px;
  color: var(--color-text);
  text-align: justify;
}

.works-list,
.bibliography-list,
.author-list {
  margin-left: 25px;
  padding: 0;
}

.work-item,
.bibliography-list li,
.author-list li {
  margin-bottom: 10px;
  line-height: 1.6;
}

/* Meta informações */
.updated,
.created {
  font-size: 0.9rem;
  color: var(--color-text);
  margin-top: 20px;
  text-align: right;
  opacity: 0.8;
}

/* Estados de erro e carregamento */
.error {
  color: var(--transites-red);
  font-size: 1.2rem;
  text-align: center;
  padding: 40px;
}

.loading {
  font-size: 1.2rem;
  text-align: center;
  color: var(--color-heading);
  padding: 40px;
}

/* Responsividade */
@media (max-width: 768px) {
  .linha-1 {
    flex-direction: column;
    gap: 20px;
  }

  .image-section {
    max-width: 100%;
  }

  .main-info {
    padding-left: 0;
  }

  .article-title {
    font-size: 2rem;
  }

  .article-container {
    margin: 10px;
    padding: 20px;
  }
}
</style>