<template>
  <div>
    <h1>Mídias</h1>
    <v-container>
      <iframe
        v-for="(link, i) in links"
        :key="i"
        width="500"
        height="315"
        :src="link.url"
        allowfullscreen
      ></iframe>
    </v-container>
  </div>
</template>

<script>
export default {
  data: () => ({
    links: [
      {
        url: 'https://www.youtube.com/embed/'
      },
      { url: 'https://www.youtube.com/embed/' },
      { url: 'https://www.youtube.com/embed/' }
    ]
  })
}
</script>

<style>
</style>