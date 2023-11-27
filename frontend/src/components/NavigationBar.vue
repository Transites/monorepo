<template>
  <div>
    <v-app-bar flat fixed style="background-color: white">
      <v-app-bar-nav-icon
        class="hidden-md-and-up"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>
      <v-toolbar-title style="cursor: pointer" @click="$router.push('/')"><b class="title">Transites</b></v-toolbar-title>

      <v-spacer></v-spacer>
      <v-text-field
        class="hidden-sm-and-down"
        clearable
        rounded
        variant="solo"
        hide-details
        prepend-inner-icon="mdi-magnify"
      ></v-text-field>
      <v-btn
        class="hidden-sm-and-down text-white"
        rounded="lg"
        prepend-icon="mdi-tune"
        variant="flat"
        color="var(--transites-red)"
      >
        Busca avançada
      </v-btn>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" temporary>
      <v-text-field label="Pesquisa"></v-text-field>
      <v-btn>Busca Avançada</v-btn>
    </v-navigation-drawer>
  </div>
</template>

<script>
export default {
  data: () => ({
    drawer: false
  })
}
</script>

<style>
.title {
  color: var(--transites-red);
}
</style>
