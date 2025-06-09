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
        <v-btn style="position: relative;">
          <!-- Link invisível dentro do botão -->
          <a
              href="/"
              @click.prevent="handleLinkClick"
              style="position: absolute; inset: 0; z-index: 1;"
              aria-label="Voltar para página inicial"
          ></a>

          <!-- Texto do botão -->
          <span style="position: relative; z-index: 2; pointer-events: none;">
            {{ buttonText }}
          </span>
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
      default: function () {
        return this.$router.push('/')
      }
    },
    center: {
      default: true
    }
  },
  methods: {
    handleLinkClick(event) {
      // Se tem callback customizado, executa
      if (this.buttonCallback !== this.$options.props.buttonCallback.default) {
        event.preventDefault();
        this.buttonCallback();
        return;
      }

      // Senão, apenas previne default para clique esquerdo
      if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        this.$router.push('/');
      }
      // Middle click e Ctrl+click funcionam nativamente
    }
  },
  computed: {
    propStyle() {
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
