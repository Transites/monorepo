<template>
  <div class="image-uploader">
    <div 
      class="upload-area"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      :class="{ 'drag-over': isDragging }"
    >
      <input 
        type="file" 
        ref="fileInput" 
        @change="onFileSelected" 
        accept="image/*" 
        multiple
        class="file-input"
      >

      <div class="upload-content">
        <v-icon size="48" color="grey">mdi-cloud-upload</v-icon>
        <h3 class="text-h6 mt-2">{{ $t('submission.imageUploader.dropzone') }}</h3>
        <p class="text-body-2 text-grey">{{ $t('submission.imageUploader.formats') }}</p>
        <v-btn 
          color="var(--transites-gray-purple)" 
          class="mt-4 text-white"
          @click="$refs.fileInput.click()"
        >
          {{ $t('submission.imageUploader.browse') }}
        </v-btn>
      </div>
    </div>

    <!-- Validation errors -->
    <div v-if="errors.length > 0" class="validation-errors mt-2">
      <v-alert
        v-for="(error, index) in errors"
        :key="index"
        type="error"
        density="compact"
        variant="tonal"
        class="mb-2"
      >
        {{ error }}
      </v-alert>
    </div>

    <!-- Preview of uploaded images -->
    <div v-if="images.length > 0" class="image-preview-container mt-4">
      <h3 class="text-subtitle-1 mb-2">{{ $t('submission.imageUploader.selectedImages') }} ({{ images.length }})</h3>

      <v-row>
        <v-col 
          v-for="(image, index) in images" 
          :key="index"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card class="image-card">
            <div class="image-preview-wrapper">
              <img :src="image.preview" :alt="image.name" class="image-preview">
            </div>

            <v-card-text>
              <v-text-field
                v-model="image.title"
                :label="$t('submission.imageUploader.title')"
                density="compact"
                :rules="[v => !!v || $t('submission.imageUploader.titleRequired')]"
              ></v-text-field>

              <v-textarea
                v-model="image.caption"
                :label="$t('submission.imageUploader.caption')"
                density="compact"
                rows="2"
                :rules="[v => !!v || $t('submission.imageUploader.captionRequired')]"
              ></v-textarea>

              <v-text-field
                v-model="image.credits"
                :label="$t('submission.imageUploader.credits')"
                density="compact"
                :rules="[v => !!v || $t('submission.imageUploader.creditsRequired')]"
              ></v-text-field>
            </v-card-text>

            <v-card-actions>
              <v-btn 
                icon 
                color="error" 
                variant="text"
                @click="removeImage(index)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>

              <v-spacer></v-spacer>

              <v-btn
                v-if="index > 0"
                icon
                @click="moveImage(index, index - 1)"
              >
                <v-icon>mdi-arrow-up</v-icon>
              </v-btn>

              <v-btn
                v-if="index < images.length - 1"
                icon
                @click="moveImage(index, index + 1)"
              >
                <v-icon>mdi-arrow-down</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageUploader',
  props: {
    value: {
      type: Array,
      default: () => []
    },
    maxFiles: {
      type: Number,
      default: 10
    },
    maxFileSize: {
      type: Number,
      default: 5 * 1024 * 1024 // 5MB
    }
  },
  data() {
    return {
      isDragging: false,
      images: [],
      errors: []
    }
  },
  watch: {
    value: {
      handler(newVal) {
        if (newVal && Array.isArray(newVal)) {
          // Only update if the arrays are different
          if (JSON.stringify(this.images) !== JSON.stringify(newVal)) {
            this.images = [...newVal]
          }
        }
      },
      immediate: true
    },
    images: {
      handler(newVal) {
        this.$emit('input', newVal)
        this.$emit('update:modelValue', newVal)
        this.validateImages()
      },
      deep: true
    }
  },
  methods: {
    onDragOver() {
      this.isDragging = true
    },
    onDragLeave() {
      this.isDragging = false
    },
    onDrop(e) {
      this.isDragging = false
      const files = e.dataTransfer.files
      if (files.length) {
        this.processFiles(files)
      }
    },
    onFileSelected(e) {
      const files = e.target.files
      if (files.length) {
        this.processFiles(files)
        // Reset the input so the same file can be selected again
        this.$refs.fileInput.value = ''
      }
    },
    processFiles(files) {
      // Check if adding these files would exceed the maximum
      if (this.images.length + files.length > this.maxFiles) {
        this.errors.push(this.$t('submission.imageUploader.maxFilesError', { max: this.maxFiles }))
        return
      }

      // Process each file
      Array.from(files).forEach(file => {
        // Validate file type
        if (!file.type.match('image.*')) {
          this.errors.push(this.$t('submission.imageUploader.invalidFileError', { name: file.name }))
          return
        }

        // Validate file size
        if (file.size > this.maxFileSize) {
          this.errors.push(this.$t('submission.imageUploader.fileSizeError', { name: file.name, size: '5MB' }))
          return
        }

        // Create a preview
        const reader = new FileReader()
        reader.onload = (e) => {
          this.images.push({
            file: file,
            name: file.name,
            preview: e.target.result,
            title: '',
            caption: '',
            credits: ''
          })
        }
        reader.readAsDataURL(file)
      })
    },
    removeImage(index) {
      this.images.splice(index, 1)
    },
    moveImage(fromIndex, toIndex) {
      // Swap images
      const temp = this.images[fromIndex]
      this.images.splice(fromIndex, 1)
      this.images.splice(toIndex, 0, temp)
    },
    validateImages() {
      this.errors = []

      // Check if there are any images
      if (this.images.length === 0) {
        return
      }

      // Check if all images have required metadata
      const incompleteImages = this.images.filter(
        img => !img.title || !img.caption || !img.credits
      )

      if (incompleteImages.length > 0) {
        this.errors.push(this.$t('submission.imageUploader.incompleteMetadataError', { count: incompleteImages.length }))
      }

      // Emit validation status
      this.$emit('validation', this.errors.length === 0, this.errors)
    },
    async uploadImages() {
      // This method would handle the actual upload to the server
      // It would be called by the parent component when ready to submit

      // Return a promise that resolves with the uploaded image data
      return Promise.all(
        this.images.map(async (image) => {
          try {
            // Here you would implement the actual upload logic
            // For now, we'll just simulate a successful upload

            // In a real implementation, you would:
            // 1. Create a FormData object
            // 2. Append the file and metadata
            // 3. Send a POST request to your API
            // 4. Return the response data

            // Simulate API response
            return {
              id: Math.random().toString(36).substring(2),
              url: image.preview,
              title: image.title,
              caption: image.caption,
              credits: image.credits
            }
          } catch (error) {
            console.error('Error uploading image:', error)
            throw error
          }
        })
      )
    }
  }
}
</script>

<style scoped>
.image-uploader {
  margin-bottom: 20px;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
}

.upload-area.drag-over {
  border-color: var(--transites-gray-purple);
  background-color: rgba(var(--transites-gray-purple-rgb), 0.05);
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-content {
  pointer-events: none;
}

.image-preview-container {
  margin-top: 20px;
}

.image-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.image-preview-wrapper {
  height: 200px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.image-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.validation-errors {
  margin-top: 10px;
}
</style>
