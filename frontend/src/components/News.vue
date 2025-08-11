<template>
  <div :style="propStyle" class="news-container">
    <h1 style="color: var(--transites-blue)">Novidades</h1>
    <v-container fluid>
      <v-row align="center" justify="center" no-gutters>
        <v-col cols="12" lg="9">
          <v-row justify="center">
            <!-- Aqui garantimos que só serão mostrados 9 artigos -->
            <v-col
              cols="12"
              sm="6"
              md="4"
              v-for="(entry, ) in entries.slice(0, 9)"
              :key="entry.id"
            >
              <div style="position: relative;">
                <v-card
                    class="news-card"
                    :style="getCardStyle(entry.category)"
                >
                  <a
                      :href="`/article/person/${entry.id}`"
                      @click.prevent="handleCardLinkClick($event, entry.id)"
                      style="position: absolute; inset: 0; z-index: 1;"
                      :aria-label="`Ler artigo: ${entry.title}`"
                  ></a>

                  <div style="position: relative; z-index: 2; pointer-events: none;">
                    <v-card-title>{{ entry.title }}</v-card-title>
                    <v-card-subtitle>{{ entry.category }}</v-card-subtitle>
                  </div>
                </v-card>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import axios from 'axios';
import api from "@/services/api";

export default {
  props: {
    padding: {
      default: "70px"
    }
  },
  mounted() {
    this.fetchDataFromStrapi();
  },
  data: () => ({
    entries: [],
    error: null,
  }),
  computed: {
    propStyle() {
      return {
        '--prop-padding': this.padding,
      }
    }
  },
  methods: {
    // Método para definir as cores dos cards com base na categoria
    getCardStyle(category) {
      switch (category.toLowerCase()) {
        case 'pessoa':
          return 'background-color: var(--transites-blue); color: white;';
        case 'instituição':
          return 'background-color: var(--transites-red); color: white;';
        case 'obra':
          return 'background-color: var(--transites-yellow); color: white;';
        case 'evento':
          return 'background-color: var(--transites-light-purple); color: white;';
        case 'grupo':
          return 'background-color: var(--transites-light-red); color: white;';
        default:
          return 'background-color: var(--transites-gray-purple); color: white;';
      }
    },

    handleCardLinkClick(event, entryId) {
      // Apenas previne o comportamento padrão para clique esquerdo normal
      if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        this.$router.push(`article/person/${entryId}`);
      }
    },

    async fetchDataFromStrapi() {
      try {
        // Fazendo a requisição para obter as submissões mais recentes
        const response = await api.get(`/submissions`, {
          params: {
            top: 9,
            skip: 0
          }
        });

        // Mapeando os dados para o formato esperado pelo componente
        this.entries = response.data.submissions.map(entry => ({
          title: entry.title,
          id: entry.id,
          category: entry.category || 'Uncategorized'
        }));

      } catch (error) {
        this.error = error;
      }
    }
  }
}
</script>

<style>
.news-container {
  padding: var(--prop-padding, 30px); /* Manter o mesmo padding */
}

.news-container .v-card {
  margin-bottom: 20px; /* Espaçamento entre os cards */
  transition: transform 0.3s ease; /* Animação suave */
}

.news-container .v-row {
  margin: 0; /* Remove o margin padrão da linha */
}

.news-container .v-col {
  padding: 0; /* Remove o padding padrão das colunas */
}

.news-card:hover {
  transform: translateY(-5px); /* Efeito de elevação ao passar o mouse */
}

.news-container {
  overflow: hidden; /* Evita que o conteúdo exceda o container */
}
</style>
