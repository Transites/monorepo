<template>
  <div style="padding-top: 80px">
    <v-container>
      <h2>Resultados da Pesquisa</h2>

      <!-- Loading state -->
      <div v-if="isLoading" class="text-center my-8">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <p class="mt-4">Carregando resultados...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center my-8">
        <v-alert type="error" title="Erro" :text="error"></v-alert>
      </div>

      <!-- Results state -->
      <div v-else-if="filteredResults.length">
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

      <!-- Empty state -->
      <div v-else class="text-center my-8">
        <v-icon size="64" color="grey">mdi-magnify-close</v-icon>
        <p class="mt-4">Nenhum resultado encontrado para "{{ searchQuery }}".</p>
      </div>
    </v-container>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  mounted() {
    // If there's a query parameter, update the store and perform search
    const query = this.$route.query.q;
    if (query && query !== this.searchQuery) {
      this.$store.dispatch('search/setSearchQuery', query);
      this.$store.dispatch('search/performSearch');
    }
  },
  computed: {
    ...mapState('search', [
      'results',
      'searchQuery',
      'isLoading',
      'error'
    ]),
    ...mapGetters('search', [
      'filteredResults'
    ])
  }
};
</script>
