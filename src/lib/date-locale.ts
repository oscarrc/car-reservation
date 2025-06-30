import { format as dateFnsFormat, formatRelative as dateFnsFormatRelative } from 'date-fns';
import { enUS, th } from 'date-fns/locale';
import i18n from '@/i18n';

// Map of supported locales
const locales = {
  en: enUS,
  th: th,
} as const;

/**
 * Get the current date-fns locale based on the i18n language
 */
export function getCurrentLocale() {
  const currentLanguage = i18n.language as keyof typeof locales;
  return locales[currentLanguage] || locales.en;
}

/**
 * Format a date with the current locale
 */
export function format(date: Date | number, formatStr: string): string {
  return dateFnsFormat(date, formatStr, { locale: getCurrentLocale() });
}

/**
 * Format a date relative to now with the current locale
 */
export function formatRelative(date: Date | number, baseDate: Date | number): string {
  return dateFnsFormatRelative(date, baseDate, { locale: getCurrentLocale() });
}

/**
 * Get localized date format strings based on current language
 */
export function getLocalizedFormats() {
  const language = i18n.language;
  
  if (language === 'th') {
    return {
      dateShort: 'dd/MM/yyyy',
      dateLong: 'dd MMMM yyyy',
      dateTime: 'dd/MM/yyyy HH:mm',
      monthYear: 'MMMM yyyy',
      dayMonth: 'dd MMM',
      time: 'HH:mm',
    };
  }
  
  // Default to English formats
  return {
    dateShort: 'MMM dd, yyyy',
    dateLong: 'MMMM dd, yyyy',
    dateTime: 'MMM dd, yyyy HH:mm',
    monthYear: 'MMMM yyyy',
    dayMonth: 'MMM dd',
    time: 'HH:mm',
  };
}

/**
 * Get the locale string for native browser APIs
 */
export function getLocaleString(): string {
  const language = i18n.language;
  
  const localeMap: Record<string, string> = {
    en: 'en-US',
    th: 'th-TH',
  };
  
  return localeMap[language] || 'en-US';
} 