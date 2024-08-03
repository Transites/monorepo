<template>
    <div>
      <v-container>
        <v-row>
          <v-col v-for="article in results" :key="article.id" cols="12" md="4" lg="3">
            <v-card :to="`/article/person-article/${article.id}`">
              <v-card-title>{{ article.attributes.title }}</v-card-title>
              <v-card-subtitle>{{ article.attributes.summary.substring(0, 100) }}...</v-card-subtitle>
              <v-card-actions>
                <v-btn text>Ver mais</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      results: {
        type: Array,
        default: () => []
      }
    }
  }
  </script>
  
  <style>
  /* Adicione estilos personalizados aqui */
  </style>
  