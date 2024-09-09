<template>
  <div>
    <v-app-bar flat fixed style="background-color: white">
      <v-app-bar-nav-icon
        class="hidden-md-and-up"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>

      <div style="cursor: pointer" @click="$router.push('/')" class="titleIcon">
        <img src="../assets/transites-icon.svg" alt="Icon" height="50" width="50" style="margin: 0 10px 0 10px" />
        <v-toolbar-title><b class="title">Trânsitos | <i>Circulations</i></b></v-toolbar-title>
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
    </v-app-bar>
  </div>
</template>

<script>
import _ from "lodash";
import axios from "axios";

export default {
  data() {
    return {
      searchQuery: '',
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
    }
  },
  created() {
    this.getGames();
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
