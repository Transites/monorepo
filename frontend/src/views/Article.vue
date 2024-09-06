<template>
  <div id="article-view" class="article-container">
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <div v-else-if="loading" class="loading">
      Carregando...
    </div>
    <div v-else class="article-content">
      <h1 class="article-title">{{ article.attributes.title }}</h1>

      <div class="image-and-info">
        <!-- Imagem e legenda -->
        <div v-if="article.attributes.Image.data" class="article-images">
          <div v-for="(image, index) in article.attributes.Image.data" :key="index" class="image-container">
            <img
              v-if="image.attributes.formats && image.attributes.formats.small"
              :src="buildImageUrl(image.attributes.formats.small.url)"
              :alt="image.attributes.alternativeText || 'Imagem do artigo'"
              class="article-image"
            />
            <p v-if="image.attributes.caption" class="image-caption">{{ image.attributes.caption }}</p>
          </div>
        </div>

        <!-- Informações ao lado da imagem -->
        <div class="article-info">
          <!-- Nascimento e Falecimento -->
          <p v-if="article.attributes.birth && article.attributes.birth.date">
            <strong>Nascimento:</strong> {{ formatDate(article.attributes.birth.date) }}, {{ article.attributes.birth.place }}
          </p>
          
          <p v-if="article.attributes.death && article.attributes.death.date">
            <strong>Falecimento:</strong> {{ formatDate(article.attributes.death.date) }}, {{ article.attributes.death.place }}
          </p>

          <p v-if="article.attributes.summary"> 
            {{ article.attributes.summary }}
          </p>

          <!-- França e Brasil -->
          <div v-if="article.attributes.Franca && article.attributes.Franca.length">
            <strong>França:</strong>
            <ul>
              <li v-for="publication in article.attributes.Franca" :key="publication.id">
                {{ publication.title }}, {{ publication.date }}
              </li>
            </ul>
          </div>

          <div v-if="article.attributes.Brasil && article.attributes.Brasil.length">
            <strong>Brasil:</strong>
            <ul>
              <li v-for="publication in article.attributes.Brasil" :key="publication.id">
                {{ publication.title }}, {{ publication.date }}
              </li>
            </ul>
          </div>

          <!-- Abertura e Fechamento -->
          <p v-if="article.attributes.Abertura && article.attributes.Abertura.length">
            <strong>Abertura:</strong> 
            <span v-for="(abertura, index) in article.attributes.Abertura" :key="index">
              {{ formatDate(abertura.date) }}, {{ abertura.place }}
            </span>
          </p>

          <p v-if="article.attributes.Fechamento && article.attributes.Fechamento.length">
            <strong>Fechamento:</strong> 
            <span v-for="(fechamento, index) in article.attributes.Fechamento" :key="index">
              {{ formatDate(fechamento.date) }}, {{ fechamento.place }}
            </span>
          </p>

          <!-- Início e Fim -->
          <p v-if="article.attributes.inicio && article.attributes.inicio.date">
            <strong>Início:</strong> {{ formatDate(article.attributes.inicio.date) }}, {{ article.attributes.inicio.place }}
          </p>

          <p v-if="article.attributes.fim && article.attributes.fim.length">
            <strong>Fim:</strong> 
            <span v-for="(fim, index) in article.attributes.fim" :key="index">
              {{ formatDate(fim.date) }}, {{ fim.place }}
            </span>
          </p>

          <!-- Eventos -->
          <div v-if="article.attributes.Eventos && article.attributes.Eventos.length">
            <strong>Eventos:</strong>
            <ul>
              <li v-for="evento in article.attributes.Eventos" :key="evento.id">
                {{ formatDate(evento.date) }}: {{ evento.description }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Artigo -->
      <div v-if="article.attributes.Artigo" class="article-section">
        <h2 class="section-title">Artigo</h2>
        <div v-html="article.attributes.Artigo" class="article-artigo"></div>
      </div>

      <!-- Obras -->
      <div v-if="article.attributes.Obras" class="section">
        <h2 class="section-title">Obras</h2>
        <p v-html="article.attributes.Obras"></p>
      </div>

      <!-- Bibliografia -->
      <div v-if="article.attributes.Bibliografia" class="section">
        <h2 class="section-title">Bibliografia</h2>
        <p v-html="article.attributes.Bibliografia"></p>
      </div>

      <!-- Autores -->
      <div v-if="article.attributes.authors" class="article-authors">
        <h2 class="section-title">Autor(es):</h2>
        <ul class="author-list">
          <li v-for="author in article.attributes.authors.data" :key="author.id">
            {{ author.attributes.name }}
          </li>
        </ul>
      </div>

      <p class="updated">Última atualização: {{ formatDate(article.attributes.updatedAt) }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Article',
  data() {
    return {
      article: null,
      error: null,
      loading: true,
    };
  },
  async mounted() {
    const { id } = this.$route.params;
    try {
      const response = await axios.get(`http://localhost:1337/api/person-articles/${id}?populate=authors,Image`);
      this.article = response.data.data;
    } catch (error) {
      this.error = 'Não foi possível carregar o verbete.';
    } finally {
      this.loading = false;
    }
  },
  methods: {
    buildImageUrl(path) {
      return `http://localhost:1337${path}`;
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
  font-size: 0.9rem;
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
