<template>
  <v-app>
    <div>
      <v-toolbar>
        <v-app-bar-nav-icon></v-app-bar-nav-icon>
        <v-toolbar-title>Transites</v-toolbar-title>
        <v-text-field
          hide-details
          prepend-inner-icon="mdi-magnify"
          single-line
        ></v-text-field>
      </v-toolbar>
    </div>
    <div>
      <h1>Welcome to My Vue Homepage</h1>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum et odio vitae est
        gravida ultrices. Sed mattis, dolor eget luctus ultricies, arcu lectus cursus tortor, vel
        ultricies tortor augue eget ipsum. Fusce tempus dolor libero, vel pharetra odio finibus
        vel..
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum et odio vitae est
        gravida ultrices. Sed mattis, dolor eget luctus ultricies, arcu lectus cursus tortor, vel
        ultricies tortor augue eget ipsum. Fusce tempus dolor libero, vel pharetra odio finibus
        vel..
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum et odio vitae est
        gravida ultrices. Sed mattis, dolor eget luctus ultricies, arcu lectus cursus tortor, vel
        ultricies tortor augue eget ipsum. Fusce tempus dolor libero, vel pharetra odio finibus
        vel..
      </p>
    </div>
    <Footer />
  </v-app>
</template>

<script setup>
import Footer from './components/Footer.vue'
</script>

