<template>
  <v-container class="px-0">
    <v-row>
      <v-col cols="12" md="4" lg="3">
        <v-row>
          <v-col cols="12" sm="5" md="12" class="pb-1" v-if="!!slots['side-panel-header']">
            <slot name="side-panel-header"></slot>
          </v-col>
          <v-col cols="12" sm md="12" class="pt-1">
            <div ref="sidePanel">
              <slot name="side-panel-body"></slot>
            </div>
            <v-divider v-if="sidePanelHasContent" thickness="3" class="border-opacity-100" color="var(--transites-red)"></v-divider>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" md lg>
        <slot name="default"></slot>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useSlots } from 'vue'

export default {
  data() {
    return {
      sidePanelHasContent: false
    }
  },
  setup() {
    return {
      slots: useSlots()
    }
  },
  mounted() {
    this.sidePanelHasContent = this.$refs.sidePanel.textContent.trim() !== ''
  }
}
</script>
