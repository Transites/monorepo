<template>
  <div style="padding-top: 80px">
    <v-form ref="emailForm">
      <v-container>
        <v-row>
          <v-col>
            <v-text-field label="Pesquisa Textual"></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-select
              v-model="Search.PrimaryValue"
              :items="PrimaryTags"
              chips
              label="Categoria"
              multiple
            ></v-select>
          </v-col>
          <v-col>
            <v-select
              v-model="Search.SecondaryValue"
              :items="SecondaryTags"
              chips
              label="Tipo de Verbete"
              multiple
            ></v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field type="date" label="De"></v-text-field>
          </v-col>
          <v-col>
            <v-text-field type="date" label="Até"></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-btn
              class="text-white"
              type="submit"
              color="var(--transites-red)"
              @click.prevent="applySearch"
              block
              >Buscar</v-btn
            >
          </v-col>
        </v-row>
      </v-container>
    </v-form>
    <div class="results">

      <v-card
        v-for="entry in searchResult"
        :key="entry"
        class="mx-auto my-8"
        max-width="344"
        elevation="16"
        @click="$router.push(`/article/person/${entry.id}`)"
      >
        <v-card-item>
          <v-card-title> {{ entry.title }} </v-card-title>
          <v-card-subtitle> {{ entry.subtitle }} </v-card-subtitle>
        </v-card-item>

        <v-card-text>
          {{ entry.text }}
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data: () => ({
    Search: {
      PrimaryValue: [],
      SecondaryValue: []
    },
    PrimaryTags: ['Artes', 'Ciências'],
    SecondaryTags: ['Pessoa', 'Obra', 'Instituição', 'Logradouro'],
    searchResult: []
  }),
  methods: {
    applySearch() {
      const base_url = import.meta.env.VITE_STRAPI_BASE_URL
      axios
        .get(`${base_url}/api/person-articles?populate=tags`)
        .then((response) => {
          this.raw_response = response.data.data
          this.searchResult = this.raw_response.map((entry) => {
            return {
              id: entry.id,
              title: entry.attributes.title,
              text: entry.attributes.summary,
              tags: entry.attributes.tags.data.map(tag => {
                tag.attributes.name
              })
            }
          })
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }
}
</script>

<style>
.results {
  display: flex;
  flex-wrap: wrap;
}
</style>
