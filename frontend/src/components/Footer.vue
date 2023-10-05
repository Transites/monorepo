<template>
  <v-footer class="footer">
    <div class="about md6">
      <h2>Sobre nós</h2>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum et odio vitae est gravida
      ultrices. Sed mattis, dolor eget luctus ultricies, arcu lectus cursus tortor, vel ultricies
      tortor augue eget ipsum. Fusce tempus dolor libero, vel pharetra odio finibus vel.
    </div>
    <div class="midia md6">
      <h2>Redes Sociais</h2>
      <div class="icones">
        <v-btn v-for="icon in icons" :key="icon" class="mx-4" :icon="icon" variant="text"></v-btn>
      </div>
    </div>
  </v-footer>
</template>

<script>
export default {
  data: () => ({
    icons: ['mdi-facebook', 'mdi-twitter', 'mdi-linkedin', 'mdi-instagram']
  })
}
</script>

<style scoped>
body {
  margin: 0;
}

.footer {
  background-color: black;
  color: white;
}

.icones {
  display: flex;
  flex-flow: row;
}
</style>