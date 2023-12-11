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
      ></v-text-field>
      <v-btn
        class="hidden-sm-and-down text-white"
        rounded="lg"
        prepend-icon="mdi-tune"
        variant="flat"
        color="var(--transites-red)"
        @click="$router.push('/search')"
      >
        Busca avançada
      </v-btn>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" temporary>
      <v-text-field label="Pesquisa"></v-text-field>
      <v-btn @click="$router.push('/search')">Busca Avançada</v-btn>
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

.titleIcon {
  display: flex;
  align-items: center;
}

</style>
