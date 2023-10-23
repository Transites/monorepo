<template>
  <div>
    <v-app-bar flat fixed>
      <v-app-bar-nav-icon
        class="hidden-sm-and-up"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>
      <v-toolbar-title><b class="title">Transites</b></v-toolbar-title>

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
        class="hidden-sm-and-down"
        rounded="lg"
        prepend-icon="mdi-tune"
        variant="flat"
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
  }),
}
</script>
