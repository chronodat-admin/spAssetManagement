import type { AppLocale, ITranslationDictionary } from './types';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';

const dictionaries: Record<AppLocale, ITranslationDictionary> = {
  en,
  es,
  fr,
  de
};

export function getDictionary(locale: AppLocale): ITranslationDictionary {
  return dictionaries[locale] || en;
}

export function translate(
  locale: AppLocale,
  section: keyof ITranslationDictionary,
  key: string,
  fallback?: string
): string {
  const dict = getDictionary(locale);
  const bucket = dict[section] as Record<string, string> | undefined;
  return bucket?.[key] || fallback || key;
}
