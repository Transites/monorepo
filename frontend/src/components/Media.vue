<template>
    <div>
      <h1 style="color: var(--transites-yellow)">Mídias</h1>
      <v-container>
        <v-row>
          <v-col
            cols="12"
            lg="6"
            v-for="(id, i) in videoIds"
            :key="i"
          >
            <iframe
              width="100%"
              style="border:5px solid var(--transites-yellow); aspect-ratio: auto 16/9"
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
      videoIds: [
        '',
        '',
      ]
    })
  }
</script>