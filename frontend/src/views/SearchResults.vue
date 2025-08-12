<template>
  <div style="padding-top: 80px">
    <v-container>
      <h2 class="mb-6" style="font-weight: 300; color: #2c3e50;">Resultados da Pesquisa</h2>

      <!-- Loading state -->
      <div v-if="isLoading" class="text-center my-12">
        <v-progress-circular
            indeterminate
            color="primary"
            size="64"
        ></v-progress-circular>
        <p class="mt-4 text-grey-600">Carregando resultados...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center my-12">
        <v-alert
            type="error"
            title="Erro"
            :text="error"
            rounded="xl"
            class="mx-auto"
            max-width="500"
        ></v-alert>
      </div>

      <!-- Results state -->
      <div v-else-if="filteredResults.length">
        <v-row>
          <v-col v-for="entry in filteredResults" :key="entry.id" cols="12" sm="6" lg="4">
            <v-card
                class="search-result-card mx-auto"
                max-width="380"
                elevation="0"
                rounded="xl"
                style="
                position: relative;
                border: 1px solid rgba(0,0,0,0.08);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
              "
                @mouseenter="onCardHover"
                @mouseleave="onCardLeave"
            >
              <!-- Link invisível dentro do card -->
              <a
                  :href="`/article/${entry.type}/${entry.id}`"
                  @click.prevent="(event) => handleLinkClick(event, entry)"
                  style="position: absolute; inset: 0; z-index: 2; cursor: pointer;"
                  :aria-label="entry.title"
              ></a>

              <!-- Conteúdo do card -->
              <div style="position: relative; z-index: 1; pointer-events: none;">

                <!-- Header com foto -->
                <div class="d-flex align-center pa-4 pb-2">
                  <v-avatar
                      size="48"
                      class="mr-3"
                      style="
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      border: 3px solid white;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    "
                  >
                    <v-icon color="white" size="24">
                      {{ getEntryIcon(entry.type) }}
                    </v-icon>
                  </v-avatar>

                  <div class="flex-grow-1">
                    <div class="text-capitalize text-grey-600 mb-1" style="font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                      {{ entry.subtitle || 'Artigo' }}
                    </div>
                  </div>
                </div>

                <!-- Título -->
                <v-card-title
                    class="px-4 pt-2 pb-3"
                    style="
                    font-size: 1.1rem;
                    font-weight: 600;
                    line-height: 1.4;
                    color: #2d3748;
                  "
                >
                  {{ entry.title }}
                </v-card-title>

                <!-- Tags -->
                <div class="px-4 pb-4">
                  <div v-if="entry.tags && entry.tags.length" class="d-flex flex-wrap gap-2">
                    <v-chip
                        v-for="tag in entry.tags.slice(0, 3)"
                        :key="tag.name"
                        size="small"
                        variant="tonal"
                        rounded="pill"
                        style="
                        height: 24px;
                        font-size: 0.75rem;
                        font-weight: 500;
                        background-color: rgba(102, 126, 234, 0.1);
                        color: #4c51bf;
                      "
                    >
                      {{ tag.name }}
                    </v-chip>
                    <v-chip
                        v-if="entry.tags.length > 3"
                        size="small"
                        variant="tonal"
                        rounded="pill"
                        color="grey"
                        style="height: 24px; font-size: 0.75rem;"
                    >
                      +{{ entry.tags.length - 3 }}
                    </v-chip>
                  </div>
                  <div v-else>
                    <v-chip
                        size="small"
                        variant="outlined"
                        rounded="pill"
                        color="grey-lighten-1"
                        style="height: 24px; font-size: 0.75rem; opacity: 0.7;"
                    >
                      Sem tags
                    </v-chip>
                  </div>
                </div>

                <!-- Indicador de hover -->
                <div
                    class="hover-indicator"
                    style="
                    position: absolute;
                    bottom: 0;
                    right: 16px;
                    width: 4px;
                    height: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 2px;
                    transition: height 0.3s ease;
                  "
                ></div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center my-12">
        <div
            style="
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            box-shadow: 0 8px 32px rgba(240, 147, 251, 0.3);
          "
        >
          <v-icon size="40" color="white">mdi-magnify-close</v-icon>
        </div>
        <h3 class="mb-2" style="color: #4a5568; font-weight: 400;">
          Nenhum resultado encontrado
        </h3>
        <p class="text-grey-600">
          Não encontramos resultados para "<strong>{{ searchQuery }}</strong>"
        </p>
      </div>
    </v-container>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  methods: {
    handleLinkClick(event, entry) {
      const path = `/article/${entry.type}/${entry.id}`;

      if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        this.$router.push(path);
      }
    },

    onCardHover(event) {
      const card = event.currentTarget;
      const indicator = card.querySelector('.hover-indicator');

      // Animações no hover
      card.style.transform = 'translateY(-4px)';
      card.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
      card.style.borderColor = 'rgba(102, 126, 234, 0.3)';

      if (indicator) {
        indicator.style.height = '100%';
      }
    },

    onCardLeave(event) {
      const card = event.currentTarget;
      const indicator = card.querySelector('.hover-indicator');

      // Reset das animações
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
      card.style.borderColor = 'rgba(0,0,0,0.08)';

      if (indicator) {
        indicator.style.height = '0';
      }
    },

    getEntryIcon(type) {
      const icons = {
        'pessoa': 'mdi-account-outline',
        'submission': 'mdi-file-document-outline',
        'book': 'mdi-book-open-variant',
        'research': 'mdi-flask-outline',
        'thesis': 'mdi-school-outline',
        'paper': 'mdi-file-document-edit-outline'
      };
      return icons[type] || 'mdi-file-outline';
    },

    getEntryTypeLabel(type) {
      const labels = {
        'article': 'Artigo',
        'book': 'Livro',
        'research': 'Pesquisa',
        'thesis': 'Tese',
        'paper': 'Paper'
      };
      return labels[type] || 'Documento';
    },

    getTypeColor(type) {
      const colors = {
        'article': 'blue',
        'book': 'green',
        'research': 'purple',
        'thesis': 'orange',
        'paper': 'teal'
      };
      return colors[type] || 'grey';
    }
  },

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

<style scoped>
.search-result-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.search-result-card:hover {
  cursor: pointer;
}

.gap-2 > * {
  margin-right: 8px;
  margin-bottom: 4px;
}

.gap-2 > *:last-child {
  margin-right: 0;
}
</style>