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
  user: Record<string, string>;
  shell: Record<string, string>;
  settingsPages?: Record<string, string>;
  settingsSections?: Record<string, string>;
  dashboard?: Record<string, string>;
  assets?: Record<string, string>;
  lookups?: Record<string, string>;
  listView?: Record<string, string>;
  errors?: Record<string, string>;
  onboarding?: Record<string, string>;
  subscription?: Record<string, string>;
  reportBuilder?: Record<string, string>;
  softwareLicenses?: Record<string, string>;
  inventory?: Record<string, string>;
  confirmDialog?: Record<string, string>;
}

export function getLanguageOptions(): AppLocale[] {
  return SUPPORTED_LOCALES.map((item) => item.code);
}

export const SUPPORTED_LOCALES: Array<{ code: AppLocale; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' }
];

export const DEFAULT_LOCALE: AppLocale = 'en';
