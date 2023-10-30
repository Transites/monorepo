<template>
    <div>
        <h1>Título do verbete</h1>
    </div>

    <v-row class="tags">
        <v-col
        v-for="tag in tags"
        :key="tag">
            <v-btn class="text-white"
            color="var(--transites-red)"
            rounded>{{ tag.title }}</v-btn>
        </v-col>
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

    <v-expansion-panels
        v-for="section in sections"
        :key="section">
            <v-expansion-panel>
                <v-expansion-panel-title>{{ section.title }}</v-expansion-panel-title>
                <v-expansion-panel-text>{{ section.text }}</v-expansion-panel-text>
            </v-expansion-panel>
    </v-expansion-panels>
</template>

<script setup>
    data: () => ({
        entries: [
            {
                title: 'Pessoa'
            },
            {
                title: 'Jornalismo'
            },
            {
                title: 'Literatura'
            },
        ]
    }),
    () => ({
        sections: [
            {
                title: 'Artigo',
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur. Cras eget lectus orci. Praesent euismod auctor velit, sed vehicula ligula mollis sed.'
            },
            {
                title: 'Publicações',
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate lacus nec leo luctus consectetur. Cras eget lectus orci. Praesent euismod auctor velit, sed vehicula ligula mollis sed.'
            },
        ]
    })
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