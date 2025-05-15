<template>
  <div class="submission-page">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h3 text-center colored mb-6">Submissão de Verbete</h1>
          <p class="text-body-1 text-center mb-8">
            Preencha o formulário abaixo para submeter um novo verbete para o Trânsitos | Circulations.
            Você pode salvar seu progresso como rascunho a qualquer momento.
          </p>
        </v-col>
      </v-row>
      
      <v-row>
        <v-col cols="12">
          <submission-form />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import SubmissionForm from '@/components/submission/SubmissionForm.vue'
import { mapActions } from 'vuex'

export default {
  name: 'SubmissionPage',
  components: {
    SubmissionForm
  },
  created() {
    // Load any existing draft when the page is loaded
    this.loadSubmissionDraft()
  },
  methods: {
    ...mapActions('submission', ['loadSubmissionDraft'])
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
</style>