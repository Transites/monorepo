import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "pt-BR",
    supportedLngs: ["pt-BR", "fr-FR"],
    defaultNS: "common",
    ns: ["common", "navigation", "content"],

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    debug: false,
  });

export default i18n;