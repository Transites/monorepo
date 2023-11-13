<template>
  <div style="padding-top: 80px">
    <v-row>
      <v-col cols="12">
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
      <v-col>
        <v-btn>Buscar</v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  data: () => ({

    Search: {
      PrimaryValue: [],
      SecondaryValue: [],
    },
    PrimaryTags: ['Artes','Ciência'],
    SecondaryTags: ['Pessoa', 'Obra', 'Instituição', 'Logradouro'],


  })
}
</script>

<style></style>
