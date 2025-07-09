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
 * Convert Gregorian year to Buddhist Era year (used in Thailand)
 */
function convertToBuddhistEra(date: Date): Date {
  const buddhistDate = new Date(date);
  buddhistDate.setFullYear(date.getFullYear() + 543);
  return buddhistDate;
}

/**
 * Format a date with proper Thai Buddhist Era conversion if needed
 */
export function format(date: Date | number, formatStr: string): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  const currentLanguage = i18n.language;
  
  if (currentLanguage === 'th') {
    // For Thai locale, convert to Buddhist Era for year-containing formats
    if (formatStr.includes('y')) {
      const buddhistDate = convertToBuddhistEra(dateObj);
      return dateFnsFormat(buddhistDate, formatStr, { locale: getCurrentLocale() });
    }
  }
  
  return dateFnsFormat(dateObj, formatStr, { locale: getCurrentLocale() });
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
      // Additional formats for better UX
      monthDay: 'dd MMMM',
      shortDateTime: 'dd/MM/yy HH:mm',
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
    // Additional formats for better UX
    monthDay: 'MMMM dd',
    shortDateTime: 'MM/dd/yy HH:mm',
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