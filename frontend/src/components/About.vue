<template>
  <v-container>
    <v-row class="aboutRow">
      <v-col class="aboutColumn">
        <div class="about">
          <img src="../assets/transites-icon.svg" height="250" width="250" />
          <h1 style="color: var(--transites-light-red)">Sobre Transitos | Circulations</h1>
        </div>
        <p style="color: var(--transites-light-red)"><b>Enciclopédia das Relações entre a França e o Brasil no século XX (1880-1980)</b></p>
      </v-col>

      <v-col class="aboutColumn">
        <p style="font-size: medium;">
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
        <p style="font-size: medium;">
          <b>Encontrou dificuldades de acesso, detectou erros? Avise-nos!</b>
          Se você encontrou erros nos verbetes lidos, se notou a falta de informações significativas em algo 
          que leu, se não conseguiu acessar algum verbete ou teve qualquer tipo de dificuldade ao acessar Trânsitos, 
          mande uma mensagem curta e informativa aqui. Faremos o possível para resolver este problema e agradecemos por sua ajuda.
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.aboutColumn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.about {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.aboutRow {
  display: flex;
  flex-wrap: wrap;
}
</style>
