<template>
  <div id="article-view" class="article-container">
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <div v-else-if="loading" class="loading">
      Carregando...
    </div>
    <div v-else class="article-content">
      <!-- Título do Artigo -->
      <h1 class="article-title">{{ article.attributes.title }}</h1>

      <!-- Imagens do Artigo -->
      <div v-if="article.attributes.image" class="article-images">
        <img
          v-for="(image, index) in article.attributes.image.data"
          :key="index"
          :src="buildImageUrl(image.attributes.url)"
          :alt="image.attributes.alternativeText || 'Imagem do artigo'"
          class="article-image"
        />
      </div>

      <!-- Autor do Artigo -->
      <div v-if="article.attributes.authors" class="article-authors">
        <h2 class="section-title">Autor(es):</h2>
        <ul class="author-list">
          <li v-for="author in article.attributes.authors.data" :key="author.id">
            {{ author.attributes.name }}
          </li>
        </ul>
      </div>

      <!-- Conteúdo do Artigo -->
      <div v-if="article.attributes.Artigo" class="article-section">
        <h2 class="section-title">Artigo</h2>
        <div v-html="article.attributes.Artigo" class="article-artigo"></div>
      </div>

      <!-- Seções Dinâmicas -->
      <div v-if="article.attributes.Obras" class="section">
        <h2 class="section-title">Obras</h2>
        <p v-html="article.attributes.Obras"></p>
      </div>

      <div v-if="article.attributes.Bibliografia" class="section">
        <h2 class="section-title">Bibliografia</h2>
        <p v-html="article.attributes.Bibliografia"></p>
      </div>

      <!-- Data de Atualização -->
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
      const response = await axios.get(`http://localhost:1337/api/person-articles/${id}?populate[authors]=*&populate[image]=*`);
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
html, body {
  background-color: var(--color-background-soft); /* Mantendo o fundo da página suave */
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
  margin: 20px auto; /* Adicionando espaço ao redor da moldura */
  padding: 20px;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 5px solid var(--transites-light-red); /* Adicionando a moldura */
}

.article-title {
  font-size: 3rem;
  margin-bottom: 15px;
  color: var(--color-heading);
  text-align: left;
  font-weight: bold;
}

.article-authors {
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: var(--color-text);
}

.author-list {
  list-style: none;
  padding: 0;
}

.article-artigo {
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 20px;
  color: var(--color-text);
  text-align: justify;
}

.article-images {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.article-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  object-fit: cover;
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

.section p {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text);
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
