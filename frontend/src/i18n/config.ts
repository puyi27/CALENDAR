// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import itTranslations from './locales/it.json';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

const savedLanguage = localStorage.getItem('fae_language') || 'it';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: itTranslations },
      en: { translation: enTranslations },
      es: { translation: esTranslations } 
    },
    lng: savedLanguage,
    fallbackLng: 'it',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;