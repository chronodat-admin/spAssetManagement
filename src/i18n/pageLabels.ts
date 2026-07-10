import type { AppPage } from '../models/IAssetApp';
import type { ITranslationDictionary } from './types';

export type TranslateFn = (
  section: keyof ITranslationDictionary,
  key: string,
  fallback?: string
) => string;

export function getLocalizedPageTitle(page: AppPage, t: TranslateFn, fallback: string): string {
  return t('pages', page, fallback);
}

export function getLocalizedPageSubtitle(
  page: AppPage,
  t: TranslateFn,
  fallback?: string
): string | undefined {
  const subtitle = t('pageSubtitles', page, fallback || '');
  return subtitle || fallback;
}

export function getLocalizedSettingsPageLabel(
  pageId: string,
  t: TranslateFn,
  fallback: string
): string {
  return t('settingsPages', `${pageId}Label`, fallback);
}

export function getLocalizedSettingsPageDescription(
  pageId: string,
  t: TranslateFn,
  fallback: string
): string {
  return t('settingsPages', `${pageId}Description`, fallback);
}
