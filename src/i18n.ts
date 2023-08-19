// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// You can import your translation files here
import RO from './locales/ro/tr.json';
import EN from './locales/en/tr.json';
import HU from './locales/hu/tr.json';
import DE from './locales/de/tr.json';

const resources = {
    en: {
        translation: EN
    },
    ro: {
        translation: RO
    },
    de: {
        translation: DE
    },
    hu: {
        translation: HU
    },
};
type Langs = {
    [code: string]: string;
}

export const langs: Langs = { "ro": "Română", "en": "English", "de": "Deutsch", "hu": "Magyar" }
// Check for saved language in localStorage or default to "ro"
const savedLanguage = localStorage.getItem('i18nLanguage') || "ro";

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

export default i18n;