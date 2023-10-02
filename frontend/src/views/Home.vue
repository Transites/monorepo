<script setup>
import About from '../components/About.vue'
import News from '../components/News.vue'
import Banner from '../components/Banner.vue'

</script>

<template>
  <main>
    <Banner/>
    <div class="cor">
      <About/>
    </div>
    <News/>
  </main>
</template>

<style>
.cor{
  background-color: violet;
}
</style>
