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

      <!-- Sumário -->
      <p v-html="article.attributes.summary" class="article-summary"></p>
      
      <!-- Imagens -->
      <div v-if="article.attributes.image" class="article-images">
        <img 
          :src="getFullImageUrl(article.attributes.image.url)" 
          :alt="article.attributes.image.alternativeText || 'Imagem do artigo'" 
          class="article-image" 
        />
      </div>

      <!-- Seções Dinâmicas -->
      <div v-if="article.attributes.Obras" class="section">
        <h2>Obras</h2>
        <p v-html="article.attributes.Obras"></p>
      </div>
      
      <div v-if="article.attributes.Bibliografia" class="section">
        <h2>Bibliografia</h2>
        <p v-html="article.attributes.Bibliografia"></p>
      </div>
      
      <!-- Data de Atualização -->
      <p class="updated">Última atualização: {{ new Date(article.attributes.updatedAt).toLocaleDateString() }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Article',
  data() {
    return {
      article: null,
      error: null,
      loading: true
    }
  },
  async mounted() {
    const { id } = this.$route.params;
    try {
      const response = await axios.get(`http://localhost:1337/api/person-articles/${id}?populate=*`);
      this.article = response.data.data;
      this.loading = false;
    } catch (error) {
      this.error = 'Não foi possível carregar o verbete.';
      this.loading = false;
    }
  },
  methods: {
    getFullImageUrl(imagePath) {
      return `http://localhost:1337${imagePath}`;
    }
  }
}
</script>

<style scoped>
.article-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.article-title {
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.article-summary {
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 20px;
  color: #555;
}

.article-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.article-image {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.section {
  margin-top: 20px;
}

.section h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  color: #444;
}

.section p {
  font-size: 1rem;
  line-height: 1.6;
  color: #666;
}

.updated {
  font-size: 0.9rem;
  color: #999;
  margin-top: 20px;
  text-align: right;
}

.error {
  color: red;
  font-size: 1.2rem;
  text-align: center;
}

.loading {
  font-size: 1.2rem;
  text-align: center;
  color: #333;
}
</style>
