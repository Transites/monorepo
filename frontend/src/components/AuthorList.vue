<template>
  <div v-if="authors.length > 0">
    {{ authors.length > 1 ? 'Autores:' : 'Autor:' }}
    <v-btn
      v-for="(author, index) in authors"
      :key="author"
      variant="text"
      rounded="lg"
      style="text-transform: none; padding: 0px 5px 3px 5px"
    >
      <span>{{ author.name }}</span>
      <span v-if="index + 1 < authors.length">, </span>
    </v-btn>
  </div>
</template>

<script>
export default {
  props: {
    authors: {
      type: Object
      // [ { name: String, institution: String, description: String }, ... ]
    }
  }
}
</script>
