import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import th from "./locales/th.json";

// Language storage key
export const LANGUAGE_STORAGE_KEY = "car-reservation-language";

// Get language from localStorage or default to 'en'
const getStoredLanguage = (): string => {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) || "en";
  } catch {
    return "en";
  }
};

// Save language to localStorage
export const saveLanguageToStorage = (language: string): void => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn("Failed to save language to localStorage:", error);
  }
};

// Available languages
export const LANGUAGES = {
  en: { code: "en", name: "EN", nativeName: "English" },
  th: { code: "th", name: "ไทย", nativeName: "ไทย" },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      th: { translation: th },
    },
    lng: getStoredLanguage(),
    fallbackLng: "en",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: [],
    },
  });

export default i18n; 