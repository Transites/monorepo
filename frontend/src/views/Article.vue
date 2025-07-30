<template>
  <div id="article-view" class="article-container">
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <div v-else-if="loading" class="loading">
      Carregando...
    </div>
    <div v-else class="article-content">
      <h1 class="article-title">{{ displayArticle.attributes.title }}</h1>

      <div class="image-and-info">
        <!-- Imagem e legenda -->
        <div v-if="displayArticle.attributes.Image?.data" class="article-images">
          <div v-for="(image, index) in displayArticle.attributes.Image.data" :key="index" class="image-container">
            <img
              :src="previewMode ? image.attributes.url : buildImageUrl(image.attributes.formats?.small?.url || image.attributes.url)"
              :alt="image.attributes.alternativeText || 'Imagem do artigo'"
              class="article-image"
            />
            <p v-if="image.attributes.caption" class="image-caption">{{ image.attributes.caption }}</p>
          </div>
        </div>

        <!-- Informações ao lado da imagem -->
        <div class="article-info">
          <!-- Nascimento e Falecimento -->
          <p v-if="displayArticle.attributes.birth && displayArticle.attributes.birth.data">
            <strong>Nascimento:</strong> {{ formatDate(displayArticle.attributes.birth.data) }}, {{ displayArticle.attributes.birth.local }}
          </p>

          <p v-if="displayArticle.attributes.death && displayArticle.attributes.death.data">
            <strong>Falecimento:</strong> {{ formatDate(displayArticle.attributes.death.data) }}, {{ displayArticle.attributes.death.local || 'Desconhecido' }}
          </p>

          <p v-if="displayArticle.attributes.summary">
            {{ displayArticle.attributes.summary }}
          </p>

          <!-- França -->
          <div v-if="displayArticle.attributes.Franca && displayArticle.attributes.Franca.length">
            <strong>França:</strong>
            <ul>
              <li v-for="publication in displayArticle.attributes.Franca" :key="publication.id">
                {{ publication.title }}
              </li>
            </ul>
          </div>

          <!-- Brasil -->
          <div v-if="displayArticle.attributes.Brasil && displayArticle.attributes.Brasil.length">
            <strong>Brasil:</strong>
            <ul>
              <li v-for="publication in displayArticle.attributes.Brasil" :key="publication.id">
                {{ publication.title }}
              </li>
            </ul>
          </div>

          <!-- Abertura -->
          <div v-if="displayArticle.attributes.Abertura && displayArticle.attributes.Abertura.length">
            <strong>Abertura:</strong>
            <ul>
              <li v-for="(abertura, index) in displayArticle.attributes.Abertura" :key="index">
                 {{ abertura.place }}
              </li>
            </ul>
          </div>

          <!-- Fechamento -->
          <div v-if="displayArticle.attributes.Fechamento && displayArticle.attributes.Fechamento.length">
            <strong>Fechamento:</strong>
            <ul>
              <li v-for="(fechamento, index) in displayArticle.attributes.Fechamento" :key="index">
                 {{ fechamento.place }}
              </li>
            </ul>
          </div>

          <!-- Início -->
          <div v-if="displayArticle.attributes.inicio && displayArticle.attributes.inicio.place">
            <strong>Início:</strong>
            <p>{{ displayArticle.attributes.inicio.place }}</p>
          </div>

          <!-- Fim -->
          <div v-if="displayArticle.attributes.fim && displayArticle.attributes.fim.place">
            <strong>Fim:</strong>
            <p>{{ displayArticle.attributes.fim.place }}</p>
          </div>

          <!-- Eventos -->
          <div v-if="displayArticle.attributes.Eventos && displayArticle.attributes.Eventos.length">
            <strong>Eventos:</strong>
            <ul>
              <li v-for="evento in displayArticle.attributes.Eventos" :key="evento.id">
                {{ evento.local }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Artigo -->
      <div v-if="displayArticle.attributes.Artigo" class="article-section">
        <h2 class="section-title">Artigo</h2>
        <div v-html="displayArticle.attributes.Artigo" class="article-artigo"></div>
      </div>

      <!-- Obras -->
      <div v-if="displayArticle.attributes.Obras" class="section">
        <h2 class="section-title">Obras</h2>
        <p v-html="displayArticle.attributes.Obras"></p>
      </div>

      <!-- Bibliografia -->
      <div v-if="displayArticle.attributes.Bibliografia" class="section">
        <h2 class="section-title">Bibliografia</h2>
        <p v-html="displayArticle.attributes.Bibliografia"></p>
      </div>

      <!-- Autores -->
      <div v-if="displayArticle.attributes.authors" class="article-authors">
        <h2 class="section-title">Autor(es):</h2>
        <ul class="author-list">
          <li v-for="author in displayArticle.attributes.authors.data" :key="author.id">
            {{ author.attributes.name }} 
            <span v-if="author.attributes.institution"> - {{ author.attributes.institution }}</span>
          </li>
        </ul>
      </div>

      <p class="updated">Última atualização: {{ formatDate(displayArticle.attributes.updatedAt) }}</p>
    </div>
  </div>
</template>

<script>
import api from '@/services/api';

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
    }
  },
  async mounted() {
    if (this.previewMode || this.article) {
      // If in preview mode or article is provided via props, use that
      this.loading = false;
      return;
    }

    const { id } = this.$route.params;
    try {
      const response = await api.get(`/submissions/${id}`);
      
      // Transform the submission data to match the expected structure
      const submission = response.data.submission;
      const metadata = submission.metadata || {};
      
      this.loadedArticle = {
        id: submission.id,
        attributes: {
          title: submission.title,
          summary: submission.summary,
          content: submission.content,
          updatedAt: submission.updated_at,
          
          // Map metadata fields to expected structure
          Artigo: submission.content,
          Bibliografia: metadata.bibliography,
          Obras: metadata.works,
          
          // Handle authors
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
          
          // Handle images if available in metadata
          Image: metadata.images ? {
            data: metadata.images.map((img, index) => ({
              id: index,
              attributes: {
                url: img.url,
                alternativeText: img.alt || '',
                caption: img.caption || '',
                formats: {
                  small: { url: img.url }
                }
              }
            }))
          } : null,
          
          // Map other metadata fields
          birth: metadata.birth,
          death: metadata.death,
          Franca: metadata.france || [],
          Brasil: metadata.brazil || [],
          Abertura: metadata.opening || [],
          Fechamento: metadata.closing || [],
          inicio: metadata.start || {},
          fim: metadata.end || {},
          Eventos: metadata.events || []
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
    buildImageUrl(path) {
      return `${import.meta.env.VITE_STRAPI_BASE_URL}${path}`;
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
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

.article-info {
  flex: 1;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text);
}

.article-artigo {
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 20px;
  color: var(--color-text);
  text-align: justify;
}

.section {
  margin-top: 20px;
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
</style>
