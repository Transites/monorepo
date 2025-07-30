<template>
    <v-container class="py-4">
      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-img :src="verbete.imageUrl" class="white--text align-end">
              <v-card-title>{{ verbete.title }}</v-card-title>
            </v-img>
            <v-card-subtitle>{{ verbete.category }}</v-card-subtitle>
            <v-card-text v-html="verbete.summary"></v-card-text>
            <v-divider></v-divider>
            <div v-for="section in verbete.sections" :key="section.id">
              <component :is="section.__component" :content="section"></component>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card>
            <v-list>
              <v-list-item v-for="author in verbete.authors" :key="author.id">
                <v-list-item-content>
                  <v-list-item-title>{{ author.name }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <v-list>
              <v-list-item v-for="tag in verbete.tags" :key="tag.id">
                <v-list-item-content>
                  <v-list-item-title>{{ tag.name }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script>
  import axios from 'axios'
  
  export default {
    props: {
      id: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        verbete: {
          title: '',
          summary: '',
          imageUrl: '',
          category: '',
          authors: [],
          tags: [],
          sections: []
        }
      }
    },
    mounted() {
      this.fetchVerbete()
    },
    methods: {
      async fetchVerbete() {
        const base_url = import.meta.env.VITE_API_BASE_URL || ''
  
        try {
          const response = await axios.get(`${base_url}/api/submissions/${this.id}`)
          const data = response.data.submission
          
          // Extract metadata for additional information
          const metadata = data.metadata || {}
          
          this.verbete = {
            title: data.title,
            summary: data.summary,
            imageUrl: metadata.imageUrl || '',
            category: data.category || 'Uncategorized',
            authors: [{ name: data.author_name }],
            tags: (data.keywords || []).map(keyword => ({ name: keyword })),
            sections: metadata.sections || []
          }
        } catch (error) {
          console.error('Error fetching verbete:', error)
        }
      }
    }
  }
  </script>
  