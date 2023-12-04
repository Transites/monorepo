<template>
  <div :style="propStyle">
    <v-card
      class="rounded-xl"
      style="padding: 30px; border: 5px solid var(--prop-color); color: var(--prop-color);"
      variant="tonal"
      outlined
    >
      <v-card-item>
        <v-card-title class="d-flex align-center mb-5" :class="$vuetify.display.xs ? 'text-h4' : 'text-h2'">
          <v-icon size="x-small" class="mr-2">{{ this.icon }}</v-icon>
          <span class="font-weight-bold">{{ this.code }}</span>
        </v-card-title>
      </v-card-item>

      <v-card-text :class="$vuetify.display.xs ? 'text-h6' : 'text-h4'">
        {{ this.text }}
      </v-card-text>

      <v-card-actions>
        <v-btn @click=buttonClick class="home-button">
          {{ buttonText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
export default {
  props: {
    color: {
      default: "var(--transites-red)"
    },
    icon: {
      default: "mdi-alert-circle"
    },
    code: {
      default: 404
    },
    text: {
      default: "Página não encontrada"
    },
    buttonText: {
      default: "Voltar para a página inicial"
    },
    buttonCallback: {
      type: Function,
      default: function() { this.$router.push('/') }
    }
  },
  methods: {
    buttonClick() {
      this.buttonCallback();
    }
  },
  computed: {
    propStyle () {
      return {
        '--prop-color': this.color,
      }
    }
  }
}
</script>

<style>
.home-button {
  height: auto !important;
  max-width: 100%;
  white-space: normal;
  &.v-btn:not(.v-btn--round).v-size--default {
    padding: 10px 16px;
  }
  .v-btn__content {
    flex: 1 0 fit-content;
  }
}
</style>
