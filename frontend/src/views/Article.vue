<!--Enhanced Article View Component for new backend structure-->
<template>
  <div id="article-view" class="article-container">
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <div v-else-if="loading" class="loading">
      Carregando...
    </div>
    <div v-else-if="!displayArticle?.title" class="error">
      Erro: conteúdo do artigo não encontrado.
    </div>
    <div v-else class="article-content">
      <!-- Título -->
      <h1 class="article-title">{{ displayArticle.title }}</h1>

      <!-- Linha 1: Imagem + Informações Principais -->
      <div class="linha-1">
        <!-- Imagem -->
        <div class="image-section">
          <div v-if="displayArticle.metadata?.image" class="image-container">
            <img
                :src="displayArticle.metadata.image.url"
                :alt="displayArticle.metadata.image.alternativeText || 'Imagem do artigo'"
                class="article-image"
            />
            <p v-if="displayArticle.metadata.image.caption" class="image-caption">
              {{ displayArticle.metadata.image.caption }}
            </p>
            <p v-if="displayArticle.metadata.image.credit" class="image-credit">
              {{ displayArticle.metadata.image.credit }}
            </p>
          </div>
          <div v-else class="image-placeholder">
            <span>Imagem</span>
          </div>
        </div>

        <!-- Informações Principais -->
        <div class="main-info">
          <!-- Nascimento -->
          <div v-if="displayArticle.metadata?.birth?.date" class="info-item">
            <strong>Nascimento:</strong>
            {{ displayArticle.metadata.birth.formatted || formatBirthDeath(displayArticle.metadata.birth) }}
          </div>

          <!-- Falecimento -->
          <div v-if="displayArticle.metadata?.death?.date" class="info-item">
            <strong>Falecimento:</strong>
            {{ displayArticle.metadata.death.formatted || formatBirthDeath(displayArticle.metadata.death) }}
          </div>

          <!-- Resumo -->
          <div v-if="displayArticle.summary" class="info-item resumo">
            <strong>Resumo:</strong>
            <p>{{ displayArticle.summary }}</p>
          </div>
        </div>
      </div>

      <!-- Linha 2: Informações Adicionais -->
      <div class="linha-2">
        <!-- Palavras-chave -->
        <div v-if="displayArticle.keywords?.length" class="info-group">
          <strong>Palavras-chave:</strong>
          <span class="keywords">
            <span v-for="(keyword, index) in displayArticle.keywords" :key="index">
              {{ keyword }}<span v-if="index < displayArticle.keywords.length - 1">, </span><span v-if="index === displayArticle.keywords.length - 1">.</span>
            </span>
          </span>
        </div>

        <!-- Ocupação -->
        <div v-if="displayArticle.metadata?.occupation?.length" class="info-group">
          <strong>Ocupação:</strong>
          <span class="occupations">
            <span v-for="(occupation, index) in displayArticle.metadata.occupation" :key="index">
              {{ occupation }}<span v-if="index < displayArticle.metadata.occupation.length - 1">, </span><span v-if="index === displayArticle.metadata.occupation.length - 1">.</span>
            </span>
          </span>
        </div>

        <!-- Organizações -->
        <div v-if="displayArticle.metadata?.organizations?.length" class="info-group">
          <strong>Organizações:</strong>
          <ul class="organizations-list">
            <li v-for="(org, index) in displayArticle.metadata.organizations" :key="index">
              {{ org }}
            </li>
          </ul>
        </div>

        <!-- Nomes alternativos -->
        <div v-if="displayArticle.metadata?.alternativeNames?.length" class="info-group">
          <strong>Nomes alternativos:</strong>
          <span class="alt-names">
            <span v-for="(name, index) in displayArticle.metadata.alternativeNames" :key="index">
              {{ name }}<span v-if="index < displayArticle.metadata.alternativeNames.length - 1">, </span><span v-if="index === displayArticle.metadata.alternativeNames.length - 1">.</span>
            </span>
          </span>
        </div>

        <!-- Temas -->
        <div v-if="displayArticle.metadata?.themes?.length" class="info-group">
          <strong>Temas:</strong>
          <ul class="themes-list">
            <li v-for="(theme, index) in displayArticle.metadata.themes" :key="index">
              {{ theme }}
            </li>
          </ul>
        </div>

        <!-- Períodos -->
        <div v-if="displayArticle.metadata?.periods" class="info-group">
          <strong>Períodos:</strong>
          <div class="periods">
            <div v-if="displayArticle.metadata.periods.main_period">
              Principal: {{ displayArticle.metadata.periods.main_period }}
            </div>
            <div v-if="displayArticle.metadata.periods.france_period">
              França: {{ displayArticle.metadata.periods.france_period }}
            </div>
            <div v-if="displayArticle.metadata.periods.career_period">
              Carreira: {{ displayArticle.metadata.periods.career_period }}
            </div>
          </div>
        </div>
      </div>

      <!-- Conteúdo do Artigo -->
      <div v-if="displayArticle.content_html || displayArticle.content" class="article-section">
        <h2 class="section-title"/>
        <div class="article-content-text">
          <!-- Use content_html directly if available, otherwise process markdown content -->
          <div v-if="displayArticle.content_html" v-html="sanitizeHtml(displayArticle.content_html)" class="html-content"></div>
          <div v-else-if="displayArticle.content" v-html="processContent(displayArticle.content)" class="markdown-content"></div>
        </div>
      </div>

      <!-- Seções adicionais do metadata -->
      <div v-if="displayArticle.metadata?.sections?.length" class="article-section">
        <div v-for="(section, index) in displayArticle.metadata.sections" :key="index" class="content-section">
          <h3 class="section-subtitle">{{ section.title }}</h3>
          <p class="section-content">{{ section.content }}</p>
        </div>
      </div>

      <!-- Obras -->
      <div v-if="displayArticle.metadata?.works?.length" class="article-section">
        <h2 class="section-title">Obras</h2>
        <ul class="works-list">
          <li v-for="(work, index) in displayArticle.metadata.works" :key="index" class="work-item">
            <strong>{{ work.title }}</strong> ({{ work.year }})
            <span v-if="work.location || work.publisher">
              - {{ work.location }}<span v-if="work.location && work.publisher">: </span>{{ work.publisher }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Bibliografia -->
      <div v-if="displayArticle.metadata?.bibliography?.length" class="article-section">
        <h2 class="section-title">Bibliografia</h2>
        <ul class="bibliography-list">
          <li v-for="(ref, index) in displayArticle.metadata.bibliography" :key="index">
            {{ ref.author }} ({{ ref.year }}). <em>{{ ref.title }}</em>
            <span v-if="ref.location && ref.publisher">. {{ ref.location }}: {{ ref.publisher }}</span><span v-else-if="ref.location">. {{ ref.location }}</span><span v-else-if="ref.publisher">. {{ ref.publisher }}</span>.
          </li>
        </ul>
      </div>

      <!-- Autores -->
      <div class="article-section">
        <h2 class="section-title">Autor(es):</h2>
        <ul class="author-list">
          <li>
            {{ displayArticle.author_name }}
            <span v-if="displayArticle.author_institution"> - {{ displayArticle.author_institution }}</span>
            <div v-if="displayArticle.author_email" class="author-email">
              <em>{{ displayArticle.author_email }}</em>
            </div>
          </li>
        </ul>
      </div>

      <p class="updated">Última atualização: {{ formatDate(displayArticle.updated_at) }}</p>
      <p v-if="displayArticle.created_at" class="created">Criado em: {{ formatDate(displayArticle.created_at) }}</p>
    </div>
  </div>
</template>

<script>
import api from '@/services/api';
import {useMarkdown} from "@/composables/markdown.js";
import DOMPurify from 'dompurify';

export default {
  name: 'ArticleView',
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
      // Updated API call for new backend structure
      const response = await api.get(`/submissions/id/${id}`);
      const submission = response.data.data.submission;

      // Map the new database structure directly
      this.loadedArticle = {
        id: submission.id,
        title: submission.title,
        summary: submission.summary,
        content: submission.content,
        content_html: submission.content_html, // New HTML field
        updated_at: submission.updated_at,
        created_at: submission.created_at,
        category: submission.category,
        keywords: submission.keywords || [],
        author_name: submission.author_name,
        author_email: submission.author_email,
        author_institution: submission.author_institution,
        metadata: submission.metadata || {} // Enhanced metadata structure
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
      if (!date) return '';
      return new Date(date).toLocaleDateString('pt-BR');
    },

    formatBirthDeath(birthDeathObj) {
      if (!birthDeathObj) return '';
      let result = '';
      if (birthDeathObj.date) {
        result += this.formatDate(birthDeathObj.date);
      }
      if (birthDeathObj.place) {
        result += result ? `, ${birthDeathObj.place}` : birthDeathObj.place;
      }
      return result;
    },

    sanitizeHtml(html) {
      if (!html) return '';
      // Configure DOMPurify to allow safe HTML tags used in our content
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a'],
        ALLOWED_ATTR: ['href', 'target', 'rel']
      });
    },

    processContent(content) {
      if (!content) return '';
      // Keep original markdown processing for fallback
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
  max-width: 500px;
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

.periods {
  margin-top: 5px;
}

.periods div {
  margin-bottom: 3px;
  font-size: 0.95rem;
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

.section-subtitle {
  font-size: 1.4rem;
  margin-bottom: 10px;
  color: var(--color-heading);
  margin-top: 25px;
}

.content-section {
  margin-bottom: 25px;
}

.section-content {
  margin-bottom: 15px;
  line-height: 1.7;
  text-align: justify;
}

.article-content-text {
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 20px;
  color: var(--color-text);
  text-align: justify;
}

/* HTML content specific styling */
.html-content :deep(p) {
  margin-bottom: 1.2em;
  line-height: 1.8;
}

.html-content :deep(h2) {
  font-size: 1.4rem;
  margin-top: 30px;
  margin-bottom: 15px;
  color: var(--color-heading);
  border-bottom: 1px solid var(--color-heading);
  padding-bottom: 5px;
}

.html-content :deep(h3) {
  font-size: 1.2rem;
  margin-top: 25px;
  margin-bottom: 12px;
  color: var(--color-heading);
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

.author-email {
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.8;
  margin-top: 3px;
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