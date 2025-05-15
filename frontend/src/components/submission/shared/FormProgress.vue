<template>
  <div class="form-progress">
    <v-stepper :model-value="currentStep" class="elevation-0">
      <v-stepper-header>
        <template v-for="(step, i) in steps" :key="i">
          <v-stepper-item
            :value="i"
            :complete="step.complete"
            :title="step.title"
            :icon="step.icon"
            @click="$emit('step-click', i)"
            :class="{ 'clickable': step.complete || i < currentStep }"
          >
          </v-stepper-item>
          
          <v-divider v-if="i < steps.length - 1"></v-divider>
        </template>
      </v-stepper-header>
    </v-stepper>
  </div>
</template>

<script>
export default {
  name: 'FormProgress',
  props: {
    currentStep: {
      type: Number,
      required: true
    },
    steps: {
      type: Array,
      required: true
    }
  },
  emits: ['step-click']
}
</script>

<style scoped>
.form-progress {
  margin: 20px 0;
}

.clickable {
  cursor: pointer;
}

/* Override Vuetify styles for completed steps */
:deep(.v-stepper-item--complete) {
  color: var(--transites-gray-purple) !important;
}

/* Override Vuetify styles for active step */
:deep(.v-stepper-item--active) {
  color: var(--transites-gray-purple) !important;
}
</style>