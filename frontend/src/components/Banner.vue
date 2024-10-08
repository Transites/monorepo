<template>
  <div class="carouselContainer" :style="propStyle">
    <v-card class="carouselCard" color="var(--prop-color)" variant="outlined">
      <v-row no-gutters>
        <v-col cols="12" md="6" style="border: var(--border-width) solid var(--prop-color)">
          <v-carousel hide-delimiters cycle interval="2000" v-model="counter">
            <template v-slot:prev>
              <v-btn icon color="var(--transites-red)" @click="prevSlide">
                <v-icon style="color: white">mdi-chevron-left</v-icon>
              </v-btn>
            </template>
            <template v-slot:next>
              <v-btn icon color="var(--transites-red)" @click="nextSlide">
                <v-icon style="color: white">mdi-chevron-right</v-icon>
              </v-btn>
            </template>
            <v-carousel-item
              class="cardItem"
              v-for="(item, i) in items"
              :key="i"
              :src="item.src"
              cover
            >
              <div class="TitleSubtitleContainer">
                <v-card-title class="cardTitleSubtitle">{{ item.title }}</v-card-title>
                <v-card-subtitle class="cardTitleSubtitle">{{ item.subtitle }}</v-card-subtitle>
              </div>
            </v-carousel-item>
          </v-carousel>
        </v-col>
        <v-col
          cols="12"
          md="6"
          class="bannerTextColumn"
          :style="$vuetify.display.smAndDown ? 'height: 150px' : ''"
        >
          <v-card-text>
            <p
              class="bannerText"
              :style="
                $vuetify.display.smAndDown ? '-webkit-line-clamp: 6' : '-webkit-line-clamp: 20'
              "
            >
              {{ items[counter].text }}
            </p>
          </v-card-text>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>
export default {
  props: {
    color: {
      default: 'var(--transites-red)'
    },
    padding: {
      default: '70px 5% 30px 5%'
    }
  },
  data: () => ({
    counter: 2,
    items: [
      {
        src: 'http://enciclopedia.iea.usp.br:1337/uploads/capa_Cahiers_a741c06e2d.jpg',
        title: 'Cahiers du Brésil Contemporain',
        subtitle: 'Revista',
        text: 'Em 1987, dois anos após a fundação do Centre de recherches sur le Brésil contemporain (CRBC) na École des Hautes Études en Sciences Sociales (EHESS), em Paris, Ignacy Sachs (1927-2023) criou os Cahiers du Brésil contemporain. A revista circulou até 2010, quando foi substituída por Brésil(s). Sciences humaines et sociales. A revista era uma publicação da Fondation Maison des Sciences de l’Homme (FMSH) e publicava, em francês, artigos em todas as disciplinas das ciências humanas e sociais, tentando construir pontes entre a pesquisa realizada no Brasil e por brasilianistas, em particular franceses. Apesar de ter publicado alguns exemplares “Micellanea”, os números eram em geral temáticos, muitas vezes duplos, compondo volumes bastante significativos.'
      },
      {
        src: 'http://enciclopedia.iea.usp.br:1337/uploads/Lucia_T_Osi_58ddf59538.png',
        title: 'Lucia Tosi',
        subtitle: 'Cientista natural, química, intelectual e professora universitária',
        text: 'Lucía Tosi foi uma cientista natural da cidade de Buenos Aires, na Argentina, que consolidou sua carreira no Brasil e na França, trazendo uma vasta contribuição às pesquisas sobre gênero e ciência e história das mulheres nas ciências. Lucía Tosi teve toda a sua formação em Química vinculada ao seu país natal, a Argentina. Todavia sua carreira científica se desenvolveu no entrelace de sua relação com a França e o Brasil.'
      },
      {
        src: 'http://enciclopedia.iea.usp.br:1337/uploads/Ignacy_Sachs_2_52e549750e.jpeg',
        title: 'Ignacy Sachs',
        subtitle: 'Economista, intelectual e professor universitário',
        text: 'Ignacy Sachs nasceu em Varsóvia em 1927. Em 1940, a família deixou a Polônia de carro, em direção à França, onde seu pai combateu junto ao exército polonês no exílio. A ocupação alemã empurrou os Sachs para mais longe: passando por Portugal, embarcaram para o Brasil. Tendo voltado à Polônia em 1954, deixou definitivamente o país em 1968, instalando-se na França a convite de Fernand Braudel. Na École des hautes études en sciences sociales, ao criar o Centre de recherches sur le Brésil Contemporain (CRBC), deu início a longas e profundas trocas científicas entre a França e o Brasil. '
      }
    ]
  }),
  methods: {
    prevSlide() {
      this.counter = (this.counter - 1 + this.items.length) % this.items.length
    },
    nextSlide() {
      this.counter = (this.counter + 1) % this.items.length
    }
  },
  computed: {
    propStyle() {
      return {
        '--prop-color': this.color,
        '--prop-padding': this.padding
      }
    }
  }
}
</script>

<style>
.carouselContainer {
  --border-width: 4px;
  padding: var(--prop-padding);
}
.carouselCard {
  display: flex;
  flex-flow: row;
}
.cardItem {
  display: flex;
  align-items: flex-end;
}
.TitleSubtitleContainer {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.cardTitleSubtitle {
  text-align: center;
  background-color: var(--transites-red);
  color: white;
  font-size: 1.5rem; /* Aumenta o tamanho da fonte */
}
.bannerTextColumn {
  display: flex;
  align-items: center;
  justify-content: center; /* Centraliza verticalmente o texto */
  border: var(--border-width) solid var(--prop-color);
  padding: 10px; /* Ajuste de padding */
}

.bannerText {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: black;
  font-size: 1.25rem; /* Aumenta o tamanho da fonte do texto */
  text-align: center; /* Centraliza o texto */
}
</style>
