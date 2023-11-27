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
    <div>
      <v-card
    class="mx-auto my-8"
    max-width="344"
    elevation="16"
  >
    <v-card-item>
      <v-card-title>
        Card title
      </v-card-title>
      <v-card-subtitle>
        Card subtitle secondary text
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    </v-card-text>
  </v-card>
  <v-card
    class="mx-auto my-8"
    max-width="344"
    elevation="16"
  >
    <v-card-item>
      <v-card-title>
        Card title
      </v-card-title>
      <v-card-subtitle>
        Card subtitle secondary text
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    </v-card-text>
  </v-card>
  <v-card
    class="mx-auto my-8"
    max-width="344"
    elevation="16"
  >
    <v-card-item>
      <v-card-title>
        Card title
      </v-card-title>
      <v-card-subtitle>
        Card subtitle secondary text
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    </v-card-text>
  </v-card>
  <v-card
    class="mx-auto my-8"
    max-width="344"
    elevation="16"
  >
    <v-card-item>
      <v-card-title>
        Card title
      </v-card-title>
      <v-card-subtitle>
        Card subtitle secondary text
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    </v-card-text>
  </v-card>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    Search: {
      PrimaryValue: [],
      SecondaryValue: []
    },
    PrimaryTags: ['Artes', 'Ciências'],
    SecondaryTags: ['Pessoa', 'Obra', 'Instituição', 'Logradouro']
  }),
  methods: {
    applySearch() {}
  }
}
</script>

<style></style>
