<template>
  <div class="media-container">
    <h1 class="media-title">Mídias</h1>
    <v-container fluid>
      <v-row justify="center">
        <v-col
          cols="12"
          lg="6"
          v-for="(id, i) in videoIds"
          :key="i"
        >
          <iframe
            class="media-iframe"
            :src="'https://www.youtube.com/embed/' + id"
            allowfullscreen
          ></iframe>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  data: () => ({
    videoIds: ['70P5mHigQVY']
  })
}
</script>

<style scoped>
.media-container {
  padding: var(--prop-padding, 30px);
}

.media-title {
  color: var(--transites-yellow);
  margin-left: 16px; /* Ajuste para alinhar com o título do News.vue */
}

.media-iframe {
  width: 100%;
  border: 5px solid var(--transites-yellow);
  aspect-ratio: 16 / 9;
}
</style>
