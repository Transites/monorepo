<template>
  <HomeSection>
    <template #icon>
      <v-icon class="colored" icon="mdi-form-select" size="120"></v-icon>
    </template>
    <template #title>
      <h1 class="colored">{{ $t('contribute.title') }}<br /><b>Trânsitos</b> | <i>Circulations </i></h1>
    </template>
    <template #subtitle>
      <div class="colored">
        <p>{{ $t('contribute.subtitle1') }}</p>
        <p><router-link to="/submit" class="font-weight-bold">{{ $t('contribute.subtitle2') }}</router-link></p>
        <p>{{ $t('contribute.subtitle3').split('aqui')[0] }}<router-link to="/normas-de-publicacao">{{ $t('common.here') }}</router-link>{{ $t('contribute.subtitle3').split('aqui')[1] }}</p>
      </div>
    </template>
    <template #text>
      <v-form ref="emailForm">
        <v-text-field v-model="firstName" :rules="rules" :label="$t('contribute.form.fullName')"></v-text-field>
        <v-text-field v-model="subject" :rules="rules" :label="$t('contribute.form.subject')"></v-text-field>
        <v-textarea v-model="message" :rules="rules" :label="$t('contribute.form.message')"></v-textarea>
        <v-btn
          class="text-white"
          type="submit"
          color="var(--transites-gray-purple)"
          @click.prevent="sendEmail"
          block
          >{{ $t('contribute.form.send') }}</v-btn
        >
      </v-form>
    </template>
  </HomeSection>
</template>

<script>
import HomeSection from '@/components/HomeSection.vue'

export default {
  data: () => ({
    firstName: '',
    subject: '',
    message: '',
    rules: [
      (value) => {
        if (value) return true
        return this.$t('contribute.form.required')
      }
    ]
  }),
  methods: {
    sendEmail() {
      const email = import.meta.env.VITE_CONTRIBUTE_EMAIL
      const body = this.message.replace(/\n/g, '%0D')
      this.$refs.emailForm.validate().then((result) => {
        if (result.valid) {
          window.open(
            `mailto:${email}?subject=${this.subject}&body=${body}%0D%0DDe: ${this.firstName}`
          )
        }
      })
    }
  },
  components: {
    HomeSection: HomeSection
  }
}
</script>

<style scoped>
.colored {
  color: var(--transites-gray-purple);
}

/* Se precisar ajustar o padding/margin */
.contribute-container {
  padding: var(--prop-padding, 70px);
  margin-top: 20px; /* Ajuste conforme necessário para espaçamento */
}
</style>
