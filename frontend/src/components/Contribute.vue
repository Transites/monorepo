<template>
  <HomeSection>
    <template #icon>
      <v-icon icon="mdi-form-select" size="120"></v-icon>
    </template>
    <template #title>
      <h1>Contribua com o<br />Transitos | Circulation</h1>
    </template>
    <template #subtitle>
      <p>Envie sua sugestão, elogio ou crítica...</p>
      <p>...ou contribua com um verbete!</p>
      <p>(Clique <u>aqui</u> para conferir nossas normas de publicação)</p>
    </template>
    <template #text>
      <v-form ref="emailForm">
        <v-text-field v-model="firstName" :rules="rules" label="Nome completo"></v-text-field>
        <v-text-field v-model="subject" :rules="rules" label="Assunto"></v-text-field>
        <v-textarea v-model="message" :rules="rules" label="Mensagem"></v-textarea>
        <v-btn
          class="text-white"
          type="submit"
          color="var(--transites-gray-purple)"
          @click.prevent="sendEmail"
          block
          >Enviar</v-btn
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
        return 'Campo obrigatório.'
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
