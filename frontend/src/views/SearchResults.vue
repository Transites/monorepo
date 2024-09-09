<template>
  <div style="padding-top: 80px">
    <v-container>
      <h2>Resultados da Pesquisa</h2>
      <div v-if="filteredResults.length">
        <v-row>
          <v-col v-for="entry in filteredResults" :key="entry.id" cols="12" md="6" lg="4">
            <v-card
              class="mx-auto my-8"
              max-width="344"
              elevation="16"
              @click="$router.push(`/article/${entry.type}/${entry.id}`)"
            >
              <v-card-item>
                <v-card-title>{{ entry.title }}</v-card-title>
                <v-card-subtitle>{{ entry.subtitle }}</v-card-subtitle>
                <div v-if="entry.tags && entry.tags.length">
                  <v-chip v-for="tag in entry.tags" :key="tag.name" color="primary" class="mr-1">
                    {{ tag.name }}
                  </v-chip>
                </div>
                <div v-else>
                  <v-chip color="grey" class="mr-1">Sem tags</v-chip>
                </div>
              </v-card-item>

              <v-card-text>
                {{ entry.text }}
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
      <div v-else>
        <p>Nenhum resultado encontrado.</p>
      </div>
    </v-container>
  </div>
</template>

<script>
export default {
  data() {
    return {
      results: [],
      searchTerm: '',
    };
  },
  mounted() {
    const results = this.$route.query.results;
    this.searchTerm = this.$route.query.searchTerm || '';

    if (results) {
      this.results = JSON.parse(results).map(entry => ({
        id: entry.id,
        type: entry.type || 'person-articles',
        title: entry.title || 'Título indisponível',
        subtitle: entry.subtitle || 'Subtítulo indisponível',
        text: entry.text || 'Resumo indisponível',
        tags: entry.tags?.map(tag => ({
          name: tag.name
        })) || []
      }));
    }
  },
  computed: {
    filteredResults() {
      if (this.searchTerm.trim() === '') {
        return this.results;
      }
      return this.results.filter(entry =>
        entry.title && entry.title.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }
};
</script>