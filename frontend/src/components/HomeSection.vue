<template>
  <v-container>
    <v-row align="center">
      <v-col cols="12" md="6" class="mb-10">
        <v-row align="center">
          <v-col cols="12" sm="4" :align="$vuetify.display.smAndUp ? 'right' : 'center'">
            <slot name="icon"></slot>
          </v-col>
          <v-col cols="12" sm="8" :align="$vuetify.display.smAndUp ? 'left' : 'center'">
            <slot name="title"></slot>
          </v-col>
        </v-row>
        <v-row>
          <v-col align="center">
            <slot name="subtitle"></slot>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" md="6">
        <slot name="text"></slot>
      </v-col>
    </v-row>
  </v-container>
</template>
