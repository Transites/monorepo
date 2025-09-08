import "i18next";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof import("../../public/locales/pt-BR/common.json");
      navigation: typeof import("../../public/locales/pt-BR/navigation.json");
      content: typeof import("../../public/locales/pt-BR/content.json");
    };
  }
}