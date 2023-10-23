<template>
  <v-container>
    <v-row class="aboutRow">
      <v-col class="aboutColumn">
        <div class="about">
          <img src="https://cdn.iconscout.com/icon/free/png-256/free-people-1767899-1502152.png" />
          <h1>Sobre o Transites</h1>
        </div>
        <p>Saiba mais sobre nossa história e colaboradores.</p>
      </v-col>

      <v-col class="aboutColumn">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum et odio vitae est
          gravida ultrices. Sed mattis, dolor eget luctus ultricies, arcu lectus cursus tortor, vel
          ultricies tortor augue eget ipsum. Fusce tempus dolor libero, vel pharetra odio finibus
          vel..
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum et odio vitae est
          gravida ultrices. Sed mattis, dolor eget luctus ultricies, arcu lectus cursus tortor, vel
          ultricies tortor augue eget ipsum. Fusce tempus dolor libero, vel pharetra odio finibus
          vel..
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
