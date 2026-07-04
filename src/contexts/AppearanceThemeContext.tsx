import * as React from 'react';
import { IAppSettings } from '../models/IAssetApp';
import { AppearanceThemeMode, IAppearanceSettings } from '../models/IAppearanceSettings';
import { parseAppearanceSettings } from '../lib/appearance-settings/storage';
import { createAppTheme, getAppearanceCssVariables } from '../utils/appearanceTheme';
import {
  getSystemPrefersDark,
  isDarkThemeMode,
  loadUserThemeMode,
  resolveEffectiveThemeMode,
  saveUserThemeMode
} from '../utils/themeModeStorage';
import { syncSharePointLeftNavVisibility, syncSharePointPageBarVisibility, syncSharePointTopBarVisibility } from '../utils/loadAssetManagementStyles';
import { SpfxFluentProvider } from '../components/SpfxFluentProvider/SpfxFluentProvider';

export interface IAppearanceThemeContextValue {
  appearance: IAppearanceSettings;
  effectiveThemeMode: AppearanceThemeMode;
  isDark: boolean;
  setThemeMode: (mode: AppearanceThemeMode) => void;
  toggleThemeMode: () => void;
}

const AppearanceThemeContext = React.createContext<IAppearanceThemeContextValue | undefined>(
  undefined
);

export interface IAppearanceThemeProviderProps {
  settings?: IAppSettings;
  webUrl?: string;
  isTeamsHost?: boolean;
  children: React.ReactNode;
}

export const AppearanceThemeProvider: React.FC<IAppearanceThemeProviderProps> = ({
  settings,
  webUrl = '',
  isTeamsHost = false,
  children
}) => {
  const baseAppearance = React.useMemo(() => parseAppearanceSettings(settings), [settings]);
  const [userThemeMode, setUserThemeMode] = React.useState<AppearanceThemeMode | undefined>(() =>
    loadUserThemeMode(webUrl)
  );
  const [prefersDark, setPrefersDark] = React.useState(() => getSystemPrefersDark());

  React.useEffect(() => {
    setUserThemeMode(loadUserThemeMode(webUrl));
  }, [webUrl]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (): void => setPrefersDark(mediaQuery.matches);
    handleChange();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const effectiveThemeMode = React.useMemo(
    () => resolveEffectiveThemeMode(baseAppearance.themeMode, userThemeMode),
    [baseAppearance.themeMode, userThemeMode]
  );
  const isDark = isDarkThemeMode(effectiveThemeMode, prefersDark);
  const appearance = React.useMemo(
    () => ({ ...baseAppearance, themeMode: effectiveThemeMode }),
    [baseAppearance, effectiveThemeMode]
  );

  React.useEffect(() => {
    if (isTeamsHost) {
      syncSharePointPageBarVisibility(false);
      syncSharePointTopBarVisibility(false);
      syncSharePointLeftNavVisibility(false);
      return;
    }
    syncSharePointPageBarVisibility(appearance.hideSharePointPageBar);
    syncSharePointTopBarVisibility(appearance.hideSharePointTopBar);
    syncSharePointLeftNavVisibility(appearance.hideSharePointLeftNav);
  }, [
    appearance.hideSharePointPageBar,
    appearance.hideSharePointTopBar,
    appearance.hideSharePointLeftNav,
    isTeamsHost
  ]);

  const theme = React.useMemo(() => createAppTheme(appearance, isDark), [appearance, isDark]);
  const cssVariables = React.useMemo(
    () => getAppearanceCssVariables(appearance, isDark),
    [appearance, isDark]
  );

  const setThemeMode = React.useCallback(
    (mode: AppearanceThemeMode) => {
      setUserThemeMode(mode);
      saveUserThemeMode(webUrl, mode);
    },
    [webUrl]
  );

  const toggleThemeMode = React.useCallback(() => {
    setThemeMode(isDark ? 'light' : 'dark');
  }, [isDark, setThemeMode]);

  const contextValue = React.useMemo<IAppearanceThemeContextValue>(
    () => ({
      appearance,
      effectiveThemeMode,
      isDark,
      setThemeMode,
      toggleThemeMode
    }),
    [appearance, effectiveThemeMode, isDark, setThemeMode, toggleThemeMode]
  );

  return (
    <AppearanceThemeContext.Provider value={contextValue}>
      <SpfxFluentProvider theme={theme} providerId="asset-mgmt-app" className="asset-mgmt-root">
        <div
          className="asset-mgmt-themed"
          data-theme={isDark ? 'dark' : 'light'}
          data-theme-mode={effectiveThemeMode}
          data-compact={appearance.compactMode ? 'true' : 'false'}
          data-rounded={appearance.roundedCorners ? 'true' : 'false'}
          style={{
            ...cssVariables,
            width: '100%',
            maxWidth: '100%',
            fontSize: 'var(--asset-font-size-base)'
          }}
        >
          {children}
        </div>
      </SpfxFluentProvider>
    </AppearanceThemeContext.Provider>
  );
};

export function useAppearanceTheme(): IAppearanceThemeContextValue {
  const context = React.useContext(AppearanceThemeContext);
  if (!context) {
    throw new Error('useAppearanceTheme must be used within AppearanceThemeProvider');
  }
  return context;
}

export function useAppearanceSettings(settings?: IAppSettings): IAppearanceSettings {
  return React.useMemo(() => parseAppearanceSettings(settings), [settings]);
}

export function useOptionalAppearanceTheme(): IAppearanceThemeContextValue | undefined {
  return React.useContext(AppearanceThemeContext);
}
