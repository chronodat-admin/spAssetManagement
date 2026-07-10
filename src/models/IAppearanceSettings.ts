import { ColorSchemeOption } from '../utils/dashboardSettings';

export type AppearanceFontSize = 'small' | 'medium' | 'large';
export type AppearanceThemeMode = 'light' | 'dark' | 'system';

export interface IAppearanceSettings {
  themeMode: AppearanceThemeMode;
  colorScheme: ColorSchemeOption;
  customBrandColor: string;
  enableTopNavColor: boolean;
  topBarColor: string;
  topNavFontColor: string;
  /** Primary accent bar action (Create New Risk / New Assessment). */
  topNavCtaBackground: string;
  topNavCtaText: string;
  topNavCtaBorder: string;
  enableSidebarColor: boolean;
  sidebarColor: string;
  sidebarFontColor: string;
  roundedCorners: boolean;
  compactMode: boolean;
  fontSize: AppearanceFontSize;
  /**
   * Header layout. When true, the colored app top bar is removed and its actions
   * move to the top-right of the content/page header area. Always treated as
   * enabled inside Microsoft Teams, which already provides its own header.
   */
  hideAppTopBar: boolean;
  /** Hide SharePoint page toolbar (New, Edit, Share, etc.) on pages hosting this app. */
  hideSharePointPageBar: boolean;
  /** Hide the SharePoint suite bar (app launcher, search, M365 header) on pages hosting this app. */
  hideSharePointTopBar: boolean;
  /** Hide SharePoint app bar, site header, and left navigation on pages hosting this app. */
  hideSharePointLeftNav: boolean;
  /** When false, asset table/list views omit the image thumbnail column. */
  showAssetImageColumn: boolean;
}

export const DEFAULT_APPEARANCE_SETTINGS: IAppearanceSettings = {
  themeMode: 'light',
  colorScheme: 'Blue',
  customBrandColor: '#2563eb',
  enableTopNavColor: false,
  topBarColor: '#2563eb',
  topNavFontColor: '#ffffff',
  topNavCtaBackground: '#fbbf24',
  topNavCtaText: '#0f172a',
  topNavCtaBorder: '#d97706',
  enableSidebarColor: false,
  sidebarColor: '#f5f5f5',
  sidebarFontColor: '#242424',
  roundedCorners: true,
  compactMode: false,
  fontSize: 'medium',
  hideAppTopBar: false,
  hideSharePointPageBar: false,
  hideSharePointTopBar: false,
  hideSharePointLeftNav: true,
  showAssetImageColumn: true
};
