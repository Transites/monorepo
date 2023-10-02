<template>
  <v-app>
    <NavigationBar />
    <RouterView />
    <Footer/>
  </v-app>
</template>

<script setup>
import { RouterView } from 'vue-router'
import NavigationBar from './components/NavigationBar.vue'
import Footer from './components/Footer.vue'
</script>



