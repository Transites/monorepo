<template>
  <HomeSection>
    <template #icon>
      <v-img :src="logo" max-width="180" ></v-img>
    </template>
    <template #title>
      <h1 style="color: var(--transites-light-red)">Sobre Trânsitos | Circulations</h1>
    </template>
    <template #subtitle>
      <p style="color: var(--transites-light-red)"><b>Enciclopédia das Relações entre a França e o Brasil no século XX (1880-1980)</b></p>
    </template>
    <template #text>
      <p>
        Trânsitos é uma enciclopédia digital e evolutiva sobre os trânsitos Brasil-França. 
        Os verbetes referem-se a <b>pessoas</b> que transitam entre os dois países, além de <b>obras</b>, 
        <b>instituições</b> e <b>eventos</b> que marcam de alguma forma as relações e as circulações entre 
        estas duas margens do Atlântico. Em sua primeira fase, Trânsitos tratará somente do período 1880-1990. 
        Os verbetes, informativos, devem seguir as normas indicadas em nosso <b>manual</b>. 
        O objetivo não é simplesmente caracterizar uma personalidade, uma obra, um coletivo ou instituição, 
        um evento: o fio condutor de cada verbete deve ser a relação destes com os trânsitos Brasil-França, 
        <i>raison d’être</i> da enciclopédia.
      </p>
      <br>
      <p>
        <b>Encontrou dificuldades de acesso, detectou erros? Avise-nos!</b>
        Se você encontrou erros nos verbetes lidos, se notou a falta de informações significativas em algo 
        que leu, se não conseguiu acessar algum verbete ou teve qualquer tipo de dificuldade ao acessar Trânsitos, 
        mande uma mensagem curta e informativa aqui. Faremos o possível para resolver este problema e agradecemos por sua ajuda.
      </p>
    </template>
  </HomeSection>
</template>

<script setup>
import HomeSection from "@/components/HomeSection.vue"
import logo from "@/assets/transites-icon.svg"
</script>
