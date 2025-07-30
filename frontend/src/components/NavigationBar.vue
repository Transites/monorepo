<template>
  <div>
    <v-app-bar flat fixed style="background-color: white">
      <v-app-bar-nav-icon
          class="hidden-md-and-up"
          @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>

      <div style="cursor: pointer; position: relative;" class="titleIcon">
        <!-- Link invisível para middle click -->
        <a
            href="/"
            @click.prevent="handleLinkClick"
            style="position: absolute; inset: 0; z-index: 1;"
            aria-label="Ir para página inicial"
            class="invisible-link"
        ></a>

        <div style="display: flex; align-items: center; position: relative; z-index: 2; pointer-events: none;">
          <img src="../assets/transites-icon.svg" alt="Icon" height="50" width="50" style="margin: 0 10px 0 10px" />
          <v-toolbar-title><b class="title">Trânsitos | <i>Circulations</i></b></v-toolbar-title>
        </div>
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
          :placeholder="$t('navbar.search.placeholder')"
      ></v-text-field>

      <language-switcher class="ml-4 hidden-sm-and-down" />
    </v-app-bar>
  </div>
</template>

<script>
import _ from "lodash";
import axios from "axios";
import api from "@/services/api";
import LanguageSwitcher from "@/components/LanguageSwitcher.vue";

export default {
  components: {LanguageSwitcher},
  data() {
    return {
      searchQuery: '',
      games: [],
      isLoading: true,
      apiUrl: `${api.getUri()}/submissions`
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
    handleLinkClick(event) {
      if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        this.$router.push('/');
      }
    },

    async getGames() {
      this.isLoading = true;
      try {
        const response = await axios.get(this.apiUrl, {
          params: {
            top: 100,
            skip: 0
          }
        });
        this.games = response.data.submissions.map(item => ({
          id: item.id,
          title: item.title
        }));
      } catch (e) {
        console.error(e);
      } finally {
        this.isLoading = false;
      }
    },

    async performSearch() {
      // Store the search query in Vuex (even if empty)
      this.$store.dispatch('search/setSearchQuery', this.searchQuery);

      // Perform the search using Vuex action (handles empty queries internally)
      await this.$store.dispatch('search/performSearch');

      // Navigate to results page without passing results in URL
      this.$router.push({
        name: 'Results',
        query: {
          q: this.searchQuery // Only pass the search query in URL for bookmarking/sharing
        }
      });
    }
  },
  created() {
    this.getGames();
  },
  watch: {
    searchQuery: _.debounce(function (query) {
      // Only update the query in the store, don't navigate
      // This allows for real-time filtering without page navigation
      this.$store.dispatch('search/setSearchQuery', query);
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
