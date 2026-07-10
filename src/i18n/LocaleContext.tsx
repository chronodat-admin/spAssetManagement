import * as React from 'react';
import type { AppLocale } from './types';
import { DEFAULT_LOCALE } from './types';
import { getDictionary, translate } from './index';

const LOCALE_STORAGE_KEY = 'asset-management-locale';

export interface ILocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (section: keyof ReturnType<typeof getDictionary>, key: string, fallback?: string) => string;
  dictionary: ReturnType<typeof getDictionary>;
}

const LocaleContext = React.createContext<ILocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (_section, key, fallback) => fallback || key,
  dictionary: getDictionary(DEFAULT_LOCALE)
});

export function loadStoredLocale(siteUrl: string): AppLocale {
  try {
    const raw = localStorage.getItem(`${LOCALE_STORAGE_KEY}:${siteUrl}`);
    if (raw === 'en' || raw === 'es' || raw === 'fr' || raw === 'de') {
      return raw;
    }
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

export function saveStoredLocale(siteUrl: string, locale: AppLocale): void {
  try {
    localStorage.setItem(`${LOCALE_STORAGE_KEY}:${siteUrl}`, locale);
  } catch {
    // ignore
  }
}

export interface ILocaleProviderProps {
  siteUrl: string;
  initialLocale?: AppLocale;
  children: React.ReactNode;
}

export const LocaleProvider: React.FC<ILocaleProviderProps> = ({
  siteUrl,
  initialLocale,
  children
}) => {
  const [locale, setLocaleState] = React.useState<AppLocale>(
    () => initialLocale || loadStoredLocale(siteUrl)
  );

  const setLocale = React.useCallback(
    (next: AppLocale) => {
      setLocaleState(next);
      saveStoredLocale(siteUrl, next);
    },
    [siteUrl]
  );

  const dictionary = React.useMemo(() => getDictionary(locale), [locale]);

  const t = React.useCallback(
    (section: keyof typeof dictionary, key: string, fallback?: string) =>
      translate(locale, section, key, fallback),
    [locale]
  );

  const value = React.useMemo(
    () => ({ locale, setLocale, t, dictionary }),
    [locale, setLocale, t, dictionary]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export function useLocale(): ILocaleContextValue {
  return React.useContext(LocaleContext);
}

export function useTranslation(): Pick<ILocaleContextValue, 't' | 'locale' | 'dictionary'> {
  const { t, locale, dictionary } = React.useContext(LocaleContext);
  return { t, locale, dictionary };
}
