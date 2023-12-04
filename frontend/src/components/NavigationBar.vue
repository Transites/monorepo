<template>
  <div>
    <v-app-bar flat fixed style="background-color: white">
      <div style="cursor: pointer" @click="$router.push('/')" class="titleIcon">
        <img src="../assets/transites-icon.svg" alt="Icon" height="50" width="50" style="margin: 0 10px 0 10px">
        <v-toolbar-title><b class="title">Transites</b></v-toolbar-title>
      </div>

      <v-spacer></v-spacer>
      <v-spacer></v-spacer>

      <SearchBar class="hidden-sm-and-down mr-3"/>

      <template #append>
        <v-app-bar-nav-icon
          class="hidden-md-and-up"
          @click.stop="drawer = !drawer"
        ></v-app-bar-nav-icon>
      </template>

    </v-app-bar>

    <v-navigation-drawer class="hidden-md-and-up" location="right" v-model="drawer" temporary>
      <SearchBar class="mx-4" />
    </v-navigation-drawer>
  </div>
</template>

<script>
import SearchBar from '@/components/SearchBar.vue'

export default {
  data: () => ({
    drawer: false
  }),
  components: {
    SearchBar
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

</style>
