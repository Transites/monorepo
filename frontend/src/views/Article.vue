<template>
    <div style="padding-left: 30px; padding-right: 30px;">
        <div>
            <h1 style="color: var(--transites-red); margin: 10px 0 10px;">Título do verbete</h1>
            <h2 style="color: var(--transites-red)">Autor do verbete</h2>
            <p style="color:var(--transites-red);">Publicado em: XX/XX/XXXX | Atualizado em: XX/XX/XXXX</p>
        </div>

        <v-divider
        :thickness="5"
        class=" divisor"
        color="var(--transites-red)"
        ></v-divider>

        <div>
            <v-btn class="tags text-white"
                v-for="tag in tags"
                :key="tag"
                color="var(--transites-red)"
                rounded
                style="margin-right: 10px;"
            >
            {{ tag }}
            </v-btn>
        </div>

        <v-divider
        :thickness="5"
        class="divisor"
        color="var(--transites-red)"
        ></v-divider>

        <div>
            <h3 style="color: var(--transites-red);">Local de nascimento, XX/XX/XXXX</h3>
            <h3 style="color: var(--transites-red);">Local de falecimento, XX/XX/XXXX</h3> <br>
        </div>

        <v-conteiner>
            <v-row class="d-flex d-row">
                <v-col cols="12" sm="6" md="6" class="articlePhoto">
                    <div class="d-flex align-center justify-center">
                        <v-img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Mona_Lisa-restored.jpg/1200px-Mona_Lisa-restored.jpg"
                        aspect-ratio="16/9"
                        max-width="300"></v-img>
                    </div>
                    <div>
                        <p class="d-flex align-center justify-center" style="color: var(--transites-red)">Legenda da imagem: Lorem ipsum dolor sit amet, consectetur adipiscing.</p>
                    </div>
                </v-col>
                <v-col cols="12" sm="6" md="6" class="articleText">
                    <div>
                        <p class="d-flex align-center justify-center" style="color: var(--transites-red)">Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Nunc vulputate lacus nec leo luctus consectetur. Cras eget lectus orci.
                        Praesent euismod auctor velit, sed vehicula ligula mollis sed.
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Nunc vulputate lacus nec leo luctus consectetur. Cras eget lectus orci.
                        Praesent euismod auctor velit, sed vehicula ligula mollis sed.
                        [RESUMO DA TRAJETÓRIA DA PESSOA APRESENTADA]</p>
                    </div>
                </v-col>
            </v-row>

        </v-conteiner>

       <div>
            <v-expansion-panels>

                <v-expansion-panel class="section"
                    v-for="(section, index) in sections"
                    :key="section"
                    :style="{ 'color': getPanelColor(index) }"
                >
                    <v-divider
                        :thickness="5"
                        class="border-opacity-100"
                        :style="{ 'color': getPanelColor(index) }"
                    ></v-divider>
                    <v-expansion-panel-title style="font-size: x-large;">{{ section.title }}</v-expansion-panel-title>
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
      tags: ["TAG 1", "TAG 2", "TAG 3"],
      sections: [
        { title: "Artigo", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur." },
        { title: "Publicações", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur." },
        { title: "Premiações", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur." },
        { title: "Bibliografia", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur." },
      ],
      panelColors: [
        '--transites-light-red',
        '--transites-yellow',
        '--transites-blue',
        '--transites-gray-purple',
      ], // Define an array of colors
    };
  },
  methods: {
    getPanelColor(index) {
      // Dynamically select a color from the panelColors array based on the index
      return `var(${this.panelColors[index % this.panelColors.length]})`;
    },
  },
};
</script>

<style scoped>
.tags {
    flex-wrap: wrap;
    flex-direction: column;
    /* margin-left: 30px; */
    color: white;
}

.section {
    flex-wrap: wrap;
    flex-direction: column;
    margin: 10px;
}

.divisor {
    opacity: 100%;
    margin: 15px 0 15px;
}
</style>
