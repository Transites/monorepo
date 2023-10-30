<template>
  <div :style="propStyle" class="news-container">
    <h1 style="color: var(--transites-blue)">Novidades</h1>
    <v-conteiner>
      <v-row align="center">
        <v-col cols="12" lg="9">
          <v-row>
            <v-col
              cols="12"
              sm="6"
              v-for="entry in entries"
              :key="entry"
            >
              <v-card
                style="color: var(--transites-blue)"
                :title="entry.title"
                :subtitle="entry.category"
              >
              </v-card>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="12" lg="3" align="center">
          <v-card
            width="100%"
            max-height="450px"
            style="aspect-ratio: auto 3/4"
          >
            <v-img
              class="align-end text-white"
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Mona_Lisa-restored.jpg/1200px-Mona_Lisa-restored.jpg"
              cover
              align="start"
            >
              <v-card-title style="color: var(--transites-blue)">Verbete</v-card-title>
            </v-img>
          </v-card>
        </v-col>
      </v-row>
    </v-conteiner>
  </div>
</template>


<script>
export default {
  props: {
    padding: {
      default: "70px"
    }
  },
  data: () => ({
    entries: [
      {
        title: 'Título do verbete 1',
        category: 'categoria 1'
      },
      {
        title: 'Título do verbete 2',
        category: 'categoria 2'
      },
      {
        title: 'Título do verbete 3',
        category: 'categoria 3'
      },
      {
        title: 'Título do verbete 4',
        category: 'categoria 4'
      },
      {
        title: 'Título do verbete 1',
        category: 'categoria 1'
      },
      {
        title: 'Título do verbete 2',
        category: 'categoria 2'
      },
      {
        title: 'Título do verbete 3',
        category: 'categoria 3'
      },
      {
        title: 'Título do verbete 4',
        category: 'categoria 4'
      }
    ]
  }),
  computed: {
    propStyle () {
      return {
        '--prop-padding': this.padding,
      }
    }
  }
}
</script>

<style>
.news-container {
  padding: var(--prop-padding);
}
</style>
