<template>
  <v-app>
    <NavigationBar />
    <v-main>
      <RouterView />
    </v-main>
    <Footer />
  </v-app>
</template>

<script setup>
import { RouterView } from 'vue-router'
import NavigationBar from './components/NavigationBar.vue'
import Footer from './components/Footer.vue'
</script>



