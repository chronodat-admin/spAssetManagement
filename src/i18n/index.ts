import type { AppLocale, ITranslationDictionary } from './types';
import { mergeLocales } from './mergeLocales';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';
import { enExtra } from './en.extra';
import { esExtra } from './es.extra';
import { frExtra } from './fr.extra';
import { deExtra } from './de.extra';

const dictionaries: Record<AppLocale, ITranslationDictionary> = {
  en: mergeLocales(en, enExtra),
  es: mergeLocales(es, esExtra),
  fr: mergeLocales(fr, frExtra),
  de: mergeLocales(de, deExtra)
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
