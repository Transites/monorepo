<template>
  <div :style="propStyle" class="news-container">
    <h1 style="color: var(--transites-blue)">Novidades</h1>
    <v-container>
      <v-row align="center">
        <v-col cols="12" lg="9">
          <v-row>
            <v-col
              cols="12"
              sm="6"
              v-for="entry in entries"
              :key="entry"
            >
              <v-card
                style="color: var(--transites-blue)"
                :title="entry.title"
                :subtitle="entry.category"
                @click="$router.push(`article/person/${entry.id}`)"
              >
              </v-card>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="12" lg="3" align="center">
          <v-card
            width="100%"
            max-height="450px"
            style="aspect-ratio: auto 3/4"
          >
            <v-img
              class="align-end text-white"
              :src="url_news_image"
              cover
              align="start"
            >
              <v-card-title style="color: var(--transites-blue)">Verbete</v-card-title>
            </v-img>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>


<script>
import axios from 'axios'
export default {
  props: {
    padding: {
      default: "70px"
    }
  },
  mounted() {
    this.fetchDataFromStrapi()
    this.fetchImagesFromStrapi()
  },
  data: () => ({
    entries: null,
    url_news_image : ""
  }),
  computed: {
    propStyle () {
      return {
        '--prop-padding': this.padding,
      }
    }
  },
  methods:{
  fetchDataFromStrapi() {
      const base_url = import.meta.env.VITE_STRAPI_BASE_URL

      try {
        axios.get(`${base_url}/api/person-articles/?pagination[limit]=8&populate=categories&sort=createdAt:desc`).then((response) => {
          this.raw_response = response.data.data
          this.entries = this.raw_response.map((entry) => {
          return {
            title: entry.attributes.title,
            id: entry.id,
            category: entry.attributes.categories.data.length
              ? entry.attributes.categories.data[0].attributes.name
              : 'Uncategorized'
          }
          })
        })
      } catch (error) {
        this.error = error
      }
    },
    fetchImagesFromStrapi() {
      const base_url = import.meta.env.VITE_STRAPI_BASE_URL

      try {
        axios.get(`${base_url}/api/person-articles/?pagination[limit]=8&populate=image&sort=createdAt:desc`).then((response) => {
          this.imageData = response.data.data
          if (this.imageData && this.imageData.length > 0) {
            for (const item of this.imageData) {
              if (item.attributes.image.data) {
                const formats = item.attributes.image.data.attributes.formats;
                const key = Object.keys(formats)[0];

                this.url_news_image = formats[key].url;
                return null;
              }
            }
          }
          return null;
        }).catch(error => {this.error = true})
      } catch (error) {
        this.error = error
      }
    }
  }
}
</script>

<style>
.news-container {
  padding: var(--prop-padding);
}
</style>
