<template>
  <div>
    <v-app-bar flat fixed style="background-color: white">
      <v-app-bar-nav-icon
        class="hidden-md-and-up"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>

      <div style="cursor: pointer" @click="$router.push('/')" class="titleIcon">
        <img src="../assets/transites-icon.svg" alt="Icon" height="50" width="50" style="margin: 0 10px 0 10px" />
        <v-toolbar-title><b class="title">Trânsitos | Circulations</b></v-toolbar-title>
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
        item-text="title"
        item-value="id"
        label="Categoria"
        clearable
      ></v-select>
      <v-select
        v-model="selectedTags"
        :items="tags"
        item-text="title"
        item-value="id"
        label="Tags"
        multiple
        clearable
      ></v-select>
      <v-row>
        <v-col>
          <v-text-field v-model="startDate" type="date" label="De"></v-text-field>
        </v-col>
        <v-col>
          <v-text-field v-model="endDate" type="date" label="Até"></v-text-field>
        </v-col>
      </v-row>
      <v-btn @click="performAdvancedSearch" color="var(--transites-red)" block>
        Buscar
      </v-btn>
    </v-navigation-drawer>
  </div>
</template>

<script>
import _ from "lodash";
import axios from "axios";

export default {
  data() {
    return {
      drawer: false,
      searchQuery: '',
      selectedCategory: null,
      selectedTags: [],
      startDate: '',
      endDate: '',
      categories: [],
      tags: [],
      searchResult: [],
      games: [],
      isLoading: true,
      apiUrl: "http://localhost:1337/api/person-articles"
    };
  },
  computed: {
    filteredGames() {
      if (!this.searchQuery) return this.games;
      return this.games.filter(game => 
        game.title.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  },
  methods: {
    async getGames() {
      this.isLoading = true;
      try {
        const response = await axios.get(this.apiUrl);
        this.games = response.data.data.map(item => ({
          id: item.id,
          title: item.attributes.title
        }));
      } catch (e) {
        console.error(e);
      } finally {
        this.isLoading = false;
      }
    },

    async performSearch() {
      if (!this.searchQuery || !this.searchQuery.trim()) return;
      if (!this.searchQuery.trim()) return;
      try {
        const response = await axios.get(this.apiUrl, {
          params: {
            filters: {
              title: {
                $contains: this.searchQuery
              }
            },
            populate: ['tags', 'categories']
          }
        });

        const results = response.data.data.map(item => ({
          id: item.id,
          type: 'person-articles',
          title: item.attributes.title || 'Título indisponível',
          subtitle: item.attributes.subtitle || 'Subtítulo indisponível',
          text: item.attributes.summary || 'Resumo indisponível',
          tags: item.attributes.tags?.data.map(tag => ({
            name: tag.attributes.name
          })) || []
        }));

        this.$router.push({
          name: 'Results',
          query: {
            results: JSON.stringify(results),
            searchTerm: this.searchQuery
          }
        });
      } catch (error) {
        console.error('Error performing search:', error);
      }
    },
    
    async performAdvancedSearch() {
      const filters = {
        ...(this.searchQuery ? { title: { $contains: this.searchQuery } } : {}),
        ...(this.selectedCategory ? { categories: { id: this.selectedCategory } } : {}),
        ...(this.selectedTags.length ? { tags: { id: { $in: this.selectedTags } } } : {}),
        ...(this.startDate ? { createdAt: { $gte: this.startDate } } : {}),
        ...(this.endDate ? { createdAt: { $lte: this.endDate } } : {})
      };

      try {
        const response = await axios.get(this.apiUrl, {
          params: {
            filters,
            populate: ['tags', 'categories']
          }
        });

        const results = response.data.data.map(item => ({
          id: item.id,
          title: item.attributes.title,
          subtitle: item.attributes.subtitle,
          text: item.attributes.summary,
          tags: item.attributes.tags?.data.map(tag => tag.attributes.name) || [],
          categories: item.attributes.categories?.data.map(category => category.attributes.name) || []
        }));

        this.$router.push({
          name: 'Results',
          query: {
            results: JSON.stringify(results)
          }
        });
      } catch (error) {
        console.error('Error performing advanced search:', error);
      }
    },

    async fetchCategories() {
      try {
        const response = await axios.get('http://localhost:1337/api/categories');
        this.categories = response.data.data.map(category => ({
          id: category.id.toString(),
          title: category.attributes.name
        }));
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      }
    },

    async fetchTags() {
      try {
        const response = await axios.get('http://localhost:1337/api/tags');
        this.tags = response.data.data.map(tag => ({
          id: tag.id.toString(),
          title: tag.attributes.name
        }));
      } catch (error) {
        console.error('Erro ao buscar tags:', error);
      }
    },

    handleAutocompleteChange(selectedId) {
      if (selectedId) {
        this.$router.push(`/article/person-articles/${selectedId}`);
      }
    }
  },
  created() {
    this.getGames();
    this.fetchCategories();
    this.fetchTags();
  },
  watch: {
    searchQuery: _.debounce(function(query) {
      this.performSearch();
    }, 250)
  }
};
</script>

<style>
.title {
  color: var(--transites-red);
}

.titleIcon {
  display: flex;
  align-items: center;
}

.results {
  display: flex;
  flex-wrap: wrap;
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
