<template>
  <v-container>
    <v-row>
      <v-col cols="4">
        <div class="contribute-container">
          <div class="d-flex flex-row">
            <img class="contribute-icon" src="https://cdn-icons-png.flaticon.com/512/1105/1105791.png">
            <h1 class="contribute-title">Contribua com <br>o Transites</h1>
          </div>
          <p>Envie sua sugestão, elogio ou crítica...
          <br><br>
          ...ou contribua com um verbete! (Clique <u>aqui</u> para conferir nossas normas de publicação)
          </p>
        </div>
      </v-col>
      <v-col cols="8">
        <v-form>
          <v-text-field
            v-model="firstName"
            :rules="rules"
            label="Nome completo"
          ></v-text-field>
          <v-text-field
            v-model="email"
            :rules="rules"
            label="E-mail"
          ></v-text-field>
          <v-text-field
            v-model="subject"
            :rules="rules"
            label="Assunto"
          ></v-text-field>
          <v-textarea
            v-model="message"
            :rules="rules"
            label="Mensagem"
          ></v-textarea>
          <v-btn type="submit" block class="mt-2">Enviar</v-btn>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data: () => ({
    firstName: '',
    email: '', 
    subject: '', 
    message: '', 
    rules: [
      value => {
        if (value) return true
        return 'Campo obrigatório.'
      },
    ],
  }),
}
</script>


<style scoped>
.contribute-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
}
.contribute-icon {
  width: 50%;
}
.contribute-title {
  font-size: 2em;
}
</style>
