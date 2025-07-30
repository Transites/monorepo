<template>
  <div class="submission-edit-page">
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px;">
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
    </div>
    
    <submission-edit
      v-else
      :token="token"
      @submission-saved="handleSubmissionSaved"
    />
  </div>
</template>

<script>
import SubmissionEdit from '@/components/submission/SubmissionEdit.vue'
import submissionService from '@/services/submissionService'

export default {
  name: 'SubmissionEditPage',
  components: {
    SubmissionEdit
  },
  props: {
    token: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: true
    }
  },
  async created() {
    await this.validateToken()
  },
  methods: {
    async validateToken() {
      try {
        // Validar token antes de carregar a interface
        const tokenStatus = await submissionService.checkTokenStatus(this.token)
        
        if (!tokenStatus.valid) {
          this.$router.push('/submission-error')
          return
        }
        
        this.loading = false
        
      } catch (error) {
        console.error('Error validating token:', error)
        this.$router.push('/submission-error')
      }
    },

    handleSubmissionSaved() {
      // Callback quando submissão é salva
      this.$toast.success('Submissão salva com sucesso!')
    }
  }
}
</script>

<style scoped>
.submission-edit-page {
  padding: 20px 0;
}
</style>