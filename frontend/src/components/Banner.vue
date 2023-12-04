<template>
  <div class="carouselContainer" :style="propStyle">
    <v-card
      class="carouselCard"
      color="var(--prop-color)"
      variant="outlined"
    >
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
        <v-col cols="12" md="6" class="bannerTextColumn" :style="$vuetify.display.smAndDown ? 'height: 150px' : ''">
          <v-card-text>
            <p class="bannerText" :style="$vuetify.display.smAndDown ? '-webkit-line-clamp: 6' : '-webkit-line-clamp: 20'">
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
      default: "var(--transites-red)"
    },
    padding: {
      default: "70px 5% 30px 5%"
    }
  },
  data: () => ({
    counter: 2,
    items: [
      {
        src: 'https://cdn.vuetifyjs.com/images/carousel/squirrel.jpg',
        title: 'Título 1',
        subtitle: 'Subtítulo 1',
        text: 'Algum tempo hesitei se devia abrir estas memórias pelo princípio ou pelo fim, isto é, se poria em primeiro lugar o meu nascimento ou a minha morte. Suposto o uso vulgar seja começar pelo nascimento, duas considerações me levaram a adotar diferente método: a primeira'
      },
      {
        src: 'https://cdn.vuetifyjs.com/images/carousel/sky.jpg',
        title: 'Título 2',
        subtitle: 'Subtítulo 2',
        text: ' é que eu não sou propriamente um autor defunto, mas um defunto autor, para quem a campa foi outro berço'
      },
      {
        src: 'https://cdn.vuetifyjs.com/images/carousel/bird.jpg',
        title: 'Título 3',
        subtitle: 'Subtítulo 3',
        text: '" Georges Dumas nasceu em 6 de março de 1866, em Lédignan, no sul da França. Entre 1878 e 1884 frequentou o Liceu de Nîmes, de onde seguiu para os estudos preparatórios no Liceu Louis-le Grand, em Paris. Ingressou, aos vinte anos, na École normale supérieure (ens, Paris) e, em 1889, recebeu o diploma de agrégation em Filosofia, habilitando-se como professor secundário – ou agrégé, termo que será muito frequente durante a implantação das missões francesas nas recém-fundadas universidades de São Paulo e do Rio de Janeiro. De 1894 a 1902 ministrou aulas de Filosofia no Colégio Chaptal. Em 1900 se tornou docteur es lettres com uma tese principal sobre La Tristesse et la Joie (Alcan, 1900), e uma tese complementar intitulada Auguste Comte (Alcan, 1900). Casou-se, em 1906, com Aimée, filha do então diretor da ens. À formação humanista, agregou o diploma em Medicina, tendo concluído o doutorado com a tese Les états intellectuels de la mélancolie (Alcan, 1894). Com esse duplo interesse, pela Filosofia e pela Medicina, direcionou-se para a área de Psicologia. Assumiu a chefia do Laboratório de Psicologia Patológica na clínica de doenças mentais da Faculdade de Medicina, em 1897, posto que conservou até a aposentadoria, em 1937. Em 1902 passou a ministrar a disciplina Psico-Filosofia na Sorbonne, uma área totalmente nova, iniciada pelo amigo Pierre Janet. Em 1912 foi nomeado professor titular de Psicologia Experimental na mesma instituição, cargo que acumulou, a partir de 1921, com o posto de professor de Psicologia Patológica no Instituto de Psicologia da Universidade de Paris. Situa-se no período que antecede à i Guerra a produção intelectual mais densa e constante de Dumas, tanto em livros como em artigos publicados por periódicos renomados, a exemplo da Revue de deux mondes, Revue de Paris e Annales médico-psychologiques. A edição do estudo Psychologie de deux messies positivistes: Auguste Comte et Saint-Simon (Alcan, 1905) muito provavelmente acendeu o interesse dos brasileiros sobre seu pensamento. Pelo menos, foi sobre este tema que discorreu nas conferências proferidas no Rio de Janeiro e em São Paulo, em 1908, embora não tenha agradado necessariamente boa parte do público, tal era a distância entre o pensador interessado no sistema filosófico de Comte e uma audiência que abraçava o positivismo como uma religião. Um último livro, anterior ao início de suas atividades diplomáticas, selou sua imagem como a do psicólogo dedicado ao estudo das emoções: Le sourire et l’expression des émotions (Alcan, 1906). Georges Dumas pertenceu a uma nova geração francesa, formada na III República, que conformou um círculo de artistas, intelectuais e políticos notáveis, o quais fizeram do nacionalismo, do liberalismo e da laicidade uma profissão de fé. Como escreverá Dumas, em 1918, ao defender a criação de quatro liceus no Brasil (Porto Alegre, Belo Horizonte, Rio de Janeiro e São Paulo):'
      }
    ]
  }),
  methods: {
    prevSlide() {
      this.counter = (this.counter - 1 + this.items.length) % this.items.length;
    },
    nextSlide() {
      this.counter = (this.counter + 1) % this.items.length;
    },
  },
  computed: {
    propStyle () {
        return{
            '--prop-color': this.color,
            '--prop-padding': this.padding,
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
}
.bannerTextColumn {
  display: flex;
  align-items: center;
  border: var(--border-width) solid var(--prop-color);
}

.bannerText {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
