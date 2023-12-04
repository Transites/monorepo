<template>
  <v-text-field
    color="var(--transites-red)"
    clearable
    rounded="xl"
    variant="outlined"
    hide-details
    prepend-inner-icon="mdi-magnify"
    density="compact"
    append-inner-icon="mdi-tune"
    @click:append-inner="openAdvancedSearch"
  ></v-text-field>
</template>

<script>
export default {
  methods: {
    openAdvancedSearch() {
      // TODO route to advanced-search page
      this.$router.push('/');
    }
  }
}
</script>
