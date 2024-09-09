<template>
  <HomeSection>
    <template #icon> 
      <v-img :src="logo" max-width="180" ></v-img>
    </template>
    <template #title>
      <h2 style="color: var(--transites-light-red)"> <b>Trânsitos | <i>Circulations </i></b></h2>
    </template>
    <template #subtitle>
      <p style="color: var(--transites-light-red)">Enciclopédia das Relações entre a França e o Brasil no século XX (1880-1980)</p>
    </template>
    <template #text>
      <p>
        <span style="color: var(--transites-red);">
          <b> Trânsitos  </b>| <i>Circulations</i>
        </span>  é uma enciclopédia digital e evolutiva sobre os trânsitos Brasil-França. 
        Os verbetes referem-se a <b>pessoas</b> que transitam entre os dois países, além de <b>obras</b>, 
        <b>instituições</b> e <b>eventos</b> que marcam de alguma forma as relações e as circulações entre 
        estas duas margens do Atlântico. Em sua primeira fase, Trânsitos tratará do período 1880-1980. 
        Os verbetes, informativos, devem seguir as normas indicadas em nosso <b>manual</b>. 
        O objetivo não é simplesmente caracterizar uma personalidade, uma obra, um coletivo ou instituição, 
        um evento: o fio condutor de cada verbete deve ser a relação destes com os trânsitos Brasil-França, 
        <i>raison d’être</i> da enciclopédia.
      </p>
      <br>
      <p>
        <b>Encontrou dificuldades de acesso? Detectou erros? Avise-nos!</b>
        Se você encontrou erros nos verbetes lidos, se notou a falta de informações significativas em algo 
        que leu, se não conseguiu acessar algum verbete ou teve qualquer tipo de dificuldade ao acessar Trânsitos | <i>Circulations</i>, 
        mande uma mensagem curta e informativa <router-link to="/Contribute">aqui</router-link>. Faremos o possível para resolver este problema e agradecemos por sua ajuda.
      </p>
    </template>
  </HomeSection>
</template>

<script setup>
import HomeSection from "@/components/HomeSection.vue"
import logo from "@/assets/transites-icon.svg"
</script>
