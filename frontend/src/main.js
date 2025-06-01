import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './i18n'

// Set up a default JWT token in localStorage if one doesn't exist
// This is a temporary solution for development purposes
if (!localStorage.getItem('jwt')) {
  // This is a dummy token that will be accepted by the backend for requests from trusted origins
  localStorage.setItem('jwt', 'dummy-jwt-token');
}

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import '@mdi/font/css/materialdesignicons.css'
import {aliases, mdi} from "vuetify/lib/iconsets/mdi"

const vuetify = createVuetify({
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi
    }
  },
  components,
  directives
})

createApp(App).use(router).use(store).use(vuetify).use(i18n).mount('#app')
