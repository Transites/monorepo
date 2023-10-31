<template>
    <div>
        <h1 style="color: var(--transites-red); padding-left: 30px; margin-top: 10px;">Título do verbete</h1>
    </div>

    <v-divider
    :thickness="5"
    class="border-opacity-100"
    color="var(--transites-red)"
    style="margin: 30px;"
    ></v-divider>

    <div>
        <v-btn class="tags text-white"
        v-for="tag in tags"
        :key="tag"
        color="var(--transites-red)"
        rounded
        >
        {{ tag }}
        </v-btn>
    </div>

    <v-divider
    :thickness="5"
    class="border-opacity-100"
    color="var(--transites-red)"
    style="margin: 30px;"
    ></v-divider>

    <div>
        <h3 style="color: var(--transites-red); padding-left: 30px;">Local de nascimento, XX/XX/XXXX</h3>
        <h3 style="color: var(--transites-red); padding-left: 30px;">Local de falecimento, XX/XX/XXXX</h3> <br>
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
                    <p class="d-flex align-center justify-center" style="padding: 30px; color: var(--transites-red)">Legenda da imagem: Lorem ipsum dolor sit amet, consectetur adipiscing.</p>
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

<!--        <div>
            <v-expansion-panels style="padding: 30px">
                <v-expansion-panel class="section"
                v-for="section in sections"
                :key="section"
                :class="getPanelColor(section)">
                    <v-expansion-panel-title style="color: var(--transites-red)">{{ section.title }}</v-expansion-panel-title>
                    <v-expansion-panel-text style="color: var(--transites-red)">{{ section.content }}</v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </div> -->

        <div>
            <v-expansion-panels flat style="padding: 30px">
                <v-divider
                :thickness="5"
                class="border-opacity-100"
                color="var(--transites-light-red)"
                ></v-divider>

                <v-expansion-panel class="section" style="margin: 10px">
                    <v-expansion-panel-title style="color: var(--transites-light-red); font-size: x-large;">Artigo</v-expansion-panel-title>
                    <v-expansion-panel-text style="color: var(--transites-light-red)">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur.</v-expansion-panel-text>
                </v-expansion-panel>

                <v-divider
                :thickness="5"
                class="border-opacity-100"
                color="var(--transites-yellow)"
                ></v-divider>

                <v-expansion-panel style="margin: 10px">
                    <v-expansion-panel-title style="color: var(--transites-yellow); font-size: x-large;">Publicações</v-expansion-panel-title>
                    <v-expansion-panel-text style="color: var(--transites-yellow)">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur.</v-expansion-panel-text>
                </v-expansion-panel>

                <v-divider
                :thickness="5"
                class="border-opacity-100"
                color="var(--transites-blue)"
                ></v-divider>

                <v-expansion-panel style="margin: 10px">
                    <v-expansion-panel-title style="color: var(--transites-blue); font-size: x-large;">Premiações e distinções</v-expansion-panel-title>
                    <v-expansion-panel-text style="color: var(--transites-blue)">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur.</v-expansion-panel-text>
                </v-expansion-panel>

                <v-divider
                :thickness="5"
                class="border-opacity-100"
                color="var(--transites-gray-purple)"
                ></v-divider>

                <v-expansion-panel style="margin: 10px">
                    <v-expansion-panel-title style="color: var(--transites-gray-purple); font-size: x-large;">Bibliografia</v-expansion-panel-title>
                    <v-expansion-panel-text style="color: var(--transites-gray-purple)">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur.</v-expansion-panel-text>
                </v-expansion-panel>

            </v-expansion-panels>
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
      panelColors: ["red", "blue", "green"], // Define an array of colors
    };
  },
  methods: {
    getPanelColor(index) {
      // Dynamically select a color from the panelColors array based on the index
      return `color-${this.panelColors[index]}`;
    },
  },
};
</script>
  
<style scoped>
.tags {
    flex-wrap: wrap;
    flex-direction: column;
    margin-left: 30px;
    color: white;
}

.section {
    flex-wrap: wrap;
    flex-direction: column;
    margin: 10px;
}

.sections {
    border: none; /* Remove the border */
    box-shadow: none; /* Remove the box-shadow */
}

</style>
  