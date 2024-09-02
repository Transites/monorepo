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

    <!-- Resultados -->
    <div class="results">
      <v-card
        v-for="entry in searchResult"
        :key="entry.id"
        class="mx-auto my-8"
        max-width="344"
        elevation="16"
        @click="$router.push(`/article/person/${entry.id}`)"
      >
        <v-card-item>
          <v-card-title>{{ entry.title }}</v-card-title>
          <v-card-subtitle>{{ entry.subtitle }}</v-card-subtitle>
          <v-chip v-for="tag in entry.tags" :key="tag.name" color="primary">
            {{ tag.name }}
          </v-chip>
        </v-card-item>
        <v-card-text>
          {{ entry.text }}
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

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
      searchResult: []
    };
  },
  methods: {
    async performSearch() {
      if (!this.searchQuery) return;
      try {
        const response = await axios.get('http://localhost:1337/api/person-articles', {
          params: {
            filters: {
              title: {
                $contains: this.searchQuery
              }
            },
            populate: ['tags', 'categories']
          }
        });

        if (response && response.data && response.data.data.length > 0) {
          const results = JSON.stringify(response.data.data);
          this.$router.push({ name: 'Results', query: { results } });
        } else {
          console.warn('No results found for the search query.');
          this.$router.push({ name: 'Results', query: { results: [] } });
        }
      } catch (error) {
        console.error('Error performing search:', error);
      }
    },

    async performAdvancedSearch() {
      const filters = {
        ...(this.searchQuery ? { title_contains: this.searchQuery } : {}),
        ...(this.selectedCategory ? { 'categories.id': this.selectedCategory } : {}),
        ...(this.selectedTags.length ? { 'tags.id_in': this.selectedTags } : {}),
        ...(this.startDate ? { createdAt_gte: this.startDate } : {}),
        ...(this.endDate ? { createdAt_lte: this.endDate } : {})
      };

      try {
        const response = await axios.get('http://localhost:1337/api/person-articles', {
          params: {
            filters,
            populate: ['tags', 'categories']
          }
        });

        if (response && response.data && response.data.data.length > 0) {
          const results = JSON.stringify(response.data.data);
          this.$router.push({ name: 'Results', query: { results } });
        } else {
          console.warn('No results found for the advanced search.');
          this.$router.push({ name: 'Results', query: { results: [] } });
        }
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
  },
  created() {
    this.fetchCategories();
    this.fetchTags();
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
