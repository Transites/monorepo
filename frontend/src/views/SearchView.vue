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
          style="position: relative;"
        >
          <!-- Link invisível dentro do card -->
          <a
            :href="`/article/person/${entry.id}`"
            @click.prevent="(event) => handleLinkClick(event, entry)"
            style="position: absolute; inset: 0; z-index: 1; cursor: pointer;"
            :aria-label="entry.title"
          ></a>

          <!-- Conteúdo do card -->
          <div style="position: relative; z-index: 0; pointer-events: none;">
            <v-card-item>
              <v-card-title> {{ entry.title }} </v-card-title>
              <v-card-subtitle> {{ entry.subtitle }} </v-card-subtitle>
              <v-chip v-for="tag in entry.tags" :key="tag" color="primary"> {{ tag.name }}</v-chip>
            </v-card-item>

            <v-card-text>
              {{ entry.text }}
            </v-card-text>
          </div>
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
      handleLinkClick(event, entry) {
        const path = `/article/person/${entry.id}`;

        if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.$router.push(path);
        }
      },
      applySearch() {
        const base_url = import.meta.env.VITE_API_BASE_URL || ''
        axios
          .get(`${base_url}/api/submissions`, {
            params: {
              search: this.Search.PrimaryValue.join(' ') || undefined,
              top: 50,
              skip: 0
            }
          })
          .then((response) => {
            this.raw_response = response.data.submissions
            this.searchResult = this.raw_response.map((entry) => {
              return {
                id: entry.id,
                title: entry.title,
                subtitle: entry.category || '',
                text: entry.summary,
                tags: (entry.keywords || []).map((keyword) => {
                  return {
                    name: keyword
                  }
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
