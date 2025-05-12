<template>
  <div v-if="authors.length > 0">
    {{ authors.length > 1 ? 'Autores:' : 'Autor:' }}
    <v-btn
      v-for="(author, index) in authors"
      :key="author"
      variant="text"
      rounded="lg"
      style="text-transform: none; padding: 0 5px 3px 5px"
    >
      <span>{{ author.name }}</span>
      <span v-if="index + 1 < authors.length">, </span>

      <v-dialog v-model="dialog[index]" activator="parent" width="auto">
        <v-card :title="author.name" prepend-icon="mdi-account" class="rounded-lg">
          <template v-slot:subtitle v-if="author.institution">
            Instituição: {{ author.institution }}
          </template>
          <v-card-text v-if="author.description">
            {{ author.description }}
          </v-card-text>
          <v-card-actions>
            <v-btn block @click="dialog[index] = false">Fechar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-btn>
  </div>
</template>

<script>
export default {
  data() {
    return {
      dialog: Array(this.authors.length).fill(false)
    }
  },
  props: {
    authors: {
      type: Array,
      default: () => []
      // [ { name: String, institution: String, description: String }, ... ]
    }
  }
}
</script>
