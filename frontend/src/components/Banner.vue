<template>
  <div class="carouselContainer" :style="propStyle">
    <v-card class="carouselCard" color="var(--prop-color)" variant="outlined">
      <v-row no-gutters>
        <v-col cols="12" md="6" style="border: var(--border-width) solid var(--prop-color)">
          <v-carousel v-if="!loading && items.length > 0" hide-delimiters cycle interval="3500" v-model="counter">
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
                @click="handleLeftClick(item)"
                style="position: relative;"
            >
              <!-- Link invisível para middle click funcionar -->
              <a
                  :href="`/article/person/${item.id}`"
                  @click.prevent="handleLinkClick($event, item)"
                  style="position: absolute; inset: 0; z-index: 1;"
                  aria-label="Ir para artigo"
              ></a>

              <div class="TitleSubtitleContainer" style="position: relative; z-index: 2; pointer-events: none;">
                <v-card-title class="cardTitleSubtitle">{{ item.title }}</v-card-title>
                <v-card-subtitle style="text-transform: capitalize" class="cardTitleSubtitle">{{ item.subtitle }}</v-card-subtitle>
              </div>
            </v-carousel-item>
          </v-carousel>
          <div v-else-if="loading" class="loading-container">
            <v-progress-circular indeterminate color="var(--transites-red)"></v-progress-circular>
          </div>
          <div v-else class="no-data-container">
            <p>No banner data available</p>
          </div>
        </v-col>
        <v-col
          cols="12"
          md="6"
          class="bannerTextColumn"
          :style="$vuetify.display.smAndDown ? 'height: 150px' : ''"
        >
          <v-card-text v-if="!loading && items.length > 0">
            <p
              class="bannerText"
              :style="
                $vuetify.display.smAndDown ? '-webkit-line-clamp: 6' : '-webkit-line-clamp: 20'
              "
            >
              {{ items[counter].text }}
            </p>
          </v-card-text>
          <v-card-text v-else-if="loading" class="loading-text">
            <v-progress-circular indeterminate color="var(--transites-red)"></v-progress-circular>
          </v-card-text>
          <v-card-text v-else class="no-data-text">
            <p>No banner data available</p>
          </v-card-text>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>
import bannerService from '@/services/bannerService'

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
    counter: 0,
    items: [],
    loading: true
  }),
  async created() {
    try {
      this.loading = true
      this.items = await bannerService.getBannerData()
      this.loading = false
    } catch (error) {
      console.error('Error loading banner data:', error)
      this.loading = false
      // Fallback to default items if there's an error
      this.items = [
        // {
        //   src: 'http://enciclopedia.iea.usp.br:1337/uploads/capa_Cahiers_a741c06e2d.jpg',
        //   title: 'Cahiers du Brésil Contemporain',
        //   subtitle: 'Revista',
        //   text: 'Em 1987, dois anos após a fundação do Centre de recherches sur le Brésil contemporain (CRBC) na École des Hautes Études en Sciences Sociales (EHESS), em Paris, Ignacy Sachs (1927-2023) criou os Cahiers du Brésil contemporain. A revista circulou até 2010, quando foi substituída por Brésil(s). Sciences humaines et sociales.'
        // }
      ]
    }
  },
  methods: {
    prevSlide() {
      this.counter = (this.counter - 1 + this.items.length) % this.items.length
    },
    nextSlide() {
      this.counter = (this.counter + 1) % this.items.length
    },
    handleLeftClick(item) {
      // Apenas para garantir que cliques no conteúdo funcionem
      this.$router.push(`/article/person/${item.id}`);
    },

    handleLinkClick(event, item) {
      // Apenas previne o comportamento padrão para clique esquerdo
      if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        this.$router.push(`/article/person/${item.id}`);
      }
      // Middle click e Ctrl+click funcionam nativamente
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
  cursor: pointer;
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

.loading-container, .no-data-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  background-color: #f5f5f5;
}

.loading-text, .no-data-text {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.no-data-container p, .no-data-text p {
  font-size: 1.25rem;
  color: #757575;
  text-align: center;
}
</style>
