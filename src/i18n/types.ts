export type AppLocale = 'en' | 'es' | 'fr' | 'de';

export interface ITranslationDictionary {
  nav: Record<string, string>;
  pages: Record<string, string>;
  pageSubtitles: Record<string, string>;
  common: Record<string, string>;
  operations: Record<string, string>;
  settings: Record<string, string>;
  rbac: Record<string, string>;
  barcode: Record<string, string>;
  requests: Record<string, string>;
  maintenance: Record<string, string>;
  bookings: Record<string, string>;
  depreciation: Record<string, string>;
  operationsEmpty: Record<string, string>;
  reminders: Record<string, string>;
}

export const SUPPORTED_LOCALES: Array<{ code: AppLocale; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' }
];

export const DEFAULT_LOCALE: AppLocale = 'en';
