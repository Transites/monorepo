<template>
  <div :style="propStyle" class="news-container">
    <h1 style="color: var(--transites-blue)">Novidades</h1>
    <v-container fluid>
      <v-row align="center" justify="center" no-gutters>
        <v-col cols="12" lg="9">
          <v-row justify="center">
            <v-col
              cols="12"
              sm="6"
              md="4"
              v-for="entry in entries"
              :key="entry.id"
            >
              <v-card
                class="news-card"
                style="background-color: var(--transites-blue); color: white; height: 100%;"
                @click="$router.push(`article/person/${entry.id}`)"
              >
                <v-card-title>{{ entry.title }}</v-card-title>
                <v-card-subtitle>{{ entry.category }}</v-card-subtitle>
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
    this.fetchImagesFromStrapi();
  },
  data: () => ({
    entries: [],
    url_news_image: "",
    title_news_image: "",
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
    async fetchDataFromStrapi() {
      const base_url = import.meta.env.VITE_STRAPI_BASE_URL;

      try {
        const response = await axios.get(`${base_url}/api/person-articles/?pagination[limit]=8&populate=categories&sort=createdAt:desc`);
        this.entries = response.data.data.map(entry => ({
          title: entry.attributes.title,
          id: entry.id,
          category: entry.attributes.categories.data.length
            ? entry.attributes.categories.data[0].attributes.name
            : 'Uncategorized'
        }));
      } catch (error) {
        this.error = error;
      }
    },
    async fetchImagesFromStrapi() {
      const base_url = import.meta.env.VITE_STRAPI_BASE_URL;

      try {
        const response = await axios.get(`${base_url}/api/person-articles/?pagination[limit]=8&populate=image&sort=createdAt:desc`);
        this.imageData = response.data.data;

        if (this.imageData && this.imageData.length > 0) {
          for (const item of this.imageData) {
            if (item.attributes.image.data) {
              const formats = item.attributes.image.data.attributes.formats;
              const key = Object.keys(formats)[0];

              this.title_news_image = item.attributes.title;
              this.url_news_image = formats[key].url;
              return null;
            }
          }
        }
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
