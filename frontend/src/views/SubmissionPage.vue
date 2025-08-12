<template>
  <div class="submission-page">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h3 text-center colored mb-6">Submissão de Verbete</h1>
          <p class="text-body-1 text-center mb-8">
            Escolha uma das opções abaixo para continuar com sua submissão para o Trânsitos | Circulations.
          </p>
        </v-col>
      </v-row>
      
      <v-row>
        <v-col cols="12" md="7" order="md-2" class="mb-6">
          <!-- Escrever novos artigos (destaque maior) -->
          <v-card elevation="3" class="pa-6 primary-card h-100">
            <v-card-title class="text-h4 colored">Escrever novos artigos</v-card-title>
            <v-card-text>
              <p class="text-body-1 mb-4">
                Inicie a criação de um novo verbete para a enciclopédia Trânsitos.
                Você poderá salvar seu progresso como rascunho a qualquer momento.
              </p>
              <p class="text-body-2 mb-6">
                Ao criar um novo artigo, você receberá um link de acesso por email para continuar
                a edição posteriormente.
              </p>
            </v-card-text>
            <v-card-actions>
              <v-btn 
                color="var(--transites-gray-purple)" 
                size="large" 
                block
                @click="startNewSubmission"
              >
                Criar Novo Artigo
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="5" order="md-1">
          <!-- Gerenciar artigos em progresso -->
          <v-card elevation="2" class="pa-6 secondary-card h-100">
            <v-card-title class="text-h5 colored">Gerenciar artigos em progresso</v-card-title>
            <v-card-text>
              <p class="text-body-1 mb-4">
                Acesse seus artigos em progresso para continuar a edição.
              </p>
              
              <v-form @submit.prevent="checkInProgressArticles" ref="emailForm">
                <v-text-field
                  v-model="email"
                  label="Seu email"
                  hint="Informe o email utilizado na criação dos artigos"
                  :rules="emailRules"
                  required
                  variant="outlined"
                  class="mb-4"
                ></v-text-field>
                
                <div v-if="emailSent" class="success-message pa-3 mb-4">
                  <p>Um email com os acessos para seus artigos em progresso foi enviado para <strong>{{ email }}</strong>.</p>
                  <p class="text-body-2">Verifique sua caixa de entrada e também a pasta de spam.</p>
                </div>
                
                <div v-if="error" class="error-message pa-3 mb-4">
                  <p>{{ error }}</p>
                </div>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-btn 
                color="var(--transites-gray-purple)" 
                variant="outlined"
                :loading="loading"
                :disabled="loading || !email"
                block
                @click="checkInProgressArticles"
              >
                Verificar Artigos
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import submissionService from '@/services/submissionService'
import { mapActions } from 'vuex'

export default {
  name: 'SubmissionPage',
  data() {
    return {
      email: '',
      loading: false,
      emailSent: false,
      error: null,
      emailRules: [
        v => !!v || 'Email é obrigatório',
        v => /.+@.+\..+/.test(v) || 'Email deve ser válido'
      ]
    }
  },
  methods: {
    ...mapActions('submission', ['loadSubmissionDraft']),
    
    // Iniciar nova submissão
    startNewSubmission() {
      this.$router.push('/submissao/nova');
    },
    
    // Verificar artigos em progresso
    async checkInProgressArticles() {
      if (!this.$refs.emailForm.validate()) return;
      
      this.loading = true;
      this.error = null;
      this.emailSent = false;
      
      try {
        await submissionService.checkInProgressArticles(this.email);
        this.emailSent = true;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          this.error = 'Nenhum artigo em progresso encontrado para este email.';
        } else {
          this.error = 'Ocorreu um erro ao verificar seus artigos. Tente novamente.';
          console.error('Error checking in-progress articles:', error);
        }
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.submission-page {
  padding: 40px 0;
}

.colored {
  color: var(--transites-gray-purple);
}

.primary-card {
  border-left: 5px solid var(--transites-gray-purple);
  background-color: #f8f9fa;
}

.secondary-card {
  background-color: white;
}

.h-100 {
  height: 100%;
}

.success-message {
  background-color: #d4edda;
  border-radius: 4px;
  color: #155724;
}

.error-message {
  background-color: #f8d7da;
  border-radius: 4px;
  color: #721c24;
}
</style>