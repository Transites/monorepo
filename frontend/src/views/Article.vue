<template>
    <NavBar />
    <div>
        <h1>Título do verbete</h1>
    </div>
    <v-row class="tags">
        <v-col><v-btn rounded>TAG</v-btn></v-col>
        <v-col><v-btn rounded>TAG</v-btn></v-col>
        <v-col><v-btn rounded>TAG</v-btn></v-col>
    </v-row>
    <div>
        <h3>Local de nascimento, XX/XX/XXXX</h3>
        <h3>Local de falecimento, XX/XX/XXXX</h3>
    </div>
        <v-conteiner>
            <v-row class="articleRow">
                <v-col class="articlePhoto">
                    <v-card
                        max-height="450px"
                        style="aspect-ratio: auto 3/4"
                    >
                        <v-img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Mona_Lisa-restored.jpg/1200px-Mona_Lisa-restored.jpg"
                    cover>
                        </v-img>
                    </v-card>
                </v-col>
                <v-col class="articleText">
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                    Nunc vulputate lacus nec leo luctus consectetur. Cras eget lectus orci. 
                    Praesent euismod auctor velit, sed vehicula ligula mollis sed. 
                    [RESUMO DA TRAJETÓRIA DA PESSOA APRESENTADA]</p>
                    
                    <br>

                    <p>Legenda da imagem: Lorem ipsum dolor sit amet, consectetur adipiscing.</p>
                </v-col>
            </v-row>
        </v-conteiner>

        <v-expansion-panels>
            <v-expansion-panel>
                <v-expansion-panel-title style="color: blue">Artigo</v-expansion-panel-title>
                <v-expansion-panel-text>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur. 
                    Cras eget lectus orci. Praesent euismod auctor velit, sed vehicula ligula mollis sed. Etiam pretium malesuada mauris vitae vulputate. 
                    Proin nunc sapien, sagittis et auctor sed, luctus ut sapien. Morbi fringilla elementum turpis, bibendum consectetur tortor lacinia sed. 
                    Sed maximus vulputate metus, et suscipit risus dignissim nec.
                    
                    Ut ac arcu pellentesque, vulputate tellus vitae, pulvinar odio. Maecenas feugiat neque imperdiet, euismod neque ut, posuere nisi. 
                    Quisque fringilla tortor a neque aliquet, a mattis enim blandit. Nullam molestie laoreet libero, vulputate consequat mauris laoreet eu. 
                    Nulla vitae nibh vel eros fermentum efficitur ac vel ligula. Nulla in commodo risus. Praesent tristique ac enim a ornare. Nam at neque varius, 
                    fringilla odio commodo, pellentesque augue. Nunc ut hendrerit nulla, vitae condimentum turpis. Aliquam erat volutpat. Cras faucibus commodo mauris, 
                    non vulputate lacus pretium vel. Pellentesque mattis vel tellus id volutpat.
                </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel>
                <v-expansion-panel-title>Publicações</v-expansion-panel-title>
                <v-expansion-panel-text>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur. 
                    Cras eget lectus orci. Praesent euismod auctor velit, sed vehicula ligula mollis sed. Etiam pretium malesuada mauris vitae vulputate. 
                    Proin nunc sapien, sagittis et auctor sed, luctus ut sapien. Morbi fringilla elementum turpis, bibendum consectetur tortor lacinia sed. 
                    Sed maximus vulputate metus, et suscipit risus dignissim nec.
                    
                    Ut ac arcu pellentesque, vulputate tellus vitae, pulvinar odio. Maecenas feugiat neque imperdiet, euismod neque ut, posuere nisi. 
                    Quisque fringilla tortor a neque aliquet, a mattis enim blandit. Nullam molestie laoreet libero, vulputate consequat mauris laoreet eu. 
                    Nulla vitae nibh vel eros fermentum efficitur ac vel ligula. Nulla in commodo risus. Praesent tristique ac enim a ornare. Nam at neque varius, 
                    fringilla odio commodo, pellentesque augue. Nunc ut hendrerit nulla, vitae condimentum turpis. Aliquam erat volutpat. Cras faucibus commodo mauris, 
                    non vulputate lacus pretium vel. Pellentesque mattis vel tellus id volutpat.
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
</template>

<script setup>
import About from '../components/About.vue'
import News from '../components/News.vue'
import Banner from '../components/Banner.vue'
import Media from '../components/Media.vue'
import Contribute from '../components/Contribute.vue'
</script>
  
<style scoped>
.tags {
        align-items: start;
}
.articleColumn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.articlePhoto{
    flex-direction: row;
    align-self: center;
}

.articleText{
    display: flex;
    flex-wrap: wrap;
}

</style>
  