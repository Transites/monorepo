<template>
  <HomeSection>
    <template #icon> 
      <v-img :src="logo" max-width="180" ></v-img>
    </template>
    <template #title>
      <h2 style="color: var(--transites-light-red)"> <b>{{ $t('about.title') }}</b></h2>
    </template>
    <template #subtitle>
      <p style="color: var(--transites-light-red)">{{ $t('about.subtitle') }}</p>
    </template>
    <template #text>
      <p>
        <span style="color: var(--transites-red);">
          <b>{{ $t('about.projectName') }}</b>
        </span> {{ $t('about.description') }}
      </p>
      <br>
      <p>
        <b>{{ $t('about.feedbackTitle') }}</b>
        {{ $t('about.feedbackText') }}
        <router-link to="/Contribute">{{ $t('common.here') }}</router-link>.
        {{ $t('about.feedbackThanks') }}
      </p>
    </template>
  </HomeSection>
</template>

<script setup>
import HomeSection from "@/components/HomeSection.vue"
import logo from "@/assets/transites-icon.svg"
</script>
