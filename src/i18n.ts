import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

type Resources = {
  [lang: string]: {
    translation: Record<string, string>;
  };
};

type Langs = {
  [code: string]: string;
};

const languages = ["en", "ro", "de", "hu"];

async function loadTranslations() {
  const resources: Resources = {};
  
  const translations = await Promise.all(
    languages.map(async (lang) => {
      const module = await import(`./locales/${lang}/tr.json`);
      return { lang, translation: module.default };
    })
  );
  
  translations.forEach(({ lang, translation }) => {
    resources[lang] = { translation };
  });
  
  return resources;
}

loadTranslations().then((resources) => {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "ro",
      lng: localStorage.getItem("i18nLanguage") || "ro",
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
    });
});

i18n.on("languageChanged", function (lng) {
  localStorage.setItem("i18nLanguage", lng);
});

export const langs: Langs = {
  ro: "Română",
  en: "English",
  de: "Deutsch",
  hu: "Magyar",
};

export default i18n;
