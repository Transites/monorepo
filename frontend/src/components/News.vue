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
              v-for="(entry, index) in entries.slice(0, 9)"  
              :key="entry.id"
            >
              <v-card
                class="news-card"
                :style="getCardStyle(entry.category)"
                @click="$router.push(`article/person/${entry.id}`)"
              >
                <v-card-subtitle class="text-center">{{ entry.category }}</v-card-subtitle>
                <v-card-title class="text-center">{{ entry.title }}</v-card-title>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>


<script>
import axios from 'axios';

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

    async fetchDataFromStrapi() {
      const base_url = import.meta.env.VITE_STRAPI_BASE_URL;

      try {
        // Fazendo a requisição e ordenando pelo ID em ordem decrescente (mais recentes primeiro)
        const response = await axios.get(`${base_url}/api/person-articles?pagination[limit]=8&populate=categories&sort=id:desc`);
        
        // Filtrando manualmente os 9 artigos mais recentes
        this.entries = response.data.data.slice(0, 9).map(entry => ({
          title: entry.attributes.title,
          id: entry.id,
          category: entry.attributes.categories.data.length
            ? entry.attributes.categories.data[0].attributes.name
            : 'Uncategorized'
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
.news-container .v-card-title,
.news-container .v-card-subtitle {
  margin-bottom: 0; /* Remove espaçamento extra */
  margin-top: 1px; /* Remove margem superior */
  text-align: center; /* Centraliza o texto */
}

.news-container .v-card-subtitle {
  margin-bottom: 8px; /* Um pequeno espaço entre a categoria e o título */
  font-size: 0.875rem; /* Um pouco menor para a categoria */
}

.news-container .v-card-title {
  margin-top: 8px; /* Aproxima o título da categoria */
  font-size: 1rem; /* Mantém um bom tamanho de título */
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

