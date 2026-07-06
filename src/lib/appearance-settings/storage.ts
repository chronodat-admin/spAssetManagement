import { IAppSettings } from '../../models/IAssetApp';
import {
  DEFAULT_APPEARANCE_SETTINGS,
  IAppearanceSettings
} from '../../models/IAppearanceSettings';
import { COLOR_SCHEME_OPTIONS, ColorSchemeOption } from '../../utils/dashboardSettings';

function normalizeColorScheme(value: unknown): ColorSchemeOption {
  if (typeof value !== 'string') {
    return DEFAULT_APPEARANCE_SETTINGS.colorScheme;
  }
  const match = COLOR_SCHEME_OPTIONS.find(
    (option) => option.toLowerCase() === value.trim().toLowerCase()
  );
  return match || DEFAULT_APPEARANCE_SETTINGS.colorScheme;
}

function normalizeFontSize(value: unknown): IAppearanceSettings['fontSize'] {
  if (value === 'small' || value === 'medium' || value === 'large') {
    return value;
  }
  return DEFAULT_APPEARANCE_SETTINGS.fontSize;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'yes' || normalized === 'true') {
      return true;
    }
    if (normalized === 'no' || normalized === 'false') {
      return false;
    }
  }
  return fallback;
}

function normalizeColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}

function normalizeThemeMode(value: unknown): IAppearanceSettings['themeMode'] {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return DEFAULT_APPEARANCE_SETTINGS.themeMode;
}

export function parseAppearanceSettings(settings?: IAppSettings | null): IAppearanceSettings {
  const fromLegacyScheme = normalizeColorScheme(settings?.ColorScheme);

  if (!settings?.AppearanceSettings?.trim()) {
    return {
      ...DEFAULT_APPEARANCE_SETTINGS,
      colorScheme: fromLegacyScheme
    };
  }

  try {
    const parsed = JSON.parse(settings.AppearanceSettings) as Partial<IAppearanceSettings>;
    return {
      themeMode: normalizeThemeMode(parsed.themeMode),
      colorScheme: normalizeColorScheme(parsed.colorScheme ?? fromLegacyScheme),
      customBrandColor: normalizeColor(
        parsed.customBrandColor,
        DEFAULT_APPEARANCE_SETTINGS.customBrandColor
      ),
      enableTopNavColor: normalizeBoolean(
        parsed.enableTopNavColor,
        DEFAULT_APPEARANCE_SETTINGS.enableTopNavColor
      ),
      topBarColor: normalizeColor(parsed.topBarColor, DEFAULT_APPEARANCE_SETTINGS.topBarColor),
      topNavFontColor: normalizeColor(
        parsed.topNavFontColor,
        DEFAULT_APPEARANCE_SETTINGS.topNavFontColor
      ),
      topNavCtaBackground: normalizeColor(
        parsed.topNavCtaBackground,
        DEFAULT_APPEARANCE_SETTINGS.topNavCtaBackground
      ),
      topNavCtaText: normalizeColor(parsed.topNavCtaText, DEFAULT_APPEARANCE_SETTINGS.topNavCtaText),
      topNavCtaBorder: normalizeColor(
        parsed.topNavCtaBorder,
        DEFAULT_APPEARANCE_SETTINGS.topNavCtaBorder
      ),
      enableSidebarColor: normalizeBoolean(
        parsed.enableSidebarColor,
        DEFAULT_APPEARANCE_SETTINGS.enableSidebarColor
      ),
      sidebarColor: normalizeColor(parsed.sidebarColor, DEFAULT_APPEARANCE_SETTINGS.sidebarColor),
      sidebarFontColor: normalizeColor(
        parsed.sidebarFontColor,
        DEFAULT_APPEARANCE_SETTINGS.sidebarFontColor
      ),
      roundedCorners: normalizeBoolean(
        parsed.roundedCorners,
        DEFAULT_APPEARANCE_SETTINGS.roundedCorners
      ),
      compactMode: normalizeBoolean(parsed.compactMode, DEFAULT_APPEARANCE_SETTINGS.compactMode),
      fontSize: normalizeFontSize(parsed.fontSize),
      hideAppTopBar: normalizeBoolean(
        parsed.hideAppTopBar,
        DEFAULT_APPEARANCE_SETTINGS.hideAppTopBar
      ),
      hideSharePointPageBar: normalizeBoolean(
        parsed.hideSharePointPageBar,
        DEFAULT_APPEARANCE_SETTINGS.hideSharePointPageBar
      ),
      hideSharePointTopBar: normalizeBoolean(
        parsed.hideSharePointTopBar,
        DEFAULT_APPEARANCE_SETTINGS.hideSharePointTopBar
      ),
      hideSharePointLeftNav: normalizeBoolean(
        parsed.hideSharePointLeftNav,
        DEFAULT_APPEARANCE_SETTINGS.hideSharePointLeftNav
      )
    };
  } catch {
    return {
      ...DEFAULT_APPEARANCE_SETTINGS,
      colorScheme: fromLegacyScheme
    };
  }
}

export function serializeAppearanceSettings(settings: IAppearanceSettings): string {
  return JSON.stringify(settings);
}
