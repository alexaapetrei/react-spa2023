import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Define the types for TypeScript
type Resources = {
    [lang: string]: {
        translation: Record<string, string>;
    };
};

type Langs = {
    [code: string]: string;
};

// You can import your translation files here
const languages = ["en", "ro", "de", "hu"];

const resources: Resources = {};

async function loadTranslations() {
    for (const lang of languages) {
        const module = await import(`./locales/${lang}/tr.json`);
        resources[lang] = {
            translation: module.default
        };
    }
}

loadTranslations().then(() => {
    // Initialize i18n after translations are loaded
    i18n
        .use(initReactI18next)
        .init({
            resources,
            lng: savedLanguage,
            interpolation: {
                escapeValue: false // react already escapes values
            }
        });

    // Listen for language changes and update localStorage
    i18n.on('languageChanged', function (lng) {
        localStorage.setItem('i18nLanguage', lng);
    });
});

export const langs: Langs = {
    ro: "Română",
    en: "English",
    de: "Deutsch",
    hu: "Magyar"
};

// Check for saved language in localStorage or default to "ro"
const savedLanguage = localStorage.getItem('i18nLanguage') || "ro";

export default i18n;
