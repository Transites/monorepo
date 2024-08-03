<template>
  <div>
    <v-app-bar flat fixed style="background-color: white">
      <v-app-bar-nav-icon
        class="hidden-md-and-up"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>

      <div style="cursor: pointer" @click="$router.push('/')" class="titleIcon">
        <img src="../assets/transites-icon.svg" alt="Icon" height="50" width="50" style="margin: 0 10px 0 10px">
        <v-toolbar-title><b class="title">Transites</b></v-toolbar-title>
      </div>

      <v-spacer></v-spacer>
      <v-text-field
        class="hidden-sm-and-down"
        clearable
        rounded
        variant="solo"
        hide-details
        prepend-inner-icon="mdi-magnify"
        v-model="searchQuery"
        @keydown.enter="performSearch"
        placeholder="Pesquisar..."
      ></v-text-field>
      <v-btn
        class="hidden-sm-and-down text-white"
        rounded="lg"
        prepend-icon="mdi-tune"
        variant="flat"
        color="var(--transites-red)"
        @click="drawer = !drawer"
      >
        Busca avançada
      </v-btn>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" temporary>
      <v-text-field
        label="Pesquisa"
        v-model="searchQuery"
        clearable
        @keydown.enter="performSearch"
        placeholder="Pesquisar..."
      ></v-text-field>
      <v-select
        v-model="selectedCategory"
        :items="categories"
        item-text="name"
        item-value="id"
        label="Categoria"
        clearable
      ></v-select>
      <v-select
        v-model="selectedTags"
        :items="tags"
        item-text="name"
        item-value="id"
        label="Tags"
        multiple
        clearable
      ></v-select>
      <v-btn @click="performAdvancedSearch">Busca Avançada</v-btn>
    </v-navigation-drawer>
  </div>
</template>

<script>
import api from '@/services/api';

export default {
  data() {
    return {
      drawer: false,
      searchQuery: '',
      categories: [],
      tags: [],
      selectedCategory: null,
      selectedTags: []
    };
  },
  methods: {
    async fetchCategories() {
      try {
        const response = await api.get('/categories');
        this.categories = response.data.data.map(category => ({
          id: category.id.toString(), // Convertendo id para string
          name: category.attributes.name
        }));
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    },
    async fetchTags() {
      try {
        const response = await api.get('/tags');
        this.tags = response.data.data.map(tag => ({
          id: tag.id.toString(), // Convertendo id para string
          name: tag.attributes.name
        }));
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    },
    async performSearch() {
      if (!this.searchQuery) return;
      try {
        const response = await api.get('/person-articles', {
          params: {
            filters: {
              title: {
                $contains: this.searchQuery
              }
            },
            populate: ['tags', 'categories']
          }
        });
        this.navigateSearchResults(response.data.data);
      } catch (error) {
        console.error('Error performing search:', error);
      }
    },
    async performAdvancedSearch() {
      const filters = {
        title_contains: this.searchQuery,
        ...(this.selectedCategory ? { 'categories.id': this.selectedCategory } : {}),
        ...(this.selectedTags.length ? { 'tags.id_in': this.selectedTags } : {})
      };

      try {
        const response = await api.get('/person-articles', {
          params: {
            filters,
            populate: ['tags', 'categories']
          }
        });
        this.navigateSearchResults(response.data.data);
      } catch (error) {
        console.error('Error performing advanced search:', error);
      }
    },
    navigateSearchResults(results) {
      this.$router.push({ name: 'SearchResults', params: { results: JSON.stringify(results) } });
    }
  },
  mounted() {
    this.fetchCategories();
    this.fetchTags();
  }
}
</script>

<style>
.title {
  color: var(--transites-red);
}

.titleIcon {
  display: flex;
  align-items: center;
}

.hidden-sm-and-down {
  display: none;
}

@media (min-width: 960px) {
  .hidden-sm-and-down {
    display: block;
  }
}

.hidden-md-and-up {
  display: block;
}

@media (min-width: 960px) {
  .hidden-md-and-up {
    display: none;
  }
}
</style>
