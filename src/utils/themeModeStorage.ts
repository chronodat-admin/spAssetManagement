import { AppearanceThemeMode } from '../models/IAppearanceSettings';

const STORAGE_PREFIX = 'asset-mgmt-theme-mode-v1';

function storageKey(webUrl: string): string {
  return `${STORAGE_PREFIX}:${webUrl.trim().toLowerCase()}`;
}

function normalizeThemeMode(value: unknown): AppearanceThemeMode | undefined {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return undefined;
}

/** Per-user theme preference for this site (overrides org default until cleared). */
export function loadUserThemeMode(webUrl: string): AppearanceThemeMode | undefined {
  if (!webUrl || typeof localStorage === 'undefined') {
    return undefined;
  }

  try {
    const raw = localStorage.getItem(storageKey(webUrl));
    return normalizeThemeMode(raw || undefined);
  } catch {
    return undefined;
  }
}

export function saveUserThemeMode(webUrl: string, mode: AppearanceThemeMode): void {
  if (!webUrl || typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(storageKey(webUrl), mode);
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function clearUserThemeMode(webUrl: string): void {
  if (!webUrl || typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(storageKey(webUrl));
  } catch {
    /* ignore */
  }
}

export function resolveEffectiveThemeMode(
  defaultMode: AppearanceThemeMode,
  userOverride?: AppearanceThemeMode
): AppearanceThemeMode {
  return userOverride || defaultMode;
}

export function isDarkThemeMode(mode: AppearanceThemeMode, prefersDark: boolean): boolean {
  if (mode === 'dark') {
    return true;
  }
  if (mode === 'light') {
    return false;
  }
  return prefersDark;
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
