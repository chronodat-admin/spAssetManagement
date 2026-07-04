import {
  BrandVariants,
  Theme,
  createDarkTheme,
  createLightTheme,
  webLightTheme
} from '@fluentui/react-components';
import type { CSSProperties } from 'react';
import { IAppearanceSettings } from '../models/IAppearanceSettings';
import { ColorSchemeOption } from './dashboardSettings';

export interface IAppearanceSchemePalette {
  primary: string;
  accent: string;
  topNavGradient: string;
  brand: BrandVariants;
}

type BrandShade = keyof BrandVariants;

const BLACK = { r: 0, g: 0, b: 0 };
const WHITE = { r: 255, g: 255, b: 255 };

const DARK_SHADE_MIX: Partial<Record<BrandShade, number>> = {
  10: 0.92,
  20: 0.85,
  30: 0.78,
  40: 0.7,
  50: 0.62,
  60: 0.54,
  70: 0.46,
  80: 0.38
};

const LIGHT_SHADE_MIX: Partial<Record<BrandShade, number>> = {
  100: 0.15,
  110: 0.28,
  120: 0.4,
  130: 0.52,
  140: 0.64,
  150: 0.76,
  160: 0.88
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function toHexChannel(value: number): string {
  const clamped = Math.max(0, Math.min(255, Math.round(value)));
  const hex = clamped.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

function mixRgb(
  base: { r: number; g: number; b: number },
  target: { r: number; g: number; b: number },
  amount: number
): { r: number; g: number; b: number } {
  return {
    r: base.r + (target.r - base.r) * amount,
    g: base.g + (target.g - base.g) * amount,
    b: base.b + (target.b - base.b) * amount
  };
}

function lightenHex(hex: string, amount: number): string {
  const mixed = mixRgb(hexToRgb(hex), WHITE, amount);
  return rgbToHex(mixed.r, mixed.g, mixed.b);
}

function darkenHex(hex: string, amount: number): string {
  const mixed = mixRgb(hexToRgb(hex), BLACK, amount);
  return rgbToHex(mixed.r, mixed.g, mixed.b);
}

const DARK_SHADES: BrandShade[] = [10, 20, 30, 40, 50, 60, 70, 80];
const LIGHT_SHADES: BrandShade[] = [100, 110, 120, 130, 140, 150, 160];

export function buildBrandRampFromHex(hex: string): BrandVariants {
  const base = hexToRgb(hex);
  const ramp = { 90: hex } as BrandVariants;

  for (let i = 0; i < DARK_SHADES.length; i++) {
    const shade = DARK_SHADES[i];
    const mixed = mixRgb(base, BLACK, DARK_SHADE_MIX[shade] || 0);
    ramp[shade] = rgbToHex(mixed.r, mixed.g, mixed.b);
  }

  for (let i = 0; i < LIGHT_SHADES.length; i++) {
    const shade = LIGHT_SHADES[i];
    const mixed = mixRgb(base, WHITE, LIGHT_SHADE_MIX[shade] || 0);
    ramp[shade] = rgbToHex(mixed.r, mixed.g, mixed.b);
  }

  return ramp;
}

function buildCustomGradient(hex: string): string {
  return `linear-gradient(to right, ${hex}, ${lightenHex(hex, 0.15)})`;
}

const BRAND_RAMPS: Record<Exclude<ColorSchemeOption, 'Custom'>, BrandVariants> = {
  Blue: {
    10: '#030408',
    20: '#0a1629',
    30: '#0f2140',
    40: '#132b52',
    50: '#163565',
    60: '#1a4078',
    70: '#1e4a8b',
    80: '#22559e',
    90: '#2563eb',
    100: '#3b82f6',
    110: '#5596f7',
    120: '#6faaf8',
    130: '#89bef9',
    140: '#a3d2fa',
    150: '#bde6fb',
    160: '#d7fafc'
  },
  Green: {
    10: '#020806',
    20: '#062116',
    30: '#093523',
    40: '#0c4430',
    50: '#0f533c',
    60: '#116248',
    70: '#137154',
    80: '#158060',
    90: '#059669',
    100: '#10b981',
    110: '#34d399',
    120: '#4ade80',
    130: '#6ee7b7',
    140: '#86efac',
    150: '#a7f3d0',
    160: '#d1fae5'
  },
  Purple: {
    10: '#07040f',
    20: '#160f2d',
    30: '#241645',
    40: '#311d5c',
    50: '#3f2473',
    60: '#4d2b8a',
    70: '#5b32a1',
    80: '#6939b8',
    90: '#7c3aed',
    100: '#8b5cf6',
    110: '#a78bfa',
    120: '#c4b5fd',
    130: '#ddd6fe',
    140: '#ede9fe',
    150: '#f5f3ff',
    160: '#faf5ff'
  },
  Teal: {
    10: '#020807',
    20: '#06201c',
    30: '#09342f',
    40: '#0c4440',
    50: '#0f5450',
    60: '#116460',
    70: '#137470',
    80: '#158480',
    90: '#0d9488',
    100: '#14b8a6',
    110: '#2dd4bf',
    120: '#5eead4',
    130: '#7dd3fc',
    140: '#99f6e4',
    150: '#ccfbf1',
    160: '#f0fdfa'
  },
  Indigo: {
    10: '#04040f',
    20: '#0f1030',
    30: '#18194a',
    40: '#212164',
    50: '#2a2a7e',
    60: '#333398',
    70: '#3c3cb2',
    80: '#4545cc',
    90: '#4f46e5',
    100: '#6366f1',
    110: '#818cf8',
    120: '#a5b4fc',
    130: '#c7d2fe',
    140: '#e0e7ff',
    150: '#eef2ff',
    160: '#f5f7ff'
  },
  Orange: {
    10: '#0f0602',
    20: '#301406',
    30: '#4a1f09',
    40: '#642a0c',
    50: '#7e350f',
    60: '#984012',
    70: '#b24b15',
    80: '#cc5618',
    90: '#ea580c',
    100: '#f97316',
    110: '#fb923c',
    120: '#fdba74',
    130: '#fed7aa',
    140: '#ffedd5',
    150: '#fff7ed',
    160: '#fffaf5'
  },
  Rose: {
    10: '#0f0306',
    20: '#300812',
    30: '#4a0d1d',
    40: '#641228',
    50: '#7e1733',
    60: '#981c3e',
    70: '#b22149',
    80: '#cc2654',
    90: '#e11d48',
    100: '#f43f5e',
    110: '#fb7185',
    120: '#fda4af',
    130: '#fecdd3',
    140: '#ffe4e6',
    150: '#fff1f2',
    160: '#fff7f8'
  },
  Slate: {
    10: '#050608',
    20: '#111827',
    30: '#1f2937',
    40: '#293548',
    50: '#334155',
    60: '#3d4d66',
    70: '#475569',
    80: '#526077',
    90: '#64748b',
    100: '#94a3b8',
    110: '#a8b4c4',
    120: '#bcc5d2',
    130: '#d0d6e0',
    140: '#e2e8f0',
    150: '#f1f5f9',
    160: '#f8fafc'
  }
};

export const COLOR_SCHEME_SWATCHES: Record<Exclude<ColorSchemeOption, 'Custom'>, string> = {
  Blue: 'linear-gradient(to right, #2563eb, #3b82f6)',
  Green: 'linear-gradient(to right, #059669, #10b981)',
  Purple: 'linear-gradient(to right, #7c3aed, #8b5cf6)',
  Teal: 'linear-gradient(to right, #0d9488, #14b8a6)',
  Indigo: 'linear-gradient(to right, #4f46e5, #6366f1)',
  Orange: 'linear-gradient(to right, #ea580c, #f97316)',
  Rose: 'linear-gradient(to right, #e11d48, #f43f5e)',
  Slate: 'linear-gradient(to right, #475569, #64748b)'
};

export function getColorSchemeSwatch(
  appearance: Pick<IAppearanceSettings, 'colorScheme' | 'customBrandColor'>
): string {
  if (appearance.colorScheme === 'Custom') {
    return buildCustomGradient(appearance.customBrandColor);
  }
  return COLOR_SCHEME_SWATCHES[appearance.colorScheme];
}

export function getAppearanceSchemePalette(
  appearance: Pick<IAppearanceSettings, 'colorScheme' | 'customBrandColor'>
): IAppearanceSchemePalette {
  if (appearance.colorScheme === 'Custom') {
    const brand = buildBrandRampFromHex(appearance.customBrandColor);
    return {
      primary: brand[90],
      accent: brand[100],
      topNavGradient: buildCustomGradient(appearance.customBrandColor),
      brand
    };
  }

  const brand = BRAND_RAMPS[appearance.colorScheme] || BRAND_RAMPS.Blue;
  return {
    primary: brand[90],
    accent: brand[100],
    topNavGradient: COLOR_SCHEME_SWATCHES[appearance.colorScheme] || COLOR_SCHEME_SWATCHES.Blue,
    brand
  };
}

const FONT_SIZE_MAP: Record<IAppearanceSettings['fontSize'], string> = {
  small: '14px',
  medium: '16px',
  large: '18px'
};

export const COMPACT_SPACING_SCALE = 0.82;

function scalePxValue(value: string, scale: number): string {
  const trimmed = value.trim();
  if (!trimmed.endsWith('px')) {
    return value;
  }

  const numeric = Number.parseFloat(trimmed.slice(0, -2));
  if (Number.isNaN(numeric)) {
    return value;
  }

  return `${Math.max(2, Math.round(numeric * scale))}px`;
}

function withCompactSpacing(theme: Theme, compactMode: boolean): Theme {
  if (!compactMode) {
    return theme;
  }

  const spacingPatch: Partial<Theme> = {};
  for (const key of Object.keys(theme) as Array<keyof Theme>) {
    if (String(key).startsWith('spacing')) {
      const value = theme[key];
      if (typeof value === 'string') {
        (spacingPatch as Record<string, string>)[key as string] = scalePxValue(
          value,
          COMPACT_SPACING_SCALE
        );
      }
    }
  }

  return { ...theme, ...spacingPatch };
}

export function createAppTheme(appearance: IAppearanceSettings, isDark = false): Theme {
  const palette = getAppearanceSchemePalette(appearance);
  const baseTheme = isDark ? createDarkTheme(palette.brand) : createLightTheme(palette.brand);
  const cornerRadius = appearance.roundedCorners ? baseTheme.borderRadiusMedium : '2px';
  const cornerRadiusLarge = appearance.roundedCorners ? baseTheme.borderRadiusLarge : '4px';

  const themed: Theme = {
    ...baseTheme,
    borderRadiusSmall: appearance.roundedCorners ? baseTheme.borderRadiusSmall : '2px',
    borderRadiusMedium: cornerRadius,
    borderRadiusLarge: cornerRadiusLarge,
    borderRadiusXLarge: appearance.roundedCorners ? baseTheme.borderRadiusXLarge : '6px',
    borderRadiusCircular: baseTheme.borderRadiusCircular,
    fontSizeBase200: appearance.fontSize === 'small' ? '12px' : baseTheme.fontSizeBase200,
    fontSizeBase300:
      appearance.fontSize === 'small'
        ? '13px'
        : appearance.fontSize === 'large'
          ? '17px'
          : baseTheme.fontSizeBase300,
    fontSizeBase400:
      appearance.fontSize === 'small'
        ? '14px'
        : appearance.fontSize === 'large'
          ? '20px'
          : baseTheme.fontSizeBase400,
    fontSizeBase500:
      appearance.fontSize === 'small'
        ? '18px'
        : appearance.fontSize === 'large'
          ? '26px'
          : baseTheme.fontSizeBase500
  };

  return withCompactSpacing(themed, appearance.compactMode);
}

export function getDefaultAppTheme(): Theme {
  return webLightTheme;
}

export function getAppearanceCssVariables(
  appearance: IAppearanceSettings,
  isDark = false
): CSSProperties {
  const palette = getAppearanceSchemePalette(appearance);
  const topNavBackground = appearance.enableTopNavColor
    ? appearance.topBarColor
    : palette.topNavGradient;
  const topNavText = appearance.enableTopNavColor
    ? appearance.topNavFontColor
    : '#ffffff';
  const sidebarBackground = appearance.enableSidebarColor
    ? appearance.sidebarColor
    : isDark
      ? '#171717'
      : '#fafafa';
  const sidebarText = appearance.enableSidebarColor
    ? appearance.sidebarFontColor
    : isDark
      ? '#f5f5f5'
      : '#242424';
  const sidebarMutedText = appearance.enableSidebarColor
    ? appearance.sidebarFontColor
    : isDark
      ? '#a3a3a3'
      : '#616161';
  const sidebarBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const sidebarHoverBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const sidebarSelectedBg = isDark ? 'rgba(20, 184, 166, 0.22)' : 'rgba(0, 120, 212, 0.12)';
  const sidebarSelectedText = isDark ? '#5eead4' : palette.primary;
  const sidebarSelectedHoverBg = isDark ? 'rgba(20, 184, 166, 0.3)' : 'rgba(0, 120, 212, 0.18)';
  const topNavCtaBackground = appearance.topNavCtaBackground;
  const topNavCtaText = appearance.topNavCtaText;
  const topNavCtaBorder = appearance.topNavCtaBorder;

  return {
    ['--asset-topnav-bg' as string]: topNavBackground,
    ['--asset-topnav-text' as string]: topNavText,
    ['--asset-topnav-border' as string]: 'rgba(255, 255, 255, 0.18)',
    ['--asset-topnav-cta-bg' as string]: topNavCtaBackground,
    ['--asset-topnav-cta-bg-hover' as string]: darkenHex(topNavCtaBackground, 0.12),
    ['--asset-topnav-cta-text' as string]: topNavCtaText,
    ['--asset-topnav-cta-border' as string]: topNavCtaBorder,
    ['--asset-topnav-cta-shadow' as string]: '0 2px 8px rgba(15, 23, 42, 0.28)',
    ['--asset-sidebar-bg' as string]: sidebarBackground,
    ['--asset-sidebar-text' as string]: sidebarText,
    ['--asset-sidebar-muted-text' as string]: sidebarMutedText,
    ['--asset-sidebar-border' as string]: sidebarBorder,
    ['--asset-sidebar-hover-bg' as string]: sidebarHoverBg,
    ['--asset-sidebar-selected-bg' as string]: sidebarSelectedBg,
    ['--asset-sidebar-selected-text' as string]: sidebarSelectedText,
    ['--asset-sidebar-selected-hover-bg' as string]: sidebarSelectedHoverBg,
    ['--asset-chart-tick' as string]: isDark ? '#cbd5e1' : '#374151',
    ['--asset-chart-bar-bg' as string]: isDark ? '#334155' : '#f1f5f9',
    ['--asset-chart-label' as string]: isDark ? '#e2e8f0' : '#4b5563',
    ['--asset-font-size-base' as string]: FONT_SIZE_MAP[appearance.fontSize],
    ['--asset-spacing-scale' as string]: appearance.compactMode ? String(COMPACT_SPACING_SCALE) : '1',
    ['--asset-compact-bar-height' as string]: appearance.compactMode ? '34px' : '40px',
    ['--asset-compact-control-height' as string]: appearance.compactMode ? '28px' : '32px',
    ['--asset-border-radius' as string]: appearance.roundedCorners ? '8px' : '2px',
    ['--asset-border-radius-lg' as string]: appearance.roundedCorners ? '12px' : '4px'
  };
}
