<template>
  <v-toolbar style="background-color: white;">
    <v-app-bar-nav-icon></v-app-bar-nav-icon>
    <v-toolbar-title style="color: var(--transites-red);">Transites</v-toolbar-title>

    <v-spacer></v-spacer>

    <v-text-field
      clearable
      rounded
      variant="solo"
      hide-details
      prepend-inner-icon="mdi-magnify"
    >
      <template v-slot:prepend>
        <v-icon color="var(--transites-red)"></v-icon>
      </template>
    </v-text-field>

    <v-btn color="var(--transites-red)" rounded="lg" prepend-icon="mdi-tune" variant="flat"> 
      
      <template v-slot:prepend>
        <v-icon color="white"></v-icon>
      </template>

      <span style="color: white;">Busca avançada</span> 

    </v-btn>
  </v-toolbar>
</template>
