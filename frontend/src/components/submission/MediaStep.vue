<template>
  <v-container class="pa-6">
    <h2 class="text-h5 mb-4">Imagens e Mídia</h2>
    <p class="text-body-1 mb-6">
      Adicione imagens e outros arquivos de mídia para ilustrar seu verbete.
      Cada imagem deve ter título, legenda e créditos.
    </p>

    <v-form ref="form" @submit.prevent>
      <v-row>
        <v-col cols="12">
          <h3 class="text-subtitle-1 mb-3">Imagem Principal</h3>
          <p class="text-body-2 mb-4">
            Esta imagem será exibida no topo do seu verbete e nas listagens.
            Recomendamos uma imagem de boa qualidade e resolução.
          </p>

          <div v-if="!localData.mainImage.file" class="main-image-upload">
            <v-card class="pa-6 d-flex flex-column align-center justify-center">
              <v-icon size="64" color="grey">mdi-image-outline</v-icon>
              <p class="text-body-1 mt-4 mb-6 text-center">
                Selecione uma imagem principal para o seu verbete
              </p>
              
              <input 
                type="file" 
                ref="mainImageInput" 
                @change="onMainImageSelected" 
                accept="image/*" 
                class="d-none"
              >
              
              <v-btn
                color="var(--transites-gray-purple)"
                class="text-white"
                @click="$refs.mainImageInput.click()"
              >
                Selecionar Imagem Principal
              </v-btn>
            </v-card>
          </div>

          <div v-else class="main-image-preview">
            <v-card>
              <div class="image-preview-wrapper">
                <img :src="localData.mainImage.preview" :alt="localData.mainImage.name" class="main-image">
              </div>
              
              <v-card-text>
                <v-text-field
                  v-model="localData.mainImage.title"
                  label="Título da Imagem*"
                  :rules="[v => !!v || 'Título é obrigatório']"
                  @update:model-value="updateData"
                ></v-text-field>
                
                <v-textarea
                  v-model="localData.mainImage.caption"
                  label="Legenda*"
                  :rules="[v => !!v || 'Legenda é obrigatória']"
                  rows="2"
                  @update:model-value="updateData"
                ></v-textarea>
                
                <v-text-field
                  v-model="localData.mainImage.credits"
                  label="Créditos*"
                  :rules="[v => !!v || 'Créditos são obrigatórios']"
                  hint="Autor da imagem, fonte, ou detentor dos direitos"
                  persistent-hint
                  @update:model-value="updateData"
                ></v-text-field>
              </v-card-text>
              
              <v-card-actions>
<!--                TODO: esse botao nao ta funcionando -->
                <v-btn
                  color="error"
                  variant="text"
                  @click="removeMainImage"
                >
                  Remover
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  variant="text"
                  @click="$refs.mainImageInput.click()"
                >
                  Trocar Imagem
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-6"></v-divider>

      <v-row>
        <v-col cols="12">
          <h3 class="text-subtitle-1 mb-3">Imagens Adicionais</h3>
          <p class="text-body-2 mb-4">
            Adicione outras imagens para ilustrar seu verbete. Você pode adicionar até 10 imagens adicionais.
          </p>

          <image-uploader
            v-model="localData.additionalImages"
            :value="localData.additionalImages"
            @validation="handleImageValidation"
            :max-files="10"
          ></image-uploader>
        </v-col>
      </v-row>

      <!-- Validação -->
      <v-row v-if="validationErrors.length > 0">
        <v-col cols="12">
          <v-alert
            type="warning"
            variant="tonal"
            title="Por favor, corrija os seguintes problemas:"
            class="mt-4"
          >
            <ul class="pl-4">
              <li v-for="(error, index) in validationErrors" :key="index">
                {{ error }}
              </li>
            </ul>
          </v-alert>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script>
import ImageUploader from './shared/ImageUploader.vue'

export default {
  name: 'MediaStep',
  components: {
    ImageUploader
  },
  props: {
    formData: {
      type: Object,
      required: true
    }
  },
  emits: ['update:form-data', 'validate'],
  data() {
    return {
      localData: {
        mainImage: {
          file: null,
          preview: '',
          name: '',
          title: '',
          caption: '',
          credits: ''
        },
        additionalImages: []
      },
      imageValidationErrors: [],
      validationErrors: []
    }
  },
  created() {
    // Initialize local data with form data
    this.initializeLocalData()
  },
  watch: {
    formData: {
      handler() {
        this.initializeLocalData()
      },
      deep: true
    }
  },
  methods: {
    initializeLocalData() {
      this.localData = {
        mainImage: this.formData.mainImage 
          ? { ...this.formData.mainImage } 
          : {
              file: null,
              preview: '',
              name: '',
              title: '',
              caption: '',
              credits: ''
            },
        additionalImages: Array.isArray(this.formData.additionalImages) 
          ? [...this.formData.additionalImages] 
          : []
      }
    },
    updateData() {
      this.$emit('update:form-data', this.localData)
    },
    onMainImageSelected(e) {
      const file = e.target.files[0]
      if (!file) return
      
      // Validate file type
      if (!file.type.match('image.*')) {
        this.validationErrors.push('O arquivo selecionado não é uma imagem válida.')
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.validationErrors.push('A imagem selecionada excede o tamanho máximo de 5MB.')
        return
      }
      
      // Create a preview
      const reader = new FileReader()
      reader.onload = (e) => {
        this.localData.mainImage = {
          file: file,
          preview: e.target.result,
          name: file.name,
          title: this.localData.mainImage.title || '',
          caption: this.localData.mainImage.caption || '',
          credits: this.localData.mainImage.credits || ''
        }
        this.updateData()
      }
      reader.readAsDataURL(file)
      
      // Reset the input so the same file can be selected again
      e.target.value = ''
    },
    removeMainImage() {
      this.localData.mainImage = {
        file: null,
        preview: '',
        name: '',
        title: '',
        caption: '',
        credits: ''
      }
      this.updateData()
    },
    handleImageValidation(isValid, errors) {
      this.imageValidationErrors = errors || []
      this.validateMedia()
    },
    validateMedia() {
      this.validationErrors = []
      
      // Validate main image
      if (!this.localData.mainImage.file) {
        this.validationErrors.push('Selecione uma imagem principal para o verbete')
      } else {
        if (!this.localData.mainImage.title) {
          this.validationErrors.push('Adicione um título para a imagem principal')
        }
        if (!this.localData.mainImage.caption) {
          this.validationErrors.push('Adicione uma legenda para a imagem principal')
        }
        if (!this.localData.mainImage.credits) {
          this.validationErrors.push('Adicione os créditos para a imagem principal')
        }
      }
      
      // Add image uploader validation errors
      this.validationErrors.push(...this.imageValidationErrors)
    },
    async validate() {
      const isValid = await this.$refs.form.validate()
      
      this.validateMedia()
      
      this.$emit('validate', 3, this.validationErrors)
      return isValid.valid && this.validationErrors.length === 0
    }
  }
}
</script>

<style scoped>
.main-image-upload {
  margin-bottom: 20px;
}

.image-preview-wrapper {
  height: 300px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.main-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>