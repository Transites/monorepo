<template>
  <div style="padding: 60px 30px 0 30px;">
    <div style="color: var(--transites-red); padding-bottom: 20px">
      <div>
        <h1>Título do verbete</h1>
        <h2>Autor do verbete</h2>
        <p>Publicado em: XX/XX/XXXX | Atualizado em: XX/XX/XXXX</p>
      </div>

      <v-divider thickness="5" class="border-opacity-100" style="margin: 10px 0 5px"></v-divider>

      <div>
        <v-btn
          class="tags text-white"
          v-for="tag in tags"
          :key="tag"
          color="var(--transites-red)"
          rounded
          style="margin: 5px 10px 5px 0px"
        >
          {{ tag }}
        </v-btn>
      </div>

      <v-divider thickness="5" class="border-opacity-100" style="margin: 5px 0 10px"></v-divider>

      <div>
        <h3>Local de nascimento, XX/XX/XXXX</h3>
        <h3>Local de falecimento, XX/XX/XXXX</h3>
      </div>
    </div>

    <v-container style="color: var(--transites-red)">
      <v-row>
        <v-col cols="12" sm="6" align="center">
          <v-img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Mona_Lisa-restored.jpg/1200px-Mona_Lisa-restored.jpg"
            aspect-ratio="16/9"
            max-width="300"
          ></v-img>
          <p>Legenda da imagem: Lorem ipsum dolor sit amet, consectetur adipiscing.</p>
        </v-col>
        <v-col cols="12" sm="6">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo
            luctus consectetur. Cras eget lectus orci. Praesent euismod auctor velit, sed vehicula
            ligula mollis sed. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
            vulputate lacus nec leo luctus consectetur. Cras eget lectus orci. Praesent euismod
            auctor velit, sed vehicula ligula mollis sed. [RESUMO DA TRAJETÓRIA DA PESSOA
            APRESENTADA]
          </p>
        </v-col>
      </v-row>
    </v-container>

    <div>
      <v-expansion-panels>
        <v-expansion-panel
          class="section"
          v-for="(section, index) in sections"
          :key="section"
          :style="{ color: getPanelColor(index, sections.length) }"
        >
          <v-divider thickness="5" class="border-opacity-100"></v-divider>
          <v-expansion-panel-title style="font-size: x-large">{{
            section.title
          }}</v-expansion-panel-title>
          <v-expansion-panel-text>{{ section.content }}</v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tags: ['TAG 1', 'TAG 2', 'TAG 3'],
      sections: [
        {
          title: 'Artigo',
          content:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur.'
        },
        {
          title: 'Publicações',
          content:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur.'
        },
        {
          title: 'Premiações',
          content:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur.'
        },
        {
          title: 'Bibliografia',
          content:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur.'
        }
      ],
      panelColors: [
        '--transites-light-red',
        '--transites-yellow',
        '--transites-blue',
        '--transites-gray-purple'
      ] // Define an array of colors
    }
  },
  methods: {
    getPanelColor(index, length) {
      // Dynamically select a color from the panelColors array based on the index
      const panelColorIndex = Math.floor((this.panelColors.length * index) / length)
      return `var(${this.panelColors[panelColorIndex]})`
    }
  }
}
</script>

<style scoped>
.tags {
  flex-wrap: wrap;
  flex-direction: column;
  color: white;
}

.section {
  flex-wrap: wrap;
  flex-direction: column;
  margin: 10px;
}
</style>
