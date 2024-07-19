<template>
    <v-container>
      <v-row>
        <v-col cols="12" md="8">
          <h1>{{ article.title }}</h1>
          <p v-html="article.summary"></p>
          <v-img :src="article.image.url" v-if="article.image"></v-img>
          <v-divider></v-divider>
          <div v-for="section in article.sections" :key="section.id">
            <div v-if="section.__component === 'section.free-text-section'">
              <p v-html="section.content"></p>
            </div>
            <div v-if="section.__component === 'section.strict-text-section'">
              <p v-html="section.content"></p>
            </div>
          </div>
        </v-col>
        <v-col cols="12" md="4">
          <v-list>
            <v-list-item v-for="tag in article.tags" :key="tag.id">
              <v-list-item-content>{{ tag.name }}</v-list-item-content>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script>
  import api from '@/services/api';
  
  export default {
    data() {
      return {
        article: null,
      };
    },
    async created() {
      const { id } = this.$route.params;
      try {
        const response = await api.get(`/person-articles/${id}`);
        this.article = response.data.data.attributes;
      } catch (error) {
        console.error('Error fetching article:', error);
      }
    },
  };
  </script>
  