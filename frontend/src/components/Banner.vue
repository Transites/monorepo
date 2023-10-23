<template>
  <div class="carouselContainer" :style="propStyle">
    <v-card
      class="carouselCard"
      color="var(--prop-color)"
      variant="outlined"
    >
      <v-row no-gutters>
        <v-col cols="6">
          <v-carousel hide-delimiters cycle interval="2000" v-model="counter" delimiter-icon>
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
        <v-col cols="6" md="" class="bannerTextColumn">
          <p>
            {{ items[counter].text }}
          </p>
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
      default: "70px"
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
        text: '" a segunda é que o escrito ficaria assim mais galante e mais novo. Moisés, que também contou a sua morte, não a pôs no intróito, mas no cabo; diferença radical entre este livro e o Pentateuco."'
      }
    ]
  }),
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
  border-width: var(--border-width) !important;
}
.cardItem {
  display: flex;
  align-items: flex-end;
}
.cardTitleSubtitle {
  text-align: center;
  background-color: black;
  color: white;
}
.TitleSubtitleContainer {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.bannerTextColumn {
  display: flex;
  align-items: center;
  border-left: var(--border-width) solid var(--prop-color);
}
</style>


