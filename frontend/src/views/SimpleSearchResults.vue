<template>
  <v-container>
    <h1>Resultados da Pesquisa</h1>
    <v-row v-if="articles.length">
      <v-col
        v-for="article in articles"
        :key="article.id"
        cols="12"
        md="4"
      >
        <v-card @click="$router.push({ name: 'Article', params: { id: article.id, type: 'person' } })">
          <v-card-title>{{ article.attributes.title }}</v-card-title>
          <v-card-subtitle>{{ article.attributes.publishedAt }}</v-card-subtitle>
          <v-card-text>
            <p>{{ article.attributes.summary }}</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-alert v-else type="info">Nenhum resultado encontrado.</v-alert>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      articles: []
    };
  },
  mounted() {
    const results = this.$route.params.results;
    if (results) {
      this.articles = JSON.parse(results);
    }
  }
}
</script>
