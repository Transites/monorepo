<template>
  <div>
    <v-card class="carouselCard">
      <v-row>
        <v-col cols=6>
          <v-carousel hide-delimiters cycle interval="2000" v-model="counter">
            <v-carousel-item class="cardItem" v-for="(item, i) in items" :key="i" :src="item.src" cover>
                <div class="TitleSubtitleContainer">
                    <v-card-title class="cardTitleSubtitle">Título do Verbete no Banner</v-card-title>
                    <v-card-subtitle class="cardTitleSubtitle">Subtítulo do Banner</v-card-subtitle>
                </div>
            </v-carousel-item>
          </v-carousel>
        </v-col>
        <v-col cols=6  class="bannerTextColumn">
          <v-card-text>
            {{ items[counter].text }}
          </v-card-text>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>
export default {
  data: () => ({
    counter:2,
    items: [
      {
        src: 'https://cdn.vuetifyjs.com/images/carousel/squirrel.jpg',
        title: 'Título 1',
        text: 'Texto do primeiro titulo da pagina'
      },
      {
        src: 'https://cdn.vuetifyjs.com/images/carousel/sky.jpg',
        title: 'Título 2',
        text: 'Texto do segundo titulo da pagina'
      },
      {
        src: 'https://cdn.vuetifyjs.com/images/carousel/bird.jpg',
        title: 'Título 3',
        text: 'Texto do terceiro titulo da pagina'
      },
    ]
  })
}
</script>

<style>
.carouselCard {
  display: flex;
  flex-flow: row;
}
.cardItem {
    display: flex;
    align-items: flex-end;
}
.cardTitleSubtitle{
    text-align: center;
    background-color: black;
    color:white;
}
.TitleSubtitleContainer{
    height: 100%;
    display:flex;
    flex-direction: column;
    justify-content: flex-end;
}
.bannerTextColumn{
    display:flex;
    align-items: center;
}
</style>


