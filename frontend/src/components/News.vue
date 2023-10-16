<template>
  <div>
    <h1>Novidades</h1>
    <v-conteiner class="news-content">
      <div class="d-flex">
        <div v-for="column in entries" class="column" :key="column">
          <v-card
            class="news-cards"
            v-for="entry in column"
            :key="entry"
            :title="entry.title"
            :subtitle="entry.category"
          >
          </v-card>
        </div>
      </div>
      <v-card width="200" height="300">
        <v-img
          class="align-end text-white"
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Mona_Lisa-restored.jpg/1200px-Mona_Lisa-restored.jpg"
          cover
        >
          <v-card-title>Verbete</v-card-title>
        </v-img>
      </v-card>
    </v-conteiner>
  </div>
</template>


<script>
export default {
  data: () => ({
    entries: {
      left: [
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
      ],
      right: [
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
    }
  })
}
</script>
<style>
.column {
  display: flex;
  flex-direction: column;
  padding: 2rem;
}

.news-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-wrap: wrap;
}

.news-cards {
  margin: 0.5rem;
  align-items: flex-start;
}
</style>
