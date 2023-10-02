<template>
  <v-app>

    <About/>
    <Footer/>

  </v-app>
</template>

<script setup>
import About from './components/About.vue'
import Footer from './components/Footer.vue'
</script>

<style>
.about{
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>

