<template>
  <HomeSection>
    <template #icon>
      <v-icon class="colored" icon="mdi-form-select" size="120"></v-icon>
    </template>
    <template #title>
      <h1 class="colored">Contribua com o<br /><b>Trânsitos</b> | <i>Circulations </i></h1>
    </template>
    <template #subtitle>
      <div class="colored">
        <p>Envie sua sugestão, elogio, crítica</p>
        <p>ou contribua com um verbete!</p>
        <p>Clique <router-link to="/normas-de-publicacao">aqui</router-link> para conferir nossas normas de publicação</p>
      </div>
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
        >Enviar</v-btn>
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
      // Recupera a lista de e-mails do .env e junta em uma string separada por vírgula
      const emails = import.meta.env.VITE_CONTRIBUTE_EMAIL;
      const body = this.message.replace(/\n/g, '%0D'); // Formata a mensagem

      this.$refs.emailForm.validate().then((result) => {
        if (result) {
          // Envia o e-mail para todos os destinatários em uma única chamada
          window.open(
            `mailto:${emails}?subject=${encodeURIComponent(this.subject)}&body=${encodeURIComponent(body)}%0D%0DDe: ${encodeURIComponent(this.firstName)}`
          );
        }
      });
    }
  },
  components: {
    HomeSection
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
