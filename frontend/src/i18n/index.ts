import { createI18n } from 'vue-i18n';
import { I18nOptions, MessageSchema, Messages } from './types';

// Import all locale files
import ptBR from './locales/pt-BR.json';

// Type assertion to ensure our messages match the schema
const messages: Messages = {
  'pt-BR': ptBR as MessageSchema
};

// Create i18n instance
const i18n = createI18n<[MessageSchema], 'pt-BR' | 'en-US'>({
  legacy: false, // Use Composition API
  locale: getBrowserLocale() || 'pt-BR', // Default locale
  fallbackLocale: 'pt-BR', // Fallback locale
  messages,
  globalInjection: true, // Inject $t, $tc, etc. into all components
  silentTranslationWarn: process.env.NODE_ENV === 'production', // Suppress warnings in production
  silentFallbackWarn: process.env.NODE_ENV === 'production', // Suppress fallback warnings in production
  missingWarn: process.env.NODE_ENV !== 'production', // Show missing key warnings in development
  fallbackWarn: process.env.NODE_ENV !== 'production', // Show fallback warnings in development
} as I18nOptions);

// Function to get browser locale
function getBrowserLocale(): string | null {
  // Try to get from localStorage first (for returning users)
  const storedLocale = localStorage.getItem('locale');
  if (storedLocale) {
    return storedLocale;
  }

  // Try to get from browser
  const navigatorLocale = 
    navigator.languages !== undefined 
      ? navigator.languages[0] 
      : navigator.language;
  
  if (!navigatorLocale) {
    return null;
  }

  // Check if we support this locale
  const locale = navigatorLocale.trim().split(/-|_/)[0];
  const supportedLocales = Object.keys(messages);
  
  if (supportedLocales.includes(navigatorLocale)) {
    return navigatorLocale;
  }
  
  // Check if we support the base language
  if (supportedLocales.some(l => l.startsWith(locale))) {
    return supportedLocales.find(l => l.startsWith(locale)) || null;
  }
  
  return null;
}

// Function to set locale
export function setLocale(locale: string): void {
  i18n.global.locale.value = locale;
  localStorage.setItem('locale', locale);
  document.querySelector('html')?.setAttribute('lang', locale);
}

// Export the i18n instance
export default i18n;

// Export a composable for use in components
export function useI18n() {
  return i18n.global;
}