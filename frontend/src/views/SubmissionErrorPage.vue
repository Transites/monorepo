<template>
  <div class="submission-error-page">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card class="text-center pa-6">
            <v-card-title class="text-h4 error--text">
              <v-icon size="48" color="error" class="mr-3">mdi-alert-circle</v-icon>
              Erro na Submissão
            </v-card-title>
            
            <v-card-text>
              <p class="text-body-1 mb-6">
                Não foi possível acessar a submissão solicitada. Isso pode ocorrer pelos seguintes motivos:
              </p>
              
              <v-list>
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon color="error">mdi-close-circle</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>O token de acesso é inválido ou expirou</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon color="error">mdi-close-circle</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>A submissão foi removida ou não existe</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon color="error">mdi-close-circle</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Você não tem permissão para acessar esta submissão</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
              
              <p class="text-body-1 mt-6">
                Se você acredita que isso é um erro, entre em contato com nossa equipe de suporte.
              </p>
            </v-card-text>
            
            <v-card-actions class="justify-center">
              <v-btn
                color="primary"
                x-large
                to="/"
              >
                <v-icon left>mdi-home</v-icon>
                Voltar para a Página Inicial
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'SubmissionErrorPage'
}
</script>

<style scoped>
.submission-error-page {
  padding: 40px 0;
}
</style>