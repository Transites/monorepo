<template>
  <div class="language-switcher">
    <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
          :prepend-icon="mdiTranslate"
          class="language-button"
        >
          {{ currentLocaleDisplay }}
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="locale in availableLocales"
          :key="locale.code"
          :value="locale.code"
          @click="changeLocale(locale.code)"
        >
          <v-list-item-title>{{ locale.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useI18n } from '@/i18n';
import { setLocale } from '@/i18n';
import { mdiTranslate } from '@mdi/js';

export default {
  name: 'LanguageSwitcher',
  setup() {
    const i18n = useI18n();

    const availableLocales = [
      { code: 'pt-BR', name: 'Português (Brasil)' },
      // Add more locales as they become available
      // { code: 'en-US', name: 'English (US)' },
    ];

    const currentLocaleDisplay = computed(() => {
      const locale = availableLocales.find(l => l.code === i18n.locale.value);
      return locale ? locale.name : 'Português (Brasil)';
    });

    const changeLocale = (localeCode) => {
      setLocale(localeCode);
    };

    return {
      availableLocales,
      currentLocaleDisplay,
      changeLocale,
      mdiTranslate
    };
  }
};
</script>

<style scoped>
.language-switcher {
  display: inline-block;
}

.language-button {
  min-width: 120px;
}
</style>