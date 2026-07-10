import type { ITranslationDictionary } from './types';

/** Deep-merge locale section records (extra keys override base). */
export function mergeLocales(
  base: ITranslationDictionary,
  extra: Partial<ITranslationDictionary>
): ITranslationDictionary {
  const merged = { ...base } as ITranslationDictionary;
  for (const section of Object.keys(extra) as Array<keyof ITranslationDictionary>) {
    const extraSection = extra[section];
    if (!extraSection) continue;
    merged[section] = {
      ...(base[section] as Record<string, string>),
      ...extraSection
    };
  }
  return merged;
}
