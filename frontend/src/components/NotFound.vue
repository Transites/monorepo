<template>
  <div :style="propStyle" :class="center ? 'center' : ''">
    <v-card
      class="rounded-xl"
      style="padding: 30px; border: 5px solid var(--prop-color); color: var(--prop-color);"
      variant="tonal"
      outlined
    >
      <v-card-item>
        <v-card-title class="d-flex align-center mb-5" :class="$vuetify.display.xs ? 'text-h4' : 'text-h2'">
          <v-icon size="x-small" class="mr-2">{{ icon }}</v-icon>
          <span class="font-weight-bold">{{ code }}</span>
        </v-card-title>
      </v-card-item>

      <v-card-text :class="$vuetify.display.xs ? 'text-h6' : 'text-h4'">
        {{ text }}
      </v-card-text>

      <v-card-actions>
        <v-btn @click=buttonClick>
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
      default: function() { return this.$router.push('/') }
    },
      center: {
      default: true
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
.center {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
