<template>
  <v-container>
    <v-row>
      <v-col cols="5">
        <div class="contribuition-container">
          <div class="d-flex flex-row">
            <img class="contribuition-icon" src="https://cdn-icons-png.flaticon.com/512/1105/1105791.png">
            <h1 class="contribuition-title">Contribua com <br>o Transites</h1>
          </div>
          <p>Envie sua sugestão, elogio ou crítica</p>
        </div>
      </v-col>
      <v-col cols="7">
        <v-card>
          <v-text-field
            label="Nome"
          ></v-text-field>
          <v-text-field
            label="E-mail"
          ></v-text-field>
          <v-text-field
            label="Assunto"
          ></v-text-field>
          <v-textarea
            label="Mensagem"
          ></v-textarea>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.contribuition-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
}
.contribuition-icon {
  width: 50%;
}
.contribuition-title {
  font-size: 2em;
}
</style>
