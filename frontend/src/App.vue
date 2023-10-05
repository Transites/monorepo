<template>
  <v-app>
    <RouterView />
    <Footer />
  </v-app>
</template>

<script setup>
import { RouterView } from 'vue-router'
import Footer from './components/Footer.vue'
</script>



